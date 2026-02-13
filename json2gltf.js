const fs = require('fs');
const path = require('path');
const gltfPipeline = require('gltf-pipeline');

// =========================================
// JSON TO GLTF CONVERSION FUNCTION
// =========================================
/**
 * Converts raw GLTF JSON data into a formatted GLTF structure.
 * @param {Object} gltfData - The raw GLTF JSON data.
 * @returns {Object} - The formatted GLTF JSON structure.
 */
function convertToGltfFormat(gltfData) {
    // Initialize the formatted GLTF structure with necessary properties
    const formattedData = {
        asset: {},
        buffers: [],
        extensionsUsed: gltfData.extensionsUsed || [], // Preserve existing extensions
        accessors: [],
        bufferViews: [],
        materials: [],
        meshes: [],
        nodes: [],
        scenes: [],
        scene: 0, // Default to the first scene
    };

    // =========================================
    // ASSET SECTION
    // =========================================
    if (gltfData.asset) {
        formattedData.asset = gltfData.asset;
        delete formattedData.asset.premultipliedAlpha; // Remove non-standard attribute
    }

    // =========================================
    // BUFFERS SECTION
    // =========================================
    if (gltfData.buffers) {
        for (const bufferKey in gltfData.buffers) {
            const buffer = { ...gltfData.buffers[bufferKey] };
            delete buffer.type; // Remove non-standard attribute
            formattedData.buffers.push(buffer);
        }
    }

    // =========================================
    // BUFFER VIEWS AND ACCESSORS MAPPING
    // =========================================
    const bufferViewByteStrideMap = {}; // Map to store byteStride for each bufferView

    // Process accessors and map byteStride information
    if (gltfData.accessors) {
        const bufferViewKeys = Object.keys(gltfData.bufferViews);
        for (const key in gltfData.accessors) {
            const accessor = { ...gltfData.accessors[key] };
            accessor.name = key; // Add name for reference

            if (accessor.bufferView) {
                const bufferViewIndex = bufferViewKeys.indexOf(accessor.bufferView);
                accessor.bufferView = bufferViewIndex;

                // Store byteStride if defined
                if (accessor.byteStride !== undefined) {
                    if (!bufferViewByteStrideMap[bufferViewIndex]) {
                        bufferViewByteStrideMap[bufferViewIndex] = accessor.byteStride;
                    }
                    delete accessor.byteStride; // Remove non-standard attribute
                }
            }
            formattedData.accessors.push(accessor);
        }
    }

    // Process bufferViews and apply byteStride where applicable
    if (gltfData.bufferViews) {
        const bufferKeys = Object.keys(gltfData.buffers);
        for (const key in gltfData.bufferViews) {
            const bufferView = { ...gltfData.bufferViews[key] };
            bufferView.buffer = bufferKeys.indexOf(bufferView.buffer); // Convert buffer reference to index

            // Add byteStride only if it's non-zero
            const byteStride = bufferViewByteStrideMap[formattedData.bufferViews.length];
            if (byteStride !== undefined && byteStride !== 0) {
                bufferView.byteStride = byteStride;
            }

            formattedData.bufferViews.push(bufferView);
        }
    }

    // =========================================
    // MATERIALS SECTION
    // =========================================
    if (gltfData.materials) {
        for (const key in gltfData.materials) {
            formattedData.materials.push(gltfData.materials[key]); // Preserve existing materials
        }
    }

    // =========================================
    // MESHES SECTION
    // =========================================
    const meshIndexMap = {}; // Map to associate mesh names with their indices
    if (gltfData.meshes) {
        for (const key in gltfData.meshes) {
            const mesh = { ...gltfData.meshes[key] };
            if (mesh.primitives) {
                mesh.primitives.forEach(primitive => {
                    // Convert attribute names to accessor indices
                    for (const attribute in primitive.attributes) {
                        primitive.attributes[attribute] = formattedData.accessors.findIndex(acc => acc.name === primitive.attributes[attribute]);
                    }
                    // Convert indices to accessor indices
                    if (primitive.indices) {
                        primitive.indices = formattedData.accessors.findIndex(acc => acc.name === primitive.indices);
                    }
                    // Convert material to material index
                    if (primitive.material) {
                        primitive.material = formattedData.materials.findIndex(mat => mat.name === primitive.material);
                    }
                });
            }
            meshIndexMap[key] = formattedData.meshes.length; // Map mesh name to its new index
            formattedData.meshes.push(mesh);
        }
    }

    // =========================================
    // NODES SECTION
    // =========================================
    if (gltfData.nodes) {
        const nodeIndexMap = {}; // Map to associate node names with their indices
        for (const key in gltfData.nodes) {
            const node = { ...gltfData.nodes[key] };
            node.name = key;
            nodeIndexMap[key] = formattedData.nodes.length;

            if (node.meshes && node.meshes.length === 1) {
                node.mesh = meshIndexMap[node.meshes[0]]; // Assign single mesh index
                delete node.meshes; // Remove redundant meshes array
            } else if (node.meshes) {
                node.meshes = node.meshes.map(meshName => meshIndexMap[meshName]); // Convert mesh names to indices
            }
            formattedData.nodes.push(node);
        }

        // Convert children node references to indices
        formattedData.nodes.forEach(node => {
            if (node.children) {
                node.children = node.children.map(childName => nodeIndexMap[childName] ?? -1);
            }
            if (!node.children || node.children.length === 0) delete node.children; // Remove empty children arrays
        });
    }

    // =========================================
    // SCENES SECTION
    // =========================================
    if (gltfData.scenes) {
        for (const key in gltfData.scenes) {
            const scene = { ...gltfData.scenes[key] };
            scene.name = key;
            scene.nodes = scene.nodes.map(nodeName => formattedData.nodes.findIndex(n => n.name === nodeName));
            formattedData.scenes.push(scene);
        }
    }

    // Set the default scene index if specified as a string
    if (typeof gltfData.scene === 'string') {
        formattedData.scene = Object.keys(gltfData.scenes).indexOf(gltfData.scene);
    }

    return formattedData;
}

