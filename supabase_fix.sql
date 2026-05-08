-- SCRIPT PARA RODAR NO SQL EDITOR DO SUPABASE --

-- 1. Criar a tabela de colunas se não existir
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366F1',
  sort_order INTEGER DEFAULT 0,
  responsible_user_id UUID REFERENCES profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Garantir que a coluna de responsável exista (caso a tabela já existisse)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kanban_columns' AND column_name='responsible_user_id') THEN
    ALTER TABLE kanban_columns ADD COLUMN responsible_user_id UUID REFERENCES profiles(user_id);
  END IF;
END $$;

-- 3. Inserir as colunas padrão caso o quadro esteja vazio
INSERT INTO kanban_columns (title, slug, color, sort_order)
VALUES 
  ('A Fazer', 'todo', '#94a3b8', 0),
  ('Em Produção', 'doing', '#6366F1', 1),
  ('Revisão', 'review', '#f59e0b', 2),
  ('Concluído', 'done', '#10b981', 3)
ON CONFLICT (slug) DO NOTHING;
