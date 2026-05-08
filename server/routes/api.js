const express = require('express');
const router = express.Router();
const db = require('../db');

// --- CLIENTES ---

// Listar todos os clientes
router.get('/clients', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clients ORDER BY company ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo cliente
router.post('/clients', async (req, res) => {
  try {
    const { name, email, company, phone, logo_url } = req.body;
    const { rows } = await db.query(
      'INSERT INTO clients (name, email, company, phone, logo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, company, phone, logo_url]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PROJETOS ---

router.get('/projects', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, c.company as client_name 
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TAREFAS (KANBAN) ---

router.get('/tasks', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description } = req.body;
    
    // Atualização dinâmica baseada nos campos enviados
    const { rows } = await db.query(
      'UPDATE tasks SET status = COALESCE($1, status), title = COALESCE($2, title), description = COALESCE($3, description) WHERE id = $4 RETURNING *',
      [status, title, description, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { project_id, title, status, description } = req.body;
    const { rows } = await db.query(
      'INSERT INTO tasks (project_id, title, status, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [project_id, title, status || 'todo', description]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EQUIPE / USUÁRIOS ---

router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, t.name as team_name 
      FROM profiles p
      LEFT JOIN teams t ON p.team_id = t.id
      ORDER BY p.full_name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teams', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM teams ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CONTRATOS ---

router.get('/contracts', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.*, p.name as project_name, cl.company as client_name 
      FROM contracts c
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      ORDER BY c.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contracts', async (req, res) => {
  try {
    const { project_id, client_id, title, file_url, value, status } = req.body;
    const { rows } = await db.query(
      'INSERT INTO contracts (project_id, client_id, title, file_url, value, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [project_id, client_id, title, file_url, value, status]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- WIKI / PÁGINAS ---

router.get('/projects/:projectId/pages', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { rows } = await db.query('SELECT * FROM project_pages WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects/:projectId/pages', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content, parent_id } = req.body;
    const { rows } = await db.query(
      'INSERT INTO project_pages (project_id, title, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, title, content, parent_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
