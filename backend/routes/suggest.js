// backend/routes/suggest.js
import express from 'express';
import JurisSearchService from '../services/jurissearch.js';
import { analyzeLegalText, generateExecutiveSummary } from '../services/aiservice.js';

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

    console.log('[ROUTE] Processando pedido de sugestão com IA Avançada...');

    // 1. Analisa o texto para extrair a melhor query de busca
    const analysis = await analyzeLegalText(text);
    const query = analysis.suggestedQuery || text;

    // 2. Realiza a busca real
    const searchResult = await searchService.searchJurisprudence(query);

    // 3. Para cada resultado, gera um resumo executivo e match score (IA Avançada)
    const enrichedResults = await Promise.all(
      searchResult.jurisprudencias.map(async (juris) => {
        const aiEnrichment = await generateExecutiveSummary(text, juris);
        return {
          ...juris,
          aiAnalysis: aiEnrichment
        };
      })
    );

    res.json({
      success: true,
      analysis,
      jurisprudencias: enrichedResults,
      totalFound: enrichedResults.length,
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
 */
router.get('/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Serviço JurisCheck IA Avançada ativo.',
    features: ['Executive Summary', 'Match Score', 'Real Search']
  });
});

export default router;
