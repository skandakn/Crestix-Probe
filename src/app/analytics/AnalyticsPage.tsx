'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Check, ChevronDown, Clock3,
  Download, FlaskConical, Info, Layers3, RefreshCw, ShieldCheck, Waves,
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { getExperimentReport, loadAnalytics } from '../../features/analytics/api'
import type { AnalyticsDataset, Experiment, MetricValue } from '../../features/analytics/types'
import '../../styles.css'

type ScenarioFilter = 'all' | 'test' | 'training'
type WindowFilter = 'all' | '4' | '2'

const format = (value: MetricValue | undefined, digits = 2) => {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(digits) : String(value)
}

function saveCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function buildCsv(dataset: AnalyticsDataset, selected?: Experiment) {
  const rows = [
    ['data_source', dataset.source === 'sample' ? 'ILLUSTRATIVE SAMPLE DATA — NOT MEASURED' : 'backend'],
    ['scenario', dataset.metrics.datasetLabel ?? 'Unspecified'],
    ['scenario_type', dataset.metrics.scenarioType ?? 'unknown'],
    ['MAE (m)', selected?.mae ?? dataset.metrics.mae ?? ''], ['RMSE (m)', selected?.rmse ?? dataset.metrics.rmse ?? ''],
    ['CSI (unitless)', selected?.csi ?? dataset.metrics.csi ?? ''], ['mass conservation error (%)', dataset.metrics.massConservationError ?? ''],
    ['AI inference time (ms)', dataset.metrics.inferenceTimeAiMs ?? ''], ['solver inference time (ms)', dataset.metrics.inferenceTimeSolverMs ?? ''],
    [], ['time', 'AI predicted depth (m)', 'Numerical solver depth (m)', 'Physical sensor depth (m)', 'Rainfall (mm/h)', 'AI flood extent (km²)', 'Solver flood extent (km²)', 'Observed flood extent (km²)'],
    ...dataset.comparisons.map((point) => [point.time, point.predictedDepthM ?? '', point.numericalDepthM ?? '', point.observedDepthM ?? '', point.rainfallMmH ?? '', point.aiExtentKm2 ?? '', point.solverExtentKm2 ?? '', point.observedExtentKm2 ?? '']),
  ]
  return rows.map((row) => row.map((cell) => `"${String(cell).split('"').join('""')}"`).join(',')).join('\r\n')
}

function MetricCard({ title, value, unit, note, icon: Icon, tone = 'blue' }: {
  title: string; value: string; unit: string; note: string; icon: typeof Activity; tone?: string
}) {
  return <article className="metric-card">
    <div className="metric-top"><span className={`metric-icon ${tone}`}><Icon size={17} /></span><span className="metric-label">{title}</span><Info className="info-icon" size={15} aria-label={note} /></div>
    <div className="metric-value">{value}<span>{unit}</span></div>
    <div className="metric-note">{note}</div>
  </article>
}

function ChartPanel({ title, subtitle, icon: Icon, children, className = '' }: {
  title: string; subtitle: string; icon: typeof Activity; children: ReactNode; className?: string
}) {
  return <section className={`panel chart-panel ${className}`}>
    <div className="panel-heading"><div className="heading-icon"><Icon size={17} /></div><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" aria-label={subtitle}><Info size={16} /></button></div>
    {children}
  </section>
}

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; unit?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((entry) => <div key={entry.name}><i style={{ background: entry.color }} />{entry.name}<b>{entry.value}{entry.unit ?? ''}</b></div>)}</div>
}

