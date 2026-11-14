from flask import Flask, request, jsonify
import time

app = Flask(__name__)

# Track historical state to calculate physics derivatives (Rate of Rise)
state = {
    "last_depth_sonic": 0.0,
    "last_timestamp": time.time(),
    "rate_of_rise": 0.0
}

@app.route('/update', methods=['POST'])
def receive_data():
    try:
        data = request.get_json()
        current_time = time.time()
        
        # 1. Parse incoming data
        node_id = data.get("node_id")
        depth_sonic = data.get("depth_sonic", 0.0)
        depth_probes = data.get("depth_probes", [0]*6)
        temp_c = data.get("temp_c", 0.0)

        # 2. Calculate Highest Active Probe
        probe_heights = [0, 3, 6, 9, 12, 15]
        max_probe_depth = -1
        for i, is_wet in enumerate(depth_probes):
            if is_wet == 1:
                max_probe_depth = probe_heights[i]

        # 3. CALCULATE RATE OF RISE (dh/dt)
        time_diff = current_time - state["last_timestamp"]
        depth_diff = depth_sonic - state["last_depth_sonic"]
        
        if time_diff > 0:
            rate_of_rise = depth_diff / time_diff # cm per second
        else:
            rate_of_rise = 0.0

        # Update historical state for the next loop
        state["last_depth_sonic"] = depth_sonic
        state["last_timestamp"] = current_time
        state["rate_of_rise"] = rate_of_rise

        # 4. Print Dashboard to Terminal
        print(f"\n--- Live Update from {node_id} ---")
        print(f"Probe Depth (Discrete): {max_probe_depth} cm")
        print(f"Sonic Depth (Smooth):   {depth_sonic:.2f} cm")
        print(f"Flood Velocity (dh/dt): {rate_of_rise:.2f} cm/sec")
        print(f"Water Temperature:      {temp_c:.2f} °C")
        
        return jsonify({"status": "success"}), 200

    except Exception as e:
        print(f"Error parsing data: {e}")
        return jsonify({"status": "error"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)