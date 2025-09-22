// backend/services/nlpService.js
import natural from 'natural';
import stopwords from 'stopwords-pt/stopwords-pt.json' with { type: "json" };

class NLPService {
  constructor() {
    // Dicionário de termos jurídicos brasileiros
    this.legalTerms = {
      civil: ['responsabilidade civil', 'dano moral', 'dano material', 'indenização', 'contrato', 'obrigação'],
      penal: ['crime', 'delito', 'pena', 'prisão', 'absolvição', 'condenação', 'dosimetria'],
      constitucional: ['direito fundamental', 'princípio', 'dignidade humana', 'devido processo legal'],
      tributario: ['tributo', 'imposto', 'taxa', 'contribuição', 'ICMS', 'IPI', 'IR'],
      trabalho: ['CLT', 'rescisão', 'FGTS', 'horas extras', 'adicional noturno', 'salário'],
      processual: ['petição', 'recurso', 'apelação', 'agravo', 'embargo', 'execução']
    };

    this.tribunalPatterns = {
      STF: /supremo\s+tribunal\s+federal|stf/gi,
      STJ: /superior\s+tribunal\s+de\s+justiça|stj/gi,
      TST: /tribunal\s+superior\s+do\s+trabalho|tst/gi,
      STM: /superior\s+tribunal\s+militar|stm/gi
    };

    this.recursoPatterns = {
      RE: /recurso\s+extraordinário|re\s+\d+/gi,
      REsp: /recurso\s+especial|resp\s+\d+/gi,
      AI: /agravo\s+de\s+instrumento|ai\s+\d+/gi,
      RR: /recurso\s+de\s+revista|rr\s+\d+/gi,
      HC: /habeas\s+corpus|hc\s+\d+/gi,
      MS: /mandado\s+de\s+segurança|ms\s+\d+/gi
    };

    // Tokenizer configurado
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer; // stemmer padrão em inglês
    // ⚠️ Para português, seria necessário outro stemmer/biblioteca
  }

  /**
   * Processa texto jurídico e extrai informações relevantes
   */
  async processLegalText(text) {
    try {
      const cleanText = this.cleanText(text);

      // Tokenização
      const tokens = this.tokenizer.tokenize(cleanText.toLowerCase());

      // Remove stopwords
      const filteredTokens = tokens.filter(
        token => !stopwords.includes(token) && token.length > 2
      );

      // Stemming (em inglês, pois PorterStemmer é inglês)
      const stemmedTokens = filteredTokens.map(token =>
        this.stemmer.stem(token)
      );

      return {
        originalText: text,
        cleanText,
        tokens: filteredTokens,
        stemmedTokens,
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

  // ... resto do código sem mudanças
}

export default NLPService;
