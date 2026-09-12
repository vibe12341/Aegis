import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Database,
  ShieldAlert,
  Cpu,
  Clock,
  CheckCircle,
  Download,
  Search,
  Activity,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { TelemetryResponse, TelemetryEvent } from '../types';

interface TelemetryPanelProps {
  telemetry: TelemetryResponse;
  onRefresh?: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry, onRefresh }) => {
  const { summary, recent_events, timeline, soc_status } = telemetry;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');

  // Filter recent events
  const filteredEvents = recent_events.filter((event) => {
    const matchesSearch =
      event.prompt_snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.client_ip.includes(searchTerm) ||
      event.triggered_rules.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = filterTier === 'ALL' || event.risk_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(telemetry, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aegis_telemetry_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              GET /api/telemetry
            </span>
            <span className="text-xs font-mono text-slate-400">database.py • SQLite Ingestion</span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            SOC Telemetry & Security Event Stream
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of all pre-ingestion scans, honeypot decoy engagements, and risk classifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportJSON}
            id="btn-export-telemetry"
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Audit JSON
          </button>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Status: <strong className="text-emerald-400">{soc_status}</strong>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono">Total Ingestion Scans</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{summary.total_scans}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total requests verified</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/30">
          <div className="flex items-center justify-between text-rose-300 mb-1">
            <span className="text-xs font-mono">Attacks Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{summary.attacks_prevented}</div>
          <div className="text-[11px] text-slate-500 mt-1">OWASP LLM01 Injections</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-900/30">
          <div className="flex items-center justify-between text-cyan-300 mb-1">
            <span className="text-xs font-mono">Decoys Deployed</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400">{summary.decoys_deployed}</div>
          <div className="text-[11px] text-slate-500 mt-1">Honeypots with canaries</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/30">
          <div className="flex items-center justify-between text-emerald-300 mb-1">
            <span className="text-xs font-mono">Mean Scan Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {summary.avg_latency_ms} <span className="text-xs">ms</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sub-millisecond overhead</div>
        </div>
      </div>

      {/* Ingestion Activity Timeline Chart */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Ingestion Activity Stream (Safe vs Adversarial Attacks)
            </h3>
            <p className="text-[11px] text-slate-400">Time-series breakdown across active telemetry window</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
              Safe Requests
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400"></span>
              Flagged Attacks
            </div>
          </div>
        </div>

        <div className="h-[200px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAttack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time_label" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono space-y-1">
                        <div className="font-bold text-slate-200">{label}</div>
                        <div className="text-emerald-400">Safe: {payload[0]?.value}</div>
                        <div className="text-rose-400">Attacks: {payload[1]?.value}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="safe_requests" stroke="#10b981" fillOpacity={1} fill="url(#colorSafe)" />
              <Area type="monotone" dataKey="flagged_attacks" stroke="#f43f5e" fillOpacity={1} fill="url(#colorAttack)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Threat Distribution (4 Cols) & Audit Feed (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Tier & Attack Vectors */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Threat Severity Distribution
            </h3>
            <div className="space-y-2">
              {Object.entries(summary.risk_tier_counts).map(([tier, rawCount]) => {
                const count = Number(rawCount) || 0;
                const total = summary.total_scans || 1;
                const pct = Math.round((count / total) * 100);
                let color = 'bg-emerald-400';
                if (tier === 'CRITICAL') color = 'bg-rose-500';
                else if (tier === 'HIGH') color = 'bg-orange-500';
                else if (tier === 'MEDIUM') color = 'bg-amber-500';
                else if (tier === 'LOW') color = 'bg-blue-400';

                return (
                  <div key={tier} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300">{tier}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Top Attack Vectors
            </h4>
            <div className="space-y-1.5">
              {summary.top_attack_vectors.map((vec) => (
                <div
                  key={vec.vector}
                  className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center justify-between"
                >
                  <span className="text-slate-300 truncate max-w-[180px]">{vec.vector}</span>
                  <span className="text-cyan-400 font-bold">{vec.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Filterable Audit Feed */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Ingestion Audit Feed ({filteredEvents.length} records)
            </h3>

            {/* Filter controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by IP, rule, or text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/70"
                />
              </div>

              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Tiers</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="SAFE">Safe</option>
              </select>
            </div>
          </div>

          {/* Event items */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredEvents.map((event: TelemetryEvent) => {
              const isCrit = event.risk_tier === 'CRITICAL' || event.risk_tier === 'HIGH';
              return (
                <div
                  key={event.event_id}
                  className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                    isCrit
                      ? 'bg-slate-950 border-rose-900/40 hover:border-rose-700/60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-slate-400 font-semibold">{event.client_ip}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isCrit
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                        }`}
                      >
                        {event.risk_tier} ({event.risk_score})
                      </span>
                      <span className="text-cyan-400 text-[10px] font-semibold">{event.action_taken}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs truncate mt-1">"{event.prompt_snippet}"</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      {event.triggered_rules.length > 0 ? (
                        <span>
                          Rules: <strong className="text-amber-400">{event.triggered_rules.join(', ')}</strong>
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" /> No violations
                        </span>
                      )}
                    </div>
                    <span>Latency: {event.scan_latency_ms}ms</span>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-500 font-mono">
                No telemetry events match your search criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
