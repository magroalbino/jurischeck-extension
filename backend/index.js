// backend/index.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import verifyRoutes from './routes/verify.js';
import suggestRoutes from './routes/suggest.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Definindo rotas
app.use('/api/verify', verifyRoutes);
app.use('/api/suggest', suggestRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciando o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});