// =========================================
// MAIN PROCESSING FUNCTION
// =========================================
/**
 * Processes all JSON files in the 'json' directory, converts them to GLB format,
 * and saves the resulting GLB files in the 'web' directory.
 */
function processJsonFiles() {
    const contentDir = path.join(__dirname, 'json'); // Directory containing input JSON files
    const outputDir = path.join(__dirname, 'web');   // Directory to save output GLB files
    fs.mkdirSync(outputDir, { recursive: true });    // Ensure the output directory exists

    fs.readdir(contentDir, (err, files) => {
        if (err) {
            console.error('Error reading content directory:', err);
            return;
        }

        files.forEach(file => {
            if (path.extname(file) === '.json') {
                const inputFilePath = path.join(contentDir, file);               // Full path to the input JSON file
                fs.readFile(inputFilePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error(`Error reading file ${file}:`, err);
                        return;
                    }

                    let gltfData;
                    try {
                        gltfData = JSON.parse(data); // Parse the JSON content
                    } catch (parseError) {
                        console.error(`Error parsing JSON from ${file}:`, parseError);
                        return;
                    }

                    const transformedData = convertToGltfFormat(gltfData); // Convert to formatted GLTF
                    const outputFilePath = path.join(outputDir, file.replace('.json', '.glb')); // Define output GLB path

                    // Convert GLTF JSON to GLB binary format
                    const options = {
                        resourceDirectory: path.dirname(inputFilePath),
                    };
                    gltfPipeline.gltfToGlb(transformedData, options)
                        .then(results => {
                            fs.writeFileSync(outputFilePath, results.glb); // Save the GLB file
                            console.log(`Converted GLB saved to ${outputFilePath}`);
                        })
                        .catch(err => {
                            console.error('Error converting GLTF to GLB:', err);
                        });
                });
            }
        });
    });
}

// =========================================
// START PROCESSING ALL AVAILABLE JSON FILES
// =========================================
processJsonFiles();
