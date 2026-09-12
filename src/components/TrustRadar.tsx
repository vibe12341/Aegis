import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { OutputGuardResponse } from '../types';

interface TrustRadarProps {
  guardData: OutputGuardResponse;
  title?: string;
}

export const TrustRadar: React.FC<TrustRadarProps> = ({
  guardData,
  title = 'Post-Generation Trust Radar & Ensemble Verification',
}) => {
  const { radar_scores, overall_trust_score, verdict, findings, execution_ms } = guardData;

  // Transform radar scores into Recharts data array
  const radarData = [
    {
      subject: 'Safety & OWASP',
      score: radar_scores.safety,
      fullMark: 100,
      description: 'Absence of toxic, hostile, or unauthorized instructions',
    },
    {
      subject: 'Factual Grounding',
      score: radar_scores.factual_confidence,
      fullMark: 100,
      description: 'Confidence in response accuracy and anti-hallucination',
    },
    {
      subject: 'Source Integrity',
      score: radar_scores.source_integrity,
      fullMark: 100,
      description: 'Preservation of source context and absence of indirect poisoning',
    },
    {
      subject: 'PII Protection',
      score: radar_scores.pii_protection,
      fullMark: 100,
      description: 'Prevention of leaked keys, SSNs, or sensitive records',
    },
    {
      subject: 'Model Alignment',
      score: radar_scores.alignment_score,
      fullMark: 100,
      description: 'Fidelity to corporate policy and system guardrails',
    },
  ];

  const getVerdictBadge = () => {
    switch (verdict) {
      case 'PASS':
        return {
          label: 'VERDICT: PASS',
          className: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
          icon: CheckCircle2,
        };
      case 'FLAGGED':
        return {
          label: 'VERDICT: FLAGGED',
          className: 'bg-amber-950 text-amber-300 border-amber-700/60',
          icon: AlertTriangle,
        };
      case 'REDACTED':
        return {
          label: 'VERDICT: REDACTED',
          className: 'bg-orange-950 text-orange-300 border-orange-700/60',
          icon: AlertTriangle,
        };
      default:
        return {
          label: 'VERDICT: BLOCKED',
          className: 'bg-rose-950 text-rose-300 border-rose-700/60',
          icon: ShieldAlert,
        };
    }
  };

  const verdictMeta = getVerdictBadge();
  const VerdictIcon = verdictMeta.icon;

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              POST /api/output-guard
            </span>
            <span className="text-xs font-mono text-slate-400">output_guard.py</span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {title}
          </h3>
          <p className="text-xs text-slate-400">
            Ensemble spider verification analyzing generated output for data leakage, markdown injection, and alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-mono font-bold ${verdictMeta.className}`}>
            <VerdictIcon className="w-3.5 h-3.5" />
            {verdictMeta.label}
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
            Latency: <strong className="text-slate-200">{execution_ms}ms</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart on Left, Metric Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar Spider Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950/80 rounded-xl p-3 border border-slate-800 relative">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
              Ensemble Security Pentagram
            </span>
            <span className="text-[11px] font-mono text-cyan-400">Normalized Index (0 - 100)</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  stroke="#334155"
                />
                <Radar
                  name="Trust Score"
                  dataKey="score"
                  stroke="#06b6d4"
                  fill="#0891b2"
                  fillOpacity={0.45}
                  dot={{ r: 3, fill: '#22d3ee', strokeWidth: 1, stroke: '#0e7490' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs font-mono">
                          <div className="font-bold text-cyan-300">{data.subject}</div>
                          <div className="text-white text-sm font-semibold mt-0.5">
                            Score: {data.score} / 100
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                            {data.description}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-[10px] font-mono text-slate-500 pb-1">
            Higher area represents greater trustworthiness and resistance to prompt leakage
          </div>
        </div>

        {/* Right 5 cols: Numerical Scores & Trust Index */}
        <div className="lg:col-span-5 space-y-3">
          {/* Overall Trust Index Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-slate-400">Composite Trust Index</span>
              <div className="text-3xl font-black font-mono mt-0.5 text-white flex items-baseline gap-1">
                {overall_trust_score}
                <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-400">Compliance State</span>
              <div className="text-xs font-bold font-mono mt-0.5 text-cyan-400">
                {overall_trust_score >= 80 ? 'HIGH ASSURANCE' : 'EVALUATION REJECTED'}
              </div>
            </div>
          </div>

          {/* Individual Axis Bars */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
              Multi-Axis Verification Breakdown
            </span>
            {radarData.map((item) => {
              const isLow = item.score < 60;
              const barColor = isLow ? 'bg-rose-500' : item.score < 80 ? 'bg-amber-400' : 'bg-cyan-400';
              return (
                <div key={item.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">{item.subject}</span>
                    <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                      {item.score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Findings & Redactions Box */}
      {findings.length > 0 ? (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-2">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Detected Guard Findings ({findings.length})
          </div>
          <div className="space-y-1.5">
            {findings.map((finding, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-900/40 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-rose-400 mr-2">[{finding.category}]</span>
                  <span className="text-slate-300">{finding.description}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/40 self-start sm:self-auto">
                  {finding.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-between text-xs font-mono">
          <span className="text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            No exfiltration pixels, credential leaks, or adversarial injections found in candidate output.
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">100% CLEANED</span>
        </div>
      )}
    </div>
  );
};
