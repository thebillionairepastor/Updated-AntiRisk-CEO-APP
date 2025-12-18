
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Plus, Search, RefreshCw, Download, FileText, ChevronRight, ShieldAlert, BookOpen, Globe, Briefcase, Calendar, ChevronLeft, Save, Trash2, Check, Lightbulb, Printer, Settings as SettingsIcon, MessageCircle, Mail, X, Bell, Database, Upload, Pin, PinOff, BarChart2, Sparkles, Copy, ChevronDown, Eye, Maximize2, Edit3 } from 'lucide-react';
import Navigation from './components/Navigation';
import MarkdownRenderer from './components/MarkdownRenderer';
import ShareButton from './components/ShareButton';
import IncidentChart from './components/IncidentChart';
import { View, ChatMessage, Template, SecurityRole, StoredReport, WeeklyTip, UserProfile, KnowledgeDocument } from './types';
import { STATIC_TEMPLATES, GLOBAL_TRAINING_CATEGORIES } from './constants';
import { streamAdvisorResponse, generateTrainingModule, analyzeReport, fetchBestPractices, generateWeeklyInsights, generateWeeklyTip, getTrainingSuggestions, refineTrainingModule } from './services/geminiService';

function App() {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTipAlert, setShowNewTipAlert] = useState<WeeklyTip | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // --- Quick View State ---
  const [quickViewData, setQuickViewData] = useState<{ title: string; content: string } | null>(null);

  // --- User Profile State ---
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('security_app_profile');
    return saved ? JSON.parse(saved) : { name: '', phoneNumber: '', email: '' };
  });

  // --- Advisor State ---
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('security_app_chat');
    return saved ? JSON.parse(saved) : [{
      id: 'welcome',
      role: 'model',
      text: "Hello. I am the AntiRisk AI. I can assist with security operations, or answer any other questions you have.",
      timestamp: Date.now(),
      isPinned: false
    }];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isAdvisorThinking, setIsAdvisorThinking] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Knowledge Base State ---
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeDocument[]>(() => {
    const saved = localStorage.getItem('security_app_kb');
    return saved ? JSON.parse(saved) : [];
  });
  const [showKbModal, setShowKbModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  // --- Training State ---
  const [trainingRole, setTrainingRole] = useState<string>(SecurityRole.GUARD);
  const [trainingTopic, setTrainingTopic] = useState('');
  const [trainingContent, setTrainingContent] = useState('');
  const [isTrainingLoading, setIsTrainingLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  // Refinement State
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // --- Report Analyzer State ---
  const [reportText, setReportText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [storedReports, setStoredReports] = useState<StoredReport[]>(() => {
    const saved = localStorage.getItem('security_app_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [analyzerTab, setAnalyzerTab] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [weeklyInsight, setWeeklyInsight] = useState('');
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

  // --- Best Practices State ---
  const [bpTopic, setBpTopic] = useState('Current Global Security Trends for Manpower Services');
  const [bpContent, setBpContent] = useState<{ text: string, sources?: any[] } | null>(null);
  const [isBpLoading, setIsBpLoading] = useState(false);
  const [hasAutoFetchedBp, setHasAutoFetchedBp] = useState(false);
  // Notification State for Best Practices
  const [bpBadgeCount, setBpBadgeCount] = useState(0);
  const [showBpToast, setShowBpToast] = useState(false);

  // --- Toolkit/Templates State ---
  const [customTemplates, setCustomTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('security_app_templates');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Weekly Tips State ---
  const [weeklyTips, setWeeklyTips] = useState<WeeklyTip[]>(() => {
    const saved = localStorage.getItem('security_app_weekly_tips');
    return saved ? JSON.parse(saved) : [];
  });
  // Track which tip is currently being viewed
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [customTipTopic, setCustomTipTopic] = useState('');
  const [hasCheckedWeeklyTip, setHasCheckedWeeklyTip] = useState(false);
  const [tipDispatchSuccess, setTipDispatchSuccess] = useState<string | null>(null); // 'whatsapp' | 'email' | null

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('security_app_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('security_app_chat', JSON.stringify(messages));
    if (currentView === View.ADVISOR && !showPinnedOnly) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView, showPinnedOnly]);

  useEffect(() => {
    localStorage.setItem('security_app_reports', JSON.stringify(storedReports));
  }, [storedReports]);

  useEffect(() => {
    localStorage.setItem('security_app_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  useEffect(() => {
    localStorage.setItem('security_app_weekly_tips', JSON.stringify(weeklyTips));
  }, [weeklyTips]);

  useEffect(() => {
    localStorage.setItem('security_app_kb', JSON.stringify(knowledgeBase));
  }, [knowledgeBase]);

  // Close topic dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the wrapper div (which contains both input and dropdown)
      const wrapper = document.getElementById('training-topic-wrapper');
      if (wrapper && !wrapper.contains(event.target as Node)) {
        setShowTopicSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Automatic refresh for Best Practices when entering the view
  useEffect(() => {
    if (currentView === View.BEST_PRACTICES) {
      // Clear badge when viewing
      setBpBadgeCount(0);
      
      if (!hasAutoFetchedBp && !bpContent) {
        handleFetchBP();
        setHasAutoFetchedBp(true);
      }
    }
  }, [currentView]);

  // SIMULATION: "Background" update for Best Practices
  useEffect(() => {
    // Simulate the AI sourcing new content in the background after app load
    const timer = setTimeout(() => {
      if (currentView !== View.BEST_PRACTICES) {
        setBpBadgeCount(prev => prev + 1);
        setShowBpToast(true);
        // Auto-hide toast
        setTimeout(() => setShowBpToast(false), 5000);
      }
    }, 5000); // Triggers 5 seconds after app load for demonstration

    return () => clearTimeout(timer);
  }, []);

  // Automatic Weekly Tip Generation Check
  useEffect(() => {
    if (currentView === View.WEEKLY_TIPS && !hasCheckedWeeklyTip) {
      const checkAndGenerate = async () => {
        const latestTip = weeklyTips.length > 0 ? weeklyTips[0] : null;
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        
        // Generate if list is empty OR latest tip is older than 7 days
        if (!latestTip || (now - latestTip.timestamp > sevenDaysMs)) {
          await handleGenerateWeeklyTip(true);
        }
      };
      checkAndGenerate();
      setHasCheckedWeeklyTip(true);
    }
  }, [currentView, weeklyTips, hasCheckedWeeklyTip]);

  // --- Handlers ---

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputMessage,
      timestamp: Date.now(),
      isPinned: false
    };

    // 1. Update UI with User Message immediately
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsAdvisorThinking(true);

    // 2. Create a placeholder message for the AI response
    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'model',
      text: '', // Starts empty for streaming
      timestamp: Date.now(),
      isPinned: false
    };
    setMessages(prev => [...prev, initialAiMsg]);

    // 3. Stream the response
    // We pass the messages history including the new user message (which isn't in 'messages' var yet)
    await streamAdvisorResponse(
      [...messages, userMsg],
      currentInput,
      knowledgeBase,
      (textChunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, text: msg.text + textChunk }
            : msg
        ));
      },
      (sources) => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, sources: sources }
            : msg
        ));
      }
    );

    setIsAdvisorThinking(false);
  };

  const handleTogglePin = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    ));
  };

  const handleAddKbDocument = () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    const newDoc: KnowledgeDocument = {
      id: Date.now().toString(),
      title: newDocTitle,
      content: newDocContent,
      dateAdded: new Date().toLocaleDateString()
    };

    setKnowledgeBase(prev => [newDoc, ...prev]);
    setNewDocTitle('');
    setNewDocContent('');
  };

  const handleDeleteKbDocument = (id: string) => {
    if (window.confirm("Delete this document from the AI's memory?")) {
      setKnowledgeBase(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleGenerateTraining = async () => {
    if (!trainingTopic) return;
    setShowTopicSuggestions(false);
    setIsTrainingLoading(true);
    // Pass current content as context for systematic progression
    const content = await generateTrainingModule(trainingRole, trainingTopic, trainingContent);
    setTrainingContent(content);
    setIsTrainingLoading(false);
    setRefineInstruction(''); // Clear previous refinement instruction
  };

  const handleRefineTraining = async () => {
    if (!refineInstruction.trim() || !trainingContent) return;
    setIsRefining(true);
    const refinedContent = await refineTrainingModule(trainingContent, refineInstruction);
    setTrainingContent(refinedContent);
    setIsRefining(false);
    setRefineInstruction('');
  };

  const handleGetTrainingSuggestions = async () => {
    setIsSuggestingTopics(true);
    const topics = await getTrainingSuggestions(storedReports);
    setSuggestedTopics(topics);
    setIsSuggestingTopics(false);
  };

  const handleSaveTemplate = () => {
    if (!trainingContent || !trainingTopic) return;
    
    const newTemplate: Template = {
      id: Date.now().toString(),
      title: trainingTopic,
      description: `Custom Module for ${trainingRole} - Created ${new Date().toLocaleDateString()}`,
      content: trainingContent
    };

    setCustomTemplates(prev => [newTemplate, ...prev]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleAnalyzeReport = async () => {
    if (!reportText) return;
    setIsAnalyzing(true);
    
    // Pass recent context (last 5 reports) to help AI detect recurrence immediately
    const contextReports = storedReports.slice(0, 5);
    const result = await analyzeReport(reportText, contextReports);
    setAnalysisResult(result);
    
    // Automatically save the report
    const newReport: StoredReport = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString(),
      content: reportText,
      analysis: result
    };
    setStoredReports(prev => [newReport, ...prev]);
    setIsAnalyzing(false);
  };

  const handleGenerateWeekly = async () => {
    // Filter for reports from the last 7 days
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weeklyReports = storedReports.filter(r => r.timestamp > oneWeekAgo);

    if (weeklyReports.length === 0) {
      alert("No reports found from the last 7 days to generate a weekly insight.");
      return;
    }

    setIsWeeklyLoading(true);
    const result = await generateWeeklyInsights(weeklyReports);
    setWeeklyInsight(result);
    setIsWeeklyLoading(false);
  };

  const handleFetchBP = async () => {
    setIsBpLoading(true);
    const result = await fetchBestPractices(bpTopic);
    setBpContent(result);
    setIsBpLoading(false);
  };

  const handleGenerateWeeklyTip = async (isAuto: boolean) => {
    setIsTipLoading(true);
    const topic = isAuto ? undefined : customTipTopic;
    const content = await generateWeeklyTip(topic);
    
    // Error Guard: Don't save if generation failed
    if (!content || content.startsWith("Error") || content.startsWith("Failed")) {
      setIsTipLoading(false);
      return;
    }

    // Extract topic from content (Looking for WEEKLY TRAINING TOPIC:)
    let derivedTopic = "Weekly Security Tip";
    const topicMatch = content.match(/WEEKLY TRAINING TOPIC:\s*(.*)/);
    if (topicMatch && topicMatch[1]) {
      derivedTopic = topicMatch[1].trim();
    }

    const newTip: WeeklyTip = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      weekDate: new Date().toLocaleDateString(),
      topic: derivedTopic,
      content: content,
      isAutoGenerated: isAuto
    };

    setWeeklyTips(prev => [newTip, ...prev]);
    setSelectedTipId(newTip.id); // Automatically select the new tip
    setCustomTipTopic('');
    setIsTipLoading(false);

    // Trigger Notification Flow
    setShowNewTipAlert(newTip);
  };

  const handleDeleteTip = (id: string) => {
    if (window.confirm('Remove this training tip from history?')) {
      setWeeklyTips(prev => prev.filter(t => t.id !== id));
      if (selectedTipId === id) {
        setSelectedTipId(null); // Clear selection if deleted
      }
    }
  };

  // --- Notification / Dispatch Handlers ---

  const sendToCEO = (type: 'whatsapp' | 'email', tip: WeeklyTip) => {
    if (!userProfile.phoneNumber && type === 'whatsapp') {
      setShowNewTipAlert(null); // Close alert to unblock view
      setShowSettings(true);
      return;
    }
    if (!userProfile.email && type === 'email') {
      setShowNewTipAlert(null); // Close alert to unblock view
      setShowSettings(true);
      return;
    }

    // Show visual success state
    setTipDispatchSuccess(type);
    setTimeout(() => setTipDispatchSuccess(null), 2500);

    const alertPrefix = `🔔 *WEEKLY SECURITY TRAINING* 🔔\n\n*Date:* ${tip.weekDate}\n*Topic:* ${tip.topic}\n\n`;
    
    let formattedContent = tip.content
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/^#+\s*(.*$)/gm, '\n*$1*')
      .replace(/^[\*\-]\s/gm, '• ')
      .replace(/\n\n\n+/g, '\n\n')
      .trim();

    // Professional Footer for the message
    const footer = `\n\n_– Sent via CEO Advisory App_`;
    const fullText = alertPrefix + formattedContent + footer;

    navigator.clipboard.writeText(fullText).catch(err => console.error('Clipboard copy failed', err));
    
    if (type === 'whatsapp') {
      const cleanNumber = userProfile.phoneNumber.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullText)}`;
      // Small delay to allow the animation to start before opening window
      setTimeout(() => window.open(whatsappUrl, '_blank'), 300);
    } else {
      const subject = encodeURIComponent(`Weekly Security Tip: ${tip.topic}`);
      const body = encodeURIComponent(`(Full text copied to clipboard. Paste here if content is truncated.)\n\n${fullText}`);
      setTimeout(() => window.location.href = `mailto:${userProfile.email}?subject=${subject}&body=${body}`, 300);
    }
    
    setShowNewTipAlert(null);
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    localStorage.setItem('security_app_profile', JSON.stringify(userProfile));
    setTimeout(() => {
      setSettingsSaved(false);
      setShowSettings(false);
    }, 800);
  };

  // --- Render Content Areas ---

  const renderQuickViewModal = () => {
    if (!quickViewData) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye size={24} className="text-blue-400" />
              {quickViewData.title}
            </h2>
            <div className="flex gap-2">
              <ShareButton content={quickViewData.content} title={quickViewData.title} />
              <button 
                onClick={() => setQuickViewData(null)}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-900/50">
            <MarkdownRenderer content={quickViewData.content} />
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon size={24} className="text-blue-400" />
            CEO Alert Settings
          </h2>
          <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 flex gap-3">
            <Bell className="text-blue-400 shrink-0" size={20} />
            <p className="text-sm text-blue-100">Enter your details to receive "New Tip Available" push alerts via WhatsApp and Email.</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
            <input 
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none placeholder-slate-600"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp Number (with country code)</label>
            <input 
              type="tel"
              value={userProfile.phoneNumber}
              onChange={(e) => setUserProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none placeholder-slate-600"
              placeholder="e.g. 15551234567"
            />
            <p className="text-xs text-slate-500 mt-1">Use International Format (e.g., 1 for US, 44 for UK). No '+' or dashes.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
            <input 
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none placeholder-slate-600"
              placeholder="ceo@company.com"
            />
          </div>
        </div>
        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              settingsSaved 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {settingsSaved ? (
              <>
                <Check size={18} /> Saved!
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderKbModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Database size={24} className="text-emerald-400" />
               AI Knowledge Base Manager
             </h2>
             <p className="text-sm text-slate-400">Upload policies, reports, or memos. The Advisor will use this knowledge.</p>
          </div>
          <button onClick={() => setShowKbModal(false)} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
           {/* Add New Section */}
           <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
             <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
               <Upload size={16} className="text-blue-400" />
               Add New Document
             </h3>
             <div className="space-y-3">
               <input 
                 type="text"
                 value={newDocTitle}
                 onChange={(e) => setNewDocTitle(e.target.value)}
                 placeholder="Document Title (e.g., Visitation Policy 2024)"
                 className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
               />
               <textarea 
                 value={newDocContent}
                 onChange={(e) => setNewDocContent(e.target.value)}
                 placeholder="Paste full text content here..."
                 className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none h-32 resize-none font-mono"
               />
               <div className="flex justify-end">
                 <button 
                   onClick={handleAddKbDocument}
                   disabled={!newDocTitle || !newDocContent}
                   className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                 >
                   <Plus size={16} /> Add to Memory
                 </button>
               </div>
             </div>
           </div>

           {/* List Section */}
           <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Stored Documents ({knowledgeBase.length})</h3>
             <div className="space-y-2">
               {knowledgeBase.length === 0 && <p className="text-slate-600 text-sm italic text-center py-4">No documents stored. The AI is using generic knowledge only.</p>}
               {knowledgeBase.map(doc => (
                 <div key={doc.id} className="bg-slate-800/50 border border-slate-700 hover:border-slate-500 rounded-lg p-3 flex justify-between items-start group transition-colors">
                   <div>
                     <h4 className="text-white font-medium text-sm">{doc.title}</h4>
                     <p className="text-xs text-slate-500 mt-1 line-clamp-1">{doc.content.substring(0, 60)}...</p>
                     <span className="text-[10px] text-slate-600 mt-1 block">Added: {doc.dateAdded}</span>
                   </div>
                   <button 
                     onClick={() => handleDeleteKbDocument(doc.id)}
                     className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                     title="Delete Document"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderNewTipAlertModal = () => {
    if (!showNewTipAlert) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 rounded-2xl border border-yellow-500/50 shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 text-center">
             <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <Bell size={32} className="text-white animate-bounce" />
             </div>
             <h2 className="text-2xl font-bold text-white">New Weekly Tip Generated!</h2>
             <p className="text-yellow-100 text-sm mt-2">Topic: {showNewTipAlert.topic}</p>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-300 text-center mb-2">
              The new training module is ready. Send the alert to your device now?
            </p>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                sendToCEO('whatsapp', showNewTipAlert);
              }}
              className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-colors"
            >
              <MessageCircle size={24} />
              Send WhatsApp Alert
            </button>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                sendToCEO('email', showNewTipAlert);
              }}
              className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-colors"
            >
              <Mail size={20} />
              Send Email Alert
            </button>

            <button 
              onClick={() => setShowNewTipAlert(null)}
              className="w-full text-slate-500 text-sm hover:text-white py-2 transition-colors"
            >
              Dismiss (View in App)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderToast = () => {
    if (!showBpToast) return null;
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-slate-800 border-l-4 border-blue-500 text-white px-6 py-4 rounded-lg shadow-2xl animate-in slide-in-from-right duration-300 flex items-center gap-4">
        <div className="bg-blue-900/50 p-2 rounded-full">
          <Globe size={20} className="text-blue-400" />
        </div>
        <div>
          <h4 className="font-bold text-sm">Best Practices Updated</h4>
          <p className="text-xs text-slate-400">New global standards have been sourced.</p>
        </div>
        <button 
          onClick={() => {
            setShowBpToast(false);
            setCurrentView(View.BEST_PRACTICES);
          }}
          className="ml-2 text-sm text-blue-400 hover:text-white font-bold"
        >
          VIEW
        </button>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-800 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Welcome, {userProfile.name || 'CEO'}</h2>
            <p className="text-blue-100 mb-4 max-w-lg">Your executive dashboard is active. Global threat levels are being monitored. Recent analysis suggests reviewing patrol protocols this week.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCurrentView(View.ADVISOR)}
                className="bg-white text-blue-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors"
              >
                Consult Advisor
              </button>
              <button 
                onClick={() => setCurrentView(View.REPORT_ANALYZER)}
                className="bg-blue-800 border border-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
              >
                Analyze Reports
              </button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-4 translate-x-4">
             <ShieldAlert size={200} />
          </div>
        </div>

        {/* Quick Action: Weekly Tips */}
        <div 
          onClick={() => setCurrentView(View.WEEKLY_TIPS)}
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl p-6 cursor-pointer transition-all hover:border-yellow-500/50 group relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
              <Lightbulb size={24} className="text-yellow-400" />
            </div>
            <h3 className="font-bold text-white mb-1">Weekly Training</h3>
            <p className="text-sm text-slate-400">View or generate this week's team focus.</p>
          </div>
        </div>
      </div>
      
      {/* Incident Trends Chart */}
      {storedReports.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-400" />
              Incident Trends
            </h3>
             <button onClick={() => setCurrentView(View.REPORT_ANALYZER)} className="text-xs text-blue-400 hover:text-white font-medium">View Full Analysis</button>
          </div>
          <div className="-mb-6">
             <IncidentChart reports={storedReports} />
          </div>
        </div>
      )}

      {/* Recent Activity Mockup */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw size={18} className="text-blue-400" />
          System Updates
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50 last:border-0">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
            <div>
              <p className="text-sm text-slate-300">Global Best Practices updated: "Drone Defense in Private Sectors".</p>
              <span className="text-xs text-slate-500">2 hours ago</span>
            </div>
          </div>
          {storedReports.length > 0 && (
            <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50 last:border-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <p className="text-sm text-slate-300">{storedReports.length} Incident Reports stored for Weekly Analysis.</p>
                <span className="text-xs text-slate-500">Ongoing</span>
              </div>
            </div>
          )}
          {weeklyTips.length > 0 && (
             <div className="flex items-start gap-4 pb-4 border-b border-slate-700/50 last:border-0">
               <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 shrink-0"></div>
               <div>
                 <p className="text-sm text-slate-300">Latest Weekly Tip: "{weeklyTips[0].topic}" generated.</p>
                 <span className="text-xs text-slate-500">{weeklyTips[0].weekDate}</span>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdvisor = () => {
    const filteredMessages = showPinnedOnly ? messages.filter(m => m.isPinned) : messages;

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden animate-in fade-in duration-500">
        {/* Advisor Header with KB Button */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-blue-400" size={20} />
            <h2 className="font-bold text-white">Executive Advisor</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                showPinnedOnly 
                ? 'bg-yellow-600 text-white border-yellow-500' 
                : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
              }`}
            >
              {showPinnedOnly ? <PinOff size={14} /> : <Pin size={14} />}
              {showPinnedOnly ? 'Show All' : 'Show Pinned'}
            </button>
            <button 
              onClick={() => setShowKbModal(true)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-600"
            >
              <Database size={14} className="text-emerald-400" />
              Knowledge Base ({knowledgeBase.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {showPinnedOnly && filteredMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Pin size={48} className="mb-4 opacity-20" />
              <p>No pinned messages found.</p>
            </div>
          )}

          {filteredMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 relative group ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-slate-700 text-slate-100 rounded-bl-sm'
              } ${msg.isPinned ? 'border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : ''}`}>
                
                <button
                  onClick={() => handleTogglePin(msg.id)}
                  className={`absolute top-2 right-2 p-1 rounded-full transition-all ${
                    msg.isPinned 
                      ? 'text-yellow-400 opacity-100 bg-black/20' 
                      : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/20'
                  }`}
                  title={msg.isPinned ? "Unpin Message" : "Pin Message"}
                >
                  <Pin size={14} fill={msg.isPinned ? "currentColor" : "none"} />
                </button>

                <div className={msg.isPinned ? "pr-6" : ""}>
                  <MarkdownRenderer content={msg.text} />
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                      <p className="text-xs text-slate-400 font-semibold mb-1">Sources:</p>
                      <ul className="space-y-1">
                        {msg.sources.map((s, i) => (
                          <li key={i}><a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-blue-300 hover:underline truncate block max-w-xs">{s.title}</a></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Thinking Indicator inside the chat flow, if the latest message is an empty model message */}
           {isAdvisorThinking && messages.length > 0 && messages[messages.length - 1].role === 'model' && messages[messages.length - 1].text === '' && (
              <div className="flex justify-start">
                 <div className="bg-slate-700 rounded-2xl p-4 rounded-bl-sm flex items-center gap-2">
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                 </div>
              </div>
           )}

          <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex gap-2">
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about strategy, operations, or incidents..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAdvisorThinking}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBestPractices = () => (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe size={24} className="text-blue-400" />
          Best Practice Engine
        </h2>
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            value={bpTopic}
            onChange={(e) => setBpTopic(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            placeholder="e.g., VIP Protection Standards, Warehouse Access Control"
          />
          <button 
            onClick={handleFetchBP}
            disabled={isBpLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isBpLoading ? <RefreshCw className="animate-spin" size={18} /> : 'Source'}
          </button>
        </div>

        {isBpLoading && (
           <div className="flex flex-col items-center justify-center py-12 text-slate-400">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p>Sourcing global standards...</p>
           </div>
        )}

        {bpContent && !isBpLoading && (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-blue-400">Results for: "{bpTopic}"</h3>
              <ShareButton content={bpContent.text} title={`Security Best Practices: ${bpTopic}`} />
            </div>
            <MarkdownRenderer content={bpContent.text} />
            
            {bpContent.sources && bpContent.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Reference Sources</h4>
                <div className="grid gap-2">
                  {bpContent.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      <Globe size={14} />
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderWeeklyTips = () => (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb size={24} className="text-yellow-400" />
            Weekly Training Tips
          </h2>
          <p className="text-sm text-slate-400">Automated weekly curriculum for guards and supervisors.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <input 
            type="text"
            value={customTipTopic}
            onChange={(e) => setCustomTipTopic(e.target.value)}
            placeholder="Specific Topic (Optional)"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none w-full md:w-64"
          />
          <button
            onClick={() => handleGenerateWeeklyTip(false)}
            disabled={isTipLoading || !customTipTopic}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Create Custom
          </button>
          <button
            onClick={() => handleGenerateWeeklyTip(true)}
            disabled={isTipLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-yellow-900/20"
          >
            {isTipLoading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
            Generate New Week
          </button>
        </div>
      </div>

      {/* Settings Warning Banner if Profile Incomplete */}
      {(!userProfile.phoneNumber || !userProfile.email) && (
         <div 
           onClick={() => setShowSettings(true)}
           className="bg-red-900/30 border border-red-800/50 rounded-lg p-3 mb-4 flex items-center justify-between cursor-pointer hover:bg-red-900/50 transition-colors"
         >
           <div className="flex items-center gap-3">
             <Bell className="text-red-400 animate-pulse" size={20} />
             <span className="text-sm text-red-200">CEO Alert Profile Incomplete. Configure settings to receive automatic push notifications.</span>
           </div>
           <ChevronRight size={16} className="text-red-400" />
         </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left: Current Tip Display */}
        <div className="lg:col-span-8 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative">
          {weeklyTips.length > 0 ? (
            <>
               {/* Direct Dispatch Banner */}
               <div className="bg-blue-900/30 border-b border-blue-800/50 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wide">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    Ready to Distribute
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => sendToCEO('whatsapp', weeklyTips[0])}
                      disabled={!!tipDispatchSuccess}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all duration-300 shadow-lg ${
                        tipDispatchSuccess === 'whatsapp' 
                        ? 'bg-green-500 shadow-green-900/20 scale-105' 
                        : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
                      }`}
                    >
                      {tipDispatchSuccess === 'whatsapp' ? <Check size={16} /> : <MessageCircle size={16} />}
                      {tipDispatchSuccess === 'whatsapp' ? 'Sent!' : 'Send to My WhatsApp'}
                    </button>
                    <button 
                      onClick={() => sendToCEO('email', weeklyTips[0])}
                      disabled={!!tipDispatchSuccess}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all duration-300 ${
                        tipDispatchSuccess === 'email'
                        ? 'bg-blue-500 scale-105'
                        : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {tipDispatchSuccess === 'email' ? <Check size={14} /> : <Mail size={14} />}
                      {tipDispatchSuccess === 'email' ? 'Sent!' : 'Email Me'}
                    </button>
                  </div>
               </div>

               <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Current Focus</span>
                    <h3 className="text-lg font-bold text-white leading-tight mt-1">{weeklyTips[0].topic}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                       onClick={() => window.print()}
                       className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                       title="Print / Save as PDF"
                    >
                      <Printer size={20} />
                    </button>
                    <ShareButton content={weeklyTips[0].content} title={weeklyTips[0].topic} />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-slate-900/30">
                 <div className="prose prose-invert max-w-none prose-headings:text-yellow-400 prose-strong:text-white">
                   <MarkdownRenderer content={weeklyTips[0].content} />
                 </div>
               </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              {isTipLoading ? (
                <>
                   <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                   <h3 className="text-xl font-bold text-white mb-2">Generating Weekly Intelligence...</h3>
                   <p className="text-slate-400">Analyzing global standards and AntiRisk protocols.</p>
                </>
              ) : (
                <>
                  <Lightbulb size={64} className="mb-6 text-slate-700" />
                  <h3 className="text-xl font-bold text-slate-400 mb-2">No Training Tips Generated Yet</h3>
                  <p className="max-w-md mb-6">Start by generating this week's security focus. The AI will use global standards to create a complete briefing.</p>
                  <button
                    onClick={() => handleGenerateWeeklyTip(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                    Start Automation
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: History Archive */}
        <div className="lg:col-span-4 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              Training Archive
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {weeklyTips.length === 0 && !isTipLoading && <p className="text-slate-500 text-sm italic p-4">Past trainings will appear here.</p>}
            {weeklyTips.map((tip) => (
              <div key={tip.id} className="group bg-slate-900/50 hover:bg-slate-900 p-3 rounded-xl border border-slate-800 hover:border-yellow-500/30 transition-all cursor-pointer relative">
                <div onClick={() => {
                   // Move selected tip to top of array to display it
                   const newOrder = [tip, ...weeklyTips.filter(t => t.id !== tip.id)];
                   setWeeklyTips(newOrder);
                }}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-slate-500">{tip.weekDate}</span>
                    {tip.isAutoGenerated && <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">AUTO</span>}
                  </div>
                  <h4 className="text-sm font-bold text-slate-200 group-hover:text-yellow-400 line-clamp-1">{tip.topic}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{tip.content.substring(0, 80)}...</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); sendToCEO('whatsapp', tip); }}
                    className="p-1.5 text-slate-600 hover:text-green-400 transition-colors"
                    title="Send via WhatsApp"
                  >
                    <MessageCircle size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTip(tip.id); }}
                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="grid lg:grid-cols-2 gap-6 h-full animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen size={24} className="text-emerald-400" />
          Training Architect AI
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Target Audience</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(SecurityRole).map(role => (
                <button
                  key={role}
                  onClick={() => setTrainingRole(role)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                    trainingRole === role 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div id="training-topic-wrapper" className="relative">
            <label className="block text-sm font-medium text-slate-400 mb-1">Training Topic</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-500" />
              </div>
              <input 
                type="text"
                value={trainingTopic}
                onChange={(e) => {
                  setTrainingTopic(e.target.value);
                  setShowTopicSuggestions(true);
                }}
                onFocus={() => setShowTopicSuggestions(true)}
                placeholder="Search 10,000+ global topics..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-8 py-3 text-white focus:border-blue-500 focus:outline-none"
                autoComplete="off"
              />
              {trainingTopic ? (
                <button 
                  onClick={() => { setTrainingTopic(''); setShowTopicSuggestions(true); }} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              ) : (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown size={16} className="text-slate-600" />
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showTopicSuggestions && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto scrollbar-hide animate-in fade-in slide-in-from-top-2 duration-200">
                 {GLOBAL_TRAINING_CATEGORIES.map((group, idx) => {
                   const filteredTopics = group.topics.filter(t => 
                     t.toLowerCase().includes(trainingTopic.toLowerCase())
                   );

                   if (filteredTopics.length === 0) return null;

                   return (
                     <div key={idx} className="border-b border-slate-700/50 last:border-0">
                        <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-sm text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                          {group.category}
                        </div>
                        {filteredTopics.map((topic, tIdx) => (
                          <button
                            key={tIdx}
                            onClick={() => {
                              setTrainingTopic(topic);
                              setShowTopicSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2 border-l-2 border-transparent hover:border-white"
                          >
                            <div className="w-1 h-1 bg-slate-500 rounded-full shrink-0"></div>
                            {topic}
                          </button>
                        ))}
                     </div>
                   );
                 })}
                 
                 {/* Custom Entry Option */}
                 <div className="p-2 sticky bottom-0 bg-slate-800 border-t border-slate-700">
                    <div className="text-xs text-center text-slate-500 mb-2">Or generate entirely new content</div>
                    {!isSuggestingTopics ? (
                      <button 
                        onClick={handleGetTrainingSuggestions}
                        className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white py-2 rounded-lg text-xs font-bold transition-colors border border-slate-600"
                      >
                        <Sparkles size={14} />
                        Ask Architect AI for New Ideas
                      </button>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin" /> Consulting Global Memory Bank...
                      </div>
                    )}
                 </div>
              </div>
            )}
            
            {/* AI Chips */}
            {!showTopicSuggestions && suggestedTopics.length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-3">
                   <span className="text-xs text-slate-500 flex items-center gap-1"><Sparkles size={12} /> AI Suggestions:</span>
                   {suggestedTopics.map((topic, idx) => (
                     <button
                       key={idx}
                       onClick={() => setTrainingTopic(topic)}
                       className="bg-blue-900/30 hover:bg-blue-600 hover:text-white text-blue-300 text-[10px] px-2 py-1 rounded-full transition-colors border border-blue-800"
                     >
                       {topic}
                     </button>
                   ))}
                 </div>
               )}
          </div>

          <button
            onClick={handleGenerateTraining}
            disabled={isTrainingLoading || !trainingTopic}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
          >
            {isTrainingLoading ? (
              <>
                <RefreshCw className="animate-spin" size={20} /> Designing Curriculum...
              </>
            ) : (
              <>
                <FileText size={20} /> Generate Module
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative h-full min-h-[500px]">
        {!trainingContent && !isTrainingLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p className="max-w-xs text-center">Select a topic from the Global Memory Bank to generate a compliance-ready training module.</p>
          </div>
        )}
        
        {isTrainingLoading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
             <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p>Mapping global compliance standards...</p>
           </div>
        )}

        {trainingContent && !isTrainingLoading && (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
              <h3 className="font-bold text-slate-200">Preview</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveTemplate}
                  disabled={saveSuccess}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all font-medium ${saveSuccess ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                  title="Save to Toolkit"
                >
                  {saveSuccess ? <Check size={16} /> : <Save size={16} />}
                  {saveSuccess ? 'Saved!' : 'Save as Template'}
                </button>
                <button
                  onClick={() => setQuickViewData({ title: trainingTopic, content: trainingContent })}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  title="Quick View (Full Screen)"
                >
                  <Maximize2 size={16} />
                </button>
                <ShareButton content={trainingContent} title={`Training: ${trainingTopic}`} />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 mb-4">
              <MarkdownRenderer content={trainingContent} />
            </div>

            {/* Refinement / Follow-up Input */}
            <div className="pt-4 border-t border-slate-800">
               <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                 <Edit3 size={12} /> Refine or Follow Up
               </label>
               <div className="flex gap-2">
                 <input 
                   type="text"
                   value={refineInstruction}
                   onChange={(e) => setRefineInstruction(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleRefineTraining()}
                   placeholder="e.g. Add a 5-question quiz, make it shorter, or focus on night shift..."
                   className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                 />
                 <button 
                   onClick={handleRefineTraining}
                   disabled={isRefining || !refineInstruction}
                   className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                 >
                   {isRefining ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderReportAnalyzer = () => (
    <div className="grid lg:grid-cols-2 gap-6 h-full animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText size={24} className="text-blue-400" />
          Incident Analyzer
        </h2>

        <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg">
          <button
            onClick={() => setAnalyzerTab('DAILY')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${analyzerTab === 'DAILY' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Daily Analysis
          </button>
          <button
            onClick={() => setAnalyzerTab('WEEKLY')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${analyzerTab === 'WEEKLY' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Weekly Intelligence
          </button>
        </div>

        {analyzerTab === 'DAILY' ? (
          <div className="space-y-4">
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Paste incident report here (5Ws format)..."
              className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
            />
            <button
              onClick={handleAnalyzeReport}
              disabled={!reportText || isAnalyzing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <ShieldAlert size={20} />}
              {isAnalyzing ? 'Analyzing Patterns...' : 'Run Risk Analysis'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <h4 className="text-sm font-bold text-slate-400 mb-2">Data Source</h4>
              <p className="text-sm text-slate-300 mb-2">Using <span className="text-white font-bold">{storedReports.length}</span> stored reports from the last 7 days.</p>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-2/3"></div>
              </div>
            </div>
            <button
              onClick={handleGenerateWeekly}
              disabled={isWeeklyLoading || storedReports.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2"
            >
              {isWeeklyLoading ? <RefreshCw className="animate-spin" size={20} /> : <BarChart2 size={20} />}
              {isWeeklyLoading ? 'Synthesizing Data...' : 'Generate Weekly Briefing'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-full overflow-y-auto scrollbar-hide">
        {analyzerTab === 'DAILY' && (
          <>
            {!analysisResult && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Paste a report to identify root causes and liability risks.</p>
              </div>
            )}
            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Cross-referencing with past incidents...</p>
              </div>
            )}
            {analysisResult && !isAnalyzing && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                  <h3 className="font-bold text-slate-200">Analysis Results</h3>
                  <ShareButton content={analysisResult} title="Incident Analysis" />
                </div>
                <MarkdownRenderer content={analysisResult} />
              </div>
            )}
          </>
        )}

        {analyzerTab === 'WEEKLY' && (
          <>
            {!weeklyInsight && !isWeeklyLoading && (
              <div className="space-y-6">
                <IncidentChart reports={storedReports} />
                {storedReports.length > 0 ? (
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-400 mb-3">Recent Archive</h4>
                    <div className="space-y-2">
                      {storedReports.slice(0, 5).map(report => (
                        <div key={report.id} className="text-xs text-slate-500 border-l-2 border-slate-700 pl-3 py-1 flex justify-between items-start group">
                          <div>
                            <span className="text-slate-300 font-bold">{report.dateStr}:</span> {report.content.substring(0, 50)}...
                          </div>
                          <button 
                            onClick={() => setQuickViewData({ title: `Report: ${report.dateStr}`, content: report.content + "\n\n***\n\n**AI Analysis:**\n" + report.analysis })}
                            className="text-slate-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Quick View Report"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-600">
                    <BarChart2 size={48} className="mb-4 opacity-20" />
                    <p>No reports available for analysis.</p>
                  </div>
                )}
              </div>
            )}
            {isWeeklyLoading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Detecting patterns and recurring risks...</p>
              </div>
            )}
            {weeklyInsight && !isWeeklyLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                  <h3 className="font-bold text-slate-200">Weekly Intelligence Brief</h3>
                  <ShareButton content={weeklyInsight} title="Weekly Security Briefing" />
                </div>
                <MarkdownRenderer content={weeklyInsight} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderToolkit = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Static Templates */}
        {STATIC_TEMPLATES.map(template => (
          <div key={template.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 transition-colors group relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setQuickViewData({ title: template.title, content: template.content })}
                className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Quick View"
              >
                <Eye size={16} />
              </button>
              <ShareButton content={template.content} title={template.title} />
            </div>
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-900/30 transition-colors">
              <FileText size={24} className="text-blue-400" />
            </div>
            <h3 className="font-bold text-white mb-2">{template.title}</h3>
            <p className="text-sm text-slate-400 mb-4">{template.description}</p>
            <div className="text-xs text-slate-500 font-mono bg-slate-900 p-2 rounded">
              Standard SOP
            </div>
          </div>
        ))}

        {/* Custom Templates */}
        {customTemplates.map(template => (
          <div key={template.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-emerald-500 transition-colors group relative">
            <div className="absolute top-4 right-4 flex gap-2">
               <button
                  onClick={() => setQuickViewData({ title: template.title, content: template.content })}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Quick View"
                >
                  <Eye size={16} />
                </button>
               <ShareButton content={template.content} title={template.title} />
               <button 
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="p-2 bg-slate-700 hover:bg-red-900/50 hover:text-red-400 text-slate-400 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
            </div>
            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-900/30 transition-colors">
              <Briefcase size={24} className="text-emerald-400" />
            </div>
            <h3 className="font-bold text-white mb-2">{template.title}</h3>
            <p className="text-sm text-slate-400 mb-4">{template.description}</p>
            <div className="text-xs text-emerald-500/50 font-mono bg-slate-900 p-2 rounded border border-emerald-900/30">
              Custom AI Generated
            </div>
          </div>
        ))}

        {/* Add New Placeholder */}
        <button 
          onClick={() => setCurrentView(View.TRAINING)}
          className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 transition-colors h-full min-h-[200px]"
        >
          <Plus size={32} className="mb-2" />
          <span className="font-bold text-sm">Create New Template</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Navigation 
        currentView={currentView} 
        setView={setCurrentView} 
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
        onOpenSettings={() => setShowSettings(true)}
        bestPracticesBadge={bpBadgeCount}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur z-20">
          <h1 className="font-bold text-lg text-white">AntiRisk Security</h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-400 hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        {/* Main Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {currentView === View.DASHBOARD && renderDashboard()}
            {currentView === View.ADVISOR && renderAdvisor()}
            {currentView === View.WEEKLY_TIPS && renderWeeklyTips()}
            {currentView === View.BEST_PRACTICES && renderBestPractices()}
            {currentView === View.TRAINING && renderTraining()}
            {currentView === View.REPORT_ANALYZER && renderReportAnalyzer()}
            {currentView === View.TOOLKIT && renderToolkit()}
          </div>
        </div>

        {/* Modals & Toasts */}
        {showSettings && renderSettingsModal()}
        {showNewTipAlert && renderNewTipAlertModal()}
        {showKbModal && renderKbModal()}
        {showBpToast && renderToast()}
        {quickViewData && renderQuickViewModal()}
      </main>
    </div>
  );
}

export default App;
