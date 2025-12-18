import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom animated checkbox component for task lists
const TaskItem = ({ checked, children }: { checked: boolean, children?: React.ReactNode }) => {
  const [isChecked, setIsChecked] = useState(checked);
  const [isPressed, setIsPressed] = useState(false);

  const handleToggle = () => {
    setIsPressed(true);
    // Short delay for the "press" effect before toggling
    setTimeout(() => {
      setIsChecked(!isChecked);
      setIsPressed(false);
    }, 150);
  };

  return (
    <div 
      onClick={handleToggle}
      className={`
        flex items-start gap-3 my-2 group cursor-pointer select-none
        transition-all duration-200 ease-out
        ${isPressed ? 'scale-[0.98] opacity-90' : 'scale-100 opacity-100'}
      `}
    >
      <div className={`
        relative mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center 
        transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${isChecked 
          ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
          : 'bg-slate-800/50 border-slate-600 group-hover:border-blue-400'
        }
      `}>
         <Check 
           size={14} 
           className={`
             text-white font-bold transition-all duration-300 ease-out
             ${isChecked ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'}
           `} 
           strokeWidth={4} 
         />
      </div>
      <div className={`
        flex-1 text-sm leading-relaxed transition-all duration-300
        ${isChecked ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-300'}
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
          h1: ({node, ...props}) => <h1 className="text-xl font-bold text-blue-400 my-3" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-blue-300 my-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-md font-semibold text-white my-2" {...props} />,
          ul: ({node, ...props}) => <ul className="my-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1 text-slate-300" {...props} />,
          
          // Custom List Item to detect Task Lists
          li: ({node, children, ...props}) => {
            // Helper to get text content to check for [ ]
            const childrenArray = React.Children.toArray(children);
            const firstChild = childrenArray[0];
            
            if (typeof firstChild === 'string') {
               // Check for [ ] or [x] at start
               if (firstChild.startsWith('[ ] ') || firstChild.startsWith('[x] ')) {
                 const isChecked = firstChild.startsWith('[x] ');
                 const cleanText = firstChild.slice(4);
                 return (
                   <TaskItem checked={isChecked}>
                     {cleanText}
                     {childrenArray.slice(1)}
                   </TaskItem>
                 );
               }
            }
            
            return <li className="text-slate-300 list-disc list-inside" {...props}>{children}</li>;
          },
          
          strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
          p: ({node, ...props}) => <p className="mb-2 text-slate-300 leading-relaxed" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-slate-400 bg-slate-800/50 py-2 pr-2 rounded-r" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-400 hover:underline" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;