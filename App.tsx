
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Plus, Search, RefreshCw, FileText, ShieldAlert, BookOpen, Globe, Briefcase, Calendar, Save, Trash2, Check, Lightbulb, Printer, Settings as SettingsIcon, MessageCircle, Mail, X, Bell, Database, Upload, Pin, PinOff, BarChart2, Sparkles, Copy, Eye, Edit3, Zap, ArrowRight, Activity, Lock, Key } from 'lucide-react';
import Navigation from './components/Navigation';
import BottomNavigation from './components/BottomNavigation';
import MarkdownRenderer from './components/MarkdownRenderer';
import ShareButton from './components/ShareButton';
import IncidentChart from './components/IncidentChart';
import SplashScreen from './components/SplashScreen';
import SecurityGate from './components/SecurityGate';
import { View, ChatMessage, Template, SecurityRole, StoredReport, WeeklyTip, UserProfile, KnowledgeDocument } from './types';
import { STATIC_TEMPLATES, GLOBAL_TRAINING_CATEGORIES } from './constants';
import { streamAdvisorResponse, generateTrainingModule, analyzeReport, fetchBestPractices, generateWeeklyInsights, generateWeeklyTip, getTrainingSuggestions, refineTrainingModule, getTrainingCoPilotSuggestions, searchTrainingTopics } from './services/geminiService';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTipAlert, setShowNewTipAlert] = useState<WeeklyTip | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [quickViewData, setQuickViewData] = useState<{ title: string; content: string } | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('security_app_profile');
    return saved ? JSON.parse(saved) : { name: '', phoneNumber: '', email: '' };
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('security_app_chat');
    return saved ? JSON.parse(saved) : [{
      id: 'welcome',
      role: 'model',
      text: "Welcome, CEO. I am the AntiRisk AI. I'm ready to assist with operations, intelligence, and strategy. How can I serve you today?",
      timestamp: Date.now(),
      isPinned: false
    }];
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isAdvisorThinking, setIsAdvisorThinking] = useState(false);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeDocument[]>(() => {
    const saved = localStorage.getItem('security_app_kb');
    return saved ? JSON.parse(saved) : [];
  });
  const [showKbModal, setShowKbModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  const [trainingRole, setTrainingRole] = useState<string>(SecurityRole.GUARD);
  const [trainingTopic, setTrainingTopic] = useState('');
  const [trainingContent, setTrainingContent] = useState('');
  const [isTrainingLoading, setIsTrainingLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  const [coPilotSuggestions, setCoPilotSuggestions] = useState<string[]>([]);
  const [isCoPilotLoading, setIsCoPilotLoading] = useState(false);

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

  const [bpTopic, setBpTopic] = useState('Global Physical Security Standards 2025');
  const [bpContent, setBpContent] = useState<{ text: string, sources?: any[] } | null>(null);
  const [isBpLoading, setIsBpLoading] = useState(false);
  const [bpBadgeCount, setBpBadgeCount] = useState(0);
  const [showBpToast, setShowBpToast] = useState(false);

  const [customTemplates, setCustomTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('security_app_templates');
    return saved ? JSON.parse(saved) : [];
  });

  const [weeklyTips, setWeeklyTips] = useState<WeeklyTip[]>(() => {
    const saved = localStorage.getItem('security_app_weekly_tips');
    return saved ? JSON.parse(saved) : [];
  });
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [customTipTopic, setCustomTipTopic] = useState('');
  const [tipDispatchSuccess, setTipDispatchSuccess] = useState<'whatsapp' | 'email' | null>(null);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('security_app_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { 
    localStorage.setItem('security_app_chat', JSON.stringify(messages));
    if (currentView === View.ADVISOR && !showPinnedOnly) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentView, showPinnedOnly]);
  useEffect(() => { localStorage.setItem('security_app_reports', JSON.stringify(storedReports)); }, [storedReports]);
  useEffect(() => { localStorage.setItem('security_app_templates', JSON.stringify(customTemplates)); }, [customTemplates]);
  useEffect(() => { localStorage.setItem('security_app_weekly_tips', JSON.stringify(weeklyTips)); }, [weeklyTips]);
  useEffect(() => { localStorage.setItem('security_app_kb', JSON.stringify(knowledgeBase)); }, [knowledgeBase]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputMessage, timestamp: Date.now(), isPinned: false };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsAdvisorThinking(true);
    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg: ChatMessage = { id: aiMsgId, role: 'model', text: '', timestamp: Date.now(), isPinned: false };
    setMessages(prev => [...prev, initialAiMsg]);
    await streamAdvisorResponse([...messages, userMsg], currentInput, knowledgeBase, (chunk) => {
        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, text: msg.text + chunk } : msg));
    }, (sources) => {
        setMessages(prev => prev.map(msg => msg.id === aiMsgId ? { ...msg, sources } : msg));
    });
    setIsAdvisorThinking(false);
  };

  const handleTogglePin = (id: string) => { setMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m)); };
  
  const handleGenerateTraining = async () => {
    setIsTrainingLoading(true); 
    setShowTopicSuggestions(false);
    const content = await generateTrainingModule(trainingRole, trainingTopic);
    setTrainingContent(content); 
    setIsTrainingLoading(false);
    
    // Auto-fetch suggestions for a "Fast" feel
    const suggestions = await getTrainingCoPilotSuggestions(content);
    setCoPilotSuggestions(suggestions);
  };

  const handleAnalyzeReport = async () => {
    if (!reportText) return;
    setIsAnalyzing(true);
    const result = await analyzeReport(reportText);
    setAnalysisResult(result);
    setStoredReports(prev => [{ id: Date.now().toString(), timestamp: Date.now(), dateStr: new Date().toLocaleDateString(), content: reportText, analysis: result }, ...prev]);
    setIsAnalyzing(false);
  };

  const handleFetchBP = async () => {
    setIsBpLoading(true);
    const result = await fetchBestPractices(bpTopic);
    setBpContent(result);
    setIsBpLoading(false);
  };

  const handleGenerateWeeklyTip = async (isAuto: boolean) => {
    setIsTipLoading(true);
    const content = await generateWeeklyTip(isAuto ? undefined : customTipTopic);
    if (!content || content.startsWith("Error")) { setIsTipLoading(false); return; }
    const topicMatch = content.match(/WEEKLY TRAINING TOPIC:\s*(.*)/);
    const newTip: WeeklyTip = { id: Date.now().toString(), weekDate: new Date().toLocaleDateString(), topic: topicMatch ? topicMatch[1].trim() : "Weekly Tip", content, isAutoGenerated: isAuto, timestamp: Date.now() };
    setWeeklyTips(prev => [newTip, ...prev]);
    setIsTipLoading(false);
    setShowNewTipAlert(newTip);
  };

  const handleRefineWithPrompt = async (prompt: string) => {
    setIsRefining(true);
    const refined = await refineTrainingModule(trainingContent, prompt);
    setTrainingContent(refined);
    setIsRefining(false);
    // Refresh suggestions after refinement
    const suggestions = await getTrainingCoPilotSuggestions(refined);
    setCoPilotSuggestions(suggestions);
  };

  const sendToCEO = (type: 'whatsapp' | 'email', tip: WeeklyTip) => {
    setTipDispatchSuccess(type);
    setTimeout(() => setTipDispatchSuccess(null), 3000);
    const text = `🔔 *ANTI-RISK WEEKLY* 🔔\n\n*Topic:* ${tip.topic}\n\n${tip.content}\n\n_– CEO Advisory Suite_`;
    navigator.clipboard.writeText(text);
    if (type === 'whatsapp' && userProfile.phoneNumber) window.open(`https://wa.me/${userProfile.phoneNumber}?text=${encodeURIComponent(text)}`, '_blank');
    else if (type === 'email' && userProfile.email) window.location.href = `mailto:${userProfile.email}?subject=${encodeURIComponent(tip.topic)}&body=${encodeURIComponent(text)}`;
    setShowNewTipAlert(null);
  };

  const handlePinRegistration = (newPin: string) => {
    setUserProfile(prev => ({ ...prev, password: newPin }));
    setIsLocked(false);
  };

  const handleTopicSearch = async (val: string) => {
    setTrainingTopic(val);
    if (val.length > 2) {
      setIsSuggestingTopics(true);
      const searchResults = await searchTrainingTopics(val);
      setSuggestedTopics(searchResults);
      setShowTopicSuggestions(true);
      setIsSuggestingTopics(false);
    } else {
      setShowTopicSuggestions(false);
    }
  };

  // --- Views ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900 border border-blue-800/50 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-3">Welcome, {userProfile.name || 'Commander'}</h2>
            <p className="text-blue-200/80 mb-6 max-w-lg leading-relaxed text-lg">Operational readiness is 100%. All AI modules are online and synchronized with the latest security standards.</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setCurrentView(View.ADVISOR)} className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform">Consult Strategy</button>
              <button onClick={() => setCurrentView(View.REPORT_ANALYZER)} className="bg-blue-600/20 border border-blue-500/50 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600/40 transition-colors">Incident Hub</button>
            </div>
          </div>
          <ShieldAlert size={260} className="absolute right-[-40px] bottom-[-60px] opacity-10 group-hover:scale-110 transition-transform duration-1000" />
        </div>
        <div onClick={() => setCurrentView(View.WEEKLY_TIPS)} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl p-6 cursor-pointer transition-all hover:border-yellow-500/40 flex flex-col justify-center text-center">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-4 mx-auto"><Lightbulb size={32} className="text-yellow-400" /></div>
          <h3 className="font-bold text-xl text-white mb-2">Weekly Intelligence</h3>
          <p className="text-sm text-slate-400">Distribute critical skills to your frontline teams.</p>
        </div>
      </div>
      {storedReports.length > 0 && <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 shadow-inner"><h3 className="font-bold text-white mb-6 flex items-center gap-3 text-lg"><BarChart2 size={24} className="text-blue-400" />Risk Metrics</h3><IncidentChart reports={storedReports} /></div>}
    </div>
  );

  const renderAdvisor = () => (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-800/80 backdrop-blur rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
        <h2 className="font-bold text-white flex items-center gap-3"><ShieldAlert className="text-blue-400" size={24} />Executive Advisory</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowPinnedOnly(!showPinnedOnly)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${showPinnedOnly ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300'}`}>{showPinnedOnly ? <PinOff size={16} /> : <Pin size={16} />} {showPinnedOnly ? 'Briefing' : 'Full Log'}</button>
          <button onClick={() => setShowKbModal(true)} className="flex items-center gap-2 bg-slate-700 border border-slate-600 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold"><Database size={16} /> Memory ({knowledgeBase.length})</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {(showPinnedOnly ? messages.filter(m => m.isPinned) : messages).map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-5 relative group shadow-sm transition-all ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-700/80 text-slate-100 rounded-bl-sm border border-slate-600/50'} ${msg.isPinned ? 'border-2 border-yellow-500/50 shadow-yellow-900/20' : ''}`}>
              <button onClick={() => handleTogglePin(msg.id)} className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${msg.isPinned ? 'text-yellow-400 bg-black/20' : 'text-slate-500 opacity-0 group-hover:opacity-100'}`}><Pin size={16} fill={msg.isPinned ? "currentColor" : "none"} /></button>
              <MarkdownRenderer content={msg.text} />
              {msg.sources && msg.sources.length > 0 && <div className="mt-4 pt-3 border-t border-slate-600/30 flex flex-wrap gap-2">{msg.sources.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer" className="text-[10px] bg-black/20 px-2 py-1 rounded hover:text-blue-300 truncate max-w-[150px]">{s.title}</a>)}</div>}
            </div>
          </div>
        ))}
        {isAdvisorThinking && <div className="flex justify-start"><div className="bg-slate-700/50 rounded-2xl p-5 flex items-center gap-2"><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div><span className="text-xs text-slate-500 font-bold ml-2">THINKING STRATEGICALLY...</span></div></div>}
        <div ref={chatEndRef} />
      </div>
      <div className="p-5 bg-slate-900/60 border-t border-slate-700 flex gap-3">
        <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="State an operational goal or risk query..." className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 shadow-inner" />
        <button onClick={handleSendMessage} disabled={!inputMessage.trim() || isAdvisorThinking} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl shadow-lg transition-all active:scale-95"><Send size={24} /></button>
      </div>
    </div>
  );

  const renderWeeklyTips = () => (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-10rem)] flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left"><h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-3"><Lightbulb size={28} className="text-yellow-400" />Weekly Intelligence Broadcast</h2><p className="text-sm text-slate-400">CEO-approved field training for the frontline.</p></div>
        <div className="flex flex-wrap gap-2 justify-center">
            <input type="text" value={customTipTopic} onChange={(e) => setCustomTipTopic(e.target.value)} placeholder="Enter a niche topic..." className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white md:w-64" />
            <button onClick={() => handleGenerateWeeklyTip(false)} disabled={isTipLoading || !customTipTopic} className="bg-slate-700 text-white px-5 rounded-xl text-sm font-bold">Custom</button>
            <button onClick={() => handleGenerateWeeklyTip(true)} disabled={isTipLoading} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">{isTipLoading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}Auto-Generate</button>
        </div>
      </div>
      <div className="flex-1 grid lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-8 bg-slate-800/50 rounded-3xl border border-slate-700 flex flex-col relative overflow-hidden">
          {weeklyTips.length > 0 ? (
            <>
               <div className={`relative p-5 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-1000 ${tipDispatchSuccess ? 'bg-emerald-500/20' : 'bg-blue-600/10'}`}>
                  {tipDispatchSuccess && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-white/5 to-emerald-500/20 animate-pulse" />}
                  <div className="flex items-center gap-3 relative z-10 font-bold uppercase tracking-widest text-xs text-blue-300">
                    <div className={`w-3 h-3 rounded-full ${tipDispatchSuccess ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-blue-500 animate-pulse'}`} />
                    {tipDispatchSuccess ? 'Dispatch Confirmed' : 'Ready for CEO Approval'}
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto relative z-10">
                    <button onClick={() => sendToCEO('whatsapp', weeklyTips[0])} disabled={!!tipDispatchSuccess} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${tipDispatchSuccess === 'whatsapp' ? 'bg-emerald-500 scale-105' : 'bg-green-600 hover:bg-green-700 shadow-xl shadow-green-900/20'}`}>{tipDispatchSuccess === 'whatsapp' ? <Check size={20} /> : <MessageCircle size={20} />} {tipDispatchSuccess === 'whatsapp' ? 'Done' : 'WhatsApp'}</button>
                    <button onClick={() => sendToCEO('email', weeklyTips[0])} disabled={!!tipDispatchSuccess} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${tipDispatchSuccess === 'email' ? 'bg-emerald-500 scale-105' : 'bg-slate-700 hover:bg-slate-600'}`}>{tipDispatchSuccess === 'email' ? <Check size={20} /> : <Mail size={20} />} {tipDispatchSuccess === 'email' ? 'Done' : 'Email Team'}</button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-900/20"><MarkdownRenderer content={weeklyTips[0].content} /></div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-12 text-center">{isTipLoading ? <RefreshCw className="animate-spin mb-6 text-yellow-500" size={48} /> : <Lightbulb size={80} className="mb-6 opacity-20" />}<h3 className="text-2xl font-bold mb-2">Intelligence Gap</h3><p className="max-w-xs text-slate-500">No training modules active. Initiate generation above.</p></div>
          )}
        </div>
        <div className="lg:col-span-4 bg-slate-800/30 rounded-3xl border border-slate-700 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-700 font-bold text-white flex items-center gap-3"><Calendar size={20} className="text-slate-500" />History</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {weeklyTips.map(tip => (
              <div key={tip.id} onClick={() => { setWeeklyTips([tip, ...weeklyTips.filter(t => t.id !== tip.id)]); }} className="group bg-slate-900/40 p-4 rounded-2xl border border-slate-800 hover:border-yellow-500/40 transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-slate-600 tracking-tighter">{tip.weekDate}</span></div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-yellow-400 truncate">{tip.topic}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBestPractices = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Globe size={28} className="text-blue-400" />Global Intelligence</h2>
          <p className="text-sm text-slate-400">Physical security standards and industry shifts.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input type="text" value={bpTopic} onChange={(e) => setBpTopic(e.target.value)} className="flex-1 md:w-80 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white" placeholder="Search standards..." />
          <button onClick={handleFetchBP} disabled={isBpLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">{isBpLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}Sync</button>
        </div>
      </div>
      {bpContent ? (
        <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-8 shadow-2xl">
          <div className="mb-6 flex justify-between items-start">
            <h3 className="text-xl font-bold text-white">Briefing: {bpTopic}</h3>
            <ShareButton title={`Intelligence: ${bpTopic}`} content={bpContent.text} />
          </div>
          <MarkdownRenderer content={bpContent.text} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-30"><Globe size={100} /><p className="mt-4 font-bold">Search global databases for standard operating procedures.</p></div>
      )}
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm"><BookOpen size={16} className="text-blue-400" />Training Builder</h3>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Target Audience</label>
            <select value={trainingRole} onChange={(e) => setTrainingRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200">
              {Object.values(SecurityRole).map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Intelligence Search (1M+ Bank)</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={trainingTopic} 
                  onChange={(e) => handleTopicSearch(e.target.value)} 
                  onFocus={() => { if(suggestedTopics.length > 0) setShowTopicSuggestions(true); }}
                  placeholder="e.g. Nerc-CIP, ASIS Standards..." 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-200 focus:border-blue-500 transition-all outline-none" 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   {isSuggestingTopics ? <RefreshCw className="animate-spin text-blue-500" size={14} /> : <Search size={14} className="text-slate-500" />}
                </div>
              </div>
              
              {showTopicSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                    {suggestedTopics.length > 0 ? (
                      suggestedTopics.map((topic, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => { setTrainingTopic(topic); setShowTopicSuggestions(false); }} 
                          className="w-full px-5 py-3.5 text-left text-[11px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700/50 last:border-0 transition-colors flex items-center gap-3"
                        >
                          <Activity size={12} className="text-blue-500" />
                          {topic}
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-[10px] uppercase font-bold tracking-widest">No matching practices</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleGenerateTraining} disabled={isTrainingLoading || !trainingTopic} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest">
              {isTrainingLoading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />} 
              Architect Training
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Core Standards Browse</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
              {GLOBAL_TRAINING_CATEGORIES.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-[9px] font-black text-blue-500 uppercase px-1">{cat.category}</p>
                  {cat.topics.slice(0, 3).map((t, ti) => (
                    <button key={ti} onClick={() => setTrainingTopic(t)} className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-slate-400 hover:bg-slate-700 hover:text-white truncate">{t}</button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {trainingContent && (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5 space-y-4">
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                 <Zap size={14} className="animate-pulse" /> Flash Accelerator
               </h4>
               <div className="grid grid-cols-1 gap-2">
                 {coPilotSuggestions.length > 0 ? (
                    coPilotSuggestions.map((s, i) => (
                      <button key={i} onClick={() => handleRefineWithPrompt(s)} disabled={isRefining} className="text-left p-3 bg-blue-600/10 border border-blue-500/10 rounded-xl text-[10px] text-slate-300 hover:bg-blue-600/20 hover:border-blue-500/40 transition-all flex items-start gap-2 group">
                        <Activity size={12} className="text-blue-400 shrink-0 mt-0.5 group-hover:scale-125 transition-transform" />
                        {s}
                      </button>
                    ))
                 ) : (
                    <div className="py-2 text-[10px] text-slate-500 italic text-center">Architect is analyzing current draft...</div>
                 )}
               </div>
               
               <div className="pt-2 border-t border-slate-700/50 space-y-2">
                  <button onClick={() => handleRefineWithPrompt("Add a realistic high-stakes scenario")} disabled={isRefining} className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2"><ArrowRight size={12} /> Add Field Scenario</button>
                  <button onClick={() => handleRefineWithPrompt("Add a legal compliance section")} disabled={isRefining} className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-400 flex items-center justify-center gap-2"><ArrowRight size={12} /> Legal Check</button>
               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-slate-800/50 rounded-3xl border border-slate-700 h-full min-h-[600px] flex flex-col overflow-hidden shadow-2xl relative">
          {trainingContent ? (
            <>
              <div className="p-4 border-b border-slate-700 bg-slate-900/40 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Architect Output</span>
                </div>
                <div className="flex gap-2">
                   <ShareButton title={`Training: ${trainingTopic}`} content={trainingContent} />
                   <button onClick={() => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }} className="bg-slate-700 text-white px-4 py-2 rounded-lg text-xs flex items-center gap-2">{saveSuccess ? <Check size={14} /> : <Save size={14} />}Save</button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <MarkdownRenderer content={trainingContent} />
                {isRefining && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center z-20 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-blue-500/30 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                      <Zap className="text-blue-500 animate-bounce" size={40} />
                      <p className="font-black text-blue-400 text-lg uppercase tracking-widest animate-pulse">Accelerating...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-900/60 border-t border-slate-700 flex gap-2">
                <input 
                  type="text" 
                  value={refineInstruction} 
                  onChange={(e) => setRefineInstruction(e.target.value)} 
                  placeholder="Tell Advisor what to change (Super Fast)..." 
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500" 
                  onKeyDown={(e) => e.key === 'Enter' && refineInstruction && handleRefineWithPrompt(refineInstruction)}
                />
                <button 
                  onClick={() => { handleRefineWithPrompt(refineInstruction); setRefineInstruction(''); }}
                  disabled={!refineInstruction || isRefining}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all shadow-lg active:scale-90"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-700/30 space-y-6">
              <Zap size={120} />
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase tracking-[0.2em]">Workbench Offline</h3>
                <p className="text-sm font-medium">Search the 1M knowledge bank above to begin.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReportAnalyzer = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-slate-800 mb-6">
        <button onClick={() => setAnalyzerTab('DAILY')} className={`px-6 py-3 font-bold text-sm border-b-2 ${analyzerTab === 'DAILY' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>Daily Incident Analysis</button>
        <button onClick={async () => { setAnalyzerTab('WEEKLY'); if (!weeklyInsight && storedReports.length > 0) { setIsWeeklyLoading(true); setWeeklyInsight(await generateWeeklyInsights(storedReports.slice(0, 10))); setIsWeeklyLoading(false); } }} className={`px-6 py-3 font-bold text-sm border-b-2 ${analyzerTab === 'WEEKLY' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500'}`}>Executive Briefing</button>
      </div>
      {analyzerTab === 'DAILY' ? (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white mb-2">Raw Narrative Entry</h3>
            <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Paste the field report here..." className="w-full h-80 bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" />
            <button onClick={handleAnalyzeReport} disabled={isAnalyzing || !reportText} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg">{isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <ShieldAlert size={20} />}Evaluate Liability</button>
          </div>
          <div className="bg-slate-800/80 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-700 bg-slate-900/40 font-bold text-white flex justify-between">AI Strategic Analysis {analysisResult && <ShareButton title="Risk Analysis" content={analysisResult} />}</div>
            <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">{analysisResult ? <MarkdownRenderer content={analysisResult} /> : <div className="h-full flex flex-col items-center justify-center opacity-10 text-slate-600"><FileText size={80} /></div>}</div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-8 shadow-2xl">
           <h3 className="text-2xl font-bold text-white mb-8">Weekly Operational Synthesis</h3>
           {isWeeklyLoading ? <div className="py-20 flex flex-col items-center gap-4 text-blue-400"><RefreshCw className="animate-spin" size={48} /><p className="font-bold animate-pulse">Distilling operational data...</p></div> : weeklyInsight ? <MarkdownRenderer content={weeklyInsight} /> : <div className="py-20 text-center opacity-20"><FileText size={100} /></div>}
        </div>
      )}
    </div>
  );

  const renderToolkit = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <h2 className="text-2xl font-bold text-white">Operations Library</h2>
       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {STATIC_TEMPLATES.map(template => (
           <div key={template.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group">
             <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Briefcase className="text-blue-400" size={24} /></div>
             <h3 className="font-bold text-lg text-white mb-2">{template.title}</h3>
             <p className="text-sm text-slate-400 mb-6">{template.description}</p>
             <div className="flex gap-2">
               <button onClick={() => setQuickViewData({ title: template.title, content: template.content })} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-bold">Preview</button>
               <button onClick={() => { navigator.clipboard.writeText(template.content); setQuickViewData({ title: 'Success', content: 'Copied to clipboard.' }); setTimeout(() => setQuickViewData(null), 1500); }} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl"><Copy size={18} /></button>
             </div>
           </div>
         ))}
       </div>
    </div>
  );

  // --- Modals ---
  const renderSettingsModal = () => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900"><h3 className="text-xl font-bold text-white flex items-center gap-2"><SettingsIcon size={20} className="text-slate-400" />CEO Alert & Security</h3><button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><X size={24} /></button></div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Profile Details</h4>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">CEO Name</label><input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">WhatsApp</label><input type="text" value={userProfile.phoneNumber} onChange={(e) => setUserProfile({...userProfile, phoneNumber: e.target.value})} placeholder="+1234567890" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Email</label><input type="text" value={userProfile.email} onChange={(e) => setUserProfile({...userProfile, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none" /></div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Security Vault PIN</h4>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Access PIN (4 Digits)</label>
              <div className="relative">
                 <input 
                   type="password" 
                   maxLength={4} 
                   value={userProfile.password || ''} 
                   onChange={(e) => setUserProfile({...userProfile, password: e.target.value.replace(/\D/g, '').substring(0, 4)})} 
                   placeholder="Enter 4 digit PIN" 
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none tracking-[0.5em]" 
                 />
                 <Key size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" />
              </div>
              <p className="text-[9px] text-slate-500 mt-2 ml-1">This PIN will be required every time the app opens.</p>
            </div>
          </div>

          <button onClick={() => { setSettingsSaved(true); setTimeout(() => { setSettingsSaved(false); setShowSettings(false); }, 1500); }} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20 active:scale-95 transition-all">{settingsSaved ? <Check size={20} /> : <Save size={20} />}{settingsSaved ? 'Security Updated' : 'Sync Profile'}</button>
        </div>
      </div>
    </div>
  );

  const renderNewTipAlertModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl w-full max-w-lg shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
           <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Lightbulb size={40} className="text-yellow-400" /></div>
           <h3 className="text-3xl font-bold text-white mb-2">New Intelligence Ready</h3>
           <p className="text-slate-400 mb-8">"{showNewTipAlert?.topic}" module finalized for dispatch.</p>
           <div className="grid grid-cols-2 gap-4"><button onClick={() => showNewTipAlert && sendToCEO('whatsapp', showNewTipAlert)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-1 shadow-lg shadow-green-900/20"><MessageCircle size={24} /><span className="text-xs">WhatsApp</span></button><button onClick={() => showNewTipAlert && sendToCEO('email', showNewTipAlert)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-1 border border-slate-700"><Mail size={24} /><span className="text-xs">Email</span></button></div>
           <button onClick={() => setShowNewTipAlert(null)} className="mt-6 text-slate-500 font-bold text-sm">Review Later</button>
      </div>
    </div>
  );

  const renderKbModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/40"><h3 className="text-xl font-bold text-white flex items-center gap-3"><Database size={24} className="text-emerald-400" />Strategic Memory</h3><button onClick={() => setShowKbModal(false)} className="text-slate-400 hover:text-white"><X size={28} /></button></div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-slate-700 bg-slate-900/60 p-4 overflow-y-auto space-y-2">
            <button onClick={() => { setNewDocTitle(''); setNewDocContent(''); }} className="w-full flex items-center gap-2 p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs mb-4"><Plus size={16} /> Add Entry</button>
            {knowledgeBase.map(doc => (<div key={doc.id} className="group relative"><button onClick={() => { setNewDocTitle(doc.title); setNewDocContent(doc.content); }} className="w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-800 text-xs truncate font-medium border border-transparent hover:border-slate-700">{doc.title}</button><button onClick={() => setKnowledgeBase(prev => prev.filter(d => d.id !== doc.id))} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={12} /></button></div>))}
          </div>
          <div className="flex-1 p-6 flex flex-col space-y-4 bg-slate-900/20"><input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="Entry Title" className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold" /><textarea value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)} placeholder="Paste policy/context..." className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-5 text-slate-300 text-sm" /><button onClick={() => { if (!newDocTitle || !newDocContent) return; setKnowledgeBase(prev => [{ id: Date.now().toString(), title: newDocTitle, content: newDocContent, dateAdded: new Date().toLocaleDateString() }, ...prev.filter(d => d.title !== newDocTitle)]); setNewDocTitle(''); setNewDocContent(''); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Upload size={18} /> Sync Memory</button></div>
        </div>
      </div>
    </div>
  );

  const renderQuickViewModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/40"><h3 className="text-xl font-bold text-white">{quickViewData?.title}</h3><button onClick={() => setQuickViewData(null)} className="text-slate-500 hover:text-white"><X size={24} /></button></div>
        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{quickViewData?.content}</div>
        <div className="p-6 border-t border-slate-700 bg-slate-900/60 flex gap-3"><button onClick={() => { navigator.clipboard.writeText(quickViewData?.content || ''); setQuickViewData(null); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Copy size={18} /> Copy to Clipboard</button></div>
      </div>
    </div>
  );

  if (isInitializing) {
    return <SplashScreen onFinish={() => setIsInitializing(false)} />;
  }

  // Auth Gate check after Splash Screen
  if (isLocked) {
    return (
      <SecurityGate 
        storedPin={userProfile.password} 
        userName={userProfile.name} 
        onUnlock={() => setIsLocked(false)}
        onRegister={handlePinRegistration}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 lg:pb-0 animate-in fade-in duration-1000">
      <Navigation currentView={currentView} setView={setCurrentView} isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} onOpenSettings={() => setShowSettings(true)} bestPracticesBadge={bpBadgeCount} />
      
      <BottomNavigation currentView={currentView} setView={setCurrentView} onOpenMenu={() => setIsMobileMenuOpen(true)} bestPracticesBadge={bpBadgeCount} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="lg:hidden p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md z-30 shadow-xl">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center border border-white/10 shadow-lg">
                <svg viewBox="0 0 200 200" className="w-6 h-6">
                  <path d="M100 10 L10 170 L190 170 Z" fill="white" />
                  <circle cx="100" cy="100" r="55" fill="black" />
                  <text x="100" y="118" fontSize="60" fontWeight="bold" fontFamily="serif" textAnchor="middle" fill="white">AR</text>
                </svg>
             </div>
             <span className="font-bold text-lg tracking-tight">AntiRisk CEO</span>
           </div>
           <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 active:bg-slate-800 rounded-lg relative">
             <SettingsIcon size={24} />
             {(!userProfile.password || userProfile.password.length !== 4) && (
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-slate-900 animate-ping" />
             )}
           </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950">
          <div className="max-w-6xl mx-auto pb-12 lg:pb-0">
            {currentView === View.DASHBOARD && renderDashboard()}
            {currentView === View.ADVISOR && renderAdvisor()}
            {currentView === View.WEEKLY_TIPS && renderWeeklyTips()}
            {currentView === View.BEST_PRACTICES && renderBestPractices()}
            {currentView === View.TRAINING && renderTraining()}
            {currentView === View.REPORT_ANALYZER && renderReportAnalyzer()}
            {currentView === View.TOOLKIT && renderToolkit()}
          </div>
        </div>

        {showSettings && renderSettingsModal()}
        {showNewTipAlert && renderNewTipAlertModal()}
        {showKbModal && renderKbModal()}
        {quickViewData && renderQuickViewModal()}
        {showBpToast && <div className="fixed bottom-28 right-6 lg:bottom-6 bg-slate-800/90 backdrop-blur border-l-4 border-blue-500 text-white p-5 rounded-2xl shadow-2xl animate-in slide-in-from-right flex items-center gap-6 z-50"><div><p className="font-bold">Global Briefing Updated</p><p className="text-xs text-slate-400">New physical security standards sourced.</p></div><button onClick={() => { setCurrentView(View.BEST_PRACTICES); setShowBpToast(false); }} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black">VIEW</button></div>}
      </main>
    </div>
  );
}

export default App;
