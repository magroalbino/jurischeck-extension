// backend/routes/verify.js

const express = require('express');
const router = express.Router();
const { verifyJurisprudence } = require('../services/aiservice');

// ✅ Rota GET temporária para testar se o endpoint está acessível
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Rota /api/verify ativa. Use POST para verificar jurisprudências.' });
});

// ✅ Rota POST para verificar a jurisprudência com base no ID fornecido
router.post('/', async (req, res) => {
  const { jurisprudenceId } = req.body;

  if (!jurisprudenceId) {
    return res.status(400).json({ error: 'ID de jurisprudência é obrigatório.' });
  }

  try {
    const result = await verifyJurisprudence(jurisprudenceId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar jurisprudência.' });
  }
});

module.exports = router;
