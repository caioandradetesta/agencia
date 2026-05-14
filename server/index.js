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
const distPath = path.join(__dirname, '../dist');
console.log('📂 Verificando pasta dist em:', distPath);
try {
  const fs = require('fs');
  if (fs.existsSync(distPath)) {
    console.log('✅ Pasta dist encontrada. Conteúdo:', fs.readdirSync(distPath));
    if (fs.existsSync(path.join(distPath, 'assets'))) {
      console.log('📦 Conteúdo de dist/assets:', fs.readdirSync(path.join(distPath, 'assets')));
    }
  } else {
    console.log('❌ Pasta dist NÃO encontrada!');
  }
} catch (err) {
  console.error('⚠️ Erro ao listar diretório dist:', err);
}

app.use(express.static(distPath));

// Servir a pasta de uploads publicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fallback para o React (SPA) - Deve ser a ÚLTIMA rota
app.get('*', (req, res) => {
  // Se for uma requisição de API ou arquivo com extensão, não envia o index.html
  if (req.url.startsWith('/api') || req.url.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Iniciar servidor após migração do banco
migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
});
