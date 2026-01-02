// src/popup/popup.tsx
import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ExternalLink, CheckCircle, AlertCircle, Loader2, Scale, FileText, Gavel, History, BrainCircuit } from 'lucide-react';

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
  suggestions?: string[];
}

interface HistoryItem {
  query: string;
  timestamp: number;
  resultsCount: number;
}

const JurisCheckPopup: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'search' | 'verify' | 'history'>('search');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Carrega histórico do localStorage
    const savedHistory = localStorage.getItem('jurischeck_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
            if (response?.text) {
              setSelectedText(response.text);
              setSearchQuery(response.text);
            }
          });
        }
      });
    }
  }, []);

  const saveToHistory = (query: string, count: number) => {
    const newItem: HistoryItem = { query, timestamp: Date.now(), resultsCount: count };
    const updatedHistory = [newItem, ...history.slice(0, 19)];
    setHistory(updatedHistory);
    localStorage.setItem('jurischeck_history', JSON.stringify(updatedHistory));
  };

  const handleSearch = async (queryToSearch?: string) => {
    const finalQuery = queryToSearch || searchQuery;
    if (!finalQuery.trim()) {
      setError('Por favor, insira um texto para busca.');
      return;
    }

    setLoading(true);
    setError('');
    setActiveTab('search');

    try {
      const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: finalQuery })
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const data: SearchResult = await response.json();
      if (data.success) {
        setSearchResults(data);
        saveToHistory(finalQuery, data.jurisprudencias.length);
      } else {
        setError('Nenhuma jurisprudência encontrada.');
      }
    } catch (err) {
      setError('Erro ao buscar jurisprudências. Verifique o backend.');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-slate-600 bg-slate-50 border-slate-100';
  };

  return (
    <div className="w-96 h-[500px] bg-white flex flex-col shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-indigo-300" />
          <h1 className="text-md font-bold tracking-tight">JurisCheck <span className="font-light opacity-70">Pro</span></h1>
        </div>
        <BrainCircuit className="w-5 h-5 text-indigo-300 animate-pulse" />
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-slate-50">
        {[
          { id: 'search', icon: Search, label: 'Busca' },
          { id: 'history', icon: History, label: 'Histórico' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cole o texto jurídico aqui..."
                className="w-full h-24 p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-slate-50"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">{error}</div>}

            {searchResults && (
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultados com Análise de IA</p>
                {searchResults.jurisprudencias.map((juris) => (
                  <div key={juris.id} className="group border border-slate-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 uppercase">{juris.tribunal}</span>
                      {juris.aiAnalysis && (
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${getMatchColor(juris.aiAnalysis.matchScore)}`}>
                          <BrainCircuit className="w-3 h-3" />
                          {juris.aiAnalysis.matchScore}% MATCH
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2 leading-tight">{juris.numero}</h4>
                    
                    {juris.aiAnalysis && (
                      <div className="mb-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                        <p className="text-xs text-indigo-900 leading-relaxed italic">
                          " {juris.aiAnalysis.executiveSummary} "
                        </p>
                        <p className="text-[10px] font-bold text-indigo-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {juris.aiAnalysis.applicabilityTip}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{juris.ementa}</p>
                    
                    <button 
                      onClick={() => window.open(juris.link, '_blank')}
                      className="w-full py-2 text-xs font-bold text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-3 h-3" /> Ver Inteiro Teor
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Nenhuma busca recente</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setSearchQuery(item.query); handleSearch(item.query); }}
                  className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex justify-between items-center"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-xs font-medium text-slate-700 truncate">{item.query}</p>
                    <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()} • {item.resultsCount} resultados</p>
                  </div>
                  <Search className="w-3 h-3 text-slate-300" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">JurisCheck v1.2.0</span>
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Backend Online</span>
        </div>
      </div>
    </div>
  );
};

export default JurisCheckPopup;
