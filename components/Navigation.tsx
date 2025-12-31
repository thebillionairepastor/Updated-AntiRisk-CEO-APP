
import React from 'react';
import { View } from '../types';
import { LayoutDashboard, ShieldAlert, Globe, BookOpen, FileText, Briefcase, Lightbulb, Settings, X } from 'lucide-react';

interface NavigationProps {
  currentView: View;
  setView: (view: View) => void;
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
  onOpenSettings: () => void;
  bestPracticesBadge?: number;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  setView, 
  isMobileMenuOpen, 
  closeMobileMenu, 
  onOpenSettings,
  bestPracticesBadge = 0
}) => {
  const navItems = [
    { id: View.DASHBOARD, label: 'Command Center', icon: LayoutDashboard },
    { id: View.ADVISOR, label: 'Executive Advisor', icon: ShieldAlert },
    { id: View.WEEKLY_TIPS, label: 'Training Briefs', icon: Lightbulb },
    { id: View.BEST_PRACTICES, label: 'Global Intelligence', icon: Globe },
    { id: View.TRAINING, label: 'Training Builder', icon: BookOpen },
    { id: View.REPORT_ANALYZER, label: 'Liability Hub', icon: FileText },
    { id: View.TOOLKIT, label: 'Ops Toolkit', icon: Briefcase },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeMobileMenu}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-slate-900 border-r border-slate-800 shadow-2xl
        transform transition-transform duration-500 ease-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center shadow-2xl shadow-red-900/40">
                <span className="font-black text-white text-2xl">AR</span>
              </div>
              <div>
                <h1 className="font-black text-xl text-white tracking-tighter">AntiRisk</h1>
                <p className="text-[10px] text-red-500 font-black tracking-[0.2em] uppercase">Security CEO</p>
              </div>
            </div>
            <button onClick={closeMobileMenu} className="lg:hidden text-slate-500 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    closeMobileMenu();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30 ring-1 ring-blue-500/50' 
                      : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Icon 
                      size={22} 
                      className={`${isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'} transition-colors`} 
                    />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </div>
                  
                  {item.id === View.BEST_PRACTICES && bestPracticesBadge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-800 space-y-4 bg-slate-900/40">
            <button 
              onClick={() => {
                onOpenSettings();
                closeMobileMenu();
              }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-bold text-sm"
            >
              <Settings size={22} />
              Alert Profiles
            </button>
            
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest">AI Core Online</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Encrypted V3.1 Stream Active</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;
