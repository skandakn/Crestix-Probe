'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ProcessedDEMData,
  LayerSettings,
  TerrainInspectionPoint,
  CrossSectionPoint
} from '../types/terrain';
import { generateTerrainTextureBuffer } from '../processing/colormap-generator';
import { getAspectDirectionName } from '../processing/slope-calculator';
import {
  RotateCcw,
  Compass,
  Maximize2,
  Minimize2,
  Eye,
  Crosshair,
  Waves
} from 'lucide-react';

interface TerrainViewer3DProps {
  dem: ProcessedDEMData;
  settings: LayerSettings;
  onInspect: (point: TerrainInspectionPoint | null) => void;
  onCrossSectionMeasured?: (points: CrossSectionPoint[]) => void;
}

export const TerrainViewer3D: React.FC<TerrainViewer3DProps> = ({
  dem,
  settings,
  onInspect,
  onCrossSectionMeasured
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances stored in refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const markerMeshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Cross section measurement state
  const [crossSectionMode, setCrossSectionMode] = useState<boolean>(false);
  const [crossSectionPoints, setCrossSectionPoints] = useState<Array<{ x: number; y: number }>>([]);
  const crossSectionLineRef = useRef<THREE.Line | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTopDown, setIsTopDown] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 560;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0018);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 4000);
    camera.position.set(0, 140, 220);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going below horizon
    controls.minDistance = 20;
    controls.maxDistance = 800;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(120, 250, 150);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x7090b0, 0x182030, 0.4);
    scene.add(hemiLight);

    // 6. Inspection target ring marker
    const markerGeo = new THREE.RingGeometry(1.2, 2.0, 32);
    markerGeo.rotateX(-Math.PI / 2);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 0.9
    });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.visible = false;
    scene.add(marker);
    markerMeshRef.current = marker;

    // 7. Grid helper
    const grid = new THREE.GridHelper(300, 30, 0x223555, 0x142036);
    grid.position.y = -1;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Render loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window resize observer
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Build / update terrain geometry when DEM changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !dem) return;

    // Remove old terrain mesh
    if (terrainMeshRef.current) {
      scene.remove(terrainMeshRef.current);
      terrainMeshRef.current.geometry.dispose();
      terrainMeshRef.current = null;
    }
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      wireframeMeshRef.current.geometry.dispose();
      wireframeMeshRef.current = null;
    }
    if (waterMeshRef.current) {
      scene.remove(waterMeshRef.current);
      waterMeshRef.current.geometry.dispose();
      waterMeshRef.current = null;
    }

    const { width, height } = dem.metadata;
    const { min: minElev, max: maxElev } = dem.stats.elevation;
    const relief = Math.max(1, maxElev - minElev);

    // Physical 3D dimensions
    const terrainScaleX = 180;
    const terrainScaleZ = 180 * (height / width);
    const heightScale = 45; // baseline vertical amplitude

    const geometry = new THREE.PlaneGeometry(
      terrainScaleX,
      terrainScaleZ,
      width - 1,
      height - 1
    );
    geometry.rotateX(-Math.PI / 2); // Lay horizontal on XZ plane

    const posAttr = geometry.attributes.position;
    const vertexCount = posAttr.count;

    // Displace vertices with elevation data
    // PlaneGeometry vertices are generated row by row
    for (let i = 0; i < vertexCount; i++) {
      const elev = dem.elevations[i];
      const normalizedHeight = (elev - minElev) / relief;
      const y = normalizedHeight * heightScale * settings.verticalExaggeration;
      posAttr.setY(i, y);
    }

    geometry.computeVertexNormals();

    // Create dynamic colormap texture
    const textureBuffer = generateTerrainTextureBuffer(
      dem.elevations,
      dem.slopes,
      dem.flowAccumulations,
      dem.hillshade,
      dem.floodHazard,
      minElev,
      maxElev,
      width,
      height,
      settings
    );

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d');
    if (ctx) {
      const imgData = ctx.createImageData(width, height);
      imgData.data.set(textureBuffer);
      ctx.putImageData(imgData, 0, 0);
    }

    const texture = new THREE.CanvasTexture(offscreenCanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textureRef.current = texture;

    // Material with lighting response
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: false,
      wireframe: settings.wireframe
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Separate Wireframe overlay if enabled with solid surface
    if (settings.showGrid && !settings.wireframe) {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x4f88c6,
        wireframe: true,
        transparent: true,
        opacity: 0.25
      });
      const wireMesh = new THREE.Mesh(geometry.clone(), wireMat);
      wireMesh.position.y += 0.15; // slightly above terrain to prevent z-fighting
      scene.add(wireMesh);
      wireframeMeshRef.current = wireMesh;
    }

    // Water level simulation plane
    if (settings.showWaterPlane) {
      const waterNorm = Math.max(0, Math.min(1, (settings.waterLevel - minElev) / relief));
      const waterY = waterNorm * heightScale * settings.verticalExaggeration;

      const waterGeo = new THREE.PlaneGeometry(terrainScaleX * 1.05, terrainScaleZ * 1.05);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.72,
        roughness: 0.15,
        metalness: 0.3
      });

      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.y = waterY;
      scene.add(waterMesh);
      waterMeshRef.current = waterMesh;
    }

    // Update Grid helper position
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = settings.showGrid;
    }
  }, [
    dem,
    settings.viewMode,
    settings.colormap,
    settings.verticalExaggeration,
    settings.wireframe,
    settings.showGrid,
    settings.showContours,
    settings.contourInterval,
    settings.showStreams,
    settings.streamThreshold,
    settings.showWaterPlane,
    settings.waterLevel,
    settings.opacity
  ]);

  // Update water plane position dynamically on slider movement without rebuilding terrain
  useEffect(() => {
    if (waterMeshRef.current && dem) {
      const { min: minElev, max: maxElev } = dem.stats.elevation;
      const relief = Math.max(1, maxElev - minElev);
      const heightScale = 45;
      const waterNorm = Math.max(0, Math.min(1, (settings.waterLevel - minElev) / relief));
      waterMeshRef.current.position.y = waterNorm * heightScale * settings.verticalExaggeration;
      waterMeshRef.current.visible = settings.showWaterPlane;
    }
  }, [settings.waterLevel, settings.showWaterPlane, settings.verticalExaggeration, dem]);

  // Raycasting for terrain inspection
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      const terrainMesh = terrainMeshRef.current;
      if (!canvas || !camera || !terrainMesh || !dem) return;

      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(terrainMesh);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const point = hit.point;

        // Position 3D target ring marker at hit point
        if (markerMeshRef.current) {
          markerMeshRef.current.position.set(point.x, point.y + 0.3, point.z);
          markerMeshRef.current.visible = true;
        }

        // Map world coordinates back to grid coordinates
        const { width, height, cellSize, bounds } = dem.metadata;
        const terrainScaleX = 180;
        const terrainScaleZ = 180 * (height / width);

        // Normalized u, v in [0, 1]
        const u = Math.max(0, Math.min(1, (point.x + terrainScaleX / 2) / terrainScaleX));
        const v = Math.max(0, Math.min(1, (point.z + terrainScaleZ / 2) / terrainScaleZ));

        const gridX = Math.min(width - 1, Math.max(0, Math.round(u * (width - 1))));
        const gridY = Math.min(height - 1, Math.max(0, Math.round(v * (height - 1))));
        const idx = gridY * width + gridX;

        // Georeferenced lon, lat
        const longitude = bounds.west + u * (bounds.east - bounds.west);
        const latitude = bounds.north - v * (bounds.north - bounds.south);

        const elevation = dem.elevations[idx];
        const slope = dem.slopes[idx];
        const aspect = dem.aspects[idx];
        const flowDirection = dem.flowDirections[idx];
        const flowAccumulation = dem.flowAccumulations[idx];
        const floodHazardScore = dem.floodHazard[idx];

        let floodRiskCategory: 'Low' | 'Moderate' | 'High' | 'Critical Depression' = 'Low';
        if (floodHazardScore > 75) floodRiskCategory = 'Critical Depression';
        else if (floodHazardScore > 50) floodRiskCategory = 'High';
        else if (floodHazardScore > 25) floodRiskCategory = 'Moderate';

        const isSubmerged = settings.showWaterPlane && elevation <= settings.waterLevel;

        onInspect({
          worldX: Math.round(point.x * 10) / 10,
          worldY: Math.round(point.y * 10) / 10,
          worldZ: Math.round(point.z * 10) / 10,
          gridX,
          gridY,
          longitude: Math.round(longitude * 10000) / 10000,
          latitude: Math.round(latitude * 10000) / 10000,
          elevation: Math.round(elevation * 10) / 10,
          slope: Math.round(slope * 10) / 10,
          aspect: Math.round(aspect * 10) / 10,
          aspectDirection: getAspectDirectionName(aspect),
          flowDirection,
          flowAccumulation: Math.round(flowAccumulation),
          floodHazardScore,
          floodRiskCategory,
          isSubmerged
        });
      } else {
        if (markerMeshRef.current) markerMeshRef.current.visible = false;
        onInspect(null);
      }
    },
    [dem, settings.showWaterPlane, settings.waterLevel, onInspect]
  );

  const handlePointerLeave = useCallback(() => {
    if (markerMeshRef.current) markerMeshRef.current.visible = false;
    onInspect(null);
  }, [onInspect]);

  // Handle clicking for cross-section slice tool
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!crossSectionMode || !canvasRef.current || !cameraRef.current || !terrainMeshRef.current) return;
    if (e.button !== 0) return; // Only primary left click

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(terrainMeshRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0].point;
      const newPoints = [...crossSectionPoints, { x: hit.x, y: hit.z }];

      if (newPoints.length >= 2) {
        setCrossSectionPoints(newPoints.slice(0, 2));
        computeCrossSection(newPoints[0], newPoints[1]);
      } else {
        setCrossSectionPoints(newPoints);
      }
    }
  };

  const computeCrossSection = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    if (!dem) return;
    const { width, height, cellSize } = dem.metadata;
    const terrainScaleX = 180;
    const terrainScaleZ = 180 * (height / width);

    const samples = 60;
    const points: CrossSectionPoint[] = [];

    const totalDistanceMeters = 
      Math.hypot(p2.x - p1.x, p2.y - p1.y) * (cellSize / (terrainScaleX / width));

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const wx = p1.x + (p2.x - p1.x) * t;
      const wz = p1.y + (p2.y - p1.y) * t;

      const u = Math.max(0, Math.min(1, (wx + terrainScaleX / 2) / terrainScaleX));
      const v = Math.max(0, Math.min(1, (wz + terrainScaleZ / 2) / terrainScaleZ));

      const gx = Math.min(width - 1, Math.max(0, Math.round(u * (width - 1))));
      const gy = Math.min(height - 1, Math.max(0, Math.round(v * (height - 1))));
      const idx = gy * width + gx;

      const elevation = dem.elevations[idx];
      const slope = dem.slopes[idx];
      const dist = (i / samples) * totalDistanceMeters;

      points.push({
        distance: Math.round(dist),
        elevation: Math.round(elevation * 10) / 10,
        waterLevel: settings.waterLevel,
        slope: Math.round(slope * 10) / 10,
        isSubmerged: settings.showWaterPlane && elevation <= settings.waterLevel
      });
    }

    if (onCrossSectionMeasured) {
      onCrossSectionMeasured(points);
    }
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 140, 220);
    controlsRef.current.target.set(0, 10, 0);
    controlsRef.current.update();
    setIsTopDown(false);
  };

  // Toggle Top-Down View
  const handleToggleTopDown = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (!isTopDown) {
      cameraRef.current.position.set(0, 240, 0.1);
      controlsRef.current.target.set(0, 0, 0);
      setIsTopDown(true);
    } else {
      cameraRef.current.position.set(0, 140, 220);
      controlsRef.current.target.set(0, 10, 0);
      setIsTopDown(false);
    }
    controlsRef.current.update();
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[540px] bg-slate-950 overflow-hidden rounded-xl border border-slate-800 shadow-2xl select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Viewport Controls HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
        <button
          onClick={handleResetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/60 backdrop-blur transition-all shadow-md active:scale-95"
          title="Reset Camera Angle & Distance"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset Cam</span>
        </button>

        <button
          onClick={handleToggleTopDown}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur transition-all shadow-md active:scale-95 ${
            isTopDown
              ? 'bg-cyan-600/90 text-white border-cyan-400'
              : 'bg-slate-900/85 hover:bg-slate-800 text-slate-200 border-slate-700/60'
          }`}
          title="Toggle 2D Top-Down View"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>{isTopDown ? '3D Angle' : 'Top-Down'}</span>
        </button>

        <button
          onClick={() => {
            setCrossSectionMode(!crossSectionMode);
            setCrossSectionPoints([]);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur transition-all shadow-md active:scale-95 ${
            crossSectionMode
              ? 'bg-emerald-600/90 text-white border-emerald-400'
              : 'bg-slate-900/85 hover:bg-slate-800 text-slate-200 border-slate-700/60'
          }`}
          title="Measure Cross-Section (Click 2 points on terrain)"
        >
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>{crossSectionMode ? 'Cancel Measure' : 'Slice Profile'}</span>
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/60 backdrop-blur transition-all shadow-md active:scale-95"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
          )}
        </button>
      </div>

      {/* Mode Status Pill */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-slate-900/85 border border-slate-700/70 text-xs font-mono text-cyan-300 backdrop-blur shadow flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Layer: {settings.viewMode.toUpperCase()}</span>
          {settings.verticalExaggeration !== 1 && (
            <span className="text-slate-400">({settings.verticalExaggeration}x V.E.)</span>
          )}
        </div>
      </div>

      {/* Navigation Instruction Overlay (fades out or discreet in bottom-left) */}
      <div className="absolute bottom-3 left-4 z-20 pointer-events-none hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-400/80 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800/60 backdrop-blur">
        <span>Left Drag: Rotate</span>
        <span>•</span>
        <span>Right Drag: Pan</span>
        <span>•</span>
        <span>Scroll: Zoom</span>
        <span>•</span>
        <span>Hover: Inspect Cell</span>
      </div>

      {/* Cross section measuring hint */}
      {crossSectionMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 text-xs font-medium rounded-xl shadow-lg backdrop-blur flex items-center gap-2 animate-bounce">
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>
            {crossSectionPoints.length === 0
              ? 'Click first terrain point to start profile slice'
              : 'Click second terrain point to complete slice'}
          </span>
        </div>
      )}
    </div>
  );
};
