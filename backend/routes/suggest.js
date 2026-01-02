// backend/routes/suggest.js
import express from 'express';
import JurisSearchService from '../services/jurissearch.js';
import { analyzeLegalText } from '../services/aiservice.js';

const router = express.Router();
const searchService = new JurisSearchService();

/**
 * POST /api/suggest
 * Recebe um texto jurídico, analisa via IA e busca jurisprudências reais.
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Texto muito curto para análise jurídica.'
      });
    }

    console.log('[ROUTE] Processando pedido de sugestão...');

    // 1. Analisa o texto para extrair a melhor query de busca
    const analysis = await analyzeLegalText(text);
    const query = analysis.suggestedQuery || text;

    // 2. Realiza a busca real
    const searchResult = await searchService.searchJurisprudence(query);

    res.json({
      success: true,
      analysis,
      jurisprudencias: searchResult.jurisprudencias,
      totalFound: searchResult.totalFound,
      searchTime: searchResult.searchTime
    });

  } catch (error) {
    console.error('[ROUTE] Erro na rota de sugestão:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar sugestão jurídica.'
    });
  }
});

/**
 * GET /api/suggest/test
 * Rota de teste para verificar se o serviço está funcionando
 */
router.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Serviço de sugestões JurisCheck está funcionando com busca real.',
    tribunals: ['STF', 'STJ', 'TST', 'JusBrasil']
  });
});

export default router;
