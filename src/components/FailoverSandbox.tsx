import React, { useState } from 'react';
import {
  ShieldAlert,
  Database,
  Key,
  Copy,
  Check,
  Eye,
  AlertOctagon,
  Lock,
  Terminal,
  Activity,
} from 'lucide-react';
import { DecoyResponse, ScanResponse } from '../types';

interface FailoverSandboxProps {
  decoyData: DecoyResponse;
  scanResult: ScanResponse;
}

export const FailoverSandbox: React.FC<FailoverSandboxProps> = ({ decoyData, scanResult }) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'response' | 'payload' | 'canary'>('response');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-rose-900/40 space-y-4 shadow-[0_0_25px_rgba(244,63,94,0.1)]">
      {/* Honeypot Containment Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 to-slate-950 border border-rose-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-400 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-900 text-rose-200 border border-rose-600/50">
                Seamless Failover Active
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {decoyData.containment_status}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Decoy Sandbox Deployed • Adversary Contained
            </h3>
            <p className="text-xs text-slate-300">
              Hostile prompt intercepted (Threat Score: <strong className="text-rose-400">{scanResult.risk_score}</strong>). Rather than returning a detectable 403 error, AegisAI deployed high-conviction synthetic honeytokens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-rose-900/60 text-xs font-mono text-rose-300">
            Decoy Type: <strong>{decoyData.decoy_type_deployed}</strong>
          </div>
        </div>
      </div>

      {/* Navigation tabs inside Sandbox */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('response')}
            className={`px-3 py-1 rounded-md font-mono transition-colors ${
              activeView === 'response'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Attacker-Facing Decoy Output
          </button>
          <button
            onClick={() => setActiveView('payload')}
            className={`px-3 py-1 rounded-md font-mono transition-colors ${
              activeView === 'payload'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Synthetic Payload Structure
          </button>
          <button
            onClick={() => setActiveView('canary')}
            className={`px-3 py-1 rounded-md font-mono transition-colors ${
              activeView === 'canary'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Planted Canary Tokens ({decoyData.canary_tokens_injected.length})
          </button>
        </div>

        <button
          onClick={() => copyToClipboard(decoyData.attacker_simulated_response)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 font-mono transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy Decoy'}
        </button>
      </div>

      {/* Content View */}
      {activeView === 'response' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto">
            {decoyData.attacker_simulated_response}
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>SOC Deception Strategy: <strong className="text-slate-200">{decoyData.notes_for_soc}</strong></span>
            <span className="text-cyan-400">Canary Tracking Online</span>
          </div>
        </div>
      )}

      {activeView === 'payload' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 max-h-[280px] overflow-y-auto">
          <pre>{JSON.stringify(decoyData.synthetic_payload, null, 2)}</pre>
        </div>
      )}

      {activeView === 'canary' && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="text-slate-400">
            The following canary tokens were dynamically generated and woven into the synthetic response:
          </div>
          <div className="space-y-2">
            {decoyData.canary_tokens_injected.map((token, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-900 border border-cyan-500/40 flex items-center justify-between text-cyan-300"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>{token}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                  TRACKED
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            If an adversary attempts to execute or authenticate with these tokens across external services, AegisAI triggers high-priority SOC alarms.
          </p>
        </div>
      )}
    </div>
  );
};
