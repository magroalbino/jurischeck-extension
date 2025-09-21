// backend/services/nlpService.js

import natural from 'natural';
import stopwords from 'stopwords-pt';

class NLPService {
  constructor() {
    // Dicionário de termos jurídicos brasileiros
    this.legalTerms = {
      // Direito Civil
      civil: ['responsabilidade civil', 'dano moral', 'dano material', 'indenização', 'contrato', 'obrigação'],
      // Direito Penal
      penal: ['crime', 'delito', 'pena', 'prisão', 'absolvição', 'condenação', 'dosimetria'],
      // Direito Constitucional
      constitucional: ['direito fundamental', 'princípio', 'dignidade humana', 'devido processo legal'],
      // Direito Tributário
      tributario: ['tributo', 'imposto', 'taxa', 'contribuição', 'ICMS', 'IPI', 'IR'],
      // Direito do Trabalho
      trabalho: ['CLT', 'rescisão', 'FGTS', 'horas extras', 'adicional noturno', 'salário'],
      // Direito Processual
      processual: ['petição', 'recurso', 'apelação', 'agravo', 'embargo', 'execução']
    };

    this.tribunalPatterns = {
      'STF': /supremo\s+tribunal\s+federal|stf/gi,
      'STJ': /superior\s+tribunal\s+de\s+justiça|stj/gi,
      'TST': /tribunal\s+superior\s+do\s+trabalho|tst/gi,
      'STM': /superior\s+tribunal\s+militar|stm/gi
    };

    this.recursoPatterns = {
      'RE': /recurso\s+extraordinário|re\s+\d+/gi,
      'REsp': /recurso\s+especial|resp\s+\d+/gi,
      'AI': /agravo\s+de\s+instrumento|ai\s+\d+/gi,
      'RR': /recurso\s+de\s+revista|rr\s+\d+/gi,
      'HC': /habeas\s+corpus|hc\s+\d+/gi,
      'MS': /mandado\s+de\s+segurança|ms\s+\d+/gi
    };

    // Configuração do tokenizer
    natural.PorterStemmer.attach();
  }

  /**
   * Processa texto jurídico e extrai informações relevantes
   */
  async processLegalText(text) {
    try {
      // Limpa e normaliza o texto
      const cleanText = this.cleanText(text);
      
      // Tokenização
      const tokens = natural.WordTokenizer().tokenize(cleanText.toLowerCase());
      
      // Remove stopwords
      const filteredTokens = tokens.filter(token => 
        !stopwords.includes(token) && token.length > 2
      );

      // Stemming
      const stemmedTokens = filteredTokens.map(token => token.stem());

      return {
        originalText: text,
        cleanText: cleanText,
        tokens: filteredTokens,
        stemmedTokens: stemmedTokens,
        wordCount: tokens.length,
        relevantTerms: this.identifyRelevantTerms(cleanText)
      };
    } catch (error) {
      console.error('Erro no processamento de texto:', error);
      return {
        originalText: text,
        cleanText: text,
        tokens: [],
        stemmedTokens: [],
        wordCount: 0,
        relevantTerms: []
      };
    }
  }

  /**
   * Limpa e normaliza texto
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .replace(/[^\w\sÀ-ÿ-]/gi, ' ') // Remove caracteres especiais exceto acentos e hífens
      .trim();
  }

  /**
   * Identifica termos jurídicos relevantes
   */
  identifyRelevantTerms(text) {
    const relevantTerms = [];
    const textLower = text.toLowerCase();

    // Busca termos por área do direito
    Object.keys(this.legalTerms).forEach(area => {
      this.legalTerms[area].forEach(term => {
        if (textLower.includes(term)) {
          relevantTerms.push({
            term: term,
            area: area,
            type: 'legal_term'
          });
        }
      });
    });

    return relevantTerms;
  }