export default function AnalyticsPage() {
  const [dataset, setDataset] = useState<AnalyticsDataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ScenarioFilter>('all')
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all')
  const [selectedExperiment, setSelectedExperiment] = useState('')
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = async () => {
    setLoading(true)
    const next = await loadAnalytics()
    setDataset(next)
    setSelectedExperiment((current) => current || next.experiments[0]?.id || '')
    setLoading(false)
  }
  useEffect(() => {
    let cancelled = false
    void loadAnalytics().then((next) => {
      if (cancelled) return
      setDataset(next)
      setSelectedExperiment(next.experiments[0]?.id ?? '')
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const selected = useMemo(() => dataset?.experiments.find((item) => item.id === selectedExperiment), [dataset, selectedExperiment])
  const visibleExperiments = useMemo(() => (dataset?.experiments ?? []).filter((item) => filter === 'all' || item.scenarioType === filter), [dataset, filter])
  const chartData = useMemo(() => {
    const points = dataset?.comparisons ?? []
    if (windowFilter === 'all' || points.length === 0) return points
    return points.slice(0, Number(windowFilter))
  }, [dataset, windowFilter])

  const exportReport = async () => {
    if (!dataset) return
    setExporting(true)
    setNotice('')
    try {
      const report = selected ? await getExperimentReport(selected.id) : null
      saveCsv(report ?? buildCsv(dataset, selected), `crestix-validation-${selected?.id || 'report'}.csv`)
      setNotice(dataset.source === 'sample' ? 'Exported illustrative sample data. It is not a measured validation report.' : 'Validation report exported.')
    } catch (error) {
      setNotice(error instanceof Error ? `${error.message}. Exported the metrics currently loaded from the validation API instead.` : 'Report unavailable. Exported the currently loaded validation data.')
      saveCsv(buildCsv(dataset, selected), `crestix-validation-${selected?.id || 'report'}.csv`)
    } finally { setExporting(false) }
  }

  if (loading || !dataset) return <main className="loading-screen"><div className="spinner" /><span>Loading validation data…</span></main>
  const metrics = dataset.metrics
  const allMissing = dataset.source === 'empty'

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Waves size={19} /></div><div><strong>crestix<span>probe</span></strong><small>HYDROLOGY LAB</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="workspace"><span className="workspace-dot" /> Research workspace <ChevronDown size={14} /></div>
      <div className="sidebar-label">RESEARCH</div>
      <nav><a className="nav-item" href="#overview"><Activity size={17} />Overview</a><a className="nav-item active" href="#analytics"><BarChart3 size={17} />Analytics</a><a className="nav-item" href="#experiments"><FlaskConical size={17} />Experiments</a></nav>
      <div className="sidebar-bottom"><div className="sidebar-rule" /><div className="avatar">RL</div><div className="user-name">Research lead<small>Member workspace</small></div><ChevronDown size={14} /></div>
    </aside>

    <main className="main-content" id="analytics">
      <header className="topbar"><div className="breadcrumbs">Research workspace <span>/</span> <b>Analytics</b></div><div className="top-actions"><span className="date-pill"><Clock3 size={14} /> Validation report</span><button className="refresh-button" onClick={() => void refresh()}><RefreshCw size={15} /> Refresh data</button></div></header>
      <div className="content-wrap">
        <div className="page-title-row"><div><div className="eyebrow"><span className="green-dot" /> SCIENTIFIC EVALUATION</div><h1>Research analytics</h1><p className="page-subtitle">Evaluate model performance against numerical simulations and physical observations.</p></div><button className="export-button" onClick={() => void exportReport()} disabled={exporting}><Download size={16} />{exporting ? 'Preparing…' : 'Export CSV'}</button></div>

        {dataset.source === 'sample' && <div className="sample-banner"><div className="sample-mark"><Info size={16} /></div><div><strong>Illustrative sample data</strong><span>These values are for interface preview only. They are not observed results or scientific performance claims.</span></div><span className="sample-badge">SAMPLE</span></div>}
        {dataset.error && dataset.source === 'sample' && <div className="connection-note">Validation API is unavailable ({dataset.error}). Showing clearly marked sample data.</div>}
        {notice && <div className="notice"><Check size={15} />{notice}</div>}

        <section className="summary-strip"><div className="summary-icon"><ShieldCheck size={19} /></div><div className="summary-copy"><strong>Validation summary</strong><p>{metrics.validationSummary || 'No validation summary was returned by the backend. Review the metrics and source data below.'}</p></div><div className="summary-meta"><span className="status-dot" />{dataset.source === 'backend' ? 'BACKEND DATA' : 'PREVIEW'}<span className="meta-divider" />{metrics.datasetLabel || 'Scenario not specified'}</div></section>

        <div className="section-heading"><div><h2>Performance metrics</h2><p>Metrics are reported for the selected validation run.</p></div><div className="filter-group"><label htmlFor="scenario-filter">Scenario</label><select id="scenario-filter" value={filter} onChange={(e) => { const next = e.target.value as ScenarioFilter; setFilter(next); setSelectedExperiment(dataset.experiments.find((item) => next === 'all' || item.scenarioType === next)?.id ?? '') }}><option value="all">All scenarios</option><option value="test">Test</option><option value="training">Training</option></select></div></div>
        {filter === 'training' && <div className="training-note"><Info size={15} />Training scenario metrics describe model fitting data. Test scenarios are held out for evaluation; training performance does not establish generalization.</div>}
        <div className="metric-grid">
          <MetricCard title="Mean absolute error" value={format(selected?.mae ?? metrics.mae, 3)} unit="m" note="Average absolute depth difference against the selected reference series." icon={Activity} tone="blue" />
          <MetricCard title="Root mean squared error" value={format(selected?.rmse ?? metrics.rmse, 3)} unit="m" note="Square root of mean squared depth errors; larger errors contribute more." icon={BarChart3} tone="violet" />
          <MetricCard title="Critical success index" value={format(selected?.csi ?? metrics.csi, 2)} unit="" note="Flood extent overlap score (0–1); threshold and reference source should be defined by the backend." icon={Layers3} tone="teal" />
          <MetricCard title="Mass conservation error" value={format(metrics.massConservationError, 2)} unit="%" note="Relative water-volume balance error reported by the validation backend." icon={Waves} tone="amber" />
          <MetricCard title="AI inference time" value={format(metrics.inferenceTimeAiMs, 0)} unit="ms" note="Elapsed model inference time per run as reported by the backend." icon={Clock3} tone="blue" />
          <MetricCard title="Numerical solver time" value={format(metrics.inferenceTimeSolverMs, 0)} unit="ms" note="Elapsed numerical solver time per run. Speed is separate from prediction accuracy." icon={Activity} tone="violet" />
          <MetricCard title="Multi-step stability" value={metrics.stabilitySteps == null ? '—' : `${format(metrics.stabilitySteps, 0)}${metrics.stabilityTotalSteps == null ? '' : ` / ${format(metrics.stabilityTotalSteps, 0)}`}`} unit=" steps" note="Stable rollout steps / tested steps, when both values are available." icon={ShieldCheck} tone="teal" />
          <MetricCard title="Physical sensor points" value={format(metrics.sensorCount, 0)} unit=" sensors" note="Number of physical measurement sources included in validation, if provided." icon={Activity} tone="amber" />
        </div>

        <div className="section-heading charts-title"><div><h2>Model comparison</h2><p>Compare predictions with solver output and physical sensor observations.</p></div><div className="filter-group"><label htmlFor="window-filter">Observations</label><select id="window-filter" value={windowFilter} onChange={(e) => setWindowFilter(e.target.value as WindowFilter)}><option value="all">Full run</option><option value="4">First 4 points</option><option value="2">First 2 points</option></select></div></div>
        <div className="chart-grid">
          <ChartPanel title="Actual vs predicted water depth" subtitle="Water depth over time · metres (m)" icon={Waves} className="wide-chart">
            {chartData.some((point) => point.predictedDepthM != null || point.observedDepthM != null) ? <ResponsiveContainer width="100%" height={250}><LineChart data={chartData} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4" /><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} unit=" m" /><Tooltip content={<TooltipBox />} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} /><Line type="monotone" dataKey="observedDepthM" name="Physical sensor" stroke="#122b4b" strokeWidth={2.5} dot={{ r: 3 }} connectNulls /><Line type="monotone" dataKey="predictedDepthM" name="AI prediction" stroke="#3488f5" strokeWidth={2.5} dot={false} connectNulls /><Line type="monotone" dataKey="numericalDepthM" name="Numerical solver" stroke="#8a69dc" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls /></LineChart></ResponsiveContainer> : <EmptyChart />}
          </ChartPanel>
          <ChartPanel title="AI vs numerical solver" subtitle="Absolute depth error over time · metres (m)" icon={BarChart3}>
            {chartData.some((point) => point.aiErrorM != null || point.solverErrorM != null) ? <ResponsiveContainer width="100%" height={250}><AreaChart data={chartData} margin={{ top: 16, right: 8, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4" /><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} unit=" m" /><Tooltip content={<TooltipBox />} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} /><Area type="monotone" dataKey="aiErrorM" name="AI absolute error" stroke="#3488f5" fill="#dcecff" strokeWidth={2} /><Area type="monotone" dataKey="solverErrorM" name="Solver absolute error" stroke="#8a69dc" fill="#eee8ff" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <EmptyChart />}
          </ChartPanel>
          <ChartPanel title="Rainfall vs water depth" subtitle="Rainfall intensity · mm/h and depth · m" icon={Activity}>
            {chartData.some((point) => point.rainfallMmH != null) ? <ResponsiveContainer width="100%" height={250}><ComposedChart data={chartData} margin={{ top: 16, right: 4, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4" /><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} /><YAxis yAxisId="depth" tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} unit=" m" /><YAxis yAxisId="rain" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} unit=" mm/h" /><Tooltip content={<TooltipBox />} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} /><Area yAxisId="rain" type="monotone" dataKey="rainfallMmH" name="Rainfall" fill="#d8f2e8" stroke="#35a982" /><Line yAxisId="depth" type="monotone" dataKey="observedDepthM" name="Physical sensor depth" stroke="#122b4b" strokeWidth={2.5} dot={false} /></ComposedChart></ResponsiveContainer> : <EmptyChart />}
          </ChartPanel>
          <ChartPanel title="Flood extent comparison" subtitle="Flooded area over time · square kilometres (km²)" icon={Layers3}>
            {chartData.some((point) => point.aiExtentKm2 != null || point.observedExtentKm2 != null) ? <ResponsiveContainer width="100%" height={250}><LineChart data={chartData} margin={{ top: 16, right: 8, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f4" /><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 11 }} unit=" km²" /><Tooltip content={<TooltipBox />} /><Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} /><Line type="monotone" dataKey="observedExtentKm2" name="Observed extent" stroke="#122b4b" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="aiExtentKm2" name="AI extent" stroke="#3488f5" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="solverExtentKm2" name="Solver extent" stroke="#8a69dc" strokeWidth={2} strokeDasharray="5 4" dot={false} /></LineChart></ResponsiveContainer> : <EmptyChart />}
          </ChartPanel>
        </div>
        <div className="speed-panel panel"><div className="speed-title"><div className="heading-icon"><Clock3 size={17} /></div><div><h2>Inference speed comparison</h2><p>Elapsed compute time per run · milliseconds (ms)</p></div></div><div className="speed-content"><ResponsiveContainer width="100%" height={132}><BarChart data={[{ method: 'AI model', time: metrics.inferenceTimeAiMs == null ? null : Number(metrics.inferenceTimeAiMs) }, { method: 'Numerical solver', time: metrics.inferenceTimeSolverMs == null ? null : Number(metrics.inferenceTimeSolverMs) }]} layout="vertical" margin={{ top: 0, right: 24, left: 12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf0f4" /><XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#8b95a5', fontSize: 9 }} unit=" ms" /><YAxis type="category" dataKey="method" width={112} tickLine={false} axisLine={false} tick={{ fill: '#738196', fontSize: 10 }} /><Tooltip content={<TooltipBox />} /><Bar dataKey="time" name="Inference time" unit=" ms" radius={[0, 4, 4, 0]} barSize={18}>{[{ color: '#4389ef' }, { color: '#8b70dd' }].map((entry) => <Cell key={entry.color} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer><div className="speed-callout">{metrics.inferenceTimeAiMs != null && metrics.inferenceTimeSolverMs != null && Number(metrics.inferenceTimeAiMs) < Number(metrics.inferenceTimeSolverMs) ? <><ArrowDownRight size={15} /> AI runtime is lower in this run</> : <><ArrowUpRight size={15} /> Compare runtime alongside accuracy metrics</>}</div></div><div className="speed-footnote"><Info size={14} />Speed measures elapsed compute time. It does not indicate prediction accuracy; compare MAE, RMSE and CSI separately.</div></div>

        <section className="panel history-panel" id="experiments"><div className="panel-heading history-heading"><div className="heading-icon"><FlaskConical size={17} /></div><div><h2>Experiment history</h2><p>Past validation runs and their reported evaluation metrics.</p></div><span className="history-count">{visibleExperiments.length} RUNS</span></div><div className="history-table-wrap"><table><thead><tr><th>EXPERIMENT</th><th>SCENARIO TYPE</th><th>DATA SOURCE</th><th>MAE · m</th><th>RMSE · m</th><th>CSI</th><th>STATUS</th><th /></tr></thead><tbody>{visibleExperiments.map((experiment) => <HistoryRow key={experiment.id} experiment={experiment} selected={experiment.id === selectedExperiment} onClick={() => setSelectedExperiment(experiment.id)} />)}</tbody></table>{visibleExperiments.length === 0 && <div className="table-empty">No experiments match this filter.</div>}</div><div className="history-caption"><span><i className="legend-dot sample" /> Sample records are illustrative</span><span><i className="legend-dot live" /> Backend records are returned by the experiments API</span></div></section>

        <section className="research-note"><div className="research-note-icon"><Info size={17} /></div><div><strong>Interpreting this validation</strong><p>Numerical solver outputs are computational references; physical sensor observations are measurements from instruments. They have different sources of uncertainty. Training scenarios support model fitting, while held-out test scenarios support evaluation. A miniature prototype demonstration does not directly validate city-scale forecast accuracy.</p></div></section>
        <footer className="page-footer"><span>CRESTIX PROBE <b>·</b> ANALYTICS</span><span>{dataset.source === 'backend' ? `API data${metrics.updatedAt ? ` · Updated ${new Date(metrics.updatedAt).toLocaleString()}` : ''}` : allMissing ? 'No validation data' : 'Illustrative preview'}</span></footer>
      </div>
    </main>
  </div>
}

function EmptyChart() { return <div className="empty-chart"><BarChart3 size={24} /><strong>No comparison series available</strong><span>When the backend supplies time-series data, it will appear here.</span></div> }
function HistoryRow({ experiment, selected, onClick }: { experiment: Experiment; selected: boolean; onClick: () => void }) {
  return <tr className={selected ? 'selected-row' : ''} onClick={onClick}><td><div className="experiment-name">{experiment.name}<small>{experiment.scenario || 'Scenario not specified'} · {experiment.createdAt ? new Date(experiment.createdAt).toLocaleDateString() : 'Date unavailable'}</small></div></td><td><span className={`type-pill ${experiment.scenarioType || 'unknown'}`}>{experiment.scenarioType || 'Unknown'}</span></td><td>{experiment.source || 'Backend'}</td><td>{format(experiment.mae, 3)}</td><td>{format(experiment.rmse, 3)}</td><td>{format(experiment.csi, 2)}</td><td><span className="run-status"><i />{experiment.status || 'Reported'}</span></td><td><button aria-label={`Select ${experiment.name}`} className="select-run">{selected ? <Check size={14} /> : 'View'}</button></td></tr>
}
