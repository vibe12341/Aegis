import React, { useEffect, useState } from 'react';
import { auth, loginWithGoogle, logoutUser, onAuthStateChanged, User } from '../lib/firebase';
import { Shield, LogIn, LogOut, CheckCircle2, Database } from 'lucide-react';

export type NavTab = 'overview' | 'workflow' | 'components' | 'tester' | 'telemetry' | 'schemas';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="border-b-2 border-[#1a1a1e] px-4 sm:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center bg-white gap-3 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="font-syne text-2xl font-extrabold tracking-tight uppercase text-[#1a1a1e] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#1a1a1e]" />
          AEGIS<span className="text-[#06b6d4]">AI</span>
        </div>
        <div className="font-mono-tech text-[10px] tracking-widest uppercase px-2 py-0.5 border border-[#1a1a1e] bg-[#1a1a1e] text-white">
          OWASP LLM01 Shield
        </div>
        <div className="hidden lg:flex items-center gap-1.5 font-mono-tech text-[10px] uppercase px-2 py-0.5 border border-[#10b981] bg-[#f0fdf4] text-[#10b981]">
          <Database className="w-3 h-3" />
          <span>Firestore Cloud Sync</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap items-center gap-1">
          <button
            id="nav-tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`font-mono-tech text-xs uppercase px-3 py-1.5 border transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#1a1a1e] bg-[#1a1a1e]/8 font-bold text-[#1a1a1e]'
                : 'border-transparent text-[#1a1a1e]/70 hover:border-[#1a1a1e]/20 hover:text-[#1a1a1e]'
            }`}
          >
            Overview
          </button>
          <button
            id="nav-tab-workflow"
            onClick={() => setActiveTab('workflow')}
            className={`font-mono-tech text-xs uppercase px-3 py-1.5 border transition-all cursor-pointer ${
              activeTab === 'workflow'
                ? 'border-[#1a1a1e] bg-[#1a1a1e]/8 font-bold text-[#1a1a1e]'
                : 'border-transparent text-[#1a1a1e]/70 hover:border-[#1a1a1e]/20 hover:text-[#1a1a1e]'
            }`}
          >
            Pipeline
          </button>
          <button
            id="nav-tab-components"
            onClick={() => setActiveTab('components')}
            className={`font-mono-tech text-xs uppercase px-3 py-1.5 border transition-all cursor-pointer ${
              activeTab === 'components'
                ? 'border-[#1a1a1e] bg-[#1a1a1e]/8 font-bold text-[#1a1a1e]'
                : 'border-transparent text-[#1a1a1e]/70 hover:border-[#1a1a1e]/20 hover:text-[#1a1a1e]'
            }`}
          >
            Components
          </button>
          <button
            id="nav-tab-tester"
            onClick={() => setActiveTab('tester')}
            className={`font-mono-tech text-xs uppercase px-3 py-1.5 border transition-all cursor-pointer ${
              activeTab === 'tester'
                ? 'border-[#1a1a1e] bg-[#1a1a1e]/8 font-bold text-[#1a1a1e]'
                : 'border-transparent text-[#1a1a1e]/70 hover:border-[#1a1a1e]/20 hover:text-[#1a1a1e]'
            }`}
          >
            Engine
          </button>
          <button
            id="nav-tab-telemetry"
            onClick={() => setActiveTab('telemetry')}
            className={`font-mono-tech text-xs uppercase px-3 py-1.5 border transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-[#1a1a1e] bg-[#1a1a1e]/8 font-bold text-[#1a1a1e]'
                : 'border-transparent text-[#1a1a1e]/70 hover:border-[#1a1a1e]/20 hover:text-[#1a1a1e]'
            }`}
          >
            SOC
          </button>
          <button
            id="nav-tab-schemas"
            onClick={() => setActiveTab('schemas')}
            className={`font-mono-tech text-xs uppercase px-3 py-1.5 border transition-all cursor-pointer ${
              activeTab === 'schemas'
                ? 'border-[#1a1a1e] bg-[#1a1a1e]/8 font-bold text-[#1a1a1e]'
                : 'border-transparent text-[#1a1a1e]/70 hover:border-[#1a1a1e]/20 hover:text-[#1a1a1e]'
            }`}
          >
            Schemas
          </button>
        </nav>

        {/* Firebase Authentication CTA */}
        <div className="border-l border-[#1a1a1e]/20 pl-2 ml-1">
          {authLoading ? (
            <div className="font-mono-tech text-[10px] text-[#1a1a1e]/50 px-2 py-1">Auth Initializing...</div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 border border-[#1a1a1e]/20 bg-[#FAF8F5]">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" />
                <span className="font-mono-tech text-[10px] text-[#1a1a1e] font-semibold max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0] || 'Analyst'}
                </span>
              </div>
              <button
                onClick={logoutUser}
                title="Sign Out"
                className="p-1 border border-[#1a1a1e] hover:bg-[#1a1a1e] hover:text-white transition-colors cursor-pointer text-[#1a1a1e]"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a1e] text-white border border-[#1a1a1e] font-mono-tech text-[10px] uppercase font-bold tracking-wider hover:bg-transparent hover:text-[#1a1a1e] transition-colors cursor-pointer"
            >
              <LogIn className="w-3 h-3" />
              <span>Google Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