  /**
   * Extrai palavras-chave do texto
   */
  extractKeywords(text, limit = 10) {
    try {
      const processed = this.cleanText(text);
      const tokens = natural.WordTokenizer().tokenize(processed.toLowerCase());
      
      // Remove stopwords
      const filteredTokens = tokens.filter(token => 
        !stopwords.includes(token) && 
        token.length > 3 &&
        !/^\d+$/.test(token) // Remove números
      );

      // Calcula frequência
      const frequency = {};
      filteredTokens.forEach(token => {
        frequency[token] = (frequency[token] || 0) + 1;
      });

      // Ordena por frequência e relevância jurídica
      const keywords = Object.entries(frequency)
        .map(([word, freq]) => ({
          word,
          frequency: freq,
          score: this.calculateKeywordScore(word, freq, text.length)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.word);

      return keywords;
    } catch (error) {
      console.error('Erro na extração de palavras-chave:', error);
      return [];
    }
  }

  /**
   * Calcula score de relevância para palavra-chave
   */
  calculateKeywordScore(word, frequency, textLength) {
    let score = frequency / textLength * 1000;

    // Bonus para termos jurídicos
    const isLegalTerm = Object.values(this.legalTerms)
      .flat()
      .some(term => term.includes(word) || word.includes(term.split(' ')[0]));
    
    if (isLegalTerm) {
      score *= 2;
    }

    // Bonus para palavras mais longas
    if (word.length > 6) {
      score *= 1.2;
    }

    return score;
  }

  /**
   * Extrai entidades jurídicas (tribunais, recursos, etc.)
   */
  extractLegalEntities(text) {
    const entities = [];

    // Extrai tribunais
    Object.keys(this.tribunalPatterns).forEach(tribunal => {
      const matches = text.match(this.tribunalPatterns[tribunal]);
      if (matches) {
        entities.push({
          type: 'tribunal',
          value: tribunal,
          matches: matches,
          context: 'judicial_organ'
        });
      }
    });

    // Extrai tipos de recursos
    Object.keys(this.recursoPatterns).forEach(recurso => {
      const matches = text.match(this.recursoPatterns[recurso]);
      if (matches) {
        entities.push({
          type: 'recurso',
          value: recurso,
          matches: matches,
          context: 'procedural_act'
        });
      }
    });

    // Extrai números de processos
    const processoPattern = /\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}|\d{4}\.\d{3}\.\d{3}-\d{1}/g;
    const processos = text.match(processoPattern);
    if (processos) {
      processos.forEach(processo => {
        entities.push({
          type: 'numero_processo',
          value: processo,
          context: 'case_identifier'
        });
      });
    }

    // Extrai leis e artigos
    const leiPattern = /lei\s+n?º?\s*\d+[/]\d+|lei\s+n?º?\s*\d+-\d+|artigo\s+\d+º?|art\.?\s+\d+º?/gi;
    const leis = text.match(leiPattern);
    if (leis) {
      leis.forEach(lei => {
        entities.push({
          type: 'legislacao',
          value: lei,
          context: 'legal_reference'
        });
      });
    }

    return entities;
  }

  /**
   * Constrói query de busca otimizada
   */
  buildSearchQuery(processedText, keywords, entities) {
    let query = '';

    // Usa palavras-chave principais
    if (keywords.length > 0) {
      query += keywords.slice(0, 5).join(' ');
    }

    // Adiciona entidades relevantes
    entities.forEach(entity => {
      if (entity.type === 'tribunal' || entity.type === 'recurso') {
        query += ` ${entity.value}`;
      }
    });

    // Adiciona termos jurídicos específicos
    const relevantTerms = processedText.relevantTerms
      .map(term => term.term)
      .slice(0, 3);
    
    if (relevantTerms.length > 0) {
      query += ` ${relevantTerms.join(' ')}`;
    }

    return query.trim();
  }

  /**
   * Constrói query avançada com filtros
   */
  buildAdvancedSearchQuery(processedText, filters = {}) {
    let query = this.buildSearchQuery(processedText, 
      this.extractKeywords(processedText.originalText), 
      this.extractLegalEntities(processedText.originalText)
    );

    // Adiciona filtros específicos
    if (filters.tema) {
      query += ` ${filters.tema}`;
    }

    if (filters.relator) {
      query += ` relator:"${filters.relator}"`;
    }

    if (filters.dateRange) {
      // Implementar filtro de data
      query += ` ano:${filters.dateRange}`;
    }

    return query;
  }

  /**
   * Verifica correspondência contextual
   */
  checkContextualMatch(originalText, ementaText) {
    try {
      // Extrai keywords de ambos os textos
      const originalKeywords = this.extractKeywords(originalText, 15);
      const ementaKeywords = this.extractKeywords(ementaText, 15);

      // Calcula similaridade
      const intersection = originalKeywords.filter(word => 
        ementaKeywords.includes(word)
      );

      const similarity = intersection.length / Math.max(originalKeywords.length, ementaKeywords.length);

      // Considera match se similaridade > 20%
      return similarity > 0.2;
    } catch (error) {
      console.error('Erro na verificação contextual:', error);
      return true; // Em caso de erro, não filtra
    }
  }

  /**
   * Calcula score contextual
   */
  calculateContextScore(originalText, ementaText) {
    try {
      // Usa algoritmo de distância de Jaro-Winkler
      const distance = natural.JaroWinklerDistance(
        originalText.toLowerCase(), 
        ementaText.toLowerCase()
      );

      // Converte para porcentagem
      return Math.round(distance * 100);
    } catch (error) {
      console.error('Erro no cálculo de score contextual:', error);
      return 50; // Score neutro em caso de erro
    }
  }

  /**
   * Extrai pontos-chave da ementa
   */
  extractKeyPoints(ementa) {
    try {
      // Divide por sentenças
      const sentences = ementa.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      // Ordena por relevância (comprimento e palavras-chave)
      const scoredSentences = sentences.map(sentence => ({
        text: sentence.trim(),
        score: this.calculateSentenceRelevance(sentence)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.text);

      return scoredSentences;
    } catch (error) {
      console.error('Erro na extração de pontos-chave:', error);
      return [];
    }
  }

  /**
   * Calcula relevância de sentença
   */
  calculateSentenceRelevance(sentence) {
    let score = sentence.length / 100; // Score base por comprimento

    // Bonus para termos jurídicos
    const legalTermCount = Object.values(this.legalTerms)
      .flat()
      .filter(term => sentence.toLowerCase().includes(term))
      .length;
    
    score += legalTermCount * 10;

    return score;
  }

  /**
   * Identifica área do direito predominante
   */
  identifyLegalArea(text) {
    const textLower = text.toLowerCase();
    const areaScores = {};

    Object.keys(this.legalTerms).forEach(area => {
      let score = 0;
      this.legalTerms[area].forEach(term => {
        const occurrences = (textLower.match(new RegExp(term, 'g')) || []).length;
        score += occurrences;
      });
      areaScores[area] = score;
    });

    // Retorna área com maior score
    const mainArea = Object.entries(areaScores)
      .sort((a, b) => b[1] - a[1])[0];

    return mainArea ? {
      area: mainArea[0],
      confidence: mainArea[1],
      allScores: areaScores
    } : null;
  }
}

module.exports = NLPService;