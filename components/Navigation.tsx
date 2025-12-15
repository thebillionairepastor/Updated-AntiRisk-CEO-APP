
import React from 'react';
import { View } from '../types';
import { LayoutDashboard, ShieldAlert, Globe, BookOpen, FileText, Briefcase, Lightbulb, Settings } from 'lucide-react';

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
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.ADVISOR, label: 'AI Advisor', icon: ShieldAlert },
    { id: View.WEEKLY_TIPS, label: 'Weekly Training Tips', icon: Lightbulb },
    { id: View.BEST_PRACTICES, label: 'Global Best Practices', icon: Globe },
    { id: View.TRAINING, label: 'Training Builder', icon: BookOpen },
    { id: View.REPORT_ANALYZER, label: 'Report Analyzer', icon: FileText },
    { id: View.TOOLKIT, label: 'Ops Toolkit', icon: Briefcase },
  ];

  const baseClasses = "fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0";
  const mobileClasses = isMobileMenuOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <div className={`${baseClasses} ${mobileClasses}`}>
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20">
              <span className="font-bold text-white text-xl">AR</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">AntiRisk</h1>
              <p className="text-xs text-red-400 font-medium tracking-wider">MANAGEMENT</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
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
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    size={20} 
                    className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} transition-colors`} 
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                
                {/* Notification Badge for Best Practices */}
                {item.id === View.BEST_PRACTICES && bestPracticesBadge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    {bestPracticesBadge > 9 ? '9+' : bestPracticesBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <button 
            onClick={() => {
              onOpenSettings();
              closeMobileMenu();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings size={20} />
            <span className="font-medium text-sm">Alert Settings</span>
          </button>
          
          <div className="bg-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">System Status</h4>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-slate-300">AntiRisk AI Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
