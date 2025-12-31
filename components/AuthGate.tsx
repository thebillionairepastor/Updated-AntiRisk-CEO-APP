
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Delete, X, Lock, Key } from 'lucide-react';

interface AuthGateProps {
  correctPin: string;
  onUnlock: () => void;
  userName: string;
}

const AuthGate: React.FC<AuthGateProps> = ({ correctPin, onUnlock, userName }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setError(false);
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 6) {
      if (pin === correctPin) {
        onUnlock();
      } else {
        setShake(true);
        setError(true);
        setTimeout(() => {
          setShake(false);
          setPin('');
        }, 500);
      }
    }
  }, [pin, correctPin, onUnlock]);

  const dots = [0, 1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className={`w-full max-w-sm flex flex-col items-center transition-transform duration-500 ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-8 relative">
           <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <Lock size={32} className={error ? 'text-red-500' : 'text-blue-500'} />
           </div>
        </div>

        <h2 className="text-xl font-black text-white tracking-tight mb-1">Authenticated Access Only</h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10">Identity: {userName || 'Commander'}</p>

        {/* PIN Indicators */}
        <div className="flex gap-4 mb-12">
          {dots.map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i 
                  ? (error ? 'bg-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]') 
                  : 'bg-transparent border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-white hover:bg-slate-800 active:scale-90 transition-all shadow-lg flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <div className="flex items-center justify-center">
             <div className="w-2 h-2 rounded-full bg-slate-800" />
          </div>
          <button
            onClick={() => handleNumberClick('0')}
            className="h-16 rounded-2xl bg-slate-900 border border-slate-800 text-xl font-bold text-white hover:bg-slate-800 active:scale-90 transition-all shadow-lg flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          >
            <Delete size={24} />
          </button>
        </div>

        {error && (
          <p className="mt-8 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            Security Violation: Incorrect Access Key
          </p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default AuthGate;
