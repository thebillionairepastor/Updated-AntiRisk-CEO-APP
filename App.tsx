
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

  const [bpTopic, setBpTopic] = useState('Global Private Security Trends 2024');
  const [bpContent, setBpContent] = useState<{ text: string, sources?: any[] } | null>(null);
  const [isBpLoading, setIsBpLoading] = useState(false);
  const [hasAutoFetchedBp, setHasAutoFetchedBp] = useState(false);
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
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const [customTipTopic, setCustomTipTopic] = useState('');
  const [hasCheckedWeeklyTip, setHasCheckedWeeklyTip] = useState(false);
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
    setIsTrainingLoading(true); setShowTopicSuggestions(false);
    const content = await generateTrainingModule(trainingRole, trainingTopic, trainingContent);
    setTrainingContent(content); setIsTrainingLoading(false);
  };

  const handleAnalyzeReport = async () => {
    if (!reportText) return;
    setIsAnalyzing(true);
    const result = await analyzeReport(reportText, storedReports.slice(0, 5));
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
    const newTip: WeeklyTip = { id: Date.now().toString(), timestamp: Date.now(), weekDate: new Date().toLocaleDateString(), topic: topicMatch ? topicMatch[1].trim() : "Weekly Tip", content, isAutoGenerated: isAuto };
    setWeeklyTips(prev => [newTip, ...prev]);
    setSelectedTipId(newTip.id);
    setIsTipLoading(false);
    setShowNewTipAlert(newTip);
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
        <div className="flex flex-wrap gap-2 justify-center"><input type="text" value={customTipTopic} onChange={(e) => setCustomTipTopic(e.target.value)} placeholder="Enter a niche topic..." className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white md:w-64" /><button onClick={() => handleGenerateWeeklyTip(false)} disabled={isTipLoading || !customTipTopic} className="bg-slate-700 text-white px-5 rounded-xl text-sm font-bold">Custom</button><button onClick={() => handleGenerateWeeklyTip(true)} disabled={isTipLoading} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">{isTipLoading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}Auto-Generate Week</button></div>
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
                    <button onClick={() => sendToCEO('whatsapp', weeklyTips[0])} disabled={!!tipDispatchSuccess} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${tipDispatchSuccess === 'whatsapp' ? 'bg-emerald-500 scale-105' : 'bg-green-600 hover:bg-green-700 shadow-xl shadow-green-900/20'}`}>{tipDispatchSuccess === 'whatsapp' ? <Check size={20} /> : <MessageCircle size={20} />} {tipDispatchSuccess === 'whatsapp' ? 'Done' : 'WhatsApp Broadcast'}</button>
                    <button onClick={() => sendToCEO('email', weeklyTips[0])} disabled={!!tipDispatchSuccess} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${tipDispatchSuccess === 'email' ? 'bg-emerald-500 scale-105' : 'bg-slate-700 hover:bg-slate-600'}`}>{tipDispatchSuccess === 'email' ? <Check size={20} /> : <Mail size={20} />} {tipDispatchSuccess === 'email' ? 'Done' : 'Email Team'}</button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-8 scrollbar-hide bg-slate-900/20"><MarkdownRenderer content={weeklyTips[0].content} /></div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-12 text-center">{isTipLoading ? <RefreshCw className="animate-spin mb-6 text-yellow-500" size={48} /> : <Lightbulb size={80} className="mb-6 opacity-20" />}<h3 className="text-2xl font-bold mb-2">Intelligence Gap</h3><p className="max-w-xs text-slate-500">No training modules active for this period. Initiate generation above.</p></div>
          )}
        </div>
        <div className="lg:col-span-4 bg-slate-800/30 rounded-3xl border border-slate-700 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-700 font-bold text-white flex items-center gap-3"><Calendar size={20} className="text-slate-500" />Historical Briefs</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
            {weeklyTips.map(tip => (
              <div key={tip.id} onClick={() => { setWeeklyTips([tip, ...weeklyTips.filter(t => t.id !== tip.id)]); }} className="group bg-slate-900/40 p-4 rounded-2xl border border-slate-800 hover:border-yellow-500/40 transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-slate-600 tracking-tighter">{tip.weekDate}</span>{tip.isAutoGenerated && <span className="text-[8px] bg-blue-900/30 text-blue-400 px-1.5 rounded">AI</span>}</div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-yellow-400 truncate">{tip.topic}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // --- Missing View Renders ---

  const renderBestPractices = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Globe size={28} className="text-blue-400" />Global Best Practices</h2>
          <p className="text-sm text-slate-400">Real-time intelligence on global security standards.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" 
            value={bpTopic} 
            onChange={(e) => setBpTopic(e.target.value)}
            className="flex-1 md:w-80 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white"
            placeholder="Search standards (e.g. ISO 18788)..."
          />
          <button 
            onClick={handleFetchBP}
            disabled={isBpLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2"
          >
            {isBpLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
            Sync
          </button>
        </div>
      </div>

      {bpContent ? (
        <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-8">
          <div className="mb-6 flex justify-between items-start">
            <h3 className="text-xl font-bold text-white">Intelligence Briefing</h3>
            <ShareButton title={`Best Practices: ${bpTopic}`} content={bpContent.text} />
          </div>
          <MarkdownRenderer content={bpContent.text} />
          {bpContent.sources && bpContent.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-700">
              <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Verified Sources</h4>
              <div className="flex flex-wrap gap-3">
                {bpContent.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-blue-400 hover:bg-slate-700 transition-colors"
                  >
                    <Globe size={12} />
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <Globe size={80} className="mb-6 opacity-20" />
          <h3 className="text-xl font-bold mb-2">Global Sync Ready</h3>
          <p>Sync with global databases for the latest security protocols.</p>
        </div>
      )}
    </div>
  );

  const renderTraining = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2"><BookOpen size={20} className="text-blue-400" />Builder Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Role</label>
                <select 
                  value={trainingRole}
                  onChange={(e) => setTrainingRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200"
                >
                  {Object.values(SecurityRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={trainingTopic}
                    onChange={(e) => setTrainingTopic(e.target.value)}
                    placeholder="e.g. Tactical Communication"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 pr-10"
                  />
                  <button 
                    onClick={async () => {
                      setIsSuggestingTopics(true);
                      const suggestions = await getTrainingSuggestions(storedReports);
                      setSuggestedTopics(suggestions);
                      setShowTopicSuggestions(true);
                      setIsSuggestingTopics(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 p-1"
                  >
                    <Sparkles size={18} className={isSuggestingTopics ? 'animate-pulse' : ''} />
                  </button>
                </div>
                
                {showTopicSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 overflow-hidden">
                    {suggestedTopics.map((topic, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setTrainingTopic(topic); setShowTopicSuggestions(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700 last:border-0"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {isTrainingLoading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Generate Module
              </button>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-2xl border border-slate-700 p-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Topic Categories</h4>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
              {GLOBAL_TRAINING_CATEGORIES.map((cat, i) => (
                <div key={i} className="mb-3">
                  <span className="text-[10px] text-slate-400 font-bold">{cat.category}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cat.topics.map((t, j) => (
                      <button 
                        key={j} 
                        onClick={() => setTrainingTopic(t)}
                        className="text-[9px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full hover:border-blue-500 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {trainingContent ? (
            <div className="bg-slate-800/50 rounded-3xl border border-slate-700 h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-700 bg-slate-900/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-400">DRAFT 1.0</span>
                </div>
                <div className="flex gap-2">
                   <ShareButton title={`Training: ${trainingTopic}`} content={trainingContent} />
                   <button 
                    onClick={() => { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000); }}
                    className="bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                   >
                     {saveSuccess ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />}
                     Save
                   </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <MarkdownRenderer content={trainingContent} />
              </div>
              <div className="p-4 bg-slate-900/40 border-t border-slate-700">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="Refine this module (e.g. 'Make it more technical')"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm"
                  />
                  <button 
                    onClick={async () => {
                      setIsRefining(true);
                      const refined = await refineTrainingModule(trainingContent, refineInstruction);
                      setTrainingContent(refined);
                      setRefineInstruction('');
                      setIsRefining(false);
                    }}
                    disabled={isRefining || !refineInstruction}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    {isRefining ? <RefreshCw className="animate-spin" size={16} /> : <Edit3 size={16} />}
                    Refine
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-700 h-full flex flex-col items-center justify-center text-slate-600 p-12 text-center">
              <BookOpen size={80} className="mb-6 opacity-20" />
              <h3 className="text-2xl font-bold mb-2">Training Workbench</h3>
              <p className="max-w-xs text-slate-500">Select a role and topic to generate professional-grade security training material.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReportAnalyzer = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-slate-800 mb-6">
        <button 
          onClick={() => setAnalyzerTab('DAILY')}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${analyzerTab === 'DAILY' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Daily Incident Entry
        </button>
        <button 
          onClick={async () => {
            setAnalyzerTab('WEEKLY');
            if (!weeklyInsight && storedReports.length > 0) {
              setIsWeeklyLoading(true);
              const insight = await generateWeeklyInsights(storedReports.slice(0, 10));
              setWeeklyInsight(insight);
              setIsWeeklyLoading(false);
            }
          }}
          className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${analyzerTab === 'WEEKLY' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Executive Weekly Briefing
        </button>
      </div>

      {analyzerTab === 'DAILY' ? (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 shadow-xl">
              <h3 className="font-bold text-white mb-4 flex items-center gap-3"><FileText size={20} className="text-blue-400" />Raw Incident Input</h3>
              <textarea 
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Paste the incident narrative here (The 5Ws)..."
                className="w-full h-64 bg-slate-900 border border-slate-700 rounded-2xl p-5 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors scrollbar-hide"
              />
              <button 
                onClick={handleAnalyzeReport}
                disabled={isAnalyzing || !reportText}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" size={20} /> : <ShieldAlert size={20} />}
                Analyze for Liability & Root Cause
              </button>
            </div>
            
            <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 overflow-hidden">
               <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex justify-between items-center">
                 <span>Recent History</span>
                 <button onClick={() => setStoredReports([])} className="text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={12} /> Clear</button>
               </h4>
               <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                  {storedReports.map(report => (
                    <div key={report.id} onClick={() => setAnalysisResult(report.analysis)} className="p-4 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-blue-500/50 cursor-pointer transition-colors group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-500 font-mono">{report.dateStr}</span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400" />
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{report.content}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col h-full">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
              <h3 className="font-bold text-white flex items-center gap-2"><Sparkles className="text-yellow-400" size={20} />AI Analysis Result</h3>
              {analysisResult && <ShareButton title="Incident Analysis Brief" content={analysisResult} />}
            </div>
            <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
              {analysisResult ? (
                <MarkdownRenderer content={analysisResult} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-4">
                  <ShieldAlert size={60} />
                  <p className="font-medium">Run analysis to see liability breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white">Strategic Weekly Synthesis</h3>
                <p className="text-slate-400">Trend analysis for the CEO Executive Suite.</p>
              </div>
              {weeklyInsight && <ShareButton title="Executive Weekly Briefing" content={weeklyInsight} />}
           </div>
           
           {isWeeklyLoading ? (
             <div className="py-20 flex flex-col items-center gap-4 text-blue-400">
               <RefreshCw className="animate-spin" size={48} />
               <p className="font-bold animate-pulse">Synthesizing raw data into intelligence...</p>
             </div>
           ) : weeklyInsight ? (
             <MarkdownRenderer content={weeklyInsight} />
           ) : (
             <div className="py-20 text-center space-y-4 text-slate-600">
               <FileText size={80} className="mx-auto opacity-20" />
               <p>No enough incident data to generate a weekly synthesis.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );

  const renderToolkit = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       <div>
         <h2 className="text-2xl font-bold text-white mb-2">Ops Toolkit</h2>
         <p className="text-slate-400">Standard operational templates and forms for quick dispatch.</p>
       </div>

       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
         {STATIC_TEMPLATES.map(template => (
           <div key={template.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all group shadow-lg">
             <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Briefcase className="text-blue-400" size={24} /></div>
             <h3 className="font-bold text-lg text-white mb-2">{template.title}</h3>
             <p className="text-sm text-slate-400 mb-6">{template.description}</p>
             <div className="flex gap-2">
               <button onClick={() => setQuickViewData({ title: template.title, content: template.content })} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors">Preview</button>
               <button onClick={() => { navigator.clipboard.writeText(template.content); setQuickViewData({ title: 'Success', content: 'Copied to clipboard.' }); setTimeout(() => setQuickViewData(null), 1500); }} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors"><Copy size={18} /></button>
             </div>
           </div>
         ))}
       </div>

       <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 border-dashed flex flex-col items-center justify-center text-center space-y-4">
          <Plus size={48} className="text-slate-700" />
          <h3 className="text-xl font-bold text-slate-500">Custom Form Builder</h3>
          <p className="text-slate-600 max-w-sm">Need a specific site-form? Use the AI Advisor to draft a template, then save it here.</p>
          <button onClick={() => setCurrentView(View.ADVISOR)} className="text-blue-400 font-bold hover:underline">Go to Advisor →</button>
       </div>
    </div>
  );

  // --- Missing Modal Renders ---

  const renderSettingsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><SettingsIcon size={20} className="text-slate-400" />Profile & Alerts</h3>
          <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CEO Name</label>
              <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp (Intl. Format)</label>
              <input type="text" value={userProfile.phoneNumber} onChange={(e) => setUserProfile({...userProfile, phoneNumber: e.target.value})} placeholder="+1234567890" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
              <input type="text" value={userProfile.email} onChange={(e) => setUserProfile({...userProfile, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white" />
            </div>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
            <Bell className="text-blue-400 shrink-0" />
            <p className="text-xs text-slate-300 leading-relaxed">Notifications are active. You will receive alerts when global security trends shift or when weekly training is ready for dispatch.</p>
          </div>
          <button 
            onClick={() => { setSettingsSaved(true); setTimeout(() => { setSettingsSaved(false); setShowSettings(false); }, 1500); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            {settingsSaved ? <Check size={20} /> : <Save size={20} />}
            {settingsSaved ? 'Saved Successfully' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNewTipAlertModal = () => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-1 bg-gradient-to-r from-yellow-500/50 via-blue-500/50 to-yellow-500/50 animate-gradient-x" />
        <div className="p-8 text-center">
           <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Lightbulb size={40} className="text-yellow-400" />
           </div>
           <h3 className="text-3xl font-bold text-white mb-2">Weekly Tip Ready</h3>
           <p className="text-slate-400 mb-8">AI Chief of Standards has finalized the training module for this week: <span className="text-yellow-400 font-bold">"{showNewTipAlert?.topic}"</span></p>
           
           <div className="grid grid-cols-2 gap-4">
             <button 
              onClick={() => showNewTipAlert && sendToCEO('whatsapp', showNewTipAlert)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 shadow-lg shadow-green-900/20"
             >
               <MessageCircle size={24} />
               <span className="text-xs">Broadcast WhatsApp</span>
             </button>
             <button 
              onClick={() => showNewTipAlert && sendToCEO('email', showNewTipAlert)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 border border-slate-700"
             >
               <Mail size={24} />
               <span className="text-xs">Email Team</span>
             </button>
           </div>
           <button onClick={() => setShowNewTipAlert(null)} className="mt-6 text-slate-500 hover:text-white font-bold text-sm">Review Later</button>
        </div>
      </div>
    </div>
  );

  const renderKbModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/40">
          <h3 className="text-xl font-bold text-white flex items-center gap-3"><Database size={24} className="text-emerald-400" />Internal Knowledge Base</h3>
          <button onClick={() => setShowKbModal(false)} className="text-slate-400 hover:text-white p-1"><X size={28} /></button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-slate-700 bg-slate-900/60 p-4 overflow-y-auto space-y-2">
            <button 
              onClick={() => { setNewDocTitle(''); setNewDocContent(''); }}
              className="w-full flex items-center gap-2 p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs mb-4"
            >
              <Plus size={16} /> New Entry
            </button>
            {knowledgeBase.map(doc => (
              <div key={doc.id} className="group relative">
                <button 
                  onClick={() => { setNewDocTitle(doc.title); setNewDocContent(doc.content); }}
                  className="w-full text-left p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-xs truncate font-medium border border-transparent hover:border-slate-700"
                >
                  {doc.title}
                </button>
                <button 
                  onClick={() => setKnowledgeBase(prev => prev.filter(d => d.id !== doc.id))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex-1 p-6 flex flex-col space-y-4 bg-slate-900/20">
             <input 
              type="text" 
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Document Title (e.g. Site SOP 2024)"
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold"
             />
             <textarea 
              value={newDocContent}
              onChange={(e) => setNewDocContent(e.target.value)}
              placeholder="Paste the site-specific standard or policy here. The AI Advisor will use this context for future responses."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-5 text-slate-300 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
             />
             <button 
              onClick={() => {
                if (!newDocTitle || !newDocContent) return;
                const newDoc: KnowledgeDocument = { id: Date.now().toString(), title: newDocTitle, content: newDocContent, dateAdded: new Date().toLocaleDateString() };
                setKnowledgeBase(prev => [newDoc, ...prev.filter(d => d.title !== newDocTitle)]);
                setNewDocTitle(''); setNewDocContent('');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
             >
               <Upload size={18} /> Sync Document
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuickViewModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/40">
          <h3 className="text-xl font-bold text-white">{quickViewData?.title}</h3>
          <button onClick={() => setQuickViewData(null)} className="text-slate-500 hover:text-white"><X size={24} /></button>
        </div>
        <div className="flex-1 p-8 overflow-y-auto scrollbar-hide font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
          {quickViewData?.content}
        </div>
        <div className="p-6 border-t border-slate-700 bg-slate-900/60 flex gap-3">
          <button onClick={() => { navigator.clipboard.writeText(quickViewData?.content || ''); setQuickViewData(null); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
            <Copy size={18} /> Copy Content
          </button>
          <button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white px-6 rounded-xl transition-colors"><Printer size={18} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navigation currentView={currentView} setView={setCurrentView} isMobileMenuOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} onOpenSettings={() => setShowSettings(true)} bestPracticesBadge={bpBadgeCount} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="lg:hidden p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md z-30 shadow-xl">
           <div className="flex items-center gap-2"><div className="w-8 h-8 bg-red-700 rounded-md flex items-center justify-center font-bold text-white shadow-lg">AR</div><span className="font-bold text-lg tracking-tight">AntiRisk CEO</span></div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-400 active:bg-slate-800 rounded-lg"><Menu size={28} /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950">
          <div className="max-w-6xl mx-auto">
            {currentView === View.DASHBOARD && renderDashboard()}
            {currentView === View.ADVISOR && renderAdvisor()}
            {currentView === View.WEEKLY_TIPS && renderWeeklyTips()}
            {currentView