import os
import json
import logging
from http.server import SimpleHTTPRequestHandler, HTTPServer

# =========================================
# SERVER CONFIGURATION AND INITIALIZATION
# =========================================

# Set up logging configuration to output informational messages with timestamps
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


# =========================================
# CUSTOM HTTP REQUEST HANDLER
# =========================================
class DirectoryListingHandler(SimpleHTTPRequestHandler):
    """
    Custom HTTP request handler that extends SimpleHTTPRequestHandler to provide
    a JSON response of .glb files within the '/web' directory when accessed.
    """

    def do_GET(self):
        """
        Handles GET requests. If the request path is '/web' or '/web/', it responds
        with a JSON list of .glb files in the 'web' directory. Otherwise, it delegates
        the request to the superclass to handle serving static files.
        """
        logging.info(f"Received GET request for {self.path}")

        # Define the target directory for listing .glb files
        if self.path in ["/web", "/web/"]:
            try:
                directory = "web"
                # Check if the target directory exists
                if os.path.isdir(directory):
                    # List all .glb files in the directory
                    glb_files = [f for f in os.listdir(directory) if f.endswith(".glb")]
                    logging.info(f"Listing files in {directory}: {glb_files}")

                    # Prepare and send the JSON response
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps(glb_files).encode())
                else:
                    # If the directory does not exist, respond with a 404 error
                    logging.error(f"Directory '{directory}' not found")
                    self.send_response(404)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Directory not found"}).encode())
            except Exception as e:
                # Handle any unexpected errors by responding with a 500 error
                logging.error(f"Error listing directory: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            # For all other paths, use the default handler to serve static files
            super().do_GET()


# =========================================
# MAIN EXECUTION BLOCK
# =========================================
if __name__ == "__main__":
    """
    Sets up and starts the HTTP server on the specified port.
    The server listens indefinitely for incoming requests.
    """
    PORT = 8000  # Define the port number for the server
    server_address = ("", PORT)  # Listen on all available network interfaces
    httpd = HTTPServer(server_address, DirectoryListingHandler)  # Initialize the server with the custom handler
    logging.info(f"Starting server on port {PORT}")
    httpd.serve_forever()  # Start the server and keep it running indefinitely
