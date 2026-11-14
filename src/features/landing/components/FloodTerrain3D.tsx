"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CITY_BUILDINGS,
  GRID_SIZE,
  SENSOR_VIEWBOX_COORDS,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  computeDepthGrid,
  depthToRGBA,
} from "../utils/floodHeatmap";

export interface SensorOverlayItem {
  nodeId: string;
  waterDepthM: number;
  status: string;
}

interface FloodTerrain3DProps {
  dem: Float32Array;
  waterSurfaceElevationM: number;
  showDepthLayer: boolean;
  showContoursLayer: boolean;
  showSensorsLayer: boolean;
  sensors: SensorOverlayItem[];
  selectedSensorNode: string | null;
  onSelectSensorNode: (nodeId: string | null) => void;
}

const WORLD_WIDTH = 20;
const WORLD_DEPTH = 12;
const ELEV_SCALE = 0.85;

function viewboxToWorld(sx: number, sy: number): [number, number] {
  const wx = (sx / VIEWBOX_WIDTH - 0.5) * WORLD_WIDTH;
  const wz = (sy / VIEWBOX_HEIGHT - 0.5) * WORLD_DEPTH;
  return [wx, wz];
}

function sampleDemAtViewbox(dem: Float32Array, sx: number, sy: number): number {
  const gx = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((sx / VIEWBOX_WIDTH) * GRID_SIZE)));
  const gy = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor((sy / VIEWBOX_HEIGHT) * GRID_SIZE)));
  const val = dem[gy * GRID_SIZE + gx];
  return val > 5.0 ? 1.0 : val;
}

