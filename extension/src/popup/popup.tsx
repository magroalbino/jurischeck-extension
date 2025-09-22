// src/popup/popup.tsx

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, ExternalLink, CheckCircle, AlertCircle, Loader2, Scale, FileText, Gavel } from 'lucide-react';

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
}

interface SearchResult {
  success: boolean;
  jurisprudencias: Jurisprudence[];
  totalFound: number;
  searchTime: number;
  suggestions?: string[];
}

const JurisCheckPopup: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'search' | 'verify' | 'history'>('search');

  useEffect(() => {
    // Verifica se chrome.tabs está disponível
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.warn('Chrome extension API error:', chrome.runtime.lastError);
          return;
        }

        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'getSelectedText' },
            (response) => {
              if (chrome.runtime.lastError) {
                console.warn('Message sending error:', chrome.runtime.lastError);
                return;
              }

              if (response?.text) {
                setSelectedText(response.text);
                setSearchQuery(response.text);
              }
            }
          );
        }
      });
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Por favor, insira um texto para busca.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: searchQuery })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data: SearchResult = await response.json();

      if (data.success) {
        setSearchResults(data);
      } else {
        setError('Nenhuma jurisprudência encontrada para o texto informado.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao buscar jurisprudências: ${errorMessage}. Verifique se o backend está rodando.`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openJurisprudence = (link: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: link });
    } else {
      // Fallback para desenvolvimento
      window.open(link, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const getRelevanceColor = (relevancia: number) => {
    if (relevancia >= 90) return 'text-green-600 bg-green-100';
    if (relevancia >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setError('');
    setSelectedText('');
  };

  return (
    <div className="w-96 h-96 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-4">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6" />
          <h1 className="text-lg font-bold">JurisCheck</h1>
        </div>
        <p className="text-blue-100 text-sm mt-1">Busca inteligente de jurisprudências</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'search'
            ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'verify'
            ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          <CheckCircle className="w-4 h-4" />
          Verificar
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'history'
            ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
        >
          <FileText className="w-4 h-4" />
          Histórico
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'search' && (
          <div className="p-4 h-full flex flex-col">
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o texto jurídico para buscar jurisprudências..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {selectedText && (
                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Texto selecionado detectado
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Buscar
                    </>
                  )}
                </button>

                {(searchQuery || searchResults || error) && (
                  <button
                    onClick={clearSearch}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Limpar busca"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {searchResults && searchResults.jurisprudencias && (
                <>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b">
                    <span className="text-sm text-gray-600">
                      {searchResults.totalFound || searchResults.jurisprudencias.length} resultados encontrados
                    </span>
                    <span className="text-xs text-gray-500">
                      {searchResults.searchTime}ms
                    </span>
                  </div>

                  <div className="space-y-3">
                    {searchResults.jurisprudencias.map((juris) => (
                      <div key={juris.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Gavel className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-blue-800 bg-blue-50 px-2 py-1 rounded">
                              {juris.tribunal}
                            </span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRelevanceColor(juris.relevancia)}`}>
                            {juris.relevancia}% relevante
                          </span>
                        </div>

                        <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                          {juris.numero} - {juris.titulo}
                        </h4>

                        <p className="text-xs text-gray-600 mb-2">
                          <strong>Relator:</strong> {juris.relator} | <strong>Data:</strong> {formatDate(juris.dataJulgamento)}
                        </p>

                        <p className="text-xs text-gray-700 line-clamp-3 mb-3">
                          {juris.ementa}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {juris.tema}
                          </span>
                          <button
                            onClick={() => openJurisprudence(juris.link)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver original
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Sugestões */}
              {searchResults?.suggestions && searchResults.suggestions.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Sugestões:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {searchResults.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="p-4">
            <div className="text-center text-gray-500 mt-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Funcionalidade de verificação</p>
              <p className="text-sm">Em desenvolvimento</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4">
            <div className="text-center text-gray-500 mt-8">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Histórico de buscas</p>
              <p className="text-sm">Em desenvolvimento</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>JurisCheck v1.0</span>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>Direito Brasileiro</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JurisCheckPopup;