// src/popup/popup.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Scale, 
  History, 
  BrainCircuit, 
  Copy, 
  ChevronRight,
  Trash2,
  Sparkles,
  Gavel
} from 'lucide-react';

interface Jurisprudence {
  id: string;
  titulo: string;
  tribunal: string;
  numero: string;
  relator: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
  relevancia: number;
  tema: string;
  aiAnalysis?: {
    matchScore: number;
    executiveSummary: string;
    applicabilityTip: string;
  };
}

interface SearchResult {
  success: boolean;
  jurisprudencias: Jurisprudence[];
  totalFound: number;
  searchTime: number;
}

interface HistoryItem {
  query: string;
  timestamp: number;
  resultsCount: number;
}

const JurisCheckPopup: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('jurischeck_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            if (response?.text) setSearchQuery(response.text);
          });
        }
      });
    }
  }, []);

  const saveToHistory = (query: string, count: number) => {
    const newItem: HistoryItem = { query, timestamp: Date.now(), resultsCount: count };
    const updatedHistory = [newItem, ...history.filter(h => h.query !== query).slice(0, 14)];
    setHistory(updatedHistory);
    localStorage.setItem('jurischeck_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('jurischeck_history');
  };

  const handleSearch = async (queryToSearch?: string) => {
    const finalQuery = queryToSearch || searchQuery;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setError('');
    setActiveTab('search');

    try {
      const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: finalQuery })
      });

      if (!response.ok) throw new Error('Falha na conexão com o servidor');

      const data: SearchResult = await response.json();
      if (data.success) {
        setSearchResults(data);
        saveToHistory(finalQuery, data.jurisprudencias.length);
      } else {
        setError('Nenhum resultado encontrado para este contexto.');
      }
    } catch (err) {
      setError('O servidor de IA está offline. Verifique o backend.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMatchStyles = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 70) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="w-[400px] h-[550px] bg-slate-50 flex flex-col shadow-2xl overflow-hidden font-sans antialiased">
      {/* Header Premium */}
      <header className="bg-slate-900 text-white p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">JurisCheck</h1>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Inteligência Jurídica</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-300 uppercase">Live</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex bg-white border-b border-slate-200 px-2">
        {[
          { id: 'search', icon: Search, label: 'Análise' },
          { id: 'history', icon: History, label: 'Histórico' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-all relative ${
              activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-bounce-short' : ''}`} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full mx-4"></div>
            )}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'search' && (
          <div className="p-5 space-y-6">
            {/* Search Box */}
            <div className="group relative bg-white p-1 rounded-2xl shadow-sm border border-slate-200 focus-within:border-indigo-400 transition-all">
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cole um trecho de petição ou selecione um texto na página..."
                className="w-full h-28 p-4 text-sm text-slate-700 bg-transparent border-none focus:ring-0 resize-none placeholder:text-slate-300"
              />
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-medium px-2">
                  {searchQuery.length} caracteres
                </span>
                <button
                  onClick={() => handleSearch()}
                  disabled={loading || !searchQuery.trim()}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all flex items-center gap-2 shadow-md shadow-indigo-200"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Analisar com IA
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Results List */}
            {searchResults && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Precedentes Encontrados</h3>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {searchResults.totalFound} resultados
                  </span>
                </div>

                {searchResults.jurisprudencias.map((juris, idx) => (
                  <article 
                    key={juris.id} 
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-50 flex justify-between items-start bg-slate-50/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">{juris.tribunal}</span>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{juris.numero}</h4>
                      </div>
                      {juris.aiAnalysis && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black ${getMatchStyles(juris.aiAnalysis.matchScore)}`}>
                          <BrainCircuit className="w-3 h-3" />
                          {juris.aiAnalysis.matchScore}% MATCH
                        </div>
                      )}
                    </div>

                    {/* AI Insight Box */}
                    {juris.aiAnalysis && (
                      <div className="mx-4 mt-4 p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl relative">
                        <div className="absolute -top-2 -left-2 bg-white p-1 rounded-lg border border-indigo-100 shadow-sm">
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium italic">
                          "{juris.aiAnalysis.executiveSummary}"
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-indigo-600">
                          <CheckCircle className="w-3 h-3" />
                          {juris.aiAnalysis.applicabilityTip}
                        </div>
                      </div>
                    )}

                    {/* Ementa Preview */}
                    <div className="p-4">
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                        {juris.ementa}
                      </p>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.open(juris.link, '_blank')}
                          className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Inteiro Teor
                        </button>
                        <button 
                          onClick={() => copyToClipboard(`${juris.numero} - ${juris.tribunal}\n${juris.ementa}`, juris.id)}
                          className={`px-4 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                            copiedId === juris.id 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {copiedId === juris.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Empty State Search */}
            {!searchResults && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                  <Gavel className="w-10 h-10 text-indigo-200" />
                </div>
                <h3 className="text-slate-800 font-bold">Pronto para analisar</h3>
                <p className="text-xs text-slate-400 max-w-[200px] mt-2">
                  Selecione um texto jurídico ou cole aqui para encontrar precedentes.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscas Recentes</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <History className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-sm text-slate-400">Seu histórico está vazio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => { setSearchQuery(item.query); handleSearch(item.query); }}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between group text-left"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{item.query}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="text-[10px] font-bold text-indigo-500">{item.resultsCount} resultados</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Minimalista */}
      <footer className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">JurisCheck v1.5</span>
        </div>
        <span className="text-[9px] font-bold text-slate-300 uppercase">Powered by AI Engine</span>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-short { animation: bounce-short 2s infinite; }
      `}</style>
    </div>
  );
};

export default JurisCheckPopup;
