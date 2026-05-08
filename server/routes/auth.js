const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'agencia-secret-key-2024';

// 1. Setup Inicial (Cria o primeiro admin se não houver usuários)
router.post('/setup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    // Verificar se já existe algum usuário
    const { rows } = await db.query('SELECT id FROM users LIMIT 1');
    if (rows.length > 0) {
      return res.status(400).json({ error: 'O sistema já foi inicializado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Iniciar transação
    await db.query('BEGIN');
    
    const userRes = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    
    const userId = userRes.rows[0].id;
    
    await db.query(
      'INSERT INTO profiles (user_id, full_name, role) VALUES ($1, $2, $3)',
      [userId, full_name, 'admin']
    );
    
    await db.query('COMMIT');
    
    res.json({ message: 'Admin criado com sucesso! Agora você pode fazer login.' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// 2. Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Pegar o perfil
    const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [user.id]);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        profile: profileRes.rows[0]
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
