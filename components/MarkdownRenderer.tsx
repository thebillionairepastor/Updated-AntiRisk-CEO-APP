
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-xl font-bold text-blue-400 my-3" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-blue-300 my-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-md font-semibold text-white my-2" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside my-2 space-y-1 text-slate-300" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2 space-y-1 text-slate-300" {...props} />,
          li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
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