export function FloodTerrain3D({
  dem,
  waterSurfaceElevationM,
  showDepthLayer,
  showContoursLayer,
  showSensorsLayer,
  sensors,
  selectedSensorNode,
  onSelectSensorNode,
}: FloodTerrain3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const badgeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sensorWorldPositionsRef = useRef<THREE.Vector3[]>([]);

  // Initialize Three.js Scene, Terrain, Buildings, Water Mesh, Lighting & OrbitControls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = Math.max(300, container.clientWidth);
    const height = Math.max(220, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);
    // ~35 degree isometric viewing angle
    camera.position.set(0, 11.5, 16.5);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 0.8, 0);
    controls.minDistance = 8;
    controls.maxDistance = 36;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;

    // Ambient + directional lighting for crisp 3D depth perception
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, 1.45);
    keyLight.position.set(12, 20, 14);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
    rimLight.position.set(-14, 10, -10);
    scene.add(rimLight);

    // 1. 3D Ground Terrain (64x64 PlaneGeometry displaced by DEM)
    const terrainGeo = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_DEPTH, GRID_SIZE - 1, GRID_SIZE - 1);
    terrainGeo.rotateX(-Math.PI / 2);
    const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const idx = gy * GRID_SIZE + gx;
        const rawDem = dem[idx];
        // Keep ground beneath extruded buildings at street level so buildings rise cleanly
        const groundElev = rawDem > 5.0 ? 1.15 : rawDem;
        tPos.setY(idx, groundElev * ELEV_SCALE);
      }
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0b1120,
      roughness: 0.9,
      metalness: 0.08,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    const wireframeGeo = new THREE.WireframeGeometry(terrainGeo);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.55,
    });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    wireframe.position.y = 0.015;
    wireframe.visible = showContoursLayer;
    scene.add(wireframe);
    wireframeRef.current = wireframe;

    // 2. High-Detail Procedural Architectural Facade Textures (Open-Source GIS Style)
    const facadeCanvas = document.createElement("canvas");
    facadeCanvas.width = 512;
    facadeCanvas.height = 1024;
    const fCtx = facadeCanvas.getContext("2d");

    const emissiveCanvas = document.createElement("canvas");
    emissiveCanvas.width = 512;
    emissiveCanvas.height = 1024;
    const eCtx = emissiveCanvas.getContext("2d");

    if (fCtx && eCtx) {
      // Dark slate architectural composite cladding
      fCtx.fillStyle = "#1e293b";
      fCtx.fillRect(0, 0, 512, 1024);

      eCtx.fillStyle = "#000000";
      eCtx.fillRect(0, 0, 512, 1024);

      const cols = 8;
      const colWidth = 512 / cols;
      const rows = 24;
      const rowHeight = 1024 / rows;

      // Vertical structural mullion lines
      for (let c = 0; c <= cols; c++) {
        fCtx.fillStyle = "#0f172a";
        fCtx.fillRect(c * colWidth - 2, 0, 4, 1024);
      }

      // Windows and floor spandrels
      for (let r = 0; r < rows; r++) {
        const y = r * rowHeight;
        // Floor slab divider
        fCtx.fillStyle = "#090d16";
        fCtx.fillRect(0, y, 512, 6);

        for (let c = 0; c < cols; c++) {
          const x = c * colWidth + 5;
          const w = colWidth - 10;
          const h = rowHeight - 9;
          const hash = Math.sin(r * 127.1 + c * 311.7) * 0.5 + 0.5;

          if (r === rows - 1) {
            // Ground floor lobby: brightly illuminated entrance glass
            fCtx.fillStyle = "#38bdf8";
            fCtx.fillRect(x, y + 6, w, h);
            eCtx.fillStyle = "#0284c7";
            eCtx.fillRect(x, y + 6, w, h);
          } else if (hash > 0.62) {
            // Cool cyan smart city interior glow
            fCtx.fillStyle = "#7dd3fc";
            fCtx.fillRect(x, y + 6, w, h);
            eCtx.fillStyle = "#0369a1";
            eCtx.fillRect(x, y + 6, w, h);
          } else if (hash > 0.42) {
            // Warm incandescent office lighting
            fCtx.fillStyle = "#fef08a";
            fCtx.fillRect(x, y + 6, w, h);
            eCtx.fillStyle = "#a16207";
            eCtx.fillRect(x, y + 6, w, h);
          } else {
            // Dark tinted architectural reflective glass
            fCtx.fillStyle = "#0b1220";
            fCtx.fillRect(x, y + 6, w, h);
            fCtx.fillStyle = "#1e293b";
            fCtx.fillRect(x + 2, y + 8, w - 4, 2);
          }
        }
      }
    }

    const facadeTexture = new THREE.CanvasTexture(facadeCanvas);
    facadeTexture.wrapS = THREE.RepeatWrapping;
    facadeTexture.wrapT = THREE.RepeatWrapping;

    const facadeEmissive = new THREE.CanvasTexture(emissiveCanvas);
    facadeEmissive.wrapS = THREE.RepeatWrapping;
    facadeEmissive.wrapT = THREE.RepeatWrapping;

    // Materials
    const buildingMat = new THREE.MeshStandardMaterial({
      map: facadeTexture,
      emissiveMap: facadeEmissive,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.35,
    });

    const concretePodiumMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.15,
    });

    const roofMachineryMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.5,
    });

    const culvertMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.1,
    });

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
    });

    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const helipadMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });

    const buildingGroup = new THREE.Group();
    const buildingGeos: THREE.BufferGeometry[] = [];
    const beaconMeshes: THREE.Mesh[] = [];

    CITY_BUILDINGS.forEach((b, idx) => {
      const bw = (b.width / VIEWBOX_WIDTH) * WORLD_WIDTH;
      const bd = (b.height / VIEWBOX_HEIGHT) * WORLD_DEPTH;
      // Building height variation: index 2 and 5 are skyscrapers, others are commercial blocks
      const bh = idx === 2 || idx === 5 ? 3.4 : 1.9 + (idx % 3) * 0.45;
      const [wx, wz] = viewboxToWorld(b.x + b.width / 2, b.y + b.height / 2);
      const baseElev = sampleDemAtViewbox(dem, b.x + b.width / 2, b.y + b.height / 2) * ELEV_SCALE;

      // A. Ground Sidewalk / Curb Plinth Foundation (stabilizes structure against terrain)
      const plinthGeo = new THREE.BoxGeometry(bw * 1.08, 0.22, bd * 1.08);
      buildingGeos.push(plinthGeo);
      const plinthMesh = new THREE.Mesh(plinthGeo, concretePodiumMat);
      plinthMesh.position.set(wx, baseElev + 0.11 - 0.15, wz);
      buildingGroup.add(plinthMesh);

      // B. Main Architectural Tower Body
      const boxGeo = new THREE.BoxGeometry(bw, bh, bd);
      buildingGeos.push(boxGeo);
      const mesh = new THREE.Mesh(boxGeo, buildingMat);
      mesh.position.set(wx, baseElev + bh / 2 - 0.05, wz);
      buildingGroup.add(mesh);

      // Building Wireframe Edges (Cyan Architectural Linework)
      const edges = new THREE.EdgesGeometry(boxGeo);
      buildingGeos.push(edges);
      const line = new THREE.LineSegments(edges, edgeMat);
      line.position.copy(mesh.position);
      buildingGroup.add(line);

      // C. Rooftop Mechanical Penthouse / Elevator Core (HVAC)
      const roofY = baseElev + bh - 0.05;
      const hvacGeo = new THREE.BoxGeometry(bw * 0.38, 0.38, bd * 0.38);
      buildingGeos.push(hvacGeo);
      const hvacMesh = new THREE.Mesh(hvacGeo, roofMachineryMat);
      hvacMesh.position.set(wx, roofY + 0.19, wz);
      buildingGroup.add(hvacMesh);

      // D. Architectural Signature Elements by Building Type
      if (idx === 2 || idx === 5) {
        // Skyscraper Communication Spire & Aviation Beacon
        const spireGeo = new THREE.CylinderGeometry(0.03, 0.08, 1.4, 8);
        buildingGeos.push(spireGeo);
        const spireMesh = new THREE.Mesh(spireGeo, roofMachineryMat);
        spireMesh.position.set(wx, roofY + 0.38 + 0.7, wz);
        buildingGroup.add(spireMesh);

        const beaconGeo = new THREE.SphereGeometry(0.08, 12, 12);
        buildingGeos.push(beaconGeo);
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(wx, roofY + 0.38 + 1.4, wz);
        buildingGroup.add(beaconMesh);
        beaconMeshes.push(beaconMesh);
      } else if (idx === 4) {
        // Emergency Response Center: Rooftop Helipad
        const heliGeo = new THREE.CylinderGeometry(Math.min(bw, bd) * 0.32, Math.min(bw, bd) * 0.32, 0.05, 24);
        buildingGeos.push(heliGeo);
        const heliMesh = new THREE.Mesh(heliGeo, helipadMat);
        heliMesh.position.set(wx, roofY + 0.03, wz);
        buildingGroup.add(heliMesh);
      } else if (idx % 2 === 0) {
        // Rooftop Twin Chiller Fans
        const fan1Geo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 12);
        buildingGeos.push(fan1Geo);
        const fan1 = new THREE.Mesh(fan1Geo, roofMachineryMat);
        fan1.position.set(wx - bw * 0.25, roofY + 0.08, wz - bd * 0.2);
        buildingGroup.add(fan1);

        const fan2Geo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 12);
        buildingGeos.push(fan2Geo);
        const fan2 = new THREE.Mesh(fan2Geo, roofMachineryMat);
        fan2.position.set(wx + bw * 0.25, roofY + 0.08, wz - bd * 0.2);
        buildingGroup.add(fan2);
      }

      // E. Ground-Floor Glazed Entrance Canopy Overhang
      const canopyGeo = new THREE.BoxGeometry(bw * 0.45, 0.05, bd * 0.3);
      buildingGeos.push(canopyGeo);
      const canopyMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
      canopyMesh.position.set(wx, baseElev + 0.45, wz + bd / 2 + 0.12);
      buildingGroup.add(canopyMesh);
    });

    // 3. In-Situ Stormwater Culvert Portal Structure (Deployed at Node CX-N01)
    const [culvertWx, culvertWz] = viewboxToWorld(220, 240);
    const culvertElev = sampleDemAtViewbox(dem, 220, 240) * ELEV_SCALE;

    // Headwall structure
    const headwallGeo = new THREE.BoxGeometry(1.6, 0.85, 0.45);
    buildingGeos.push(headwallGeo);
    const headwallMesh = new THREE.Mesh(headwallGeo, culvertMat);
    headwallMesh.position.set(culvertWx, culvertElev + 0.42, culvertWz);
    buildingGroup.add(headwallMesh);

    // Twin Culvert Barrel Openings (Dark drainage intakes)
    const intakeMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const intake1Geo = new THREE.CylinderGeometry(0.24, 0.24, 0.5, 16);
    intake1Geo.rotateX(Math.PI / 2);
    buildingGeos.push(intake1Geo);
    const intake1 = new THREE.Mesh(intake1Geo, intakeMat);
    intake1.position.set(culvertWx - 0.42, culvertElev + 0.32, culvertWz + 0.02);
    buildingGroup.add(intake1);

    const intake2Geo = new THREE.CylinderGeometry(0.24, 0.24, 0.5, 16);
    intake2Geo.rotateX(Math.PI / 2);
    buildingGeos.push(intake2Geo);
    const intake2 = new THREE.Mesh(intake2Geo, intakeMat);
    intake2.position.set(culvertWx + 0.42, culvertElev + 0.32, culvertWz + 0.02);
    buildingGroup.add(intake2);

    // Culvert Wingwalls (Angled concrete retaining barriers)
    const wingwallGeo = new THREE.BoxGeometry(0.18, 0.75, 0.8);
    buildingGeos.push(wingwallGeo);
    const leftWing = new THREE.Mesh(wingwallGeo, culvertMat);
    leftWing.position.set(culvertWx - 0.95, culvertElev + 0.37, culvertWz + 0.35);
    leftWing.rotation.y = -0.45;
    buildingGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingwallGeo, culvertMat);
    rightWing.position.set(culvertWx + 0.95, culvertElev + 0.37, culvertWz + 0.35);
    rightWing.rotation.y = 0.45;
    buildingGroup.add(rightWing);

    scene.add(buildingGroup);

    // 3. Dynamic Translucent Floodwater Mesh (64x64)
    const waterGeo = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_DEPTH, GRID_SIZE - 1, GRID_SIZE - 1);
    waterGeo.rotateX(-Math.PI / 2);
    const colors = new Float32Array(GRID_SIZE * GRID_SIZE * 3);
    waterGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const waterMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 4. Sensor 3D Anchor Positions
    sensorWorldPositionsRef.current = SENSOR_VIEWBOX_COORDS.map((s) => {
      const [wx, wz] = viewboxToWorld(s.x, s.y);
      const baseElev = sampleDemAtViewbox(dem, s.x, s.y) * ELEV_SCALE;
      return new THREE.Vector3(wx, baseElev + 1.1, wz);
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(300, entry.contentRect.width);
        const h = Math.max(220, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    let rafId = 0;
    const projected = new THREE.Vector3();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();

      // Subtle pulse for rooftop aviation warning beacons
      const beaconIntensity = Math.sin(Date.now() * 0.006) * 0.5 + 0.5;
      beaconMat.color.setRGB(1.0, 0.2 * beaconIntensity, 0.2 * beaconIntensity);

      renderer.render(scene, camera);

      const cw = container.clientWidth;
      const ch = container.clientHeight;
      sensorWorldPositionsRef.current.forEach((worldPos, idx) => {
        const el = badgeRefs.current[idx];
        if (!el) return;
        projected.copy(worldPos).project(camera);
        if (projected.z > 1) {
          el.style.opacity = "0";
          return;
        }
        const px = (projected.x * 0.5 + 0.5) * cw;
        const py = (-projected.y * 0.5 + 0.5) * ch;
        el.style.opacity = "1";
        el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -100%)`;
      });
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      buildingMat.dispose();
      concretePodiumMat.dispose();
      roofMachineryMat.dispose();
      culvertMat.dispose();
      intakeMat.dispose();
      beaconMat.dispose();
      helipadMat.dispose();
      edgeMat.dispose();
      facadeTexture.dispose();
      facadeEmissive.dispose();
      buildingGeos.forEach((g) => g.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dem]);

  // Real-time update of 3D water mesh vertices & vertex colors at 60 FPS
  useEffect(() => {
    const waterMesh = waterMeshRef.current;
    if (!waterMesh) return;

    waterMesh.visible = showDepthLayer;
    if (!showDepthLayer) return;

    const geo = waterMesh.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const colorAttr = geo.attributes.color as THREE.BufferAttribute;
    const depthGrid = computeDepthGrid(dem, waterSurfaceElevationM);

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const d = depthGrid[i];
      const groundElev = dem[i] > 5.0 ? 1.15 : dem[i];
      if (d <= 0.005) {
        // Slightly recessed below ground where dry so dry streets show clean terrain
        posAttr.setY(i, (groundElev - 0.12) * ELEV_SCALE);
        colorAttr.setXYZ(i, 0.04, 0.07, 0.13);
      } else {
        posAttr.setY(i, (groundElev + d) * ELEV_SCALE);
        const [r, g, b] = depthToRGBA(d);
        colorAttr.setXYZ(i, r / 255, g / 255, b / 255);
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geo.computeVertexNormals();
  }, [dem, waterSurfaceElevationM, showDepthLayer]);

  useEffect(() => {
    if (wireframeRef.current) {
      wireframeRef.current.visible = showContoursLayer;
    }
  }, [showContoursLayer]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#060913] select-none overflow-hidden"
      aria-label="3D Urban Flood Terrain View"
    >
      {/* Floating 3D HTML Sensor Overlay Badges (CX-N01 to CX-N04) */}
      {showSensorsLayer &&
        sensors.map((node, idx) => {
          const isSelected = selectedSensorNode === node.nodeId;
          const isCritical = node.status === "critical";
          return (
            <button
              key={node.nodeId}
              type="button"
              ref={(el) => {
                badgeRefs.current[idx] = el;
              }}
              onClick={() => onSelectSensorNode(isSelected ? null : node.nodeId)}
              className={`absolute top-0 left-0 z-20 px-2 py-1 rounded-md text-[10px] font-mono font-bold border shadow-md backdrop-blur-sm transition-colors cursor-pointer ${
                isSelected
                  ? "bg-cyan-950/95 border-cyan-400 text-cyan-200"
                  : isCritical
                    ? "bg-slate-950/90 border-red-500/70 text-red-300"
                    : "bg-slate-950/90 border-sky-500/60 text-sky-200"
              }`}
              style={{ opacity: 0 }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle bg-current" />
              {node.nodeId}: {node.waterDepthM.toFixed(2)}m
            </button>
          );
        })}

      <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 pointer-events-none">
        Drag: Orbit • Right-Drag: Pan • Scroll: Zoom
      </div>
    </div>
  );
}

