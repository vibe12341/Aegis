/**
 * AegisAI - LLM Security Wrapper with Real-time Firestore Cloud Integration
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { Footer } from './components/Footer';
import { PhaseTracker } from './components/PhaseTracker';
import { SchemaViewer } from './components/SchemaViewer';
import { EngineTester } from './components/EngineTester';
import { TelemetryPanel } from './components/TelemetryPanel';
import { UnifiedWorkflow } from './components/UnifiedWorkflow';
import { Phase3ComponentsViewer } from './components/Phase3ComponentsViewer';
import { INITIAL_TELEMETRY } from './services/securityEngine';
import { TelemetryEvent, TelemetryResponse } from './types';
import {
  testFirestoreConnection,
  saveTelemetryEventToFirestore,
  subscribeToFirestoreTelemetry,
} from './lib/firebase';

const STORAGE_KEY = 'aegis_telemetry_audit_v1';
const LAST_RISK_SCORE_KEY = 'aegis_last_risk_score';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  const [telemetry, setTelemetry] = useState<TelemetryResponse>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TelemetryResponse;
        if (parsed && parsed.summary && Array.isArray(parsed.recent_events)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not rehydrate telemetry from localStorage, using initial dataset:', e);
    }
    return INITIAL_TELEMETRY;
  });

  const [lastRiskScore, setLastRiskScore] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(LAST_RISK_SCORE_KEY);
      if (stored !== null) {
        const parsed = Number(stored);
        if (!isNaN(parsed)) return parsed;
      }
      if (telemetry.recent_events && telemetry.recent_events.length > 0) {
        return telemetry.recent_events[0].risk_score;
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Validate Firestore Connection on initial boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Subscribe to real-time telemetry events from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToFirestoreTelemetry((cloudEvents) => {
      if (cloudEvents && cloudEvents.length > 0) {
        setTelemetry((prev) => {
          // Merge cloud events while deduplicating by event_id
          const existingIds = new Set(prev.recent_events.map((e) => e.event_id));
          const newEvents = cloudEvents.filter((e) => !existingIds.has(e.event_id));
          if (newEvents.length === 0) return prev;

          const merged = [...newEvents, ...prev.recent_events].slice(0, 50);
          return {
            ...prev,
            recent_events: merged,
          };
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(telemetry));
    } catch (e) {
      console.warn('Failed to save telemetry to localStorage:', e);
    }
  }, [telemetry]);

  useEffect(() => {
    try {
      if (lastRiskScore !== null) {
        localStorage.setItem(LAST_RISK_SCORE_KEY, lastRiskScore.toString());
      }
    } catch (e) {
      console.warn('Failed to save last risk score to localStorage:', e);
    }
  }, [lastRiskScore]);

  const handleAttackLogged = (event: TelemetryEvent) => {
    setLastRiskScore(event.risk_score);

    // Persist to Firestore asynchronously
    saveTelemetryEventToFirestore(event);

    setTelemetry((prev) => {
      const isAttack = event.risk_score >= 70;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          total_scans: prev.summary.total_scans + 1,
          attacks_prevented: isAttack ? prev.summary.attacks_prevented + 1 : prev.summary.attacks_prevented,
          decoys_deployed: event.decoy_deployed ? prev.summary.decoys_deployed + 1 : prev.summary.decoys_deployed,
          clean_prompts: !isAttack ? prev.summary.clean_prompts + 1 : prev.summary.clean_prompts,
          risk_tier_counts: {
            ...prev.summary.risk_tier_counts,
            [event.risk_tier]: (prev.summary.risk_tier_counts[event.risk_tier] || 0) + 1,
          },
        },
        recent_events: [event, ...prev.recent_events.slice(0, 49)],
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1a1a1e] flex flex-col justify-between selection:bg-[#06b6d4]/20 selection:text-[#1a1a1e]">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'overview' && (
          <PhaseTracker onProceedToTester={() => setActiveTab('workflow')} />
        )}

        {activeTab === 'workflow' && (
          <UnifiedWorkflow onLogTelemetryEvent={handleAttackLogged} />
        )}

        {activeTab === 'components' && (
          <Phase3ComponentsViewer telemetry={telemetry} />
        )}

        {activeTab === 'tester' && (
          <EngineTester onAttackLogged={handleAttackLogged} />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryPanel telemetry={telemetry} />
        )}

        {activeTab === 'schemas' && (
          <SchemaViewer />
        )}
      </main>

      <Footer
        attackCount={telemetry.summary.decoys_deployed}
        lastRiskScore={lastRiskScore}
      />
    </div>
  );
}
