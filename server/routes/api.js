const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'agencia-secret-key-2024';

const getCurrentUserId = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    return null;
  }
};

// --- CLIENTES ---

// Listar todos os clientes
router.get('/clients', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT c.*, COUNT(p.id)::int as project_count
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
      GROUP BY c.id
      ORDER BY c.company ASC
    `);
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

router.patch('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, client_id, status, description } = req.body;
    const { rows } = await db.query(
      `UPDATE projects 
       SET name = COALESCE($1, name), 
           client_id = COALESCE($2, client_id), 
           status = COALESCE($3, status), 
           description = COALESCE($4, description)
       WHERE id = $5 RETURNING *`,
      [name, client_id, status, description, id]
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
             pr.name as project_name,
             creator_prof.full_name as creator_name,
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
      LEFT JOIN projects pr ON t.project_id = pr.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN profiles p ON ta.user_id = p.user_id
      LEFT JOIN profiles creator_prof ON t.created_by = creator_prof.user_id
      GROUP BY t.id, pr.name, creator_prof.full_name
      ORDER BY 
        CASE 
          WHEN t.priority = 'high' THEN 1 
          WHEN t.priority = 'medium' THEN 2 
          ELSE 3 
        END ASC,
        t.due_date ASC NULLS LAST,
        t.created_at ASC
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
    const userId = getCurrentUserId(req);
    
    await db.query('BEGIN');

    // Buscar estado atual completo para histórico
    const { rows: oldTaskRows } = await db.query(
      'SELECT status, title, description, priority, due_date, recurrence FROM tasks WHERE id = $1',
      [id]
    );
    if (oldTaskRows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    const before = oldTaskRows[0];
    const oldStatus = before.status;

    const { rows: oldAssignees } = await db.query(
      'SELECT user_id FROM task_assignments WHERE task_id = $1',
      [id]
    );
    const beforeAssignees = oldAssignees.map(a => a.user_id).sort();

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
      // Buscar responsáveis atuais antes de deletar para saber quem é novo
      const { rows: oldAssigneesQuery } = await db.query('SELECT user_id FROM task_assignments WHERE task_id = $1', [id]);
      const oldIds = oldAssigneesQuery.map(a => a.user_id);
      const newIds = assignee_ids.filter(id => !oldIds.includes(id));

      await db.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);
      for (const userId of assignee_ids) {
        await db.query(
          'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
          [id, userId]
        );
      }

      // Notificar novos responsáveis
      for (const newId of newIds) {
        await db.query(`
          INSERT INTO notifications (user_id, title, content)
          VALUES ($1, $2, $3)
        `, [
          newId,
          'Nova Atribuição',
          `Você foi atribuído à tarefa "${rows[0].title}".`
        ]);
      }
    }

    // Registrar histórico de alterações
    const changes = {};
    if (status !== undefined && status !== before.status) {
      changes.status = { old: before.status, new: status };
    }
    if (title !== undefined && title !== before.title) {
      changes.title = { old: before.title, new: title };
    }
    if (description !== undefined && description !== before.description) {
      changes.description = { old: before.description, new: description };
    }
    if (priority !== undefined && priority !== before.priority) {
      changes.priority = { old: before.priority, new: priority };
    }

    const beforeTime = before.due_date ? new Date(before.due_date).getTime() : null;
    const targetDueDate = (due_date === '' || !due_date) ? null : due_date;
    const afterTime = targetDueDate ? new Date(targetDueDate).getTime() : null;
    if (due_date !== undefined && beforeTime !== afterTime) {
      changes.due_date = { old: before.due_date, new: targetDueDate };
    }

    if (recurrence !== undefined && recurrence !== before.recurrence) {
      changes.recurrence = { old: before.recurrence, new: recurrence || null };
    }

    if (assignee_ids && Array.isArray(assignee_ids)) {
      const afterAssignees = [...assignee_ids].sort();
      if (JSON.stringify(beforeAssignees) !== JSON.stringify(afterAssignees)) {
        changes.assignees = { old: beforeAssignees, new: afterAssignees };
      }
    }

    if (Object.keys(changes).length > 0) {
      await db.query(
        'INSERT INTO task_history (task_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [id, userId, 'update', JSON.stringify(changes)]
      );
    }

    // --- AUTOMAÇÃO POR COLUNA KANBAN (PROJETO) ---
    if (status && status !== oldStatus) {
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
    if (status === 'done' && oldStatus !== 'done' && rows[0].recurrence) {
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
    
    // Buscar a tarefa completa com os novos responsáveis, dados do projeto e criador
    const { rows: fullTask } = await db.query(`
      SELECT 
        t.*,
        p.name as project_name,
        creator_prof.full_name as creator_name,
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
      LEFT JOIN profiles creator_prof ON t.created_by = creator_prof.user_id
      WHERE t.id = $1
      GROUP BY t.id, p.name, creator_prof.full_name
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

    // Notificar usuários mencionados com @
    const mentions = content.match(/@([^@\s][^@\n]*?)(?=\s|$)/g);
    if (mentions) {
      const mentionedNames = [...new Set(mentions.map(m => m.substring(1).trim()))];
      
      for (const name of mentionedNames) {
        const { rows: mentionUser } = await db.query(
          'SELECT user_id FROM profiles WHERE full_name ILIKE $1',
          [name]
        );
        
        if (mentionUser.length > 0 && mentionUser[0].user_id !== user_id) {
          await db.query(
            'INSERT INTO notifications (user_id, title, content) VALUES ($1, $2, $3)',
            [
              mentionUser[0].user_id, 
              'Nova menção em tarefa', 
              `${fullComment[0].full_name} mencionou você: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
            ]
          );
        }
      }
    }
    
    res.json(fullComment[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obter histórico de alterações de uma tarefa
router.get('/tasks/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT th.*, p.full_name as user_name, p.color as user_color
      FROM task_history th
      LEFT JOIN profiles p ON th.user_id = p.user_id
      WHERE th.task_id = $1
      ORDER BY th.created_at DESC
    `, [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ANEXOS DE TAREFAS ---

// Listar anexos de uma tarefa
router.get('/tasks/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'SELECT * FROM task_attachments WHERE task_id = $1 ORDER BY created_at ASC',
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar anexo em uma tarefa
router.post('/tasks/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, url } = req.body;
    if (!name || !type || !url) {
      return res.status(400).json({ error: 'Campos nome, tipo e url são obrigatórios.' });
    }
    const { rows } = await db.query(
      'INSERT INTO task_attachments (task_id, name, type, url) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, type, url]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar um anexo
router.patch('/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, url } = req.body;
    const { rows } = await db.query(
      `UPDATE task_attachments 
       SET name = COALESCE($1, name), 
           type = COALESCE($2, type), 
           url = COALESCE($3, url) 
       WHERE id = $4 RETURNING *`,
      [name, type, url, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Anexo não encontrado.' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excluir um anexo
router.delete('/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM task_attachments WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Anexo não encontrado.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { project_id, title, status, description, priority, due_date, assignee_ids, recurrence } = req.body;
    const userId = getCurrentUserId(req);
    
    await db.query('BEGIN');
    
    const { rows } = await db.query(
      'INSERT INTO tasks (project_id, title, status, description, priority, due_date, recurrence, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [project_id || null, title, status || 'todo', description || '', priority || 'medium', due_date || null, recurrence || null, userId]
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
    
    // Registrar histórico inicial de criação
    await db.query(
      'INSERT INTO task_history (task_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
      [task.id, userId, 'create', JSON.stringify({ title, status: status || 'todo' })]
    );
    
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
