
import React, { useEffect, useState } from 'react';
import { Shield, Zap, Activity } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),   // Show Logo
      setTimeout(() => setStage(2), 1500),  // Show Text
      setTimeout(() => setStage(3), 2800),  // Start fade out
      setTimeout(() => onFinish(), 3500),   // Complete
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-700 ${stage === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Anti-Risk Logo (SVG Reproduction) */}
        <div className={`transition-all duration-1000 transform ${stage >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-10'}`}>
          <div className="relative w-48 h-48 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Main Triangle Body */}
              <path d="M100 10 L10 170 L190 170 Z" fill="#000000" />
              
              {/* Red Lower Section of Triangle */}
              <path d="M55 170 L10 170 L35 125 Z" fill="#CC0000" />
              <path d="M145 170 L190 170 L165 125 Z" fill="#CC0000" />
              
              {/* Center Circle */}
              <circle cx="100" cy="100" r="55" fill="white" stroke="black" strokeWidth="2" />
              
              {/* AR Text */}
              <text x="100" y="118" fontSize="65" fontWeight="bold" fontFamily="serif" textAnchor="middle" fill="black">AR</text>
              
              {/* Bottom Label Bar */}
              <rect x="10" y="170" width="180" height="25" fill="black" />
              <text x="100" y="188" fontSize="13" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fill="white" letterSpacing="0.5">ANTI-RISK SECURITY</text>
            </svg>
            
            {/* Scanning Effect */}
            {stage >= 1 && stage < 3 && (
              <div className="absolute inset-0 overflow-hidden rounded-full opacity-30">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 blur-sm animate-[scan_2s_infinite]" />
              </div>
            )}
          </div>
        </div>

        {/* Brand Text */}
        <div className={`mt-8 text-center transition-all duration-700 delay-300 transform ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h1 className="text-2xl font-black tracking-[0.3em] text-white uppercase mb-1">CEO Advisory</h1>
          <p className="text-[10px] text-blue-400 font-bold tracking-[0.4em] uppercase opacity-70">Security & Safety Services Provider</p>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-[-100px] w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-[3000ms] ease-out" 
            style={{ width: stage >= 3 ? '100%' : stage >= 1 ? '70%' : '10%' }}
          />
        </div>
      </div>

      {/* Loading States Label */}
      <div className={`absolute bottom-12 flex items-center gap-3 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-opacity duration-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <Activity size={14} className="animate-pulse" />
        {stage === 1 ? 'Initializing AI Core...' : stage === 2 ? 'Synchronizing Field Data...' : 'Welcome, Commander'}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
