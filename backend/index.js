// backend/index.js

const express = require('express');
const cors = require('cors');
const verifyRoutes = require('./routes/verify');
const suggestRoutes = require('./routes/suggest');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Definindo rotas
app.use('/api/verify', verifyRoutes);
app.use('/api/suggest', suggestRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.send('JurisCheck Backend em funcionamento!');
});

// Iniciando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

