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
    const { rows } = await db.query(`
      SELECT t.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', p.id,
                   'full_name', p.full_name,
                   'avatar_url', p.avatar_url
                 )
               ) FILTER (WHERE p.id IS NOT NULL), 
               '[]'
             ) as assignees
      FROM tasks t
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN profiles p ON ta.user_id = p.user_id
      GROUP BY t.id
      ORDER BY t.created_at ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, priority, due_date, assignee_ids } = req.body;
    
    await db.query('BEGIN');

    // Atualização dos campos básicos
    const { rows } = await db.query(
      'UPDATE tasks SET status = COALESCE($1, status), title = COALESCE($2, title), description = COALESCE($3, description), priority = COALESCE($4, priority), due_date = COALESCE($5, due_date) WHERE id = $6 RETURNING *',
      [status, title, description, priority, due_date, id]
    );

    // Sincronização dos responsáveis (se enviados)
    if (assignee_ids && Array.isArray(assignee_ids)) {
      await db.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);
      for (const userId of assignee_ids) {
        await db.query(
          'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
          [id, userId]
        );
      }
    }

    // --- AUTOMAÇÃO DE WORKFLOW ---
    const { workflow_tag } = req.body;
    if (workflow_tag) {
      // 1. Buscar se existe configuração para esta tag
      const { rows: config } = await db.query(
        'SELECT user_id FROM workflow_configs WHERE tag_name = $1',
        [workflow_tag]
      );

      if (config.length > 0) {
        const autoUserId = config[0].user_id;

        // 2. Adicionar o usuário à tarefa (se não estiver)
        await db.query(`
          INSERT INTO task_assignments (task_id, user_id) 
          VALUES ($1, $2) 
          ON CONFLICT (task_id, user_id) DO NOTHING
        `, [id, autoUserId]);

        // 3. Criar Notificação
        await db.query(`
          INSERT INTO notifications (user_id, title, content)
          VALUES ($1, $2, $3)
        `, [
          autoUserId, 
          `Nova Atribuição: ${workflow_tag}`, 
          `Você foi adicionado à tarefa "${rows[0].title}" pois ela entrou no estágio de ${workflow_tag}.`
        ]);
      }
    }
    
    await db.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// --- WORKFLOW CONFIGS ---

router.get('/workflow-configs', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT wc.*, p.full_name 
      FROM workflow_configs wc
      JOIN profiles p ON wc.user_id = p.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflow-configs', async (req, res) => {
  try {
    const { tag_name, user_id } = req.body;
    const { rows } = await db.query(
      'INSERT INTO workflow_configs (tag_name, user_id) VALUES ($1, $2) ON CONFLICT (tag_name) DO UPDATE SET user_id = EXCLUDED.user_id RETURNING *',
      [tag_name, user_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTIFICAÇÕES ---

router.get('/notifications', async (req, res) => {
  try {
    const { user_id } = req.query;
    const { rows } = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMENTÁRIOS ---

router.get('/tasks/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT tc.*, p.full_name, p.avatar_url 
      FROM task_comments tc
      JOIN profiles p ON tc.user_id = p.user_id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at ASC
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, content } = req.body;
    const { rows } = await db.query(
      'INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [id, user_id, content]
    );
    
    // Retornar com dados do perfil para atualizar UI instantaneamente
    const { rows: fullComment } = await db.query(`
      SELECT tc.*, p.full_name, p.avatar_url 
      FROM task_comments tc
      JOIN profiles p ON tc.user_id = p.user_id
      WHERE tc.id = $1
    `, [rows[0].id]);
    
    res.json(fullComment[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { project_id, title, status, description, priority, due_date, assignee_ids } = req.body;
    
    await db.query('BEGIN');
    
    const { rows } = await db.query(
      'INSERT INTO tasks (project_id, title, status, description, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [project_id, title, status || 'todo', description, priority || 'medium', due_date || null]
    );
    
    const task = rows[0];

    if (assignee_ids && Array.isArray(assignee_ids)) {
      for (const userId of assignee_ids) {
        await db.query(
          'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
          [task.id, userId]
        );
      }
    }
    
    await db.query('COMMIT');
    res.json(task);
  } catch (err) {
    await db.query('ROLLBACK');
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

router.patch('/profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, team_id } = req.body;
    
    const { rows } = await db.query(
      'UPDATE profiles SET full_name = $1, role = $2, team_id = $3 WHERE id = $4 RETURNING *',
      [full_name, role, team_id || null, id]
    );
    
    res.json(rows[0]);
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

router.post('/teams', async (req, res) => {
  try {
    const { name, description } = req.body;
    const { rows } = await db.query(
      'INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const { rows } = await db.query(
      'UPDATE teams SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ message: 'Equipe excluída com sucesso' });
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
