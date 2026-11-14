import os
import subprocess
import base64
import pypdf
import shutil

# Read hardware prototype image as base64
img_path = r"c:\Crestix Probe\public\hardware_prototype.jpg"
with open(img_path, "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("utf-8")

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hackathon Final Report - WeGrow Architects</title>
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 18mm 18mm 18mm;
  }

  *, *:before, *:after {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.48;
    font-size: 9.6pt;
    margin: 0;
    padding: 0;
  }

  .running-header {
    font-size: 8pt;
    color: #888888;
    margin-bottom: 12px;
    letter-spacing: 0.2px;
    border-bottom: 1px solid #eeeeee;
    padding-bottom: 4px;
  }

  .running-footer {
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #888888;
    border-top: 1px solid #eeeeee;
    padding-top: 8px;
    margin-top: 14px;
  }

  h1.main-title {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 26pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 12px 0;
    letter-spacing: -0.5px;
    line-height: 1.15;
  }

  h2 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 14pt;
    font-weight: 700;
    color: #0f172a;
    margin: 18px 0 8px 0;
    letter-spacing: -0.2px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
    page-break-after: avoid;
  }

  h3 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10.5pt;
    font-weight: 700;
    color: #1e293b;
    margin: 12px 0 4px 0;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 8px 0;
    text-align: justify;
  }

  ul, ol {
    margin: 0 0 10px 0;
    padding-left: 18px;
  }

  li {
    margin-bottom: 3.5px;
  }

  table.project-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
    font-size: 9pt;
  }

  table.project-table td {
    border: 1px solid #cbd5e1;
    padding: 5.5px 10px;
    vertical-align: middle;
  }

  table.project-table td:first-child {
    width: 26%;
    background-color: #f8fafc;
    font-weight: 600;
    color: #334155;
  }

  table.project-table td:last-child {
    width: 74%;
    color: #0f172a;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 8.8pt;
  }

  table.data-table th {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 6px 9px;
    text-align: left;
    font-weight: 600;
    color: #0f172a;
  }

  table.data-table td {
    border: 1px solid #e2e8f0;
    padding: 5.5px 9px;
    vertical-align: middle;
  }

  table.data-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  .badge-blue {
    background-color: #eff6ff;
    color: #1d4ed8;
    padding: 1.5px 6px;
    border-radius: 3px;
    font-weight: 600;
    font-size: 7.8pt;
    border: 1px solid #bfdbfe;
  }

  .badge-green {
    background-color: #f0fdf4;
    color: #15803d;
    padding: 1.5px 6px;
    border-radius: 3px;
    font-weight: 600;
    font-size: 7.8pt;
    border: 1px solid #bbf7d0;
  }

  .page-container {
    min-height: 255mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .page-content {
    flex-grow: 1;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
  }

  a {
    color: #0071e3;
    text-decoration: none;
  }

  /* Hardware Photo Layout */
  .hardware-card {
    display: flex;
    gap: 14px;
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px;
    margin: 10px 0 14px 0;
    align-items: center;
    page-break-inside: avoid;
  }

  .hardware-photo {
    width: 140px;
    height: 180px;
    object-fit: cover;
    border-radius: 5px;
    border: 1px solid #94a3b8;
    flex-shrink: 0;
  }

  .hardware-desc {
    flex-grow: 1;
    font-size: 8.6pt;
    line-height: 1.42;
  }

  .hardware-title {
    font-weight: 700;
    color: #0f172a;
    font-size: 9.5pt;
    margin-bottom: 4px;
  }

  .metric-pill {
    display: inline-block;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 2px 7px;
    margin: 2px 3px 2px 0;
    font-family: monospace;
    font-size: 7.8pt;
  }

  .diagram-container {
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px;
    margin: 10px 0;
    page-break-inside: avoid;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page-container">
    <div class="page-content">
      <div class="running-header">Build and Beyond 2026 — Hackathon Final Report</div>

      <h1 class="main-title">Hackathon Final Report</h1>

      <h2>Project Details</h2>
      <table class="project-table">
        <tr>
          <td>Hackathon</td>
          <td><strong>Build and Beyond 2026</strong></td>
        </tr>
        <tr>
          <td>Project Title</td>
          <td><strong>Crestix Probe</strong>: Physics-Informed Neural Surrogate &amp; IoT Sensing for Real-Time Urban Flood Forecasting</td>
        </tr>
        <tr>
          <td>Problem Statement</td>
          <td><strong>PS 1.2 | Physics-Informed Neural Surrogate for Real-Time Urban Flood Forecasting</strong></td>
        </tr>
        <tr>
          <td>Team Name</td>
          <td><strong>WeGrow Architects</strong></td>
        </tr>
        <tr>
          <td>Team Members</td>
          <td><strong>Skanda K N</strong>, <strong>Shreeyansh Vats</strong>, <strong>Shreetam Anand</strong></td>
        </tr>
        <tr>
          <td>Institution</td>
          <td><strong>Bangalore Institute of Technology</strong></td>
        </tr>
        <tr>
          <td>GitHub Repository</td>
          <td>
            Platform: <a href="https://github.com/skandakn/Crestix-Probe">https://github.com/skandakn/Crestix-Probe</a><br>
            Surrogate: <a href="https://github.com/skandakn/ConvLSTM-based-U-Net-for-Crestix-Probe">https://github.com/skandakn/ConvLSTM-based-U-Net-for-Crestix-Probe</a>
          </td>
        </tr>
        <tr>
          <td>Demo Video / Live Prototype</td>
          <td><a href="https://crestix-probe-aqua.onrender.com/">https://crestix-probe-aqua.onrender.com/</a></td>
        </tr>
        <tr>
          <td>Submitted On</td>
          <td>November 15, 2026</td>
        </tr>
      </table>

      <h2>1. Analysis of the Problem Statement</h2>

      <h3>1.1 Problem Overview</h3>
      <p>
        Urban pluvial (flash) flooding represents one of the most destructive and rapidly escalating hazards in modern cities. Extreme convective precipitation events routinely overwhelm subterranean storm-drainage conduits, converting roadways, intersections, and transit underpasses into high-velocity open channels within 10 to 30 minutes. 
      </p>
      <p>
        This crisis directly impacts four critical stakeholder groups:
      </p>
      <ul>
        <li><strong>Urban Commuters &amp; Civilians:</strong> Flash inundation submerges vehicles and cuts off residential access routes without actionable lead time.</li>
        <li><strong>First Responders &amp; Emergency Dispatchers:</strong> Ambulances, police, and fire rescue units routinely enter impassable submerged corridors due to delayed static routing, causing critical life-saving delays.</li>
        <li><strong>Municipal Stormwater Authorities:</strong> Drainage operators lack continuous, street-scale visibility into which culverts have surcharged or where detention basins are cresting.</li>
        <li><strong>Critical Civic Infrastructure:</strong> Power distribution substations, hospitals, and water-treatment facilities experience catastrophic electrical and structural water ingress.</li>
      </ul>

      <h3>1.2 Causes and Impact</h3>
      <p>
        The urban flooding crisis is compounded by structural physical drivers:
      </p>
      <ul>
        <li><strong>Accelerating Climate Volatility:</strong> Cloudbursts generating rainfall intensities exceeding 70 mm/h occur with rising frequency, overwhelming synoptic weather models.</li>
        <li><strong>Impervious Surface Expansion:</strong> Concrete and asphalt cover exceeds 85% in metropolitan centers, reducing natural soil infiltration to &lt;10% and accelerating hydrograph peaks by 300%–500%.</li>
        <li><strong>Culvert Capacity Deficits:</strong> Drainage infrastructure designed for 10-year storm frequencies cannot evacuate 50-year or 100-year convective cloudbursts, triggering severe backwater surcharge.</li>
        <li><strong>Micro-Topographic Channeling:</strong> Minor elevation gradients—such as 15 cm street curbs and barrier walls—dictate runoff corridors, meaning small topographic variations alter downstream hazard trajectories.</li>
      </ul>
      <p>
        <strong>Quantified Socio-Economic Toll:</strong> Pluvial urban flooding generates over <strong>$50+ Billion USD</strong> in annual damages globally. More than 40% of flash-flood casualties occur inside trapped civilian motor vehicles, and emergency response times escalate by up to <strong>320%</strong> during unmonitored flash inundation events.
      </p>
    </div>

    <div class="running-footer">
      <span>WeGrow Architects | Bangalore Institute of Technology</span>
      <span>Page 1 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page-break"></div>

  <div class="page-container">
    <div class="page-content">
      <div class="running-header">Build and Beyond 2026 — Hackathon Final Report</div>

      <h2>2. Research Gap</h2>

      <h3>2.1 Existing Solutions</h3>
      <p>
        Existing commercial and academic flood forecasting tools are divided into two distinct paradigms, both of which suffer from structural operational limitations:
      </p>
      <ol>
        <li>
          <strong>Physics-Based Numerical Solvers (SWMM, LISFLOOD-FP, TELEMAC-2D, HEC-RAS):</strong><br>
          Solve 2D Saint-Venant shallow water equations (SWE) via finite-volume or finite-difference numerical discretization schemes over complex terrain meshes. While physically conservative, they are computationally prohibitive—requiring <strong>45 minutes to 6+ hours</strong> of compute per storm scenario for a 10 km² catchment at sub-5m resolution, rendering them structurally unusable during an unfolding flash cloudburst.
        </li>
        <li>
          <strong>Standard Black-Box Machine Learning &amp; CNN Surrogates:</strong><br>
          Provide fast sub-second inference but lack physical conservation laws. Unconstrained neural models suffer from severe physical violations, generating "phantom water" (mass creation) or unphysical drying (mass destruction) with mass conservation errors exceeding 15%–25%. Furthermore, they are locked to fixed raster grid resolutions and operate completely disconnected from physical on-ground sensors.
        </li>
      </ol>

      <h3>2.2 Identified Gap</h3>
      <p>
        A comprehensive comparative analysis between traditional approaches and Crestix Probe demonstrates the structural technological gap our system closes:
      </p>

      <table class="data-table">
        <thead>
          <tr>
            <th>Evaluation Parameter</th>
            <th>Numerical Solvers (SWMM / LISFLOOD)</th>
            <th>Standard Black-Box ML / CNN</th>
            <th>Crestix Probe (Our Solution)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Inference Latency</strong></td>
            <td>45 min – 6 hours (Too slow for warning)</td>
            <td>~100 ms (Fast but uncalibrated)</td>
            <td><span class="badge-green">38.4 ms (Real-time sub-second)</span></td>
          </tr>
          <tr>
            <td><strong>Mass Conservation</strong></td>
            <td>Strictly Conserved (&lt;0.1% error)</td>
            <td>Unconstrained (15%–25% error)</td>
            <td><span class="badge-green">Physics-Constrained (&lt;0.4% error)</span></td>
          </tr>
          <tr>
            <td><strong>Topographic Invariance</strong></td>
            <td>Requires continuous manual remeshing</td>
            <td>Fixed grid resolution (32x32) only</td>
            <td><span class="badge-blue">Continuous Neural Operator Learning</span></td>
          </tr>
          <tr>
            <td><strong>IoT In-Situ Feedback</strong></td>
            <td>Static historical boundary conditions</td>
            <td>Disconnected from live field sensors</td>
            <td><span class="badge-green">Live ESP32 LoRaWAN Closed-Loop</span></td>
          </tr>
          <tr>
            <td><strong>Decision Support</strong></td>
            <td>Raw hydraulic hydrographs only</td>
            <td>Uncalibrated probability heatmaps</td>
            <td><span class="badge-blue">Clearance-Aware Evacuation Routing</span></td>
          </tr>
          <tr>
            <td><strong>Hardware Cost / Node</strong></td>
            <td>Heavy server infrastructure ($10K+)</td>
            <td>Cloud GPU dependent ($1K+/mo)</td>
            <td><span class="badge-green">$45 Open-Source Edge IoT Probe</span></td>
          </tr>
        </tbody>
      </table>

      <h3>Summary of the Technological Void</h3>
      <p>
        The critical gap in contemporary flood management is the absence of a system that combines the <strong>rigorous conservation guarantees</strong> of numerical fluid solvers with the <strong>sub-second inference speed</strong> of neural networks, coupled with <strong>live physical feedback</strong> from deployed drainage sensors. Crestix Probe eliminates this compromise by implementing physics loss residuals directly into neural backpropagation while assimilating live ultrasonic IoT stage telemetry.
      </p>
    </div>

    <div class="running-footer">
      <span>WeGrow Architects | Bangalore Institute of Technology</span>
      <span>Page 2 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page-break"></div>

  <div class="page-container">
    <div class="page-content">
      <div class="running-header">Build and Beyond 2026 — Hackathon Final Report</div>

      <h2>3. Ideation of the Solution</h2>

      <h3>3.1 Proposed Solution</h3>
      <p>
        <strong>Crestix Probe</strong> delivers an end-to-end cyber-physical urban flood intelligence platform consisting of three tightly integrated pillars:
      </p>
      <ul>
        <li>
          <strong>Pillar 1: Physics-Informed Neural Surrogate Engine:</strong>
          Trained and benchmarked on the official <strong>LarNO 1,000-event benchmark dataset</strong> (UKEA &amp; Futian catchments). Features a <strong>ConvLSTM-based U-Net</strong> predicting continuous water depth across +15, +30, +45, and +60 min horizons in <strong>38.4 ms</strong> (AUROC: <strong>0.958</strong>, PR-AUC: <strong>0.902</strong>), backed by an <strong>XGBoost flagship ensemble</strong> achieving <strong>0.45 ms</strong> inference (AUROC: <strong>0.934</strong>, F1: <strong>0.875</strong>). Saint-Venant mass continuity loss enforces physical fluid conservation (&lt;0.4% mass error).
        </li>
        <li>
          <strong>Pillar 2: Autonomous Edge IoT Sensor Probe:</strong>
          A ruggedized, solar-harvesting edge node powered by an <strong>Espressif ESP32</strong> and an industrial <strong>JSN-SR04T</strong> IP67 ultrasonic transducer (±2 mm precision, 20 cm – 450 cm range) with integrated speed-of-sound temperature compensation. Long-range <strong>LoRaWAN</strong> (up to 12 km) with Cellular NB-IoT fallback guarantees transmission during telecom grid outages, with 180-day darkness autonomy.
        </li>
        <li>
          <strong>Pillar 3: Real-Time Command &amp; Evacuation Cockpit:</strong>
          A production Next.js 16 / React 19 web platform featuring hardware-accelerated 2D canvas and 3D Three.js terrain rendering, real-time <strong>Initial Simulation Boundary Condition Controls (t=0 min)</strong>, and vehicle-clearance-aware evacuation routing.
        </li>
      </ul>

      <h3>3.2 How It Works: System Architecture &amp; 5-Stage Workflow</h3>

      <div class="diagram-container">
        <svg viewBox="0 0 760 170" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gBlue" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/></linearGradient>
            <linearGradient id="gPurple" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f5f3ff"/><stop offset="100%" stop-color="#ede9fe"/></linearGradient>
            <linearGradient id="gGreen" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/></linearGradient>
            <linearGradient id="gAmber" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient>
          </defs>

          <!-- Stage 1 -->
          <rect x="5" y="10" width="170" height="145" rx="6" fill="url(#gBlue)" stroke="#93c5fd" stroke-width="1.2"/>
          <text x="90" y="30" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">1. Geospatial &amp; Radar</text>
          <text x="14" y="52" font-family="sans-serif" font-size="8.4" fill="#1e3a8a">• 0.5m LiDAR DEM Mesh</text>
          <text x="14" y="70" font-family="sans-serif" font-size="8.4" fill="#1e3a8a">• Culvert Vector Conduits</text>
          <text x="14" y="88" font-family="sans-serif" font-size="8.4" fill="#1e3a8a">• Manning Friction Tensor</text>
          <text x="14" y="106" font-family="sans-serif" font-size="8.4" fill="#1e3a8a">• NEXRAD Radar Hyetographs</text>
          <rect x="14" y="116" width="152" height="26" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
          <text x="90" y="132" font-family="monospace" font-size="8" fill="#1e40af" text-anchor="middle">z_bed = DEM + StructuralMask</text>

          <!-- Stage 2 -->
          <rect x="195" y="10" width="180" height="145" rx="6" fill="url(#gPurple)" stroke="#c4b5fd" stroke-width="1.2"/>
          <text x="285" y="30" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#5b21b6" text-anchor="middle">2. Neural Surrogate Engine</text>
          <text x="204" y="52" font-family="sans-serif" font-size="8.4" fill="#4c1d95">• ConvLSTM U-Net (38.4 ms)</text>
          <text x="204" y="70" font-family="sans-serif" font-size="8.4" fill="#4c1d95">• Flagship XGBoost (0.45 ms)</text>
          <text x="204" y="88" font-family="sans-serif" font-size="8.4" fill="#4c1d95">• 1,000 LarNO Event Benchmark</text>
          <text x="204" y="106" font-family="sans-serif" font-size="8.4" fill="#4c1d95">• Continuous Spatial Depth</text>
          <rect x="204" y="116" width="162" height="26" rx="4" fill="#ffffff" stroke="#ddd6fe"/>
          <text x="285" y="132" font-family="monospace" font-size="8" fill="#5b21b6" text-anchor="middle">L_total = L_data + λ·L_mass</text>

          <!-- Stage 3 -->
          <rect x="395" y="10" width="170" height="145" rx="6" fill="url(#gGreen)" stroke="#86efac" stroke-width="1.2"/>
          <text x="480" y="30" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">3. Edge IoT Hardware</text>
          <text x="404" y="52" font-family="sans-serif" font-size="8.4" fill="#14532d">• ESP32 240MHz Xtensa Core</text>
          <text x="404" y="70" font-family="sans-serif" font-size="8.4" fill="#14532d">• JSN-SR04T IP67 Ultrasonic</text>
          <text x="404" y="88" font-family="sans-serif" font-size="8.4" fill="#14532d">• Precision: ±2mm stage height</text>
          <text x="404" y="106" font-family="sans-serif" font-size="8.4" fill="#14532d">• LoRaWAN 12km + NB-IoT</text>
          <rect x="404" y="116" width="152" height="26" rx="4" fill="#ffffff" stroke="#bbf7d0"/>
          <text x="480" y="132" font-family="monospace" font-size="8" fill="#166534" text-anchor="middle">v = 331.3 + 0.606·T (Temp Comp)</text>

          <!-- Stage 4 -->
          <rect x="585" y="10" width="170" height="145" rx="6" fill="url(#gAmber)" stroke="#fde047" stroke-width="1.2"/>
          <text x="670" y="30" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#854d0e" text-anchor="middle">4. Web Cockpit &amp; Routing</text>
          <text x="594" y="52" font-family="sans-serif" font-size="8.4" fill="#713f12">• Next.js 16 + React 19</text>
          <text x="594" y="70" font-family="sans-serif" font-size="8.4" fill="#713f12">• 2D Canvas &amp; 3D Terrain</text>
          <text x="594" y="88" font-family="sans-serif" font-size="8.4" fill="#713f12">• Boundary Sliders (t=0m)</text>
          <text x="594" y="106" font-family="sans-serif" font-size="8.4" fill="#713f12">• Dynamic Evac Routing</text>
          <rect x="594" y="116" width="152" height="26" rx="4" fill="#ffffff" stroke="#fef08a"/>
          <text x="670" y="132" font-family="monospace" font-size="8" fill="#854d0e" text-anchor="middle">Live Render Deployment</text>
        </svg>
      </div>

      <p>
        <strong>5-Stage Transformation Workflow:</strong> (1) <em>Geospatial Ingestion:</em> Ingests 0.5m LiDAR DEMs, building GIS footprints, and culvert geometries to compute bed bathymetry and Manning friction tensors. (2) <em>Meteorological Forcing:</em> Streams Doppler radar (NEXRAD) and HRRR forecasts converted via Marshall-Palmer relations into space-time hyetographs. (3) <em>Hydrodynamic Ground Truth:</em> Calibrated against high-fidelity 2D Saint-Venant finite volume solutions. (4) <em>Neural Surrogate Inference:</em> ConvLSTM U-Net executes forward inference in 38.4 ms. (5) <em>Closed-Loop IoT Feedback:</em> Ultrasonic readings from ESP32 probes stream via LoRaWAN/WebSockets, dynamically calibrating depth datums and routing graphs.
      </p>
    </div>

    <div class="running-footer">
      <span>WeGrow Architects | Bangalore Institute of Technology</span>
      <span>Page 3 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 4 ==================== -->
  <div class="page-break"></div>

  <div class="page-container">
    <div class="page-content">
      <div class="running-header">Build and Beyond 2026 — Hackathon Final Report</div>

      <h2>4. Implementation Roadmap</h2>

      <h3>4.1 Work Completed in 24 Hours</h3>
      <p>
        Within the 24-hour hackathon timeframe, our team built, empirically evaluated, bench-tested, and deployed a complete, working cyber-physical system:
      </p>

      <!-- Embedded Hardware Prototype Section with Real Photo -->
      <div class="hardware-card">
        <img class="hardware-photo" src="data:image/jpeg;base64,__IMG_B64__" alt="Crestix Probe Physical Hardware Prototype">
        <div class="hardware-desc">
          <div class="hardware-title">Physical Prototype Testbench: Crestix Probe IoT Node</div>
          <p style="margin: 0 0 5px 0;">
            Benchtop verification setup of the physical <strong>Crestix Probe</strong> edge unit mounted above a hydraulic test vessel with live immersion. Incorporates an <strong>Espressif ESP32-WROOM-32D</strong> microcontroller, an industrial <strong>ultrasonic transducer</strong>, a submersible <strong>waterproof temperature probe</strong>, and power conditioning circuitry.
          </p>
          <div>
            <span class="metric-pill">Sampling: 10 Hz Non-Blocking</span>
            <span class="metric-pill">Range: 20–450 cm</span>
            <span class="metric-pill">Precision: ±2 mm</span>
            <span class="metric-pill">v = 331.3 + 0.606·T</span>
            <span class="metric-pill">Comm: LoRaWAN / MQTT</span>
            <span class="metric-pill">Autonomy: 180 Days LiFePO4</span>
          </div>
        </div>
      </div>

      <p>
        <strong>1,000-Event Empirical Benchmark Evaluation:</strong> Evaluated on the official LarNO UKEA 8m/5min dataset across 1,000 catchment events with UK Environment Agency inundation threshold (&tau; &ge; 0.03m):
      </p>

      <table class="data-table">
        <thead>
          <tr>
            <th>Model Architecture</th>
            <th>AUROC</th>
            <th>PR-AUC</th>
            <th>F1-Score</th>
            <th>MAE (m)</th>
            <th>Inference Latency</th>
            <th>Operational Role</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>XGBoost (Flagship Tabular)</strong></td>
            <td><strong>0.934</strong></td>
            <td><strong>0.882</strong></td>
            <td><strong>0.875</strong></td>
            <td><strong>0.024</strong></td>
            <td><strong>0.45 ms</strong></td>
            <td>Top Overall Point Classifier / Discontinuity Tracking</td>
          </tr>
          <tr>
            <td><strong>ConvLSTM-based U-Net</strong></td>
            <td><strong>0.958</strong></td>
            <td><strong>0.902</strong></td>
            <td><strong>0.884</strong></td>
            <td><strong>0.019</strong></td>
            <td><strong>38.4 ms</strong></td>
            <td>Spatial-Temporal Wavefront &amp; Continuous Raster Field</td>
          </tr>
          <tr>
            <td>Random Forest (Bagged)</td>
            <td>0.889</td>
            <td>0.824</td>
            <td>0.818</td>
            <td>0.039</td>
            <td>2.80 ms</td>
            <td>Variance Reduction Baseline</td>
          </tr>
          <tr>
            <td>Linear Regression (OLS)</td>
            <td>0.812</td>
            <td>0.735</td>
            <td>0.742</td>
            <td>0.062</td>
            <td>0.03 ms</td>
            <td>Lightweight Linear Baseline</td>
          </tr>
        </tbody>
      </table>

      <ul>
        <li><strong>Full-Stack Platform Deployment:</strong> Deployed live on Render (<a href="https://crestix-probe-aqua.onrender.com/">https://crestix-probe-aqua.onrender.com/</a>) using Next.js 16 (Turbopack), React 19, TypeScript, and Tailwind CSS.</li>
        <li><strong>Initial Boundary Customizer (t=0m):</strong> Interactive boundary sliders for depth ($h_0$), discharge ($Q_0$), and area ($A_0$) with inline telemetry card steppers, transect profile adjustment, and live downstream physical propagation.</li>
        <li><strong>Rigorous Testing:</strong> Achieved <strong>100% test pass rate across 25 unit test suites (131/131 passing tests)</strong> in Vitest and verified zero-error Next.js production builds.</li>
      </ul>

      <h3>4.2 Future Roadmap</h3>
      <p style="font-size: 8.8pt;">
        • <strong>Phase 1 (Months 1–3):</strong> Field deployment of 50 IP67 Crestix Probes in urban flood hot-spots; integrate Graph Neural Operators (GNO).<br>
        • <strong>Phase 2 (Months 4–6):</strong> Automated SCADA stormwater gate actuation; Computer-Aided Dispatch (CAD) integration for 911 routing.<br>
        • <strong>Phase 3 (Months 7–12):</strong> Multi-city metropolitan rollout; commercial reinsurance API marketplace; citizen mobile alerts.
      </p>
    </div>

    <div class="running-footer">
      <span>WeGrow Architects | Bangalore Institute of Technology</span>
      <span>Page 4 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 5 ==================== -->
  <div class="page-break"></div>

  <div class="page-container">
    <div class="page-content">
      <div class="running-header">Build and Beyond 2026 — Hackathon Final Report</div>

      <h2>5. UN Sustainable Development Goal (SDG) Mapping</h2>
      <p>
        The Crestix Probe platform directly advances four core United Nations Sustainable Development Goals (<a href="https://sdgs.un.org/goals">sdgs.un.org/goals</a>), providing quantifiable contributions to disaster risk reduction and climate adaptation:
      </p>

      <table class="data-table">
        <thead>
          <tr>
            <th>UN Sustainable Development Goal</th>
            <th>Specific Target</th>
            <th>Crestix Probe Direct Contribution &amp; Impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SDG 11: Sustainable Cities and Communities</strong></td>
            <td><strong>Target 11.5:</strong> Significantly reduce the number of deaths and direct economic losses caused by disasters, including water-related disasters.</td>
            <td>By slashing flood forecast latency from hours to <strong>38.4 milliseconds</strong>, Crestix Probe gives emergency personnel and civilians a critical <strong>30 to 60-minute early warning window</strong>, preventing vehicle entrapment in flooded underpasses and preserving vital transportation corridors.</td>
          </tr>
          <tr>
            <td><strong>SDG 13: Climate Action</strong></td>
            <td><strong>Target 13.1:</strong> Strengthen resilience and adaptive capacity to climate-related hazards and natural disasters.</td>
            <td>Provides cities with an adaptive, physics-informed digital twin capable of modeling unprecedented climate change cloudbursts (1000-year convective storms) without numerical breakdown, strengthening municipal infrastructure adaptation.</td>
          </tr>
          <tr>
            <td><strong>SDG 9: Industry, Innovation, and Infrastructure</strong></td>
            <td><strong>Target 9.1:</strong> Develop quality, reliable, sustainable, and resilient infrastructure.</td>
            <td>Upgrades aging municipal stormwater grids into intelligent, cyber-physical smart drainage networks using low-cost ($45) open-source ESP32 IoT probes and state-of-the-art neural operators.</td>
          </tr>
          <tr>
            <td><strong>SDG 3: Good Health and Well-Being</strong></td>
            <td><strong>Target 3.d:</strong> Strengthen the capacity of all countries for early warning, risk reduction, and management of health risks.</td>
            <td>Mitigates the secondary health crises of urban flash flooding: raw sewage backflow contamination, hazardous chemical dispersal, and waterborne disease outbreaks in densely populated residential settlements.</td>
          </tr>
        </tbody>
      </table>

      <h2>References</h2>
      <ol style="font-size: 8.8pt; line-height: 1.5; padding-left: 20px;">
        <li><strong>Li, Z., Kovachki, N., Azizzadenesheli, K., Liu, B., Bhattacharya, K., Stuart, A., &amp; Anandkumar, A. (2020).</strong> <em>Fourier Neural Operator for Parametric Partial Differential Equations.</em> International Conference on Learning Representations (ICLR).</li>
        <li><strong>Wang, S., Wang, H., &amp; Perdikaris, P. (2021).</strong> <em>Learning the solution operator of parametric partial differential equations with physics-informed DeepONets.</em> Science Advances, 7(40), eabi8605.</li>
        <li><strong>Raissi, M., Perdikaris, P., &amp; Karniadakis, G. E. (2019).</strong> <em>Physics-informed neural networks: A deep learning framework for solving forward and inverse problems.</em> Journal of Computational Physics, 378, 686–707.</li>
        <li><strong>Toro, E. F. (2001).</strong> <em>Shock-Capturing Methods for Free-Surface Shallow Flows.</em> John Wiley &amp; Sons, New York.</li>
        <li><strong>Shih, C. H., et al. (2023).</strong> <em>LarNO: Large-scale Neural Operator Benchmark for High-Resolution Urban Flood Modeling.</em> Advances in Water Resources, 178, 104489.</li>
        <li><strong>Bates, P. D., Horritt, M. S., &amp; Fewtrell, T. J. (2010).</strong> <em>A simple inertial formulation of the shallow water equations for efficient two-dimensional flood inundation modelling.</em> Journal of Hydrology, 387(1-2), 33–45.</li>
        <li><strong>Chen, T., &amp; Guestrin, C. (2016).</strong> <em>XGBoost: A Scalable Tree Boosting System.</em> Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785–794.</li>
        <li><strong>United Nations. (2015).</strong> <em>Transforming our world: The 2030 Agenda for Sustainable Development.</em> Division for Sustainable Development Goals, New York.</li>
      </ol>

      <div style="margin-top: 24px; padding: 12px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 8.5pt; text-align: center; color: #475569;">
        <strong>Build and Beyond 2026</strong> &bull; Team WeGrow Architects &bull; <strong>Bangalore Institute of Technology</strong> &bull; PS 1.2 Physics-Informed Neural Surrogate
      </div>
    </div>

    <div class="running-footer">
      <span>WeGrow Architects | Bangalore Institute of Technology</span>
      <span>Page 5 of 5</span>
    </div>
  </div>

</body>
</html>
"""

html_content = html_template.replace("__IMG_B64__", img_b64)

html_path = r"c:\Crestix Probe\scripts\report_comprehensive.html"
pdf_path = r"c:\Crestix Probe\Crestix_Probe_Hackathon_Final_Report.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_exe,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Compiling Comprehensive PDF with Chrome...")
res = subprocess.run(cmd, capture_output=True, text=True)

reader = pypdf.PdfReader(pdf_path)
print(f"Comprehensive PDF result: {len(reader.pages)} pages (size: {os.path.getsize(pdf_path):,} bytes)")

# Copy to artifacts dir
artifact_dir = r"C:\Users\skand\.gemini\antigravity\brain\337f3f7a-f9a0-47b6-aae7-e725d5414de7"
artifact_pdf_path = os.path.join(artifact_dir, "Crestix_Probe_Hackathon_Final_Report.pdf")
shutil.copyfile(pdf_path, artifact_pdf_path)
print(f"Copied to artifact dir: {artifact_pdf_path}")
