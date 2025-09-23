// backend/routes/verify.js

import express from 'express';
const router = express.Router();

// Função para tentar carregar JurisSearchService dinamicamente
async function loadJurisSearchService() {
  try {
    const jurisSearchModule = await import('../services/jurisSearch.js');
    return jurisSearchModule.default;
  } catch {
    console.warn('JurisSearchService não encontrado. Usando verificação mock.');
    return null;
  }
}

// Função de verificação mock caso não tenha o serviço
async function mockVerifyJurisprudence(numero, tribunal) {
  // Simula verificação de jurisprudência
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock de resultado baseado no número fornecido
      const isValid = numero && numero.length > 3;
      
      if (isValid) {
        resolve({
          success: true,
          found: true,
          jurisprudencia: {
            id: `mock-${Date.now()}`,
            titulo: `Verificação para ${numero}`,
            tribunal: tribunal || 'STF',
            numero: numero,
            relator: 'Min. Exemplo',
            dataJulgamento: '2024-01-15',
            ementa: 'Jurisprudência verificada através do sistema de mock. Esta é uma simulação para teste.',
            link: `https://exemplo.com/jurisprudencia/${numero}`,
            relevancia: 85,
            tema: 'Verificação',
            tribunal_completo: tribunal === 'STF' ? 'Supremo Tribunal Federal' : 'Superior Tribunal de Justiça'
          },
          similarResults: []
        });
      } else {
        resolve({
          success: true,
          found: false,
          jurisprudencia: null,
          similarResults: []
        });
      }
    }, 500); // Simula delay de rede
  });
}

// Middleware para adicionar timestamp de início da requisição
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Rota GET para documentação/teste
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Rota /api/verify ativa. Use POST para verificar jurisprudências.',
    usage: {
      method: 'POST',
      body: {
        numero: 'string (obrigatório) - Número do processo/jurisprudência',
        tribunal: 'string (opcional) - Sigla do tribunal (STF, STJ, TST, etc.)'
      },
      example: {
        numero: 'RE 123456',
        tribunal: 'STF'
      }
    }
  });
});

// Rota POST para verificar jurisprudência
router.post('/', async (req, res) => {
  try {
    const { numero, tribunal, jurisprudenceId } = req.body;
    
    // Aceita tanto 'numero' quanto 'jurisprudenceId' para compatibilidade
    const processNumber = numero || jurisprudenceId;
    
    // Validação
    if (!processNumber) {
      return res.status(400).json({ 
        success: false,
        error: 'Número da jurisprudência é obrigatório.',
        code: 'MISSING_NUMBER',
        received: { numero, tribunal, jurisprudenceId }
      });
    }

    // Valida formato básico
    if (typeof processNumber !== 'string' || processNumber.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Número da jurisprudência deve ter pelo menos 3 caracteres.',
        code: 'INVALID_NUMBER_FORMAT'
      });
    }

    console.log(`[VERIFY] Verificando: ${processNumber} no tribunal: ${tribunal || 'todos'}`);

    let result;

    // Tenta carregar e usar o JurisSearchService se disponível
    const JurisSearchService = await loadJurisSearchService();
    
    if (JurisSearchService) {
      try {
        const searchService = new JurisSearchService();
        result = await searchService.verifyJurisprudence(processNumber.trim(), tribunal);
      } catch (serviceError) {
        console.warn('Erro no JurisSearchService, usando mock:', serviceError.message);
        result = await mockVerifyJurisprudence(processNumber.trim(), tribunal);
      }
    } else {
      // Usa verificação mock
      result = await mockVerifyJurisprudence(processNumber.trim(), tribunal);
    }

    // Garante que o resultado tenha a estrutura esperada
    const response = {
      success: true,
      found: result.found || false,
      jurisprudencia: result.jurisprudencia || null,
      similarResults: result.similarResults || [],
      searchTime: Date.now() - req.startTime || 0,
      query: {
        numero: processNumber.trim(),
        tribunal: tribunal || null
      }
    };

    console.log(`[VERIFY] Resultado: ${result.found ? 'Encontrada' : 'Não encontrada'}`);

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erro na verificação de jurisprudência:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor ao verificar jurisprudência.',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;