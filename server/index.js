const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes (Vamos implementar as rotas logo em seguida)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Agencia está online!' });
});

// Servir os arquivos estáticos do React (Frontend) após o build
app.use(express.static(path.join(__dirname, '../dist')));

// Rota para qualquer outra coisa (SPA Support)
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
