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

    // 2. 3D Extruded Building Blocks
    const buildingGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.15,
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x334155 });

    const buildingGeos: THREE.BufferGeometry[] = [];
    CITY_BUILDINGS.forEach((b, idx) => {
      const bw = (b.width / VIEWBOX_WIDTH) * WORLD_WIDTH;
      const bd = (b.height / VIEWBOX_HEIGHT) * WORLD_DEPTH;
      const bh = 2.0 + (idx % 3) * 0.45;
      const [wx, wz] = viewboxToWorld(b.x + b.width / 2, b.y + b.height / 2);
      const baseElev = sampleDemAtViewbox(dem, b.x + b.width / 2, b.y + b.height / 2) * ELEV_SCALE;

      const boxGeo = new THREE.BoxGeometry(bw, bh, bd);
      buildingGeos.push(boxGeo);
      const mesh = new THREE.Mesh(boxGeo, buildingMat);
      mesh.position.set(wx, baseElev + bh / 2 - 0.15, wz);
      buildingGroup.add(mesh);

      const edges = new THREE.EdgesGeometry(boxGeo);
      buildingGeos.push(edges);
      const line = new THREE.LineSegments(edges, edgeMat);
      line.position.copy(mesh.position);
      buildingGroup.add(line);
    });
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
      edgeMat.dispose();
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

