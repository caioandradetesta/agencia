const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do Multer (Onde salvar e qual nome dar)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type || 'others';
    const dir = path.join(__dirname, '../uploads', type);
    
    // Cria o diretório se não existir
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Rota de Upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }
  
  // No Dokploy, o arquivo estará acessível via /uploads/...
  const type = req.query.type || 'others';
  const fileUrl = `/uploads/${type}/${req.file.filename}`;
  
  res.json({ url: fileUrl });
});

module.exports = router;
