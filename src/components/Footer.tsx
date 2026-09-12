import React from 'react';

interface FooterProps {
  attackCount: number;
  lastRiskScore?: number | null;
}

export const Footer: React.FC<FooterProps> = ({ attackCount, lastRiskScore }) => {
  const isElevated = lastRiskScore && lastRiskScore >= 70;
  const alertColor = isElevated
    ? 'rgba(239, 68, 68, 0.1)'
    : 'rgba(26, 26, 30, 0.08)';
  const textColor = isElevated ? '#ef4444' : '#1a1a1e';
  const alertLabel = isElevated ? `Alert Level: Critical (${lastRiskScore})` : 'Alert Level: Nominal';

  return (
    <footer className="border-t-2 border-[#1a1a1e] px-4 sm:px-8 py-3 flex flex-col sm:flex-row justify-between items-center bg-white text-xs gap-3">
      <div className="flex items-center gap-2 font-mono-tech text-xs px-3 py-1 rounded-full bg-[#1a1a1e]/8 text-[#1a1a1e]">
        <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
        SOC: ARMED & ACTIVE
      </div>
      <div className="font-mono-tech text-[11px] text-[#1a1a1e]/50 text-center">
        LLM Security Wrapper • Phase 3 & 4 Active • Decoys: {attackCount}
      </div>
      <div
        className="font-mono-tech text-xs px-3 py-1 rounded-full"
        style={{ background: alertColor, color: textColor }}
      >
        {alertLabel}
      </div>
    </footer>
  );
};
