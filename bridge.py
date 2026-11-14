import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

CLOUD_ENDPOINT = "https://crestix-probe-aqua.onrender.com/update"

@app.route('/update', methods=['POST'])
def update():
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"status": "error", "message": "No JSON received"}), 400

    # Print to console just like before
    node_id = data.get("node_id", "unknown_node")
    sonic_depth = data.get("depth_sonic", 0.0)
    probes = data.get("depth_probes", [])
    temp_c = data.get("temp_c", 0.0)

    print(f"\n--- Live Update from {node_id} ---")
    print(f"Sonic Depth (Smooth):   {sonic_depth:.2f} cm")
    print(f"Probe Pins:             {probes}")
    print(f"Water Temperature:      {temp_c:.2f} °C")

    # Forward directly to live Render cloud deployment!
    try:
        resp = requests.post(CLOUD_ENDPOINT, json=data, timeout=3)
        print(f"🚀 Forwarded to Render: HTTP {resp.status_code} -> Live Website Updated!")
    except Exception as e:
        print(f"⚠️ Could not forward to Render: {e}")

    return jsonify({"status": "success", "forwarded": True}), 200

if __name__ == '__main__':
    print("=" * 60)
    print(" CRESTIX PROBE: LOCAL-TO-RENDER CLOUD BRIDGE RUNNING")
    print(f" Forwarding to: {CLOUD_ENDPOINT}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000)
