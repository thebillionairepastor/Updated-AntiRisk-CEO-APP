
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
    { id: View.BEST_PRACTICES, label: 'Knowledge', icon: Globe },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-around h-20 px-2">
        {items.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 gap-1.5 transition-all duration-200 active:scale-90 ${
                isActive ? 'text-blue-500' : 'text-slate-400'
              }`}
            >
              <div className="relative p-1">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''} />
                {item.id === View.BEST_PRACTICES && bestPracticesBadge > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-slate-900 animate-pulse">
                    {bestPracticesBadge > 9 ? '9+' : bestPracticesBadge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-bold truncate w-full text-center tracking-tight ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 min-w-0 gap-1.5 text-slate-400 active:scale-90 transition-all duration-200"
        >
          <div className="p-1">
            <Menu size={22} />
          </div>
          <span className="text-[11px] font-bold text-slate-500 tracking-tight">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
