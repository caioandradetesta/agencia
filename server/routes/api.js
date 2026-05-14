const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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

// Editar cliente
router.patch('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, company, phone, logo_url } = req.body;
    const { rows } = await db.query(
      'UPDATE clients SET name = $1, email = $2, company = $3, phone = $4, logo_url = $5 WHERE id = $6 RETURNING *',
      [name, email, company, phone, logo_url, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir cliente
router.delete('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ success: true });
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

router.post('/projects', async (req, res) => {
  try {
    const { name, client_id, status, description } = req.body;
    const { rows } = await db.query(
      'INSERT INTO projects (name, client_id, status, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, client_id, status || 'active', description || '']
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COLUNAS KANBAN ---

router.get('/kanban-columns', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT kc.*, p.full_name as responsible_name, p.color as responsible_color
      FROM kanban_columns kc
      LEFT JOIN profiles p ON kc.responsible_user_id = p.user_id
      ORDER BY kc.sort_order ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Erro ao buscar colunas do Kanban:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/kanban-columns', async (req, res) => {
  try {
    const { title, slug, color, sort_order, responsible_user_id, responsible_user_ids } = req.body;
    const { rows } = await db.query(
      `INSERT INTO kanban_columns (title, slug, color, sort_order, responsible_user_id, responsible_user_ids) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, slug, color || '#6366F1', sort_order || 0, responsible_user_id || null, responsible_user_ids || []]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/kanban-columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, color, sort_order, responsible_user_id, responsible_user_ids } = req.body;
    const { rows } = await db.query(
      `UPDATE kanban_columns 
       SET title = COALESCE($1, title), 
           color = COALESCE($2, color), 
           sort_order = COALESCE($3, sort_order),
           responsible_user_id = $4,
           responsible_user_ids = COALESCE($5, responsible_user_ids)
       WHERE id = $6 RETURNING *`,
      [title, color, sort_order, responsible_user_id, responsible_user_ids, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/kanban-columns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM kanban_columns WHERE id = $1', [id]);
    res.json({ success: true });
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
                   'user_id', p.user_id,
                   'full_name', p.full_name,
                   'avatar_url', p.avatar_url,
                   'color', p.color
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
    const { status, title, description, priority, due_date, assignee_ids, workflow_tag, recurrence } = req.body;
    
    await db.query('BEGIN');

    // Atualização dos campos básicos
    const { rows } = await db.query(
      `UPDATE tasks 
       SET status = COALESCE($1, status), 
           title = COALESCE($2, title), 
           description = COALESCE($3, description), 
           priority = COALESCE($4, priority), 
           due_date = COALESCE($5, due_date),
           workflow_tag = COALESCE($6, workflow_tag),
           recurrence = COALESCE($7, recurrence)
       WHERE id = $8 RETURNING *`,
      [
        status || null, 
        title || null, 
        description || null, 
        priority || null, 
        (due_date === '' || !due_date) ? null : due_date, 
        workflow_tag || null, 
        recurrence || null, 
        id
      ]
    );

    if (rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

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

    // --- AUTOMAÇÃO POR COLUNA KANBAN (PROJETO) ---
    if (status) {
      console.log(`\n🤖 [Automação] Iniciando para status: "${status}"`);
      const { rows: colConfig } = await db.query(
        'SELECT id, responsible_user_ids, title FROM kanban_columns WHERE slug ILIKE $1',
        [status]
      );

      console.log(`📊 [Automação] Colunas encontradas: ${colConfig.length}`);
      
      if (colConfig.length > 0) {
        const config = colConfig[0];
        const ids = config.responsible_user_ids || [];
        console.log(`👥 [Automação] IDs na coluna "${config.title}":`, ids);

        if (ids.length > 0) {
          for (const autoUserId of ids) {
            console.log(`🔗 [Automação] Associando usuário ${autoUserId} à tarefa ${id}`);
            await db.query(`
              INSERT INTO task_assignments (task_id, user_id) 
              VALUES ($1, $2) 
              ON CONFLICT (task_id, user_id) DO NOTHING
            `, [id, autoUserId]);
          }

          // Enviar notificação apenas para o primeiro
          await db.query(`
            INSERT INTO notifications (user_id, title, content)
            VALUES ($1, $2, $3)
          `, [
            ids[0], 
            `Nova Atribuição Automática`, 
            `Tarefa "${rows[0].title}" movida para o estágio "${config.title}".`
          ]);
        } else {
          console.log(`⚠️ [Automação] Nenhum ID de responsável configurado para esta coluna.`);
        }
      } else {
        console.log(`❌ [Automação] Nenhuma coluna encontrada com o slug "${status}"`);
      }
    }

    // --- AUTOMAÇÃO DE WORKFLOW (TAGS ANTIGAS - MANTIDO POR COMPATIBILIDADE) ---
    if (workflow_tag) {
      const { rows: config } = await db.query(
        'SELECT user_id FROM workflow_configs WHERE tag_name = $1',
        [workflow_tag]
      );

      if (config.length > 0) {
        const autoUserId = config[0].user_id;
        await db.query(`
          INSERT INTO task_assignments (task_id, user_id) 
          VALUES ($1, $2) 
          ON CONFLICT (task_id, user_id) DO NOTHING
        `, [id, autoUserId]);
      }
    }
    
    // --- AUTOMAÇÃO DE RECORRÊNCIA ---
    if (status === 'done' && rows[0].recurrence) {
      const task = rows[0];
      const nextDueDate = new Date(task.due_date || new Date());
      
      if (task.recurrence === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
      else if (task.recurrence === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
      else if (task.recurrence === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      else if (task.recurrence === 'quarterly') nextDueDate.setMonth(nextDueDate.getMonth() + 3);

      try {
        const { rows: newTask } = await db.query(
          'INSERT INTO tasks (project_id, title, description, status, priority, due_date, recurrence, workflow_tag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [task.project_id || null, task.title, task.description || '', 'todo', task.priority || 'medium', nextDueDate, task.recurrence, task.workflow_tag || null]
        );

        const { rows: assignees } = await db.query('SELECT user_id FROM task_assignments WHERE task_id = $1', [id]);
        for (const a of assignees) {
          await db.query('INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)', [newTask[0].id, a.user_id]);
        }
      } catch (recurrenceErr) {
        console.error('Erro ao processar recorrência:', recurrenceErr);
      }
    }

    await db.query('COMMIT');
    
    // Buscar a tarefa completa com os novos responsáveis e dados do projeto
    const { rows: fullTask } = await db.query(`
      SELECT 
        t.*,
        p.name as project_name,
        json_agg(
          json_build_object(
            'user_id', pr.user_id,
            'full_name', pr.full_name,
            'color', pr.color
          )
        ) FILTER (WHERE pr.user_id IS NOT NULL) as assignees
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN profiles pr ON ta.user_id = pr.user_id
      WHERE t.id = $1
      GROUP BY t.id, p.name
    `, [id]);

    res.json(fullTask[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Erro ao atualizar tarefa:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- WORKFLOW CONFIGS (ESTÁGIOS DINÂMICOS) ---

router.get('/workflow-configs', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT wc.*, p.full_name, p.color as user_color
      FROM workflow_configs wc
      LEFT JOIN profiles p ON wc.user_id = p.user_id
      ORDER BY wc.sort_order ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflow-configs', async (req, res) => {
  try {
    const { tag_name, user_id, color, label, sort_order } = req.body;
    const { rows } = await db.query(
      `INSERT INTO workflow_configs (tag_name, user_id, color, label, sort_order) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (tag_name) DO UPDATE 
       SET user_id = EXCLUDED.user_id, 
           color = EXCLUDED.color, 
           label = EXCLUDED.label, 
           sort_order = EXCLUDED.sort_order 
       RETURNING *`,
      [tag_name, user_id, color || '#6366F1', label || tag_name, sort_order || 0]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/workflow-configs/:tagName', async (req, res) => {
  try {
    const { tagName } = req.params;
    await db.query('DELETE FROM workflow_configs WHERE tag_name = $1', [tagName]);
    res.json({ success: true });
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
    const { project_id, title, status, description, priority, due_date, assignee_ids, recurrence } = req.body;
    
    await db.query('BEGIN');
    
    const { rows } = await db.query(
      'INSERT INTO tasks (project_id, title, status, description, priority, due_date, recurrence) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [project_id || null, title, status || 'todo', description || '', priority || 'medium', due_date || null, recurrence || null]
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

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EQUIPE / USUÁRIOS ---

router.get('/users', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, u.email, t.name as team_name 
      FROM profiles p
      INNER JOIN users u ON p.user_id = u.id
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
    const { full_name, role, team_id, color, email, password } = req.body;
    
    await db.query('BEGIN');

    // 1. Atualizar Profile
    const { rows: profileRows } = await db.query(
      'UPDATE profiles SET full_name = $1, role = $2, team_id = $3, color = $4 WHERE id = $5 RETURNING *',
      [full_name, role, team_id || null, color || '#6366F1', id]
    );

    if (profileRows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    const userId = profileRows[0].user_id;

    // 2. Atualizar Email se enviado
    if (email) {
      await db.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId]);
    }

    // 3. Atualizar Senha se enviada
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    }

    await db.query('COMMIT');
    res.json(profileRows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Erro ao atualizar perfil:', err);
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
