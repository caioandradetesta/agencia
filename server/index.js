const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const migrate = require('./migrate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Importar Rotas
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/uploads');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', apiRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Agencia está online!' });
});

// Servir os arquivos estáticos do React (Frontend)
app.use(express.static(path.join(__dirname, '../dist')));

// Servir a pasta de uploads publicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fallback para o React (SPA) - Deve ser a ÚLTIMA rota
app.use((req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

// Iniciar servidor após migração do banco
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
});
