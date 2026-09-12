import React, { useState } from 'react';
import { UploadScanner, PRESET_PAYLOADS } from './UploadScanner';
import { TrustRadar } from './TrustRadar';
import { XAIDashboard } from './XAIDashboard';
import { TelemetryPanel } from './TelemetryPanel';
import { ScanResponse, OutputGuardResponse, TelemetryResponse } from '../types';
import { runClientScan, runClientOutputGuard } from '../services/securityEngine';
import { LayoutDashboard, Radio, Cpu, ShieldCheck, Activity } from 'lucide-react';

interface Phase3ComponentsViewerProps {
  telemetry: TelemetryResponse;
}

export const Phase3ComponentsViewer: React.FC<Phase3ComponentsViewerProps> = ({ telemetry }) => {
  const [activeComponent, setActiveComponent] = useState<'upload' | 'radar' | 'xai' | 'telemetry'>('upload');
  const [currentPrompt, setCurrentPrompt] = useState<string>(PRESET_PAYLOADS[1].text);
  const [scanResult, setScanResult] = useState<ScanResponse>(() => runClientScan(PRESET_PAYLOADS[1].text));

  const dummyCleanOutput = `Analysis of Q3 Performance Data:\n\n1. Gross revenue rose 14.2% across North America.\n2. Cloud subscription renewals achieved a record 98.4% retention.\n3. All data points conform to audited enterprise compliance standards.`;
  const [guardResult, setGuardResult] = useState<OutputGuardResponse>(() =>
    runClientOutputGuard(PRESET_PAYLOADS[0].text, dummyCleanOutput)
  );

  const handleScanComplete = (response: ScanResponse, promptText: string) => {
    setScanResult(response);
    setCurrentPrompt(promptText);
  };

  return (
    <div className="space-y-6">
      {/* Component Navigation Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              V-Workflow Phase 3
            </span>
            <span className="text-xs font-mono text-slate-400">Modular Frontend Components</span>
          </div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Component Sandbox & Direct Verification
          </h2>
          <p className="text-xs text-slate-400">
            Directly interact with and test each of the four Phase 3 frontend components in isolation.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            id="tab-comp-upload"
            onClick={() => setActiveComponent('upload')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeComponent === 'upload'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. UploadScanner
          </button>
          <button
            id="tab-comp-radar"
            onClick={() => setActiveComponent('radar')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeComponent === 'radar'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. TrustRadar
          </button>
          <button
            id="tab-comp-xai"
            onClick={() => setActiveComponent('xai')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeComponent === 'xai'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. XAIDashboard
          </button>
          <button
            id="tab-comp-telemetry"
            onClick={() => setActiveComponent('telemetry')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium font-mono transition-all ${
              activeComponent === 'telemetry'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4. TelemetryPanel
          </button>
        </div>
      </div>

      {/* Render selected component */}
      {activeComponent === 'upload' && (
        <div className="space-y-4">
          <UploadScanner onScanComplete={handleScanComplete} />
        </div>
      )}

      {activeComponent === 'radar' && (
        <div className="space-y-4">
          <TrustRadar guardData={guardResult} />
        </div>
      )}

      {activeComponent === 'xai' && (
        <div className="space-y-4">
          <XAIDashboard scanResult={scanResult} rawPrompt={currentPrompt} />
        </div>
      )}

      {activeComponent === 'telemetry' && (
        <div className="space-y-4">
          <TelemetryPanel telemetry={telemetry} />
        </div>
      )}
    </div>
  );
};
