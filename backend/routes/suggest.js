// backend/routes/suggest.js

const express = require('express');
const router = express.Router();
const { suggestJurisprudence } = require('../services/aiservice');

// ✅ Rota GET temporária para testar se o endpoint está acessível
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Rota /api/suggest ativa. Use POST para sugerir jurisprudências.' });
});

// ✅ Rota POST para sugerir jurisprudência com base no texto fornecido
router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texto é obrigatório.' });
  }

  try {
    const suggestions = await suggestJurisprudence(text);
    return res.status(200).json(suggestions);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao sugerir jurisprudência.' });
  }
});

module.exports = router;
