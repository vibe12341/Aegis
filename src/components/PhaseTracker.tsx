import React from 'react';

interface PhaseTrackerProps {
  onProceedToTester: () => void;
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({ onProceedToTester }) => {
  return (
    <div className="border-2 border-[#1a1a1e] bg-white shadow-[4px_4px_0px_#1a1a1e]">
      {/* Hero Section */}
      <section className="p-6 sm:p-10 lg:p-12 border-b border-[#1a1a1e]/15 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 lg:gap-12 bg-white">
        <div>
          <div className="font-mono-tech text-xs uppercase tracking-widest text-[#10b981] mb-3 font-semibold">
            [ Status: Operational ]
          </div>
          <h1 className="font-syne text-4xl sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[0.92] text-[#1a1a1e] mb-4">
            Architectural Security Framework
          </h1>
          <p className="text-base text-[#1a1a1e]/60 max-w-[600px] leading-relaxed">
            FastAPI backend structure, Pydantic schemas, heuristic rules engine, decoy sandbox honeypots, Trust Radar, and seamless failover pipeline are operational.
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <button
            onClick={onProceedToTester}
            className="bg-[#1a1a1e] text-white p-5 font-syne font-extrabold text-base uppercase tracking-wider cursor-pointer flex justify-between items-center hover:bg-[#06b6d4] hover:text-[#1a1a1e] transition-colors border-2 border-[#1a1a1e]"
          >
            <span>Launch Pipeline</span>
            <span className="text-xl">→</span>
          </button>
          <div className="font-mono-tech text-[10px] text-[#1a1a1e]/50 mt-3 text-center uppercase tracking-widest">
            v.3.4.0 Production Ready
          </div>
        </div>
      </section>

      {/* Grid Container (5 Phases from Variation 5 HTML) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#1a1a1e]/15">
        {/* Phase 1 */}
        <div className="p-6 flex flex-col justify-between space-y-4 hover:bg-[#f8f7f4] transition-colors">
          <div className="space-y-3">
            <span className="font-mono-tech text-[10px] text-[#1a1a1e]/60 uppercase tracking-widest block font-semibold">
              Phase 01 / Specification
            </span>
            <h3 className="font-bold text-sm text-[#1a1a1e] leading-snug">
              Understand & Schema Specification
            </h3>
            <ul className="space-y-1.5 text-xs text-[#1a1a1e]/60">
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                schema.py defined with Pydantic v2
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                POST /api/scan-upload contract
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                POST /api/decoy-sandbox contract
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                POST /api/output-guard contract
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                GET /api/telemetry contract
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-dashed border-[#1a1a1e]/15 font-mono-tech text-[10px] text-[#06b6d4] font-semibold">
            schema.py, database.py
          </div>
        </div>

        {/* Phase 2 */}
        <div className="p-6 flex flex-col justify-between space-y-4 hover:bg-[#f8f7f4] transition-colors">
          <div className="space-y-3">
            <span className="font-mono-tech text-[10px] text-[#1a1a1e]/60 uppercase tracking-widest block font-semibold">
              Phase 02 / Core Build
            </span>
            <h3 className="font-bold text-sm text-[#1a1a1e] leading-snug">
              Backend Build & Heuristic Engine
            </h3>
            <ul className="space-y-1.5 text-xs text-[#1a1a1e]/60">
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                main.py created with modular endpoints
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Pre-Ingestion Scanner (scanner.py)
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Decoy Generator (decoy_generator.py)
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Ensemble Guard (output_guard.py)
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                SQLite Telemetry Logger (database.py)
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-dashed border-[#1a1a1e]/15 font-mono-tech text-[10px] text-[#06b6d4] font-semibold">
            main.py, scanner.py
          </div>
        </div>

        {/* Phase 3 */}
        <div className="p-6 flex flex-col justify-between space-y-4 hover:bg-[#f8f7f4] transition-colors">
          <div className="space-y-3">
            <span className="font-mono-tech text-[10px] text-[#1a1a1e]/60 uppercase tracking-widest block font-semibold">
              Phase 03 / Interface
            </span>
            <h3 className="font-bold text-sm text-[#1a1a1e] leading-snug">
              Frontend Components (React)
            </h3>
            <ul className="space-y-1.5 text-xs text-[#1a1a1e]/60">
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                UploadScanner.tsx: Drag-and-drop
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                TrustRadar.tsx: Spider chart
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                XAIDashboard.tsx: Split-screen view
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                TelemetryPanel.tsx: SOC live log
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-dashed border-[#1a1a1e]/15 font-mono-tech text-[10px] text-[#06b6d4] font-semibold">
            UploadScanner.tsx, TrustRadar.tsx
          </div>
        </div>

        {/* Phase 4 */}
        <div className="p-6 flex flex-col justify-between space-y-4 hover:bg-[#f8f7f4] transition-colors">
          <div className="space-y-3">
            <span className="font-mono-tech text-[10px] text-[#1a1a1e]/60 uppercase tracking-widest block font-semibold">
              Phase 04 / Flow
            </span>
            <h3 className="font-bold text-sm text-[#1a1a1e] leading-snug">
              Integration & Failover
            </h3>
            <ul className="space-y-1.5 text-xs text-[#1a1a1e]/60">
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Unified pipeline architecture linking
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Seamless failover: hostile auto-decoy
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Clean flow: passes to Primary LLM
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-dashed border-[#1a1a1e]/15 font-mono-tech text-[10px] text-[#06b6d4] font-semibold">
            UnifiedWorkflow.tsx
          </div>
        </div>

        {/* Phase 5 */}
        <div className="p-6 flex flex-col justify-between space-y-4 hover:bg-[#f8f7f4] transition-colors">
          <div className="space-y-3">
            <span className="font-mono-tech text-[10px] text-[#1a1a1e]/60 uppercase tracking-widest block font-semibold">
              Phase 05 / Delivery
            </span>
            <h3 className="font-bold text-sm text-[#1a1a1e] leading-snug">
              Polish & Demo Mode
            </h3>
            <ul className="space-y-1.5 text-xs text-[#1a1a1e]/60">
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                SOC dark-mode aesthetic branding
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Pre-loaded 4 hackathon payloads
              </li>
              <li className="pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-[#06b6d4] before:font-bold">
                Automated SQLite telemetry log sync
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-dashed border-[#1a1a1e]/15 font-mono-tech text-[10px] text-[#06b6d4] font-semibold">
            aegis_telemetry.db
          </div>
        </div>
      </div>
    </div>
  );
};
