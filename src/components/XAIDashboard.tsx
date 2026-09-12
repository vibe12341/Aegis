import React, { useState } from 'react';
import {
  ShieldAlert,
  HelpCircle,
  Code,
  FileSearch,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ScanResponse, RuleMatch, RiskTier } from '../types';

interface XAIDashboardProps {
  scanResult: ScanResponse | null;
  rawPrompt: string;
}

export const XAIDashboard: React.FC<XAIDashboardProps> = ({ scanResult, rawPrompt }) => {
  const [selectedRule, setSelectedRule] = useState<RuleMatch | null>(
    scanResult?.matched_rules[0] || null
  );

  if (!scanResult) {
    return (
      <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <FileSearch className="w-8 h-8 text-slate-600 mx-auto" />
        <h3 className="text-sm font-bold text-slate-300">Awaiting Ingestion Scan</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Execute a prompt scan or choose a benchmark payload to inspect explainable AI heuristic signatures and OWASP threat vectors.
        </p>
      </div>
    );
  }

  const { matched_rules, flagged_keyphrases, risk_score, risk_tier, recommended_action, attack_categories } = scanResult;

  const renderHighlightedPrompt = () => {
    if (!flagged_keyphrases || flagged_keyphrases.length === 0) {
      return (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {rawPrompt}
        </div>
      );
    }

    // Build regex to match any flagged phrase safely
    try {
      const escaped = flagged_keyphrases
        .filter((p) => !p.startsWith('[Anomaly'))
        .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');

      if (!escaped) {
        return (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {rawPrompt}
          </div>
        );
      }

      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = rawPrompt.split(regex);

      return (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {parts.map((part, index) => {
            const isMatch = flagged_keyphrases.some(
              (p) => p.toLowerCase() === part.toLowerCase()
            );

            if (isMatch) {
              return (
                <mark
                  key={index}
                  className="bg-rose-500/30 text-rose-300 border border-rose-500/60 rounded px-1.5 py-0.5 font-bold shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse"
                >
                  {part}
                </mark>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>
      );
    } catch {
      return (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap">
          {rawPrompt}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              XAI Transparency Engine
            </span>
            <span className="text-xs font-mono text-slate-400">scanner.py • Rule Audit</span>
          </div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Explainable AI (XAI) Threat Attribution & Breakdown
          </h2>
          <p className="text-xs text-slate-400">
            Transparent attribution revealing why prompts trigger security boundaries, showing matched tokens, OWASP mappings, and rule confidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            Rules Fired: <strong className="text-cyan-400">{matched_rules.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            Risk: <strong className={risk_score >= 70 ? 'text-rose-400' : 'text-emerald-400'}>{risk_score}/100</strong>
          </div>
        </div>
      </div>

      {/* Split Screen View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Highlighted Prompt Inspector */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              Ingestion Token Attribution (Visual Markup)
            </span>
            <span className="text-[11px] font-mono text-rose-400">
              {flagged_keyphrases.length} flagged token substring(s)
            </span>
          </div>

          {renderHighlightedPrompt()}

          {/* Explainability Notes Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Defense Rationale & Decision Logic
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {risk_score >= 70 ? (
                <>
                  Because the normalized threat score (<strong className="text-rose-400">{risk_score}</strong>) exceeds the deception threshold, AegisAI recommends <strong className="text-cyan-300 font-mono">DECOY_SANDBOX</strong> over a hard 403 block. Deception keeps attackers engaged within synthetic environments, gathering adversary telemetry while protecting production data.
                </>
              ) : (
                <>
                  Prompt evaluated with threat score <strong className="text-emerald-400">{risk_score}</strong>. No critical system override or exfiltration vectors detected. The input is authorized for primary LLM processing.
                </>
              )}
            </p>
            {attack_categories.length > 0 && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                {attack_categories.map((cat, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 6 cols: Granular Rule Breakdown Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Triggered Heuristic Signatures ({matched_rules.length})
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Click rule to view technical definition
            </span>
          </div>

          {matched_rules.length > 0 ? (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {matched_rules.map((rule) => {
                const isSelected = selectedRule?.rule_id === rule.rule_id;
                return (
                  <div
                    key={rule.rule_id}
                    onClick={() => setSelectedRule(rule)}
                    className={`p-3.5 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{rule.rule_id}</span>
                        <span className="text-slate-400 text-[11px]">[{rule.category}]</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          rule.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : 'bg-orange-950 text-orange-300 border border-orange-800/60'
                        }`}
                      >
                        {rule.severity}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs font-sans mb-2">{rule.description}</p>

                    <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[240px]">
                        Matched: <strong className="text-rose-400">"{rule.matched_snippet}"</strong>
                      </span>
                      <span className="text-cyan-300">Conf: {Math.round(rule.confidence * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-200">No Heuristic Violations</h4>
              <p className="text-[11px] text-slate-400">
                All 7 OWASP detection signatures passed without firing. The input prompt is clean.
              </p>
            </div>
          )}

          {/* OWASP LLM Reference Mapping */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="font-bold text-slate-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              OWASP Top 10 for LLMs Standard:
            </div>
            <div>• LLM01: Prompt Injection (Direct & Indirect overrides)</div>
            <div>• LLM02: Insecure Output Handling (Exfiltration markdown tags)</div>
            <div>• LLM06: Sensitive Information Disclosure (System keys, PII)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
