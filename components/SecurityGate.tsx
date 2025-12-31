
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Delete, Lock, Key, UserPlus, Fingerprint, ShieldAlert } from 'lucide-react';

interface SecurityGateProps {
  storedPin?: string;
  userName: string;
  onUnlock: (pin: string) => void;
  onRegister: (pin: string) => void;
}

type GateMode = 'REGISTER_START' | 'REGISTER_CONFIRM' | 'UNLOCK';

const SecurityGate: React.FC<SecurityGateProps> = ({ storedPin, userName, onUnlock, onRegister }) => {
  const [mode, setMode] = useState<GateMode>(storedPin ? 'UNLOCK' : 'REGISTER_START');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setError(null);
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (mode === 'UNLOCK') {
        if (pin === storedPin) {
          onUnlock(pin);
        } else {
          triggerError("ACCESS DENIED: INVALID KEY");
        }
      } else if (mode === 'REGISTER_START') {
        setConfirmPin(pin);
        setPin('');
        setMode('REGISTER_CONFIRM');
      } else if (mode === 'REGISTER_CONFIRM') {
        if (pin === confirmPin) {
          onRegister(pin);
        } else {
          triggerError("KEYS DO NOT MATCH");
          setPin('');
          setMode('REGISTER_START');
        }
      }
    }
  }, [pin, mode, storedPin, confirmPin, onUnlock, onRegister]);

  const triggerError = (msg: string) => {
    setShake(true);
    setError(msg);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 500);
  };

  const getTitle = () => {
    if (mode === 'UNLOCK') return "Identity Verification";
    if (mode === 'REGISTER_START') return "Register Security Key";
    return "Confirm Security Key";
  };

  const getSubtitle = () => {
    if (mode === 'UNLOCK') return `Welcome back, ${userName || 'Commander'}`;
    return "Create a 4-digit PIN to secure your advisory suite";
  };

  const dots = [0, 1, 2, 3];

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      {/* Dynamic Security Background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className={`w-full max-w-sm flex flex-col items-center transition-transform duration-500 ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-10 relative">
           <div className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center border-2 transition-all duration-500 ${
             error ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)]'
           }`}>
              {mode === 'UNLOCK' ? <Lock size={48} className={error ? 'text-red-500' : 'text-blue-500'} /> : <UserPlus size={48} className="text-blue-400" />}
           </div>
           {mode !== 'UNLOCK' && (
             <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2.5 shadow-lg ring-4 ring-slate-950">
               <Fingerprint size={18} className="text-white" />
             </div>
           )}
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2 text-center">{getTitle()}</h2>
        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em] mb-14 text-center max-w-[280px] leading-relaxed opacity-60">
          {getSubtitle()}
        </p>

        {/* PIN Indicators - Optimized for 4 slots */}
        <div className="flex gap-6 mb-16">
          {dots.map(i => (
            <div 
              key={i} 
              className={`w-5 h-5 rounded-full border-2 transition-all duration-300 transform ${
                pin.length > i 
                  ? (error ? 'bg-red-500 border-red-500 scale-125 shadow-[0_0_20px_rgba(239,68,68,0.7)]' : 'bg-blue-500 border-blue-500 scale-125 shadow-[0_0_20px_rgba(59,130,246,0.7)]') 
                  : 'bg-transparent border-slate-700 scale-100'
              }`}
            />
          ))}
        </div>

        {/* Keypad - Premium Banking Style */}
        <div className="grid grid-cols-3 gap-6 w-full px-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 text-2xl font-black text-white hover:bg-slate-800 hover:border-slate-700 active:scale-90 transition-all shadow-xl flex items-center justify-center ring-inset ring-white/5"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center opacity-30">
             <ShieldAlert size={22} className="text-slate-400" />
          </div>
          <button
            onClick={() => handleNumberClick('0')}
            className="h-16 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 text-2xl font-black text-white hover:bg-slate-800 hover:border-slate-700 active:scale-90 transition-all shadow-xl flex items-center justify-center ring-inset ring-white/5"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-3xl flex items-center justify-center text-slate-600 hover:text-red-400 active:scale-90 transition-all"
          >
            <Delete size={32} />
          </button>
        </div>

        {error && (
          <div className="mt-12 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-bounce">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
              {error}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default SecurityGate;
