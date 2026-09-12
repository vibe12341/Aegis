import React from 'react';
import { Database, ShieldAlert, Cpu, CheckCircle, Clock } from 'lucide-react';
import { TelemetryEvent, TelemetryResponse } from '../types';

interface TelemetryViewerProps {
  telemetry: TelemetryResponse;
}

export const TelemetryViewer: React.FC<TelemetryViewerProps> = ({ telemetry }) => {
  const { summary, recent_events } = telemetry;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              Phase 2 Telemetry & Database
            </span>
            <span className="text-xs font-mono text-slate-400">SQLite persistence • database.py</span>
          </div>
          <h2 className="text-lg font-bold text-white">Structured Telemetry Logs & SOC Feed</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Every pre-ingestion scan, triggered rule, risk tier, and decoy deployment is appended to the local SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            Database: <span className="text-emerald-400 font-semibold">aegis_telemetry.db</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono">Total Ingestion Scans</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{summary.total_scans}</div>
          <div className="text-[11px] text-slate-500 mt-1">Processed across sessions</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/30">
          <div className="flex items-center justify-between text-rose-300 mb-1">
            <span className="text-xs font-mono">Attacks Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{summary.attacks_prevented}</div>
          <div className="text-[11px] text-slate-500 mt-1">OWASP LLM01 / Injection</div>
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
          <div className="text-2xl font-black font-mono text-emerald-400">{summary.avg_latency_ms} <span className="text-xs">ms</span></div>
          <div className="text-[11px] text-slate-500 mt-1">Sub-millisecond overhead</div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Tier Distribution (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Threat Severity Tier Distribution
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
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Top Attack Vectors
            </h4>
            <div className="space-y-1.5">
              {summary.top_attack_vectors.map((vec) => (
                <div key={vec.vector} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                  <span className="text-slate-300 truncate max-w-[180px]">{vec.vector}</span>
                  <span className="text-cyan-400 font-bold">{vec.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Event Log Feed (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Recent Ingestion Audit Trail ({recent_events.length} records)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync Active
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {recent_events.map((event: TelemetryEvent) => {
              const isCrit = event.risk_tier === 'CRITICAL' || event.risk_tier === 'HIGH';
              return (
                <div
                  key={event.event_id}
                  className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                    isCrit ? 'bg-slate-950 border-rose-900/40 hover:border-rose-700/60' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      <span className="text-slate-400 font-semibold">{event.client_ip}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isCrit ? 'bg-rose-950 text-rose-300 border border-rose-800/40' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {event.risk_tier} ({event.risk_score})
                      </span>
                      <span className="text-cyan-400 text-[10px]">{event.action_taken}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs truncate mt-1">
                    "{event.prompt_snippet}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      {event.triggered_rules.length > 0 ? (
                        <span>Rules: <strong className="text-amber-400">{event.triggered_rules.join(', ')}</strong></span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> No violations</span>
                      )}
                    </div>
                    <span>Latency: {event.scan_latency_ms}ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
