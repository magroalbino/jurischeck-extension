// backend/index.js

import express from 'express';
import cors from 'cors';
import verifyRoutes from './routes/verify.js';
import suggestRoutes from './routes/suggest.js';

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