const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('--- INICIANDO MIGRAÇÃO DE BANCO DE DADOS ---');
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    if (!fs.existsSync(sqlPath)) {
      console.warn('⚠️ Arquivo init.sql não encontrado. Pulando migração.');
      return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL de inicialização
    await db.query(sql);
    
    // Scripts Adicionais de Segurança (Garantindo colunas novas)
    await db.query(`
      DO $$ 
      BEGIN 
        -- Garantir kanban_columns e responsible_user_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='kanban_columns') THEN
          CREATE TABLE kanban_columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            color TEXT DEFAULT '#6366F1',
            sort_order INTEGER DEFAULT 0,
            responsible_user_id UUID REFERENCES profiles(user_id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          
          INSERT INTO kanban_columns (title, slug, color, sort_order)
          VALUES 
            ('A Fazer', 'todo', '#94a3b8', 0),
            ('Em Produção', 'doing', '#6366F1', 1),
            ('Revisão', 'review', '#f59e0b', 2),
            ('Concluído', 'done', '#10b981', 3)
          ON CONFLICT (slug) DO NOTHING;
        ELSE
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kanban_columns' AND column_name='responsible_user_id') THEN
            ALTER TABLE kanban_columns ADD COLUMN responsible_user_id UUID REFERENCES profiles(user_id);
          END IF;
        END IF;

        -- Garantir colunas em clients se faltarem
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='phone') THEN
          ALTER TABLE clients ADD COLUMN phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='logo_url') THEN
          ALTER TABLE clients ADD COLUMN logo_url TEXT;
        END IF;
      END $$;
    `);

    console.log('✅ Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração do banco de dados:', err);
    // Não paramos o servidor se a migração falhar (pode ser que as tabelas já existam)
  }
}

module.exports = migrate;
