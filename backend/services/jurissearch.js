// backend/services/jurisSearch.js

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

class JurisSearchService {
  constructor() {
    this.tribunals = {
      STF: {
        name: 'Supremo Tribunal Federal',
        searchUrl: 'https://jurisprudencia.stf.jus.br/pages/search',
        baseUrl: 'https://jurisprudencia.stf.jus.br'
      },
      STJ: {
        name: 'Superior Tribunal de Justiça',
        searchUrl: 'https://processo.stj.jus.br/jurisprudencia/externo/informativo/',
        baseUrl: 'https://processo.stj.jus.br'
      },
      TST: {
        name: 'Tribunal Superior do Trabalho',
        searchUrl: 'https://jurisprudencia.tst.jus.br/consulta-unificada',
        baseUrl: 'https://jurisprudencia.tst.jus.br'
      }
    };
    
    this.googleSearchApi = {
      enabled: true,
      baseUrl: 'https://www.googleapis.com/customsearch/v1',
      // Configure suas chaves da API do Google Custom Search
      apiKey: process.env.GOOGLE_API_KEY,
      searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID
    };
  }

  /**
   * Busca jurisprudências usando múltiplas fontes
   */
  async searchJurisprudence(query, options = {}) {
    const {
      tribunals = ['STF', 'STJ', 'TST'],
      useGoogle = true,
      maxResults = 10
    } = options;

    const startTime = Date.now();
    const results = [];

    try {
      // Busca paralela em múltiplas fontes
      const searchPromises = [];

      // Busca nos tribunais específicos
      if (tribunals.includes('STF')) {
        searchPromises.push(this.searchSTF(query, Math.ceil(maxResults / 3)));
      }
      if (tribunals.includes('STJ')) {
        searchPromises.push(this.searchSTJ(query, Math.ceil(maxResults / 3)));
      }
      if (tribunals.includes('TST')) {
        searchPromises.push(this.searchTST(query, Math.ceil(maxResults / 3)));
      }

      // Busca no Google (sites jurídicos)
      if (useGoogle && this.googleSearchApi.enabled) {
        searchPromises.push(this.searchGoogle(query, maxResults));
      }

      // Executa todas as buscas em paralelo
      const searchResults = await Promise.allSettled(searchPromises);
      
      // Processa os resultados
      searchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(...result.value);
        }
      });

      // Remove duplicatas e ordena por relevância
      const uniqueResults = this.removeDuplicates(results);
      const scoredResults = this.calculateRelevance(uniqueResults);
      const sortedResults = scoredResults.sort((a, b) => b.relevancia - a.relevancia);

      const searchTime = Date.now() - startTime;

      return {
        jurisprudencias: sortedResults.slice(0, maxResults),
        totalFound: sortedResults.length,
        searchTime,
        sources: this.getUsedSources(searchResults)
      };

    } catch (error) {
      console.error('Erro na busca de jurisprudências:', error);
      throw new Error('Falha ao buscar jurisprudências');
    }
  }

  /**
   * Busca no STF
   */
  async searchSTF(query, limit = 5) {
    try {
      // Simula busca no STF (implementar scraping real ou API)
      const mockResults = [
        {
          id: uuidv4(),
          titulo: 'RE 123456 - Direito Constitucional',
          tribunal: 'STF',
          numero: 'RE 123456',
          relator: 'Min. Roberto Barroso',
          dataJulgamento: '2024-08-15',
          ementa: 'Recurso extraordinário. Direito constitucional. Princípio da dignidade da pessoa humana. Aplicação dos direitos fundamentais.',
          link: 'https://jurisprudencia.stf.jus.br/pages/search/sjur123456',
          tema: 'Direito Constitucional',
          tribunal_completo: this.tribunals.STF.name
        }
      ];

      // Usa o parâmetro limit para limitar o número de resultados retornados
      const limitedResults = mockResults.slice(0, limit);

      return this.processSearchResults(limitedResults, query, 'STF');
    } catch (error) {
      console.error('Erro na busca STF:', error);
      return [];
    }
  }

  /**
   * Busca no STJ
   */
  async searchSTJ(query, limit = 5) {
    try {
      // Simula busca no STJ
      const mockResults = [
        {
          id: uuidv4(),
          titulo: 'REsp 456789 - Direito Civil',
          tribunal: 'STJ',
          numero: 'REsp 456789',
          relator: 'Min. Nancy Andrighi',
          dataJulgamento: '2024-09-01',
          ementa: 'Recurso especial. Responsabilidade civil. Dano moral. Quantum indenizatório. Proporcionalidade e razoabilidade.',
          link: 'https://processo.stj.jus.br/jurisprudencia/externo/informativo/456789',
          tema: 'Direito Civil',
          tribunal_completo: this.tribunals.STJ.name
        }
      ];

      // Usa o parâmetro limit para limitar o número de resultados retornados
      const limitedResults = mockResults.slice(0, limit);

      return this.processSearchResults(limitedResults, query, 'STJ');
    } catch (error) {
      console.error('Erro na busca STJ:', error);
      return [];
    }
  }

  /**
   * Busca no TST
   */
  async searchTST(query, limit = 5) {
    try {
      // Simula busca no TST
      const mockResults = [
        {
          id: uuidv4(),
          titulo: 'RR 789123 - Direito do Trabalho',
          tribunal: 'TST',
          numero: 'RR 789123',
          relator: 'Min. Dora Maria da Costa',
          dataJulgamento: '2024-08-30',
          ementa: 'Recurso de revista. Horas extras. Adicional noturno. Cálculo. Jurisprudência consolidada.',
          link: 'https://jurisprudencia.tst.jus.br/consulta-unificada/789123',
          tema: 'Direito do Trabalho',
          tribunal_completo: this.tribunals.TST.name
        }
      ];

      // Usa o parâmetro limit para limitar o número de resultados retornados
      const limitedResults = mockResults.slice(0, limit);

      return this.processSearchResults(limitedResults, query, 'TST');
    } catch (error) {
      console.error('Erro na busca TST:', error);
      return [];
    }
  }

  /**
   * Busca no Google usando Custom Search API
   */
  async searchGoogle(query, limit = 10) {
    if (!this.googleSearchApi.apiKey || !this.googleSearchApi.searchEngineId) {
      console.warn('Google API não configurada');
      return [];
    }

    try {
      const searchQuery = `${query} jurisprudência tribunal`;
      const siteRestriction = 'site:stf.jus.br OR site:stj.jus.br OR site:tst.jus.br OR site:jusbrasil.com.br';
      
      const response = await axios.get(this.googleSearchApi.baseUrl, {
        params: {
          key: this.googleSearchApi.apiKey,
          cx: this.googleSearchApi.searchEngineId,
          q: `${searchQuery} ${siteRestriction}`,
          num: limit,
          lr: 'lang_pt',
          gl: 'br'
        }
      });

      if (response.data && response.data.items) {
        return response.data.items.map(item => ({
          id: uuidv4(),
          titulo: item.title,
          tribunal: this.extractTribunalFromUrl(item.link),
          numero: this.extractNumeroFromTitle(item.title),
          relator: 'Não informado',
          dataJulgamento: new Date().toISOString().split('T')[0],
          ementa: item.snippet || 'Ementa não disponível',
          link: item.link,
          tema: this.extractTemaFromContent(item.snippet),
          tribunal_completo: this.getTribunalFullName(this.extractTribunalFromUrl(item.link)),
          relevancia: 75
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro na busca Google:', error);
      return [];
    }
  }

  /**
   * Processa resultados de busca
   */
  processSearchResults(results, query, tribunal) {
    return results.map(result => ({
      ...result,
      relevancia: this.calculateBasicRelevance(result, query),
      searchSource: tribunal
    }));
  }

  /**
   * Calcula relevância básica
   */
  calculateBasicRelevance(result, query) {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const textToSearch = `${result.titulo} ${result.ementa}`.toLowerCase();
    
    let score = 0;
    let totalWords = queryWords.length;

    queryWords.forEach(word => {
      if (textToSearch.includes(word)) {
        score += 1;
      }
    });

    return Math.round((score / totalWords) * 100);
  }

  /**
   * Calcula relevância avançada
   */
  calculateRelevance(results) {
      return results.map(result => {
          let relevance = result.relevancia || 0;
          
          // Bonus por tribunal superior
          if (['STF', 'STJ'].includes(result.tribunal)) {
              relevance += 10;
          }
          
          // Bonus por data recente
          const dataJulgamento = new Date(result.dataJulgamento);
          const now = new Date();
          const daysDiff = (now - dataJulgamento) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 365) relevance += 5;
          if (daysDiff < 180) relevance += 5;
          
          // Limita entre 0 e 100
          relevance = Math.min(100, Math.max(0, relevance));
          
          return {
              ...result,
              relevancia: relevance
          };
      });
  }

  /**
   * Remove duplicatas
   */
  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = `${result.tribunal}-${result.numero}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Extrai tribunal da URL
   */
  extractTribunalFromUrl(url) {
    if (url.includes('stf.jus.br')) return 'STF';
    if (url.includes('stj.jus.br')) return 'STJ';
    if (url.includes('tst.jus.br')) return 'TST';
    if (url.includes('jusbrasil.com.br')) return 'JusBrasil';
    return 'Outros';
  }

  /**
   * Extrai número do título
   */
  extractNumeroFromTitle(title) {
    const match = title.match(/(\w+\s?\d+)/);
    return match ? match[1] : 'N/A';
  }

  /**
   * Extrai tema do conteúdo
   */
  extractTemaFromContent(content) {
    const temas = [
      'Direito Civil', 'Direito Penal', 'Direito Constitucional',
      'Direito do Trabalho', 'Direito Tributário', 'Direito Administrativo',
      'Direito Processual', 'Direito Empresarial'
    ];
    
    const contentLower = content.toLowerCase();
    for (const tema of temas) {
      if (contentLower.includes(tema.toLowerCase())) {
        return tema;
      }
    }
    
    return 'Geral';
  }

  /**
   * Obtém nome completo do tribunal
   */
  getTribunalFullName(sigla) {
    return this.tribunals[sigla]?.name || sigla;
  }

  /**
   * Obtém fontes utilizadas na busca
   */
  getUsedSources(searchResults) {
    return searchResults
      .filter(result => result.status === 'fulfilled')
      .map((result, index) => {
        const sources = ['STF', 'STJ', 'TST', 'Google'];
        return sources[index] || 'Desconhecido';
      });
  }

  /**
   * Busca jurisprudência específica por ID/número
   */
  async verifyJurisprudence(numero, tribunal = null) {
    try {
      // Implementar verificação específica
      const results = await this.searchJurisprudence(numero, {
        tribunals: tribunal ? [tribunal] : ['STF', 'STJ', 'TST'],
        maxResults: 5,
        useGoogle: true
      });

      // Filtra resultados que correspondem exatamente ao número
      const exactMatches = results.jurisprudencias.filter(juris => 
        juris.numero.toLowerCase().includes(numero.toLowerCase())
      );

      return {
        found: exactMatches.length > 0,
        jurisprudencia: exactMatches[0] || null,
        similarResults: results.jurisprudencias.slice(0, 3)
      };
    } catch (error) {
      console.error('Erro na verificação:', error);
      throw error;
    }
  }
}

export default JurisSearchService;