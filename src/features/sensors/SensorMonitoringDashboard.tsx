"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Download,
  Gauge,
  MapPin,
  Play,
  Pause,
  Radio,
  RefreshCw,
  Ruler,
  ShieldAlert,
  Sun,
  Thermometer,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  DEFAULT_STALE_THRESHOLD_MS,
  POSITION_CALIBRATIONS,
  evaluateStaleStatus,
  normalizeIngestedReading,
} from "./calibration";
import {
  buildSensorStatusSnapshot,
  createSimulatedReading,
  fetchSensorHistory,
  fetchSensorLatest,
  generateSeedHistory,
  postSensorReading,
} from "./api";
import { downloadSensorReadingsCsv } from "./csvExport";
import { SensorTelemetryChart } from "./SensorTelemetryChart";
import type {
  DataSourceMode,
  Esp32ConnectionState,
  IndividualSensorHealth,
  MeasurementPositionId,
  RealtimeSensorEnvelope,
  SensorFaultCode,
  SensorReading,
  TransportProtocol,
} from "./types";

const POSITIONS: MeasurementPositionId[] = ["P1", "P2", "P3"];

export function SensorMonitoringDashboard() {
  // Operational & Experiment State
  const [experimentId, setExperimentId] = useState<string>("EXP-2026-FLOOD-01");
  const [activePosition, setActivePosition] = useState<MeasurementPositionId>("P2");
  const [sourceMode, setSourceMode] = useState<DataSourceMode>("SIMULATED");
  const [protocol, setProtocol] = useState<TransportProtocol>("WEBSOCKET");
  const [streamUrl, setStreamUrl] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location?.host) {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${window.location.host}/api/sensor/stream`;
    }
    return "ws://localhost:3000/api/sensor/stream";
  });
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [ldrEnabled, setLdrEnabled] = useState<boolean>(true);
  const [injectedFault, setInjectedFault] = useState<SensorFaultCode>("NONE");
  const [positionFilter, setPositionFilter] = useState<MeasurementPositionId | "ALL">("ALL");

  // Custom reference height override per position
  const [referenceOverrides, setReferenceOverrides] = useState<
    Partial<Record<MeasurementPositionId, number>>
  >({});

  const activeCalibration = POSITION_CALIBRATIONS[activePosition];
  const effectiveRefHeightCm =
    referenceOverrides[activePosition] ?? activeCalibration.referenceHeightCm;

  // Connection & Telemetry State
  const [connectionState, setConnectionState] =
    useState<Esp32ConnectionState>("SIMULATED_STREAM");
  const [readings, setReadings] = useState<SensorReading[]>(() =>
    generateSeedHistory(24, {
      experimentId: "EXP-2026-FLOOD-01",
      position: "P2",
      ldrEnabled: true,
      injectedFault: "NONE",
      esp32ConnectionSimulated: "SIMULATED_STREAM",
    })
  );
  const [nowMs, setNowMs] = useState<number>(1773489600000);
  const [lastExportedFile, setLastExportedFile] = useState<string | null>(null);
  const [manualDistanceInput, setManualDistanceInput] = useState<string>("22.40");
  const [manualTempInput, setManualTempInput] = useState<string>("24.6");
  const [manualLdrInput, setManualLdrInput] = useState<string>("435");

  const stepCounterRef = useRef<number>(25);
  const wsRef = useRef<WebSocket | null>(null);

  // Clock tick every 1 second to evaluate staleness accurately
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Append incoming reading safely
  const appendReading = useCallback((reading: SensorReading) => {
    setReadings((prev) => {
      const next = [...prev, reading];
      return next.length > 150 ? next.slice(next.length - 150) : next;
    });
    setNowMs(Date.now());
  }, []);

  // Handle WebSocket / MQTT-over-WS / HTTP Poll or Simulated Stream
  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (!isStreaming) {
      setConnectionState("DISCONNECTED");
      return;
    }

    if (sourceMode === "SIMULATED") {
      if (injectedFault === "ESP32_HEARTBEAT_LOST") {
        setConnectionState("DISCONNECTED");
        return;
      }

      setConnectionState("SIMULATED_STREAM");
      const interval = setInterval(() => {
        stepCounterRef.current += 1;
        const simReading = createSimulatedReading(stepCounterRef.current, {
          experimentId,
          position: activePosition,
          customReferenceHeightCm: effectiveRefHeightCm,
          ldrEnabled,
          injectedFault,
          esp32ConnectionSimulated: "SIMULATED_STREAM",
        });
        appendReading(simReading);
      }, 2000);

      return () => clearInterval(interval);
    }

    // LIVE HARDWARE MODE:
    // Never pretend a disconnected ESP32 is connected. Attempt real WebSocket or HTTP poll.
    if (protocol === "WEBSOCKET" || protocol === "MQTT_OVER_WS") {
      setConnectionState("RECONNECTING");
      let socket: WebSocket | null = null;
      try {
        socket = new WebSocket(streamUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setConnectionState("CONNECTED");
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data) as
              | RealtimeSensorEnvelope
              | SensorReading;
            if ("event" in parsed && parsed.event === "sensor.reading") {
              appendReading(parsed.payload as SensorReading);
              setConnectionState("CONNECTED");
            } else if ("measuredDistanceCm" in parsed) {
              appendReading(parsed as SensorReading);
              setConnectionState("CONNECTED");
            }
          } catch {
            // Ignore malformed frame
          }
        };

        socket.onerror = () => {
          setConnectionState("DISCONNECTED");
        };

        socket.onclose = () => {
          setConnectionState("DISCONNECTED");
        };
      } catch {
        setConnectionState("DISCONNECTED");
      }

      return () => {
        if (socket) {
          socket.close();
        }
      };
    } else {
      // HTTP Polling against Member 9 endpoints (/api/sensor/latest)
      setConnectionState("RECONNECTING");
      let cancelled = false;

      const poll = async () => {
        const latestRes = await fetchSensorLatest(experimentId, activePosition);
        if (cancelled) return;
        if (latestRes && latestRes.ok && latestRes.reading) {
          appendReading(latestRes.reading);
          setConnectionState(latestRes.stale ? "RECONNECTING" : "CONNECTED");
        } else {
          setConnectionState("DISCONNECTED");
        }
      };

      void poll();
      const pollTimer = setInterval(() => {
        void poll();
      }, 2000);

      return () => {
        cancelled = true;
        clearInterval(pollTimer);
      };
    }
  }, [
    activePosition,
    appendReading,
    effectiveRefHeightCm,
    experimentId,
    injectedFault,
    isStreaming,
    ldrEnabled,
    protocol,
    sourceMode,
    streamUrl,
  ]);

  // Latest reading for the active position (or overall latest)
  const positionReadings = useMemo(
    () =>
      readings.filter((r) =>
        positionFilter === "ALL" ? true : r.position === positionFilter
      ),
    [readings, positionFilter]
  );

  const latestReading = useMemo(() => {
    for (let i = readings.length - 1; i >= 0; i--) {
      if (readings[i].position === activePosition) {
        return readings[i];
      }
    }
    return readings[readings.length - 1] ?? null;
  }, [readings, activePosition]);

  const staleEvaluation = useMemo(
    () =>
      evaluateStaleStatus(
        latestReading?.timestamp,
        nowMs,
        DEFAULT_STALE_THRESHOLD_MS
      ),
    [latestReading?.timestamp, nowMs]
  );

  const statusSnapshot = useMemo(
    () =>
      buildSensorStatusSnapshot({
        latest: latestReading,
        connectionState,
        activeProtocol:
          sourceMode === "SIMULATED" ? "LOCAL_SIMULATOR" : protocol,
        sourceMode,
        activePosition,
        activeExperimentId: experimentId,
        ldrEnabled,
        nowMs,
      }),
    [
      activePosition,
      connectionState,
      experimentId,
      latestReading,
      ldrEnabled,
      nowMs,
      protocol,
      sourceMode,
    ]
  );

  // Manual ingestion test handler (POST /api/sensor/readings)
  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    stepCounterRef.current += 1;
    const dist =
      manualDistanceInput.trim() === "" ? null : Number(manualDistanceInput);
    const temp =
      manualTempInput.trim() === "" ? null : Number(manualTempInput);
    const ldr =
      !ldrEnabled || manualLdrInput.trim() === ""
        ? null
        : Number(manualLdrInput);

    const payload = {
      experimentId,
      deviceId: "ESP32-WROOM-FLOOD-01",
      firmwareVersion: "v2.4.1-probe",
      timestamp: new Date().toISOString(),
      deviceMillis: stepCounterRef.current * 1500,
      position: activePosition,
      sourceMode,
      measuredDistanceCm: dist,
      referenceHeightCm: effectiveRefHeightCm,
      ambientTemperatureC: temp,
      ldrLightLevelLux: ldr,
      rssiDbm: sourceMode === "LIVE" ? -54 : -59,
      faultCode: injectedFault,
    };

    // Attempt backend POST first; also normalize locally so UI updates immediately
    const apiResult = await postSensorReading(payload);
    const normalized =
      apiResult.ok && apiResult.reading
        ? apiResult.reading
        : normalizeIngestedReading(payload, stepCounterRef.current);

    appendReading(normalized);
  };

  // Sync history from Member 9 backend if available
  const handleSyncBackendHistory = async () => {
    const res = await fetchSensorHistory(experimentId, positionFilter, 50);
    if (res && res.ok && res.readings.length > 0) {
      setReadings(res.readings);
    }
  };

  const handleExportCsv = () => {
    const filename = downloadSensorReadingsCsv(
      positionReadings,
      experimentId,
      positionFilter
    );
    setLastExportedFile(filename);
  };

  const depthSeverity = useMemo(() => {
    const d = latestReading?.calculatedWaterDepthCm;
    if (d === null || d === undefined) return "UNKNOWN";
    if (d >= activeCalibration.criticalDepthCm) return "CRITICAL";
    if (d >= activeCalibration.warningDepthCm) return "WARNING";
    return "NOMINAL";
  }, [
    activeCalibration.criticalDepthCm,
    activeCalibration.warningDepthCm,
    latestReading?.calculatedWaterDepthCm,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Operational Telemetry Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
              <Waves className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
                  CRESTIX PROBE • MODULE 07
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                  ESP32 Physical Flood Rig
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Live Hardware Sensor Monitoring
              </h1>
            </div>
          </div>

          {/* Primary Mode & Connection Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Explicit LIVE vs SIMULATED Badge */}
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wider ${
                sourceMode === "LIVE"
                  ? "border-emerald-500/50 bg-emerald-950/70 text-emerald-300"
                  : "border-amber-500/60 bg-amber-950/80 text-amber-300"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  sourceMode === "LIVE"
                    ? "animate-pulse bg-emerald-400"
                    : "animate-pulse bg-amber-400"
                }`}
              />
              {sourceMode === "LIVE"
                ? "MODE: LIVE ESP32 HARDWARE"
                : "MODE: SIMULATED TELEMETRY"}
            </div>

            {/* ESP32 Connection Status Indicator */}
            <div
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold ${
                statusSnapshot.connectionState === "CONNECTED"
                  ? "border-cyan-500/40 bg-cyan-950/60 text-cyan-200"
                  : statusSnapshot.connectionState === "SIMULATED_STREAM"
                    ? "border-indigo-500/40 bg-indigo-950/60 text-indigo-200"
                    : statusSnapshot.connectionState === "RECONNECTING"
                      ? "border-amber-500/40 bg-amber-950/60 text-amber-200"
                      : "border-rose-500/60 bg-rose-950/80 text-rose-200"
              }`}
            >
              {statusSnapshot.connectionState === "DISCONNECTED" ? (
                <WifiOff className="h-4 w-4 text-rose-400" aria-hidden="true" />
              ) : (
                <Wifi className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              )}
              <span>
                ESP32:{" "}
                <strong className="font-mono">
                  {statusSnapshot.connectionState}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Data Integrity Banner: Point-Sensor Spatial Scope Disclaimer */}
        <section
          aria-label="Spatial coverage notice"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-950/25 px-4 py-3 text-xs text-cyan-200"
        >
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
            <p>
              <strong>Point-Measurement Scope Integrity:</strong> The single ultrasonic transducer measures vertical water elevation{" "}
              <span className="underline decoration-cyan-400/60 underline-offset-2">
                only at the selected physical gantry position ({activePosition}: {activeCalibration.zoneName})
              </span>
              . It does <strong>not</strong> measure the entire miniature flood basin simultaneously.
            </p>
          </div>
          <span className="font-mono text-[11px] text-cyan-300">
            Coordinates: {activeCalibration.coordinatesLabel}
          </span>
        </section>

        {/* Critical Warnings: Disconnected, Stale Data, or Sensor Faults */}
        {(statusSnapshot.connectionState === "DISCONNECTED" ||
          statusSnapshot.isStale ||
          latestReading?.faultCode !== "NONE" ||
          latestReading?.calibrationUnderflowWarning) && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/60 bg-rose-950/50 p-4 text-rose-100 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-400"
                aria-hidden="true"
              />
              <div className="space-y-1 text-sm">
                <h2 className="font-bold uppercase tracking-wide text-rose-300">
                  Hardware Telemetry Integrity Warning
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-xs text-rose-200">
                  {statusSnapshot.connectionState === "DISCONNECTED" && (
                    <li>
                      <strong>ESP32 Disconnected:</strong> No active WebSocket/MQTT or HTTP telemetry link to{" "}
                      <code className="font-mono">{statusSnapshot.deviceId}</code>. Disconnected sensors are strictly marked{" "}
                      <code className="font-mono">OFFLINE</code>.
                    </li>
                  )}
                  {statusSnapshot.isStale && (
                    <li>
                      <strong>Stale Telemetry Warning:</strong> Latest reading timestamp (
                      <code className="font-mono">
                        {latestReading?.timestamp ?? "N/A"}
                      </code>
                      ) is older than the {DEFAULT_STALE_THRESHOLD_MS / 1000}s freshness window (Age:{" "}
                      {staleEvaluation.ageMs !== null
                        ? `${(staleEvaluation.ageMs / 1000).toFixed(1)}s`
                        : "Unknown"}
                      ). Do not rely on stale values for flood gate actuation.
                    </li>
                  )}
                  {latestReading?.faultCode === "ULTRASONIC_ECHO_TIMEOUT" && (
                    <li>
                      <strong>Ultrasonic Echo Fault:</strong> Transducer failed to receive an acoustic pulse return. Measured distance and calculated water depth are marked{" "}
                      <code className="font-mono">MISSING (NULL)</code>.
                    </li>
                  )}
                  {(latestReading?.calibrationUnderflowWarning ||
                    latestReading?.faultCode === "DISTANCE_EXCEEDS_REFERENCE") && (
                    <li>
                      <strong>Calibration Reference Underflow:</strong> Measured ultrasonic distance (
                      <code className="font-mono">
                        {latestReading?.measuredDistanceCm?.toFixed(2)} cm
                      </code>
                      ) exceeds calibrated dry-bed reference height (
                      <code className="font-mono">
                        {latestReading?.referenceHeightCm.toFixed(2)} cm
                      </code>
                      ) at {activePosition}. Water depth is clamped to{" "}
                      <code className="font-mono">0.00 cm</code>. Verify sensor mount height or position selector.
                    </li>
                  )}
                  {latestReading?.faultCode === "TEMP_ONEWIRE_CRC_ERROR" && (
                    <li>
                      <strong>Ambient Temperature Sensor Fault:</strong> OneWire CRC error on DS18B20 probe. Temperature marked{" "}
                      <code className="font-mono">MISSING</code>.
                    </li>
                  )}
                  {latestReading?.faultCode === "LDR_ADC_SATURATED" && (
                    <li>
                      <strong>Optional LDR ADC Saturated:</strong> Photoresistor channel pinned at 12-bit rail (4095).
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Experiment Controls, Mode Switcher, and Measurement Position Selector (P1, P2, P3) */}
        <section
          aria-labelledby="experiment-controls-heading"
          className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:grid-cols-12"
        >
          <div className="space-y-3 lg:col-span-5">
            <h2
              id="experiment-controls-heading"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              <MapPin className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Measurement Position Selector (P1, P2, P3)
            </h2>
            <div
              role="group"
              aria-label="Select physical sensor position"
              className="grid grid-cols-3 gap-2"
            >
              {POSITIONS.map((posId) => {
                const cal = POSITION_CALIBRATIONS[posId];
                const isSelected = activePosition === posId;
                return (
                  <button
                    key={posId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setActivePosition(posId)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-950/60 text-white shadow-sm"
                        : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-mono text-base font-bold text-cyan-300">
                        {posId}
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                        Ref: {(referenceOverrides[posId] ?? cal.referenceHeightCm).toFixed(1)}cm
                      </span>
                    </div>
                    <span className="mt-1 line-clamp-1 text-xs font-medium">
                      {cal.zoneName}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">
              {activeCalibration.description}
            </p>
          </div>

          {/* Experiment ID & Calibration Reference Control */}
          <div className="space-y-3 border-t border-slate-800 pt-3 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Gauge className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Experiment & Reference Calibration
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="experiment-id-input"
                  className="block text-xs font-medium text-slate-300"
                >
                  Experiment ID
                </label>
                <input
                  id="experiment-id-input"
                  type="text"
                  value={experimentId}
                  onChange={(e) => setExperimentId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="reference-height-input"
                  className="block text-xs font-medium text-slate-300"
                >
                  {activePosition} Ref Height (cm)
                </label>
                <input
                  id="reference-height-input"
                  type="number"
                  step="0.5"
                  min="5"
                  max="100"
                  value={effectiveRefHeightCm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (Number.isFinite(val) && val > 0) {
                      setReferenceOverrides((prev) => ({
                        ...prev,
                        [activePosition]: val,
                      }));
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={ldrEnabled}
                  onChange={(e) => setLdrEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500"
                />
                <span>Enable Optional LDR Sensor (GPIO34)</span>
              </label>
            </div>
          </div>

          {/* Stream Mode, Transport Protocol & Diagnostic Fault Simulator */}
          <div className="space-y-3 border-t border-slate-800 pt-3 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Radio className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Telemetry Source & Stream
            </h2>

            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={sourceMode === "SIMULATED"}
                onClick={() => setSourceMode("SIMULATED")}
                className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  sourceMode === "SIMULATED"
                    ? "border-amber-400 bg-amber-950/70 text-amber-200"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                Simulated Rig
              </button>
              <button
                type="button"
                aria-pressed={sourceMode === "LIVE"}
                onClick={() => setSourceMode("LIVE")}
                className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  sourceMode === "LIVE"
                    ? "border-emerald-400 bg-emerald-950/70 text-emerald-200"
                    : "border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                Live ESP32 Link
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStreaming((prev) => !prev)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  isStreaming
                    ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "border-cyan-500/50 bg-cyan-950/60 text-cyan-300"
                }`}
              >
                {isStreaming ? (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    Pause Stream
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Resume Stream
                  </>
                )}
              </button>

              <select
                aria-label="Inject hardware fault scenario"
                value={injectedFault}
                onChange={(e) =>
                  setInjectedFault(e.target.value as SensorFaultCode)
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-[11px] text-slate-200"
              >
                <option value="NONE">Fault Test: NONE</option>
                <option value="ULTRASONIC_ECHO_TIMEOUT">
                  Fault: Echo Timeout
                </option>
                <option value="DISTANCE_EXCEEDS_REFERENCE">
                  Fault: Distance &gt; Ref
                </option>
                <option value="TEMP_ONEWIRE_CRC_ERROR">
                  Fault: Temp CRC Error
                </option>
                <option value="LDR_ADC_SATURATED">
                  Fault: LDR Saturated
                </option>
                <option value="ESP32_HEARTBEAT_LOST">
                  Fault: ESP32 Disconnect
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* Primary Telemetry Cards: Strictly Separating Measured Distance vs Calculated Water Depth */}
        <section
          aria-label="Live sensor measurement cards"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Card 1: Current Measured Distance (Ultrasonic Air Gap) */}
          <article className="rounded-xl border border-amber-500/30 bg-slate-900/90 p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                1. Measured Distance
              </span>
              <Ruler className="h-4 w-4 text-amber-400" aria-hidden="true" />
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Ultrasonic transducer face → water surface air gap
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                data-testid="current-measured-distance"
                className="font-mono text-3xl font-bold text-white"
              >
                {latestReading?.measuredDistanceCm !== null &&
                latestReading?.measuredDistanceCm !== undefined
                  ? `${latestReading.measuredDistanceCm.toFixed(2)} cm`
                  : "MISSING"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              <span>Ref Bed Height ({activePosition}):</span>
              <strong className="font-mono text-slate-200">
                {effectiveRefHeightCm.toFixed(2)} cm
              </strong>
            </div>
          </article>

          {/* Card 2: Calculated Water Depth (Derived from Reference Height - Distance) */}
          <article
            className={`rounded-xl border p-4 shadow ${
              depthSeverity === "CRITICAL"
                ? "border-rose-500/70 bg-rose-950/30"
                : depthSeverity === "WARNING"
                  ? "border-amber-500/60 bg-amber-950/20"
                  : "border-cyan-500/40 bg-slate-900/90"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                2. Calculated Water Depth
              </span>
              <Waves className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Derived: <code className="font-mono">Ref ({effectiveRefHeightCm.toFixed(1)}) − Distance</code> at {activePosition}
            </p>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span
                data-testid="calculated-water-depth"
                className="font-mono text-3xl font-bold text-cyan-300"
              >
                {latestReading?.calculatedWaterDepthCm !== null &&
                latestReading?.calculatedWaterDepthCm !== undefined
                  ? `${latestReading.calculatedWaterDepthCm.toFixed(2)} cm`
                  : "MISSING"}
              </span>
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                  depthSeverity === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-300"
                    : depthSeverity === "WARNING"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {depthSeverity}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              <span>Warn / Crit Threshold:</span>
              <strong className="font-mono text-slate-200">
                {activeCalibration.warningDepthCm.toFixed(1)} /{" "}
                {activeCalibration.criticalDepthCm.toFixed(1)} cm
              </strong>
            </div>
          </article>

          {/* Card 3: Ambient Temperature Sensor */}
          <article className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                3. Ambient Temperature
              </span>
              <Thermometer
                className="h-4 w-4 text-emerald-400"
                aria-hidden="true"
              />
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              DS18B20 1-Wire probe • Acoustic speed compensation
            </p>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                data-testid="ambient-temperature"
                className="font-mono text-3xl font-bold text-white"
              >
                {latestReading?.ambientTemperatureC !== null &&
                latestReading?.ambientTemperatureC !== undefined
                  ? `${latestReading.ambientTemperatureC.toFixed(1)} °C`
                  : "MISSING"}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              <span>Speed of Sound Est.:</span>
              <strong className="font-mono text-slate-200">
                {latestReading?.ambientTemperatureC !== null &&
                latestReading?.ambientTemperatureC !== undefined
                  ? `${(331.3 + 0.606 * latestReading.ambientTemperatureC).toFixed(1)} m/s`
                  : "345.8 m/s (Default)"}
              </strong>
            </div>
          </article>

          {/* Card 4: Optional LDR & Frame Timestamp Metadata */}
          <article className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                4. Optional LDR & Timestamp
              </span>
              <Sun className="h-4 w-4 text-purple-400" aria-hidden="true" />
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Ambient illumination (GPIO34) & latest frame clock
            </p>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span
                data-testid="ldr-reading"
                className="font-mono text-2xl font-bold text-white"
              >
                {!ldrEnabled
                  ? "DISABLED"
                  : latestReading?.ldrLightLevelLux !== null &&
                      latestReading?.ldrLightLevelLux !== undefined
                    ? `${latestReading.ldrLightLevelLux} lux`
                    : "MISSING"}
              </span>
              <span className="font-mono text-xs text-slate-400">
                RSSI: {latestReading?.rssiDbm ?? "--"} dBm
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
              <span>Frame UTC:</span>
              <strong
                data-testid="latest-reading-timestamp"
                className="font-mono text-slate-200"
              >
                {latestReading?.timestamp
                  ? new Date(latestReading.timestamp).toISOString().slice(11, 23) + "Z"
                  : "NO FRAME"}
              </strong>
            </div>
          </article>
        </section>

        {/* Sensor Overview & Individual Hardware Status Indicators */}
        <section
          aria-labelledby="sensor-overview-heading"
          className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="sensor-overview-heading"
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white"
              >
                <Cpu className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                Hardware Sensor Overview & Diagnostic Status Indicators
              </h2>
              <p className="text-xs text-slate-400">
                Node: <code className="font-mono text-slate-200">{statusSnapshot.deviceId}</code> • Firmware:{" "}
                <code className="font-mono text-slate-200">{statusSnapshot.firmwareVersion}</code> • Experiment:{" "}
                <code className="font-mono text-cyan-300">{experimentId}</code>
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Last Heartbeat:{" "}
              {statusSnapshot.lastHeartbeatIso
                ? new Date(statusSnapshot.lastHeartbeatIso).toLocaleTimeString()
                : "NONE"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {statusSnapshot.sensors.map((sensor: IndividualSensorHealth) => {
              const badgeStyles =
                sensor.status === "ONLINE"
                  ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                  : sensor.status === "DEGRADED" || sensor.status === "STALE"
                    ? "border-amber-500/50 bg-amber-950/60 text-amber-300"
                    : sensor.status === "NOT_INSTALLED"
                      ? "border-slate-700 bg-slate-800 text-slate-400"
                      : "border-rose-500/60 bg-rose-950/70 text-rose-300";

              return (
                <div
                  key={sensor.sensorId}
                  className="flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-950/80 p-3.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">
                          {sensor.name}
                        </h3>
                        <p className="font-mono text-[11px] text-slate-400">
                          {sensor.hardwareModel}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${badgeStyles}`}
                      >
                        {sensor.status === "ONLINE" ? (
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        )}
                        {sensor.status}
                      </span>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
                      {sensor.faultMessage}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono text-[10px] text-slate-400">
                    <span>Fault: {sensor.faultCode}</span>
                    <span>
                      Signal:{" "}
                      {sensor.signalQualityPct !== null
                        ? `${sensor.signalQualityPct}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Readings Dual-Trace Hydrograph Chart */}
        <SensorTelemetryChart
          readings={positionReadings}
          referenceHeightCm={effectiveRefHeightCm}
          warningDepthCm={activeCalibration.warningDepthCm}
          criticalDepthCm={activeCalibration.criticalDepthCm}
          activePosition={activePosition}
        />

        {/* WebSocket / MQTT / REST Ingestion Bridge & Manual Frame Test Bench */}
        <section
          aria-labelledby="bridge-controls-heading"
          className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:grid-cols-12"
        >
          <div className="space-y-2 lg:col-span-6">
            <h2
              id="bridge-controls-heading"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300"
            >
              <Activity className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Real-Time Stream Configuration (WebSocket / MQTT / REST)
            </h2>
            <p className="text-xs text-slate-400">
              Coordinated with Member 9 backend endpoints:{" "}
              <code className="text-cyan-300">GET /api/sensor/latest</code>,{" "}
              <code className="text-cyan-300">GET /api/sensor/history</code>,{" "}
              <code className="text-cyan-300">POST /api/sensor/readings</code>,{" "}
              <code className="text-cyan-300">GET /api/sensor/status</code>.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="transport-protocol-select"
                  className="block text-[11px] font-medium text-slate-400"
                >
                  Transport Protocol
                </label>
                <select
                  id="transport-protocol-select"
                  value={protocol}
                  onChange={(e) =>
                    setProtocol(e.target.value as TransportProtocol)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white"
                >
                  <option value="WEBSOCKET">WebSocket Stream</option>
                  <option value="MQTT_OVER_WS">MQTT over WebSocket</option>
                  <option value="HTTP_POLL">REST HTTP Polling</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="stream-endpoint-input"
                  className="block text-[11px] font-medium text-slate-400"
                >
                  WebSocket / MQTT Broker Endpoint URI
                </label>
                <input
                  id="stream-endpoint-input"
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Manual Frame Ingestion Test Form */}
          <form
            onSubmit={handleManualIngest}
            className="space-y-2 border-t border-slate-800 pt-3 lg:col-span-6 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Inject Test Telemetry Frame (<code className="font-mono">POST /api/sensor/readings</code>)
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <label
                  htmlFor="manual-distance-input"
                  className="block text-[11px] text-slate-400"
                >
                  Distance (cm)
                </label>
                <input
                  id="manual-distance-input"
                  type="number"
                  step="0.1"
                  value={manualDistanceInput}
                  onChange={(e) => setManualDistanceInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="manual-temp-input"
                  className="block text-[11px] text-slate-400"
                >
                  Temp (°C)
                </label>
                <input
                  id="manual-temp-input"
                  type="number"
                  step="0.1"
                  value={manualTempInput}
                  onChange={(e) => setManualTempInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="manual-ldr-input"
                  className="block text-[11px] text-slate-400"
                >
                  LDR (lux)
                </label>
                <input
                  id="manual-ldr-input"
                  type="number"
                  step="1"
                  value={manualLdrInput}
                  onChange={(e) => setManualLdrInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  Send Reading
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Historical Sensor Data Table & CSV Export */}
        <section
          aria-labelledby="history-table-heading"
          className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="history-table-heading"
                className="text-sm font-bold uppercase tracking-wider text-white"
              >
                Historical Sensor Telemetry Log ({positionReadings.length} Records)
              </h2>
              <p className="text-xs text-slate-400">
                Complete audit trail with Experiment ID, ISO Timestamp, Position (P1/P2/P3), Source Mode, Measured Distance, and Calculated Water Depth
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="history-position-filter" className="sr-only">
                Filter history by position
              </label>
              <select
                id="history-position-filter"
                value={positionFilter}
                onChange={(e) =>
                  setPositionFilter(
                    e.target.value as MeasurementPositionId | "ALL"
                  )
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-200"
              >
                <option value="ALL">Filter: All Positions (P1–P3)</option>
                <option value="P1">Filter: P1 Only</option>
                <option value="P2">Filter: P2 Only</option>
                <option value="P3">Filter: P3 Only</option>
              </select>

              <button
                type="button"
                onClick={handleSyncBackendHistory}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Sync API History
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV ({positionReadings.length})
              </button>
            </div>
          </div>

          {lastExportedFile && (
            <div
              role="status"
              className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 font-mono text-xs text-emerald-300"
            >
              Exported CSV: <strong>{lastExportedFile}</strong>
            </div>
          )}

          <div className="max-h-[380px] overflow-auto rounded-lg border border-slate-800">
            <table className="w-full border-collapse text-left text-xs">
              <caption className="sr-only">
                Historical ESP32 flood sensor readings including experiment ID, timestamp, position, measured distance, reference height, calculated water depth, temperature, LDR light level, and fault codes.
              </caption>
              <thead className="sticky top-0 z-10 bg-slate-950 font-mono text-[11px] uppercase text-slate-400">
                <tr>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Timestamp (UTC)
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Experiment ID
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Pos
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Mode
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Measured Distance
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Ref Height
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Calculated Depth
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Temp (°C)
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    LDR (lux)
                  </th>
                  <th scope="col" className="border-b border-slate-800 px-3 py-2.5">
                    Status / Fault
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {positionReadings
                  .slice()
                  .reverse()
                  .slice(0, 40)
                  .map((row) => (
                    <tr
                      key={row.readingId}
                      className="hover:bg-slate-800/40"
                    >
                      <th
                        scope="row"
                        className="whitespace-nowrap bg-slate-900/90 px-3 py-2 font-normal text-slate-300"
                      >
                        {row.timestamp.replace("T", " ").slice(0, 23)}Z
                      </th>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                        {row.experimentId}
                      </td>
                      <td className="px-3 py-2 font-bold text-cyan-300">
                        {row.position}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            row.sourceMode === "LIVE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {row.sourceMode}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-amber-300">
                        {row.measuredDistanceCm !== null
                          ? `${row.measuredDistanceCm.toFixed(2)} cm`
                          : "MISSING"}
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {row.referenceHeightCm.toFixed(2)} cm
                      </td>
                      <td className="px-3 py-2 font-bold text-cyan-300">
                        {row.calculatedWaterDepthCm !== null
                          ? `${row.calculatedWaterDepthCm.toFixed(2)} cm`
                          : "MISSING"}
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {row.ambientTemperatureC !== null
                          ? `${row.ambientTemperatureC.toFixed(1)} °C`
                          : "MISSING"}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {row.ldrLightLevelLux !== null
                          ? `${row.ldrLightLevelLux}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ${
                            row.faultCode === "NONE"
                              ? "bg-slate-800 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {row.faultCode}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
