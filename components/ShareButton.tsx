
import React, { useState } from 'react';
import { Share2, Copy, Mail, MessageCircle, Check } from 'lucide-react';

interface ShareButtonProps {
  content: string;
  title: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ content, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`*${title}*\n\n${content}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(content);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
      >
        <Share2 size={16} />
        Broadcast
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="p-1">
              <button 
                onClick={handleWhatsApp}
                className="flex items-center w-full gap-3 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg"
              >
                <MessageCircle size={16} className="text-green-500" />
                WhatsApp
              </button>
              <button 
                onClick={handleEmail}
                className="flex items-center w-full gap-3 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg"
              >
                <Mail size={16} className="text-blue-400" />
                Email Team
              </button>
              <button 
                onClick={handleCopy}
                className="flex items-center w-full gap-3 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-lg border-t border-slate-700/50 mt-1"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;