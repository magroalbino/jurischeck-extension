// backend/routes/suggest.js

import express from 'express';
import JurisSearchService from '../services/jurisSearch.js';
import NLPService from '../services/nlpService.js';

const router = express.Router();

const jurisSearchService = new JurisSearchService();
const nlpService = new NLPService();

/**
 * POST /api/suggest
 * Sugere jurisprudências baseadas em texto
 */
router.post('/', async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    // Validação
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        error: 'Texto deve conter pelo menos 10 caracteres',
        code: 'TEXT_TOO_SHORT'
      });
    }

    const startTime = Date.now();

    // Processa o texto com NLP para extrair termos jurídicos relevantes
    const processedText = await nlpService.processLegalText(text);
    
    // Extrai palavras-chave e entidades jurídicas
    const keywords = nlpService.extractKeywords(text);
    const legalEntities = nlpService.extractLegalEntities(text);
    
    // Monta query otimizada para busca
    const searchQuery = nlpService.buildSearchQuery(processedText, keywords, legalEntities);

    // Configurações de busca
    const searchOptions = {
      tribunals: options.tribunals || ['STF', 'STJ', 'TST'],
      useGoogle: options.useGoogle !== false,
      maxResults: options.maxResults || 15,
      includeEmenta: options.includeEmenta !== false
    };

    // Busca jurisprudências
    const searchResults = await jurisSearchService.searchJurisprudence(searchQuery, searchOptions);

    // Aplica filtros de relevância específicos para o texto
    const filteredResults = await applyContextualFilters(searchResults.jurisprudencias, text);

    // Enriquece resultados com análise contextual
    const enrichedResults = await enrichWithContext(filteredResults, text, legalEntities);

    const totalTime = Date.now() - startTime;

    // Log para analytics
    console.log(`[SUGGEST] Query: "${text.substring(0, 100)}..." | Results: ${enrichedResults.length} | Time: ${totalTime}ms`);

    res.json({
      jurisprudencias: enrichedResults,
      totalFound: searchResults.totalFound,
      searchTime: totalTime,
      metadata: {
        originalQuery: text,
        processedQuery: searchQuery,
        keywords: keywords,
        legalEntities: legalEntities,
        sources: searchResults.sources,
        filters: {
          tribunals: searchOptions.tribunals,
          useGoogle: searchOptions.useGoogle
        }
      }
    });

  } catch (error) {
    console.error('Erro na sugestão de jurisprudências:', error);
    
    res.status(500).json({
      error: 'Erro interno do servidor ao buscar jurisprudências',
      code: 'SEARCH_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/suggest/advanced
 * Busca avançada com mais parâmetros
 */
router.post('/advanced', async (req, res) => {
  try {
    const {
      text,
      tribunals = ['STF', 'STJ', 'TST'],
      dateRange = null,
      tema = null,
      relator = null,
      maxResults = 20
    } = req.body;

    if (!text || text.trim().length < 5) {
      return res.status(400).json({
        error: 'Texto é obrigatório para busca avançada',
        code: 'TEXT_REQUIRED'
      });
    }

    const startTime = Date.now();

    // Processa texto
    const processedText = await nlpService.processLegalText(text);
    const searchQuery = nlpService.buildAdvancedSearchQuery(processedText, {
      tema,
      relator,
      dateRange
    });

    // Busca com filtros avançados
    const searchOptions = {
      tribunals,
      useGoogle: true,
      maxResults,
      includeEmenta: true,
      advancedFilters: {
        tema,
        relator,
        dateRange
      }
    };

    const results = await jurisSearchService.searchJurisprudence(searchQuery, searchOptions);
    const totalTime = Date.now() - startTime;

    res.json({
      ...results,
      searchTime: totalTime,
      query: {
        original: text,
        processed: searchQuery,
        filters: searchOptions.advancedFilters
      }
    });

  } catch (error) {
    console.error('Erro na busca avançada:', error);
    res.status(500).json({
      error: 'Erro na busca avançada',
      code: 'ADVANCED_SEARCH_ERROR'
    });
  }
});

/**
 * GET /api/suggest/trending
 * Retorna temas jurídicos em alta
 */
router.get('/trending', async (req, res) => {
  try {
    // Mock de temas trending - implementar analytics real
    const trendingTopics = [
      {
        tema: 'LGPD e Proteção de Dados',
        searches: 1250,
        growth: '+45%',
        tribunals: ['STF', 'STJ'],
        keywords: ['proteção de dados', 'LGPD', 'privacidade']
      },
      {
        tema: 'Direito Digital',
        searches: 980,
        growth: '+32%',
        tribunals: ['STJ', 'TJs'],
        keywords: ['marco civil', 'internet', 'digital']
      },
      {
        tema: 'ESG e Sustentabilidade',
        searches: 750,
        growth: '+28%',
        tribunals: ['STF', 'TST'],
        keywords: ['sustentabilidade', 'meio ambiente', 'ESG']
      }
    ];

    res.json({
      trending: trendingTopics,
      lastUpdate: new Date().toISOString(),
      period: '30 dias'
    });

  } catch (error) {
    console.error('Erro ao buscar trending topics:', error);
    res.status(500).json({
      error: 'Erro ao carregar temas em alta',
      code: 'TRENDING_ERROR'
    });
  }
});

// Funções auxiliares

/**
 * Aplica filtros contextuais nos resultados
 */
async function applyContextualFilters(results, originalText) {
  return results.filter(result => {
    // Remove resultados com relevância muito baixa
    if (result.relevancia < 30) return false;

    // Filtra por contexto jurídico
    const contextMatch = nlpService.checkContextualMatch(originalText, result.ementa);
    if (!contextMatch) return false;

    return true;
  });
}

/**
 * Enriquece resultados com contexto adicional
 */
async function enrichWithContext(results, originalText, legalEntities) {
  return results.map(result => {
    // Calcula score de relevância contextual
    const contextScore = nlpService.calculateContextScore(originalText, result.ementa);
    
    // Identifica citações relacionadas
    const relatedCitations = findRelatedCitations(result, legalEntities);
    
    // Extrai pontos-chave da ementa
    const keyPoints = nlpService.extractKeyPoints(result.ementa);

    return {
      ...result,
      contextScore,
      relatedCitations,
      keyPoints,
      citationFormat: generateCitationFormat(result),
      practicalApplication: generatePracticalApplication(result)
    };
  });
}

/**
 * Encontra citações relacionadas
 */
function findRelatedCitations() {
  // Implementar lógica para encontrar citações relacionadas
  return [];
}

/**
 * Gera formato de citação ABNT
 */
function generateCitationFormat(result) {
  const tribunal = result.tribunal_completo || result.tribunal;
  const data = new Date(result.dataJulgamento).getFullYear();
  
  return {
    abnt: `${tribunal}. ${result.numero}. Relator: ${result.relator}. ${data}. Disponível em: ${result.link}`,
    apa: `${tribunal} (${data}). ${result.numero}. ${result.relator} (Relator). ${result.link}`,
    simple: `${result.tribunal} - ${result.numero} - ${result.relator} (${data})`
  };
}

/**
 * Gera aplicação prática
 */
function generatePracticalApplication(result) {
  // Usar IA para gerar sugestão de aplicação prática
  return {
    suggestion: "Esta jurisprudência pode ser aplicada em casos similares envolvendo os mesmos princípios jurídicos.",
    relevantPoints: ["Princípio aplicável", "Precedente vinculante", "Contexto similar"],
    petitionSuggestion: `Conforme entendimento do ${result.tribunal} no ${result.numero}...`
  };
}

/**
 * Middleware de rate limiting para busca
 */
import rateLimit from 'express-rate-limit';

const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 50 buscas por IP
  message: {
    error: 'Muitas tentativas de busca. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Aplica rate limiting nas rotas
router.use('/', searchRateLimit);
export default router;
module.exports = router;