# Bühler Machine Visualization - JSON2GLTF

## Overview

This project is a web-based application designed to visualize 3D models and facilitate the mapping of Programmable Logic Controller (PLC) variables to specific parts of these models. It was developed specifically for creating GUIs of industrial machines (internally called "process visu") at Bühler AG. It provides an interactive interface for selecting models, viewing their hierarchical structures, and managing PLC variable mappings (only demonstratively implemented). The application comprises three primary components:

1. **Server (`server.py`)**: A Python-based HTTP server that serves static files and provides a JSON endpoint listing available GLB (glTF - Graphics Library Transmission Format) files.
2. **JSON to glTF Converter (`json2gltf.js`)**: A Node.js script that processes JSON and BIN file bundles hailing from the Quanos spare parts catalog by converting them to follow the glTF 2.0 specification (which is only loosely followed beforehand), and further compiles them into GLB files for efficient web rendering. 
3. **Frontend (`index.html`)**: An HTML5 application utilizing Three.js for rendering 3D models, alongside a UI for model selection, node structure visualization, and PLC variable mapping.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Running the Server](#running-the-server)
  - [Converting JSON to GLB](#converting-json-to-glb)
  - [Accessing the Frontend](#accessing-the-frontend)
- [Configuration](#configuration)
  - [Server Configuration](#server-configuration)
  - [Frontend Configuration](#frontend-configuration)
- [TODOs](#todos)
- [Ideas](#ideas)
- [Contributing](#contributing)
- [License](#license)

## Features

### 1. Server (`server.py`)

- **Static File Serving**: Hosts static files such as the frontend application (`index.html`) and GLB model files.
- **Dynamic GLB Listing**: Provides a JSON endpoint (`/web`) that lists all available GLB files in the `web` directory, enabling dynamic model loading on the frontend.
- **Logging**: Implements logging to monitor server activity and troubleshoot issues.

### 2. JSON to glTF Converter (`json2gltf.js`)
The utilized files during development of this repo came from Windchill and were transformed automatically upon status release by the Quanos CATALOGcreator Software. First, it is turned into a proprietary XVL (.xv3) format developed by Lattice and then to the mentioned JSON and BIN bundle (also titled XVL Web3D). This format - said to be "browser native" as per the publisher - only loosely follows glTF specification and therefore actually needs to be hosted by a proprietary software to be accessed by browser.

- **JSON Processing**: Reads JSON files from the `json` directory, each representing a 3D model's structure and properties. 
- **glTF Conversion**: Transforms the JSON data to follow the glTF format, ensuring compatibility and optimization for web rendering.
- **GLB Compilation**: Parses the JSON data and then utilizes the `gltf-pipeline` library to compile the parsed data (which also loads the BIN file through references) into a glTF file (.glb).
- **Error Handling**: Incorporates error handling to manage issues during file reading, parsing, and conversion processes.

### 3. Frontend (`index.html`)

- **3D Model Rendering**: Uses Three.js to render GLB models, providing interactive controls for orbiting, zooming, and panning.
- **Model Selection Sidebar**: Allows users to select from available models, view their hierarchical node structures, and interact with individual parts. Currently, several nodes are being hidden from the structure depending on the prefix of their Windchill part number (standard parts). This may be reverted by removing the if-clause which holds the method *partNumberFull.startsWith*.
- **PLC Variable Mapping**: Enables users to map PLC variables to specific parts of the model (only demonstratively implemented), facilitating integration of the process visu with new machines.
- **Responsive UI**: Features resizable sidebars, tooltips, annotation boxes, and flyout panels for an intuitive user experience.
- **Dynamic Flyouts**: Displays contextual information and sensor variables (only demonstratively implemented) associated with mapped parts.
- **Blue Dot Markers**: Visual indicators on the model representing parts with existing PLC mappings.
- **Setup Mode**: Provides a dedicated mode for configuring and managing PLC variable mappings (only demonstratively implemented), including importing and exporting configurations into the file `sensorMapping.json`. Mappings are done between part number from Windchill and a not yet defined source for the name of PLC variable.

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Python 3.x**: For running the server.
- **Node.js (v14 or later)**: For executing the JSON to glTF converter.
- **npm**: Node package manager for managing JavaScript dependencies.

### Installation

1. **Clone the Repository**

    ```bash
    git clone https://gitlab.ost.ch/ipek/buehlermachinevisualization.git
    cd buehlermachinevisualization
    ```

2. **Install Python Dependencies**

    The server uses Python's built-in `http.server`, so no additional dependencies are required for the server.

3. **Install Node.js Dependencies**

    Navigate to the project directory and install the necessary Node.js packages:

    ```bash
    npm install gltf-pipeline
    ```

    This installs the `gltf-pipeline` library used for converting glTF to GLB.

## Usage

### Running the Server

1. **Start the Server**

    Execute the `server.py` script to start the HTTP server:

    ```bash
    python server.py
    ```

    The server will start on `http://localhost:8000` by default.

2. **Access the Server**

    Open your web browser and navigate to `http://localhost:8000` to access the frontend application.

### Converting JSON to GLB

1. **Prepare JSON Files**

    Place your JSON and BIN files from Quanos CATALOGcreator in the `json` directory.

2. **Run the Converter**

    Execute the `json2gltf.js` script to process and convert JSON files to GLB:

    ```bash
    node json2gltf.js
    ```

    The converted GLB files will be saved in the `web` directory, making them available for the frontend application.

### Accessing the Frontend

Once the server is running and GLB files are available:

1. **Open the Application**

    Navigate to `http://localhost:8000/index.html` in your web browser.

2. **Interact with Models**

    - **Select a Model**: Use the dropdown at top of left sidebar to choose from available 3D models.
    - **View Node Structure**: Explore the hierarchical structure of the selected model's parts.
    - **Map PLC Variables**: Enter setup mode to assign PLC variables to specific parts.
    - **Visual Indicators**: Observe blue dot markers on the model indicating parts with existing PLC mappings.
    - **Flyouts and Tooltips**: Access additional information through interactive UI elements.

## Configuration

### Server Configuration

- **Port**: The server listens on port `8000` by default. To change the port, modify the `PORT` variable in `server.py`:

    ```python
    PORT = 8000  # Change to desired port number
    ```

- **Directory Paths**: Ensure that the `web` directory exists and contains the GLB files. The server dynamically lists these files via the `/web` endpoint.

### Frontend Configuration

- **Model Path**: The frontend fetches models from the `/web` endpoint. If the server's directory structure changes, update the fetch path in `index.html` accordingly:

    ```javascript
    fetch('/web')  // Modify if the endpoint changes
    ```

- **External Libraries**: The frontend relies on CDN links for libraries like Three.js, GLTFLoader, OrbitControls, Chart.js, and FileSaver.js. Ensure these links are accessible or consider hosting them locally for improved reliability.

- **Sensor Mapping File**: The frontend loads sensor mappings from `sensorMapping.json`. Ensure this file exists in the `web` directory or adjust the path in the frontend script:

    ```javascript
    loadSensorMapping('sensorMapping.json');  // Update path if necessary
    ```

## TODOs

- **Variable readings**: Actual functionality of interacting with PLC variables has not been addressed in the project.

- **Implementation**: While performance of the GUI was tested on a touch panel utilized in the industrial machines by Bühler AG, it was never evaluated whether or with what effort the HTML application can be implemented in the actual process visu. Also, the json2gltf script should be implemented either on machines where engineers will setup the PLC mapping or on the server which also converts the XVL files automatically.

- **Permission Handling**: The frontend includes dropdowns for minimum reading and writing permissions for PLC variables (`minReadPerm` and `minWritePerm`). However, these permissions do not currently affect the application's behavior or enforce access controls.

- **Enhance and adjust UI/UX**: Improve the frontend's user interface for better accessibility and responsiveness across different devices. 

- **100% BOM**: It has been worked with 150% BOMs and thus the node structures often contain unresolved WSL nodes (variant parts lists) which leads to inaccurate representations when working with machine instances (which have the BOM reduced to 100%). It would be advantageous if the 100% BOMs or a configuration report of the machine could be imported, for example from SAP or EqC software, so that the visualization of the machine instances could be derived dynamically.

## Ideas

- **Automatic variable mapping**: Whether or not PLC variables could be mapped automatically onto Windchill structure has not been addressed in the project. Only manual mapping and exporting of the mapping file is possible as of yet.

- **Error handling & spare part suggestion**: If a mapping fails, an error occurs (e.g., if a sensor is missing, the part lights up red; if a part is missing, an error banner appears)
In the event of a error where spare parts are defined in the node structure, one could then directly link to the spare parts catalog for further assistance.

- **Mapping lifecycle management**: Store mappings centrally in a database? Currently, everything is stored in a file. For different machine configurations, parts of the mappings need to be replaceable.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your enhancements or bug fixes. Ensure that your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the [MIT License](LICENSE). See the [LICENSE](LICENSE) file for details.
