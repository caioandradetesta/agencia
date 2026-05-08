const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Importar Rotas
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/uploads');

// Função para inicializar o banco de dados
const initDb = async () => {
  try {
    console.log('Iniciando migração do banco de dados...');
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await db.query(sql);
    console.log('Banco de dados inicializado com sucesso! ✅');
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err.message);
  }
};

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

app.get('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

// Iniciar servidor após tentar inicializar o banco
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
