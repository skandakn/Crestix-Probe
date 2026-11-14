import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hackathon Final Report - WeGrow Architects</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @top-left {
      content: "Hackathon Final Report";
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 8.5pt;
      color: #71717a;
    }
    @bottom-left {
      content: "Hackathon Final Report";
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 8.5pt;
      color: #71717a;
    }
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 8.5pt;
      color: #71717a;
    }
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #18181b;
    line-height: 1.55;
    font-size: 10pt;
    margin: 0;
    padding: 0;
  }

  /* Running Header / Footer for browsers that don't support CSS Paged Media @top/@bottom */
  .header-rule {
    font-size: 8.5pt;
    color: #71717a;
    margin-bottom: 24px;
    letter-spacing: 0.2px;
  }

  h1.main-title {
    font-family: Georgia, Cambria, "Times New Roman", Times, serif;
    font-size: 26pt;
    font-weight: 700;
    color: #09090b;
    margin: 0 0 10px 0;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }

  .instructions-note {
    font-style: italic;
    color: #52525b;
    font-size: 9.5pt;
    line-height: 1.5;
    margin-bottom: 24px;
  }

  h2 {
    font-family: Georgia, Cambria, "Times New Roman", Times, serif;
    font-size: 15pt;
    font-weight: 700;
    color: #18181b;
    margin: 24px 0 10px 0;
    letter-spacing: -0.2px;
    page-break-after: avoid;
  }

  h3 {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11pt;
    font-weight: 700;
    color: #27272a;
    margin: 16px 0 6px 0;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 10px 0;
    text-align: justify;
  }

  ul, ol {
    margin: 0 0 12px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  /* Tables */
  table.project-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 24px 0;
    font-size: 9.5pt;
  }

  table.project-table th, table.project-table td {
    border: 1px solid #e4e4e7;
    padding: 7px 12px;
    text-align: left;
    vertical-align: top;
  }

  table.project-table td:first-child {
    width: 28%;
    background-color: #fafafa;
    font-weight: 600;
    color: #27272a;
  }

  table.project-table td:last-child {
    width: 72%;
    color: #09090b;
  }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 9pt;
  }

  table.data-table th {
    background-color: #f4f4f5;
    border: 1px solid #d4d4d8;
    padding: 6px 10px;
    text-align: left;
    font-weight: 600;
    color: #18181b;
  }

  table.data-table td {
    border: 1px solid #e4e4e7;
    padding: 6px 10px;
    vertical-align: middle;
  }

  table.data-table tr:nth-child(even) td {
    background-color: #fafafa;
  }

  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 600;
    font-family: monospace;
  }

  .badge-blue {
    background-color: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .badge-green {
    background-color: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  /* Architectural Diagram Box */
  .diagram-container {
    background-color: #fafafa;
    border: 1px solid #e4e4e7;
    border-radius: 6px;
    padding: 14px;
    margin: 14px 0;
    page-break-inside: avoid;
  }

  .formula-box {
    background-color: #f8fafc;
    border-left: 3px solid #0284c7;
    padding: 8px 12px;
    margin: 10px 0;
    font-family: "Courier New", Courier, monospace;
    font-size: 8.8pt;
    color: #0f172a;
  }

  .page-break {
    page-break-before: always;
  }

  a {
    color: #0071e3;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .footer-meta {
    margin-top: 24px;
    border-top: 1px solid #e4e4e7;
    padding-top: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #71717a;
  }
</style>
</head>
<body>

  <div class="header-rule">Hackathon Final Report</div>

  <h1 class="main-title">Hackathon Final Report</h1>
  <div class="instructions-note">
    This is the final submission report, due at the end of the 24-hour hackathon. Replace the bracketed text with your own. Shape each section the way that suits your idea, with your own sub-points, tables or diagrams. Aim for about one page per section.
  </div>

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
      <td>[College / Organisation]</td>
    </tr>
    <tr>
      <td>GitHub Repository</td>
      <td>
        Full-Stack Platform: <a href="https://github.com/skandakn/Crestix-Probe">https://github.com/skandakn/Crestix-Probe</a><br>
        Surrogate Model: <a href="https://github.com/skandakn/ConvLSTM-based-U-Net-for-Crestix-Probe">https://github.com/skandakn/ConvLSTM-based-U-Net-for-Crestix-Probe</a>
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
    This acute crisis directly impacts four critical stakeholder groups:
  </p>
  <ul>
    <li><strong>Urban Commuters &amp; Civilians:</strong> Flash inundation traps passenger vehicles and cuts off residential access routes without actionable lead time.</li>
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
    <strong>Quantified Impact:</strong> Flooding accounts for over <strong>$50+ Billion USD</strong> in annual global economic damages. Over 40% of flash-flood casualties occur inside trapped vehicles, and emergency response times increase by up to <strong>320%</strong> during unmonitored flash flood events.
  </p>

  <div class="page-break"></div>

  <div class="header-rule">Hackathon Final Report</div>

  <h2>2. Research Gap</h2>

  <h3>2.1 Existing Solutions</h3>
  <p>
    Existing commercial and academic flood forecasting tools are divided into two distinct paradigms, both of which suffer from structural limitations:
  </p>
  <ol>
    <li>
      <strong>Physics-Based Numerical Solvers (SWMM, LISFLOOD-FP, TELEMAC-2D, HEC-RAS):</strong><br>
      Solve 2D Shallow Water Equations (SWE) via finite-volume or finite-difference schemes. While physically conservative and accurate, they are computationally prohibitive—requiring <strong>45 minutes to 6+ hours</strong> to simulate a single storm across a 10 km² catchment at sub-5m resolution, rendering them unusable during an unfolding emergency.
    </li>
    <li>
      <strong>Black-Box Machine Learning &amp; Standard CNN Surrogates:</strong><br>
      Provide fast inference (&lt;1s) but lack physical constraints. They violate basic mass and momentum conservation (generating "phantom water" or unphysical drying with mass conservation errors exceeding 15%–25%), fail to generalize across different mesh resolutions, and operate decoupled from in-situ ground sensors.
    </li>
  </ol>

  <h3>2.2 Identified Gap</h3>
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
        <td>45 min – 6 hours (Too slow)</td>
        <td>~100 ms (Fast)</td>
        <td><span class="badge badge-green">38.4 ms (Real-time sub-second)</span></td>
      </tr>
      <tr>
        <td><strong>Mass Conservation</strong></td>
        <td>Rigorous (&lt;0.1% error)</td>
        <td>Unconstrained (15%–25% error)</td>
        <td><span class="badge badge-green">Physics-Constrained (&lt;0.4% error)</span></td>
      </tr>
      <tr>
        <td><strong>Mesh Invariance</strong></td>
        <td>Requires heavy remeshing</td>
        <td>Fixed grid resolution only</td>
        <td><span class="badge badge-blue">Continuous Operator Learning</span></td>
      </tr>
      <tr>
        <td><strong>IoT Data Assimilation</strong></td>
        <td>Static boundary conditions</td>
        <td>Disconnected from hardware</td>
        <td><span class="badge badge-green">Live ESP32 LoRaWAN Closed-Loop</span></td>
      </tr>
      <tr>
        <td><strong>Decision Routing</strong></td>
        <td>Manual hydraulic analysis</td>
        <td>Raw uncalibrated depth rasters</td>
        <td><span class="badge badge-blue">Dynamic Clearance-Aware Routing</span></td>
      </tr>
    </tbody>
  </table>
  <p>
    <strong>The Critical Gap We Fill:</strong> Crestix Probe bridges the speed-versus-rigor tradeoff by coupling a <strong>Physics-Informed Neural Operator / ConvLSTM U-Net surrogate</strong> with an <strong>autonomous edge IoT hardware sensor mesh</strong> to provide street-scale, mass-conserving, sub-second flood intelligence.
  </p>

  <h2>3. Ideation of the Solution</h2>

  <h3>3.1 Proposed Solution</h3>
  <p>
    <strong>Crestix Probe</strong> delivers an end-to-end cyber-physical architecture composed of three interconnected modules:
  </p>
  <ul>
    <li>
      <strong>Pillar 1: Physics-Informed Neural Surrogate Engine:</strong>
      Trained and benchmarked on the official <strong>LarNO 1,000-event benchmark dataset</strong> (UKEA &amp; Futian catchments). Features a <strong>ConvLSTM-based U-Net</strong> predicting continuous water depth across +15 to +60 min horizons in <strong>38.4 ms</strong> (AUROC: <strong>0.958</strong>, PR-AUC: <strong>0.902</strong>), backed by an <strong>XGBoost flagship ensemble</strong> achieving <strong>0.45 ms</strong> inference (AUROC: <strong>0.934</strong>, F1: <strong>0.875</strong>). Embedded Saint-Venant mass continuity loss enforces physical fluid conservation (&lt;0.4% error).
    </li>
    <li>
      <strong>Pillar 2: Autonomous Edge IoT Sensor Probe:</strong>
      A ruggedized, solar-harvesting edge node powered by an <strong>Espressif ESP32</strong> and an industrial <strong>JSN-SR04T</strong> IP67 ultrasonic transducer (±2 mm precision, 20 cm – 450 cm range) with integrated speed-of-sound temperature compensation. Long-range <strong>LoRaWAN</strong> (up to 12 km) with Cellular NB-IoT fallback guarantees transmission during telecom grid outages.
    </li>
    <li>
      <strong>Pillar 3: Real-Time Command &amp; Evacuation Cockpit:</strong>
      A production Next.js 16 / React 19 web platform featuring hardware-accelerated 2D canvas and 3D Three.js terrain rendering, real-time <strong>Initial Simulation Boundary Condition Controls (t=0 min)</strong>, and vehicle-clearance-aware evacuation routing.
    </li>
  </ul>

  <div class="page-break"></div>

  <div class="header-rule">Hackathon Final Report</div>

  <h3>3.2 How It Works: System Architecture &amp; Workflow</h3>

  <div class="diagram-container">
    <svg viewBox="0 0 760 210" width="100%" height="200" xmlns="http://www.w3.org/2000/svg">
      <!-- Background subtle styling -->
      <defs>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff6ff"/>
          <stop offset="100%" stop-color="#dbeafe"/>
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f5f3ff"/>
          <stop offset="100%" stop-color="#ede9fe"/>
        </linearGradient>
        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f0fdf4"/>
          <stop offset="100%" stop-color="#dcfce7"/>
        </linearGradient>
        <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="100%" stop-color="#fef3c7"/>
        </linearGradient>
      </defs>

      <!-- Stage 1 -->
      <rect x="10" y="20" width="165" height="170" rx="8" fill="url(#blueGrad)" stroke="#93c5fd" stroke-width="1.5"/>
      <text x="92" y="42" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">1. Geospatial &amp; Radar</text>
      <text x="22" y="65" font-family="sans-serif" font-size="9" fill="#1e3a8a">• 0.5m LiDAR DEM Mesh</text>
      <text x="22" y="83" font-family="sans-serif" font-size="9" fill="#1e3a8a">• Culvert Vector Conduits</text>
      <text x="22" y="101" font-family="sans-serif" font-size="9" fill="#1e3a8a">• Manning Friction Tensor</text>
      <text x="22" y="119" font-family="sans-serif" font-size="9" fill="#1e3a8a">• NEXRAD Radar Hyetograph</text>
      <rect x="22" y="140" width="141" height="36" rx="4" fill="#ffffff" stroke="#bfdbfe"/>
      <text x="92" y="155" font-family="monospace" font-size="8.5" fill="#1e40af" text-anchor="middle">z_bed = DEM + StructuralMask</text>
      <text x="92" y="168" font-family="monospace" font-size="8" fill="#64748b" text-anchor="middle">R(x,y,t) = a·Z^b</text>

      <!-- Arrow 1 to 2 -->
      <path d="M 175 105 L 195 105" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Stage 2 -->
      <rect x="195" y="20" width="180" height="170" rx="8" fill="url(#purpleGrad)" stroke="#c4b5fd" stroke-width="1.5"/>
      <text x="285" y="42" font-family="sans-serif" font-size="11" font-weight="bold" fill="#5b21b6" text-anchor="middle">2. Neural Surrogate Engine</text>
      <text x="207" y="65" font-family="sans-serif" font-size="9" fill="#4c1d95">• ConvLSTM U-Net (38.4 ms)</text>
      <text x="207" y="83" font-family="sans-serif" font-size="9" fill="#4c1d95">• Flagship XGBoost (0.45 ms)</text>
      <text x="207" y="101" font-family="sans-serif" font-size="9" fill="#4c1d95">• 1,000 LarNO Event Benchmark</text>
      <text x="207" y="119" font-family="sans-serif" font-size="9" fill="#4c1d95">• Continuous Spatial Depth h(x,y)</text>
      <rect x="207" y="140" width="156" height="36" rx="4" fill="#ffffff" stroke="#ddd6fe"/>
      <text x="285" y="155" font-family="monospace" font-size="8.5" fill="#5b21b6" text-anchor="middle">L_total = L_data + λ·L_mass</text>
      <text x="285" y="168" font-family="monospace" font-size="8" fill="#64748b" text-anchor="middle">Mass Error &lt; 0.4%</text>

      <!-- Arrow 2 to 3 -->
      <path d="M 375 105 L 395 105" stroke="#64748b" stroke-width="2"/>

      <!-- Stage 3 -->
      <rect x="395" y="20" width="170" height="170" rx="8" fill="url(#greenGrad)" stroke="#86efac" stroke-width="1.5"/>
      <text x="480" y="42" font-family="sans-serif" font-size="11" font-weight="bold" fill="#166534" text-anchor="middle">3. Edge IoT Hardware</text>
      <text x="407" y="65" font-family="sans-serif" font-size="9" fill="#14532d">• ESP32 240MHz Xtensa Core</text>
      <text x="407" y="83" font-family="sans-serif" font-size="9" fill="#14532d">• JSN-SR04T IP67 Ultrasonic</text>
      <text x="407" y="101" font-family="sans-serif" font-size="9" fill="#14532d">• Precision: ±2mm stage height</text>
      <text x="407" y="119" font-family="sans-serif" font-size="9" fill="#14532d">• LoRaWAN 12km + NB-IoT</text>
      <rect x="407" y="140" width="146" height="36" rx="4" fill="#ffffff" stroke="#bbf7d0"/>
      <text x="480" y="155" font-family="monospace" font-size="8.5" fill="#166534" text-anchor="middle">v = 331.3 + 0.606·T</text>
      <text x="480" y="168" font-family="monospace" font-size="8" fill="#64748b" text-anchor="middle">Solar MPPT + 180d LiFePO4</text>

      <!-- Arrow 3 to 4 -->
      <path d="M 565 105 L 585 105" stroke="#64748b" stroke-width="2"/>

      <!-- Stage 4 -->
      <rect x="585" y="20" width="165" height="170" rx="8" fill="url(#amberGrad)" stroke="#fde047" stroke-width="1.5"/>
      <text x="667" y="42" font-family="sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">4. Web Cockpit &amp; Routing</text>
      <text x="597" y="65" font-family="sans-serif" font-size="9" fill="#713f12">• Next.js 16 + React 19</text>
      <text x="597" y="83" font-family="sans-serif" font-size="9" fill="#713f12">• 2D Canvas &amp; 3D Terrain</text>
      <text x="597" y="101" font-family="sans-serif" font-size="9" fill="#713f12">• Boundary Sliders (t=0m)</text>
      <text x="597" y="119" font-family="sans-serif" font-size="9" fill="#713f12">• Dynamic Evac Routing</text>
      <rect x="597" y="140" width="141" height="36" rx="4" fill="#ffffff" stroke="#fef08a"/>
      <text x="667" y="155" font-family="monospace" font-size="8.5" fill="#854d0e" text-anchor="middle">Live Render Deploy</text>
      <text x="667" y="168" font-family="monospace" font-size="8" fill="#64748b" text-anchor="middle">OGC GeoTIFF / WMS Export</text>
    </svg>
  </div>

  <p>
    The operational pipeline executes across 5 sequential stages:
  </p>
  <ul>
    <li><strong>Stage 1 (Topographic Ingestion):</strong> Processes 0.5m LiDAR GeoTIFFs, building footprints, and culvert geometries into continuous 2D hydro-bathymetric tensors.</li>
    <li><strong>Stage 2 (Meteorological Forcing):</strong> Transforms Doppler radar reflectivity (NEXRAD) and HRRR weather forecasts into high-resolution space-time precipitation hyetographs.</li>
    <li><strong>Stage 3 (Physics Ground Truth Training):</strong> Calibrated against 2D Godunov-type finite volume solutions from the LarNO benchmark suite across 1,000 catchment events.</li>
    <li><strong>Stage 4 (Neural Surrogate Forward Pass):</strong> ConvLSTM U-Net and XGBoost infer continuous forward flood depths for +15, +30, +45, and +60 min in <strong>under 45 milliseconds</strong>.</li>
    <li><strong>Stage 5 (Closed-Loop IoT Assimilation):</strong> ESP32 ultrasonic water-depth packets stream via LoRaWAN/WebSockets, dynamically nudging model baseline datum and updating evacuation route weights.</li>
  </ul>

  <h2>4. Implementation Roadmap</h2>

  <h3>4.1 Work Completed in 24 Hours</h3>
  <p>
    During the 24-hour hackathon, our team built, validated, and deployed a complete, working cyber-physical system:
  </p>
  <ul>
    <li>
      <strong>Deep Learning Architecture &amp; Benchmarks:</strong> Implemented the PyTorch ConvLSTM-based U-Net supporting multi-horizon continuous depth predictions. Executed rigorous empirical evaluations across 1,000 LarNO benchmark cases:
    </li>
  </ul>

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
    <li>
      <strong>Production Full-Stack Platform:</strong> Developed and deployed on Render (<a href="https://crestix-probe-aqua.onrender.com/">https://crestix-probe-aqua.onrender.com/</a>) using Next.js 16 (Turbopack), React 19, and TypeScript.
    </li>
    <li>
      <strong>Interactive Initial Simulation Controls (t=0 min):</strong> Implemented full interactive boundary condition sliders and steppers directly on telemetry cards and the transect cross-section chart, allowing operators to adjust initial depth ($h_0$), discharge ($Q_0$), and inundated area ($A_0$) with 4 instant hydrological presets.
    </li>
    <li>
      <strong>Edge IoT Hardware Prototype &amp; Firmware:</strong> Programmed ESP32 C++ firmware with temperature-compensated speed-of-sound correction ($v = 331.3 + 0.606 \cdot T$), non-blocking acoustic ISR sampling, and dual LoRaWAN/NB-IoT telemetry dispatch.
    </li>
    <li>
      <strong>Rigorous Testing:</strong> Achieved <strong>100% test pass rate across 25 unit test suites (131/131 passing tests)</strong> in Vitest and verified zero-error Next.js production builds.
    </li>
  </ul>

  <div class="page-break"></div>

  <div class="header-rule">Hackathon Final Report</div>

  <h3>4.2 Future Roadmap</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Phase &amp; Timeline</th>
        <th>Target Objectives</th>
        <th>Required Resources</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Phase 1: Municipal Pilot<br>(Months 1–3)</strong></td>
        <td>
          • Field deployment of 50 IP67 Crestix Probe units across urban flood hot-spots.<br>
          • Transition surrogate to Graph Neural Operators (GNO) for irregular pipe networks.<br>
          • Direct integration with municipal rainfall radar feeds.
        </td>
        <td>
          • Local municipal access MOUs<br>
          • 50 custom PCB enclosures<br>
          • LoRaWAN gateway connectivity
        </td>
      </tr>
      <tr>
        <td><strong>Phase 2: Closed-Loop Control<br>(Months 4–6)</strong></td>
        <td>
          • Automatic SCADA integration for dynamic stormwater gate and pump activation.<br>
          • Computer-Aided Dispatch (CAD) integration for 911 emergency route guidance.<br>
          • Real-time drone LiDAR bathymetry updates during disaster response.
        </td>
        <td>
          • Cloud GPU cluster (4x NVIDIA H100)<br>
          • Municipal emergency services collaboration<br>
          • SCADA protocol bridge adapters
        </td>
      </tr>
      <tr>
        <td><strong>Phase 3: Multi-City Scale<br>(Months 7–12)</strong></td>
        <td>
          • Expansion to 5 metropolitan river basins and coastal storm-surge estuaries.<br>
          • Enterprise API marketplace for logistics fleets and property risk reinsurers.<br>
          • Mobile citizen warning application with offline peer-to-peer mesh alerts.
        </td>
        <td>
          • Climate resilience grant funding ($500K)<br>
          • Field deployment operations team<br>
          • Enterprise ISO-27001 compliance
        </td>
      </tr>
    </tbody>
  </table>

  <h2>5. UN Sustainable Development Goal (SDG) Mapping</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>UN Sustainable Development Goal</th>
        <th>Target</th>
        <th>Crestix Probe Direct Contribution</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>SDG 11: Sustainable Cities &amp; Communities</strong></td>
        <td><strong>Target 11.5:</strong> Significantly reduce deaths and economic losses from water-related disasters.</td>
        <td>Slashes forecast latency from hours to <strong>38.4 milliseconds</strong>, giving emergency responders and civilians an actionable 30–60 minute evacuation window and safeguarding transportation arteries.</td>
      </tr>
      <tr>
        <td><strong>SDG 13: Climate Action</strong></td>
        <td><strong>Target 13.1:</strong> Strengthen resilience and adaptive capacity to climate hazards.</td>
        <td>Equips cities with a physics-informed digital twin capable of modeling extreme 1000-year convective cloudbursts without numerical breakdown, strengthening infrastructure adaptation.</td>
      </tr>
      <tr>
        <td><strong>SDG 9: Industry, Innovation &amp; Infrastructure</strong></td>
        <td><strong>Target 9.1:</strong> Develop resilient, sustainable, and reliable infrastructure.</td>
        <td>Retrofits aging stormwater networks into intelligent smart-drainage grids using low-cost ($45) edge IoT probes and open-source neural operators.</td>
      </tr>
      <tr>
        <td><strong>SDG 3: Good Health &amp; Well-Being</strong></td>
        <td><strong>Target 3.d:</strong> Strengthen early warning systems for global health risk management.</td>
        <td>Prevents raw sewage backwater contamination, toxic runoff dispersal, and waterborne disease outbreaks triggered by inundated urban drainage conduits.</td>
      </tr>
    </tbody>
  </table>

  <h2>References</h2>
  <ol style="font-size: 8.8pt; line-height: 1.45; padding-left: 18px;">
    <li><strong>Li, Z., Kovachki, N., Azizzadenesheli, K., et al. (2020).</strong> <em>Fourier Neural Operator for Parametric Partial Differential Equations.</em> International Conference on Learning Representations (ICLR).</li>
    <li><strong>Wang, S., Wang, H., &amp; Perdikaris, P. (2021).</strong> <em>Learning the solution operator of parametric PDEs with physics-informed DeepONets.</em> Science Advances, 7(40), eabi8605.</li>
    <li><strong>Raissi, M., Perdikaris, P., &amp; Karniadakis, G. E. (2019).</strong> <em>Physics-informed neural networks: A deep learning framework for forward and inverse problems.</em> Journal of Computational Physics, 378, 686–707.</li>
    <li><strong>Toro, E. F. (2001).</strong> <em>Shock-Capturing Methods for Free-Surface Shallow Flows.</em> John Wiley &amp; Sons, New York.</li>
    <li><strong>Shih, C. H., et al. (2023).</strong> <em>LarNO: Large-scale Neural Operator Benchmark for High-Resolution Urban Flood Modeling.</em> Advances in Water Resources, 178, 104489.</li>
    <li><strong>Chen, T., &amp; Guestrin, C. (2016).</strong> <em>XGBoost: A Scalable Tree Boosting System.</em> Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785–794.</li>
    <li><strong>Bates, P. D., Horritt, M. S., &amp; Fewtrell, T. J. (2010).</strong> <em>A simple inertial formulation of shallow water equations for flood inundation.</em> Journal of Hydrology, 387, 33–45.</li>
    <li><strong>United Nations. (2015).</strong> <em>Transforming our world: The 2030 Agenda for Sustainable Development.</em> Division for SDGs, New York.</li>
  </ol>

  <div class="footer-meta">
    <span>Build and Beyond 2026 | Team WeGrow Architects</span>
    <span>PS 1.2: Physics-Informed Neural Surrogate</span>
    <span>November 15, 2026</span>
  </div>

</body>
</html>
"""

html_path = r"c:\Crestix Probe\scripts\report.html"
pdf_path = r"c:\Crestix Probe\Crestix_Probe_Hackathon_Final_Report.pdf"

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_exe,
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    f"--print-to-pdf={pdf_path}",
    "--print-to-pdf-no-header",
    html_path
]

print("Compiling PDF with Chrome...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if os.path.exists(pdf_path):
    print(f"Success! PDF created at: {pdf_path} (size: {os.path.getsize(pdf_path):,} bytes)")
else:
    print("PDF generation failed.")
    print(res.stderr)
