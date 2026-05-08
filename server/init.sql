-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Usuários para Login (Local)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Equipes (Teams)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Perfis de Usuário (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Clientes (Clients)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Projetos (Projects)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  description TEXT,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tarefas (Tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Páginas de Informação (Project Pages/Wiki)
CREATE TABLE IF NOT EXISTS project_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB,
  parent_id UUID REFERENCES project_pages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Contratos (Contracts)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  client_id UUID REFERENCES clients(id),
  title TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'draft',
  value DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Atribuições de Tarefas (Multi-assign)
CREATE TABLE IF NOT EXISTS task_assignments (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

-- 10. Comentários em Tarefas
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Configurações de Workflow (Automação Tag -> Usuário)
CREATE TABLE IF NOT EXISTS workflow_configs (
  tag_name TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Notificações do Sistema
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna de tag de workflow nas tarefas
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_tag TEXT;

-- Adicionar coluna de recorrência nas tarefas
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence TEXT; -- daily, weekly, monthly, quarterly

-- Adicionar coluna de cor personalizada nos perfis
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366F1';

-- Atualizar tabela de estágios para suportar cores e ordenação
ALTER TABLE workflow_configs ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366F1';
ALTER TABLE workflow_configs ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE workflow_configs ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Tabela para colunas dinâmicas do Kanban
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366F1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir colunas padrão se não existirem
INSERT INTO kanban_columns (title, slug, color, sort_order)
VALUES 
  ('A Fazer', 'todo', '#94a3b8', 0),
  ('Em Produção', 'doing', '#6366F1', 1),
  ('Revisão', 'review', '#f59e0b', 2),
  ('Concluído', 'done', '#10b981', 3)
ON CONFLICT (slug) DO NOTHING;

-- Adicionar responsável automático às colunas do Kanban
ALTER TABLE kanban_columns ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES profiles(user_id);

-- Garantir que a tabela e a coluna existam (Redundância de segurança)
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366F1',
  sort_order INTEGER DEFAULT 0,
  responsible_user_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
