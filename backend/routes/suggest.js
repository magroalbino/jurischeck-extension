// backend/routes/suggest.js

import express from 'express';
const router = express.Router();

// Mock data para testes
const mockJurisprudencias = [
  {
    id: "1",
    titulo: "Direito Constitucional - Liberdade de Expressão",
    tribunal: "STF",
    numero: "RE 123456",
    relator: "Min. Roberto Barroso",
    dataJulgamento: "2024-01-15",
    ementa: "A liberdade de expressão é garantia fundamental prevista na Constituição Federal. O exercício desse direito deve observar os limites impostos pela dignidade da pessoa humana e pelos direitos da personalidade. Precedente: ADI 4815.",
    link: "https://portal.stf.jus.br/processos/detalhe.asp?incidente=123456",
    relevancia: 95,
    tema: "Direitos Fundamentais",
    tribunal_completo: "Supremo Tribunal Federal"
  },
  {
    id: "2",
    titulo: "Processo Civil - Prova Documental Digital",
    tribunal: "STJ",
    numero: "REsp 789012",
    relator: "Min. Nancy Andrighi",
    dataJulgamento: "2024-02-10", 
    ementa: "A prova documental produzida em meio digital possui a mesma força probatória que a prova física, desde que observadas as normas de autenticidade e integridade estabelecidas pela legislação processual vigente.",
    link: "https://www.stj.jus.br/processo/revista/documento/mediado/?componente=ATC&sequencial=789012",
    relevancia: 88,
    tema: "Processo Civil",
    tribunal_completo: "Superior Tribunal de Justiça"
  },
  {
    id: "3",
    titulo: "Direito Trabalhista - Home Office e Equipamentos",
    tribunal: "TST",
    numero: "RR 456789",
    relator: "Min. Márcio Eurico Vitral Amaro",
    dataJulgamento: "2024-03-05",
    ementa: "O empregador deve fornecer equipamentos adequados para trabalho remoto, incluindo mobiliário ergonômico e equipamentos de informática necessários ao desempenho das funções laborais.",
    link: "https://www.tst.jus.br/consulta-unificada",
    relevancia: 82,
    tema: "Direito do Trabalho",
    tribunal_completo: "Tribunal Superior do Trabalho"
  },
  {
    id: "4",
    titulo: "LGPD - Proteção de Dados Pessoais",
    tribunal: "STJ",
    numero: "REsp 987654",
    relator: "Min. Paulo de Tarso Sanseverino",
    dataJulgamento: "2024-01-20",
    ementa: "A Lei Geral de Proteção de Dados estabelece diretrizes claras para tratamento de dados pessoais, sendo aplicável tanto ao setor público quanto privado. Violação: multa e reparação civil.",
    link: "https://www.stj.jus.br/processo/revista/documento/mediado/?componente=ATC&sequencial=987654",
    relevancia: 91,
    tema: "Proteção de Dados",
    tribunal_completo: "Superior Tribunal de Justiça"
  }
];

/**
 * POST /api/suggest
 * Sugere jurisprudências baseadas em texto
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    const startTime = Date.now();

    // Validação básica
    if (!text || text.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Texto deve conter pelo menos 3 caracteres',
        code: 'TEXT_TOO_SHORT'
      });
    }

    console.log(`[SUGGEST] Buscando por: "${text.substring(0, 100)}..."`);

    // Busca simples por palavras-chave
    const searchTerm = text.toLowerCase().trim();
    const filteredResults = mockJurisprudencias.filter(juris => {
      return juris.titulo.toLowerCase().includes(searchTerm) ||
             juris.ementa.toLowerCase().includes(searchTerm) ||
             juris.tema.toLowerCase().includes(searchTerm) ||
             juris.numero.toLowerCase().includes(searchTerm) ||
             juris.relator.toLowerCase().includes(searchTerm);
    });

    // Ordena por relevância
    filteredResults.sort((a, b) => b.relevancia - a.relevancia);

    const searchTime = Date.now() - startTime;

    // Gera sugestões se não encontrou resultados
    const suggestions = filteredResults.length === 0 ? [
      'Tente usar termos mais específicos (ex: "liberdade expressão", "processo civil")',
      'Verifique a ortografia dos termos jurídicos',
      'Use sinônimos ou termos relacionados',
      'Inclua o nome do tribunal (STF, STJ, TST) se souber'
    ] : [];

    const response = {
      success: true,
      jurisprudencias: filteredResults,
      totalFound: filteredResults.length,
      searchTime,
      suggestions,
      metadata: {
        originalQuery: text,
        searchTerms: searchTerm.split(' '),
        tribunalsSearched: ['STF', 'STJ', 'TST'],
        mockData: true
      }
    };

    console.log(`[SUGGEST] Encontradas ${filteredResults.length} jurisprudências em ${searchTime}ms`);

    res.json(response);

  } catch (error) {
    console.error('Erro na sugestão de jurisprudências:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor ao buscar jurisprudências',
      code: 'SEARCH_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
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
    message: 'Serviço de sugestões está funcionando',
    availableJurisprudencias: mockJurisprudencias.length,
    tribunals: ['STF', 'STJ', 'TST'],
    sampleTopics: ['Direitos Fundamentais', 'Processo Civil', 'Direito do Trabalho', 'Proteção de Dados']
  });
});

/**
 * GET /api/suggest/trending
 * Temas jurídicos populares
 */
router.get('/trending', (req, res) => {
  const trendingTopics = [
    {
      tema: 'LGPD e Proteção de Dados',
      count: 4,
      keywords: ['proteção dados', 'LGPD', 'privacidade'],
      tribunals: ['STF', 'STJ']
    },
    {
      tema: 'Trabalho Remoto',
      count: 3,
      keywords: ['home office', 'trabalho remoto', 'equipamentos'],
      tribunals: ['TST']
    },
    {
      tema: 'Direitos Fundamentais',
      count: 5,
      keywords: ['liberdade expressão', 'dignidade humana', 'direitos fundamentais'],
      tribunals: ['STF']
    }
  ];

  res.json({
    trending: trendingTopics,
    lastUpdate: new Date().toISOString(),
    period: 'Mock data'
  });
});

export default router;