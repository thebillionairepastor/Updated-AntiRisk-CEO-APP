
import React from 'react';
import { View } from '../types';
import { LayoutDashboard, ShieldAlert, Lightbulb, Globe, Menu } from 'lucide-react';

interface BottomNavigationProps {
  currentView: View;
  setView: (view: View) => void;
  onOpenMenu: () => void;
  bestPracticesBadge?: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentView,
  setView,
  onOpenMenu,
  bestPracticesBadge = 0
}) => {
  const items = [
    { id: View.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: View.ADVISOR, label: 'Advisor', icon: ShieldAlert },
    { id: View.WEEKLY_TIPS, label: 'Tips', icon: Lightbulb },
    { id: View.BEST_PRACTICES, label: 'Intel', icon: Globe },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/60 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-20 px-4">
        {items.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 gap-1.5 transition-all duration-300 active:scale-90 ${
                isActive ? 'text-blue-500' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 1.8} 
                  className={isActive ? 'drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]' : ''} 
                />
                {item.id === View.BEST_PRACTICES && bestPracticesBadge > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-slate-900 animate-pulse">
                    {bestPracticesBadge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 min-w-0 gap-1.5 text-slate-500 active:scale-90 transition-all duration-300"
        >
          <div className="relative">
            <Menu size={24} strokeWidth={1.8} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            Tools
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
