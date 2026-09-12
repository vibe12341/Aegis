import React, { useState } from 'react';
import {
  UploadScanner,
  PRESET_PAYLOADS,
} from './UploadScanner';
import { FailoverSandbox } from './FailoverSandbox';
import { TrustRadar } from './TrustRadar';
import { XAIDashboard } from './XAIDashboard';
import {
  ScanResponse,
  DecoyResponse,
  OutputGuardResponse,
  TelemetryEvent,
} from '../types';
import {
  runClientDecoy,
  runClientOutputGuard,
} from '../services/securityEngine';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface UnifiedWorkflowProps {
  onLogTelemetryEvent: (event: TelemetryEvent) => void;
}

export const UnifiedWorkflow: React.FC<UnifiedWorkflowProps> = ({ onLogTelemetryEvent }) => {
  const [currentPrompt, setCurrentPrompt] = useState<string>(PRESET_PAYLOADS[1].text);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [decoyResult, setDecoyResult] = useState<DecoyResponse | null>(null);
  const [guardResult, setGuardResult] = useState<OutputGuardResponse | null>(null);
  const [llmOutput, setLlmOutput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'flow' | 'xai' | 'radar'>('flow');

  const handleScanComplete = (response: ScanResponse, promptText: string) => {
    setCurrentPrompt(promptText);
    setScanResult(response);

    // Decision Branch: Seamless Failover Logic (Phase 4)
    if (response.is_hostile) {
      // Branch A: Seamless Failover to Decoy Sandbox
      const decoy = runClientDecoy(promptText);
      setDecoyResult(decoy);
      setGuardResult(null);
      setLlmOutput(decoy.attacker_simulated_response);

      // Append hostile event to SOC Telemetry
      const event: TelemetryEvent = {
        event_id: `ev-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        client_ip: '198.51.100.12',
        prompt_snippet: promptText.length > 85 ? promptText.substring(0, 85) + '...' : promptText,
        risk_score: response.risk_score,
        risk_tier: response.risk_tier,
        action_taken: 'DECOY_SANDBOX',
        triggered_rules: response.matched_rules.map((r) => r.rule_id),
        attack_category: response.attack_categories[0] || 'Prompt Injection (OWASP LLM01)',
        decoy_deployed: true,
        scan_latency_ms: response.scan_latency_ms,
      };
      onLogTelemetryEvent(event);
    } else {
      // Branch B: Clean / Permitted Flow through Primary LLM and Output Guard
      setDecoyResult(null);
      const generatedResponse = `Analysis of Q3 Corporate Data:\n\n1. Enterprise Revenue Growth: Operating margins expanded by +14.2% quarter-over-quarter.\n2. Regional Performance: North America led pipeline velocity, driven by enterprise cloud adoption.\n3. Governance & Controls: All controller-audited checkpoints were met with zero compliance flags.\n\nPrepared for board presentation as requested.`;
      setLlmOutput(generatedResponse);

      const guard = runClientOutputGuard(promptText, generatedResponse);
      setGuardResult(guard);

      // Append clean event to SOC Telemetry
      const event: TelemetryEvent = {
        event_id: `ev-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        client_ip: '192.168.1.105',
        prompt_snippet: promptText.length > 85 ? promptText.substring(0, 85) + '...' : promptText,
        risk_score: response.risk_score,
        risk_tier: response.risk_tier,
        action_taken: 'ALLOW',
        triggered_rules: [],
        attack_category: null,
        decoy_deployed: false,
        scan_latency_ms: response.scan_latency_ms,
      };
      onLogTelemetryEvent(event);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Architecture Status Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Phase 4: Integrated Pipeline
            </span>
            <span className="text-xs font-mono text-slate-400">
              Real-time Ingestion • Failover Routing • Output Verification
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Failover Gateway Armed
          </span>
        </div>

        {/* Pipeline Stepper / Flowchart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-950 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              1
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-200">Ingestion</div>
              <div className="text-[10px] text-slate-400">File & Prompt Parse</div>
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
            scanResult ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <div className="w-6 h-6 rounded-md bg-cyan-950 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
              2
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-200">Heuristic Scan</div>
              <div className="text-[10px] text-slate-400">OWASP Signatures</div>
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border flex items-center gap-2 ${
            scanResult?.is_hostile
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              : scanResult
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <div className="w-6 h-6 rounded-md bg-slate-900 text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
              3
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-200">Failover Router</div>
              <div className="text-[10px] text-slate-400">
                {scanResult?.is_hostile ? 'Decoy Sandbox' : scanResult ? 'Safe LLM Pass' : 'Decision Gate'}
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-slate-300 flex items-center justify-center text-xs font-bold font-mono">
              4
            </div>
            <div className="text-xs">
              <div className="font-bold text-slate-200">SOC Sync</div>
              <div className="text-[10px] text-slate-400">SQLite Telemetry Log</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Ingestion Scanner (Phase 3 Component 1) */}
      <UploadScanner onScanComplete={handleScanComplete} />

      {/* Execution Results Section */}
      {scanResult && (
        <div className="space-y-4 pt-2">
          {/* Sub-tab view selector */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                  activeTab === 'flow'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {scanResult.is_hostile ? '1. Decoy Sandbox Failover' : '1. Safe Output & Verification'}
              </button>
              <button
                onClick={() => setActiveTab('xai')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                  activeTab === 'xai'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Explainable AI (XAI) Attribution
              </button>
              {guardResult && (
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                    activeTab === 'radar'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3. Trust Radar Analysis
                </button>
              )}
            </div>

            <span className="text-xs font-mono text-slate-400">
              Action: <strong className={scanResult.is_hostile ? 'text-rose-400' : 'text-emerald-400'}>{scanResult.recommended_action}</strong>
            </span>
          </div>

          {/* Tab 1: Flow Execution (Decoy or Clean Output) */}
          {activeTab === 'flow' && (
            <div>
              {scanResult.is_hostile && decoyResult ? (
                <FailoverSandbox decoyData={decoyResult} scanResult={scanResult} />
              ) : guardResult ? (
                <div className="space-y-4">
                  {/* Clean Response Display */}
                  <div className="p-5 rounded-xl bg-slate-900 border border-emerald-900/40 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Primary LLM Output Verified & Allowed
                      </span>
                      <span className="text-slate-400">Model: gpt-4o-mini (Grounding Active)</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {llmOutput}
                    </div>
                  </div>

                  {/* Trust Radar Component (Phase 3 Component 2) */}
                  <TrustRadar guardData={guardResult} />
                </div>
              ) : null}
            </div>
          )}

          {/* Tab 2: Explainable AI Dashboard (Phase 3 Component 3) */}
          {activeTab === 'xai' && (
            <XAIDashboard scanResult={scanResult} rawPrompt={currentPrompt} />
          )}

          {/* Tab 3: Trust Radar (if clean) */}
          {activeTab === 'radar' && guardResult && (
            <TrustRadar guardData={guardResult} />
          )}
        </div>
      )}
    </div>
  );
};
