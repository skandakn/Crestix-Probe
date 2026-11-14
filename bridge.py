import http.server
import urllib.request
import json
import sys

CLOUD_ENDPOINT = "https://crestix-probe-aqua.onrender.com/update"
PORT = 5000

class CrestixBridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length)

        # 1. Decode & Print for live monitor
        try:
            payload = json.loads(raw_body.decode("utf-8"))
            node_id = payload.get("node_id", "river_sensor_alpha")
            sonic_depth = payload.get("depth_sonic", 0.0)
            probes = payload.get("depth_probes", [])
            temp_c = payload.get("temp_c", 0.0)

            print(f"\n--- Live Update from {node_id} ---", flush=True)
            print(f"Sonic Depth (Smooth):   {sonic_depth:.2f} cm", flush=True)
            print(f"Probe Pins:             {probes}", flush=True)
            print(f"Water Temperature:      {temp_c:.2f} °C", flush=True)
        except Exception:
            payload = {}

        # 2. Forward payload directly to live Render cloud
        forward_ok = False
        try:
            req = urllib.request.Request(
                CLOUD_ENDPOINT,
                data=raw_body,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=4) as response:
                print(f"🚀 [LIVE TO WEBSITE] Forwarded to Render: HTTP {response.status} -> SUCCESS!", flush=True)
                forward_ok = True
        except Exception as e:
            print(f"⚠️ [FORWARD WARNING] Could not forward to Render: {e}", flush=True)

        # 3. Respond 200 OK to ESP32
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        resp_json = json.dumps({"status": "success", "forwarded": forward_ok}).encode("utf-8")
        self.wfile.write(resp_json)

    def log_message(self, format, *args):
        # Format like Werkzeug
        print(f"{self.address_string()} - - [{self.log_date_time_string()}] {format % args}", flush=True)

if __name__ == "__main__":
    print("=" * 65)
    print("  CRESTIX PROBE: ZERO-DEPENDENCY CLOUD BRIDGE (PORT 5000)")
    print(f"  Target: {CLOUD_ENDPOINT}")
    print("=" * 65)
    print(f"Listening on http://0.0.0.0:{PORT}/update ... Press Ctrl+C to stop.\n", flush=True)

    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), CrestixBridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping bridge server...")
        server.server_close()
