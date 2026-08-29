### WIP ###

## [OBSOLETE] this idea was abandoned

import json
import os
import subprocess
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request

"""
This is a proxy that intercepts requests to the host llama.cpp server and call the script to start llama.cpp with the requested model.

"""


PROXY_PORT = 8005
LLAMA_PORT = 8001  # Your active llama-server port
CURRENT_MODEL = None
SERVER_START_SCRIPT = "./start_server_.sh"

def reboot_llama_server(model_id):
    print(f"\n[PROXY] Detect Model Switch: Triggering {model_id} script configuration...")
    # Kill existing server gracefully
    subprocess.run(["pkill", "llama-server"])
    time.sleep(2)
    
    # Map the Pi ID to your exact host launch script configurations
    if "gemma" in model_id.lower():
        # Spin up your exact gemma config in the background
        # (Replace with your actual bash file or direct execution)
        subprocess.Popen(["bash", "/path/to/your/start_gemma.sh"])
    elif "gpt-oss" in model_id.lower():
        subprocess.Popen(["bash", "/path/to/your/start_gpt_oss.sh"])
        
    print("[PROXY] Waiting for llama-server to spin up...")
    time.sleep(5)  # Give it time to load weights into VRAM

class ProxyHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        global CURRENT_MODEL
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        
        try:
            payload = json.loads(body.decode('utf-8'))
            requested_model = payload.get("model")
            
            # Catch the model change immediately from the /model command choice
            if requested_model and requested_model != CURRENT_MODEL:
                reboot_llama_server(requested_model)
                CURRENT_MODEL = requested_model
        except Exception as e:
            pass # Fallback for non-JSON requests

        # Forward the request to the actual llama-server seamlessly
        req = urllib.request.Request(
            f"http://127.0.0.1:{LLAMA_PORT}{self.path}",
            data=body,
            headers={k: v for k, v in self.headers.items() if k.lower() != 'host'},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as response:
                self.send_response(response.status)
                for k, v in response.getheaders():
                    self.send_header(k, v)
                self.end_headers()
                self.wfile.write(response.read())
        except Exception as e:
            self.send_error(500, f"Backend down: {str(e)}")

print(f"Proxy bridge listening on port {PROXY_PORT}...")
HTTPServer(('0.0.0.0', PROXY_PORT), ProxyHandler).serve_forever()