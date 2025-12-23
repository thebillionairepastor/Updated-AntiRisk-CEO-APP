
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const TaskItem = ({ checked, children }: { checked: boolean, children?: React.ReactNode }) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [isPressed, setIsPressed] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const handleToggle = () => {
    const newCheckedState = !isChecked;
    if (newCheckedState) {
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 800);
    }
    
    setIsPressed(true);
    setTimeout(() => {
      setIsChecked(newCheckedState);
      setIsPressed(false);
    }, 80);
  };

  return (
    <div 
      onClick={handleToggle}
      className={`
        flex items-start gap-4 my-2.5 group cursor-pointer select-none
        transition-all duration-300 ease-in-out
        ${isPressed ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}
      `}
    >
      <div className="relative mt-1">
        {/* Satisfying Radial Pulse */}
        {showPulse && (
          <div className="absolute inset-[-8px] bg-emerald-400/30 rounded-full animate-ping pointer-events-none" />
        )}
        
        <div className={`
          relative w-5 h-5 rounded-md border-2 flex items-center justify-center 
          transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
          ${isChecked 
            ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
            : 'bg-slate-800/80 border-slate-600 group-hover:border-blue-400'
          }
        `}>
           <Check 
             size={14} 
             className={`
               text-white font-black transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)
               ${isChecked ? 'scale-110 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-45'}
             `} 
             strokeWidth={4} 
           />
        </div>
      </div>
      <div className={`
        flex-1 text-sm leading-relaxed transition-all duration-500
        ${isChecked ? 'text-slate-500 line-through decoration-slate-700' : 'text-slate-300'}
      `}>
        {children}
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-xl font-bold text-blue-400 my-4 border-b border-slate-800 pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-blue-300 my-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-md font-semibold text-white my-2" {...props} />,
          ul: ({node, ...props}) => <ul className="my-2 space-y-1 list-none p-0" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-2 text-slate-300" {...props} />,
          
          li: ({node, children, ...props}) => {
            const childrenArray = React.Children.toArray(children);
            const firstChild = childrenArray[0];
            
            if (typeof firstChild === 'string') {
               const normalized = firstChild.trim();
               if (normalized.startsWith('[ ]') || normalized.startsWith('[x]')) {
                 const isChecked = normalized.startsWith('[x]');
                 const cleanText = normalized.slice(normalized.indexOf(']') + 1).trim();
                 return (
                   <TaskItem checked={isChecked}>
                     {cleanText}
                     {childrenArray.slice(1)}
                   </TaskItem>
                 );
               }
            }
            
            return <li className="text-slate-300 list-disc list-inside ml-4" {...props}>{children}</li>;
          },
          
          strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
          p: ({node, ...props}) => <p className="mb-3 text-slate-300 leading-relaxed" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-slate-400 bg-slate-800/40 py-3 pr-3 rounded-r-lg" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-4" {...props} />,
          code: ({node, ...props}) => <code className="bg-slate-800 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
