const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('--- INICIANDO MIGRAÇÃO INDIVIDUAL (V6) ---');
  
  const runQuery = async (query, desc) => {
    try {
      await db.query(query);
      console.log(`✅ ${desc}`);
      return true;
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`ℹ️ ${desc} (Já existe)`);
        return true;
      } else {
        console.warn(`⚠️ Erro em "${desc}":`, err.message);
        return false;
      }
    }
  };

  try {
    // 1. Tentar extensões de forma isolada (Não trava se falhar)
    await runQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', 'Extensão uuid-ossp');
    await runQuery('CREATE EXTENSION IF NOT EXISTS "pgcrypto";', 'Extensão pgcrypto');

    // 2. Garantir coluna UNIQUE em profiles antes de qualquer coisa
    await runQuery('ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);', 'Constraint UNIQUE em profiles.user_id');

    // 3. Ler o SQL e executar comando por comando (Split inteligente)
    const sqlPath = path.join(__dirname, 'init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Split básico por ponto e vírgula, mas ignorando o que está dentro de aspas simples se possível
      // Para o init.sql simples, o split por ; funciona se não houver strings complexas
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        const snippet = cmd.substring(0, 30).replace(/\n/g, ' ');
        await runQuery(cmd, `Comando ${i+1}: ${snippet}...`);
      }
    }

    // 4. Correções finais para garantir o Kanban
    await runQuery(`
      CREATE TABLE IF NOT EXISTS kanban_columns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#6366F1',
        sort_order INTEGER DEFAULT 0,
        responsible_user_id UUID REFERENCES profiles(user_id),
        responsible_user_ids UUID[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `, 'Tabela kanban_columns (V7)');

    // Forçar adição da coluna caso a tabela já exista (V7)
    await runQuery(`
      ALTER TABLE kanban_columns ADD COLUMN IF NOT EXISTS responsible_user_ids UUID[] DEFAULT '{}';
      UPDATE kanban_columns SET responsible_user_ids = '{}' WHERE responsible_user_ids IS NULL;
    `, 'Sincronizando responsible_user_ids em kanban_columns');

    // Garantir criação da tabela task_attachments (V8)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela task_attachments (V8)');

    // Histórico de Tarefas (V9)
    await runQuery(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
    `, 'Coluna created_by em tasks (V9)');

    await runQuery(`
      CREATE TABLE IF NOT EXISTS task_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela task_history (V9)');

    // Repositório de arquivos do cliente (V10)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS client_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela client_files (V10)');

    // Notas de clientes (V10)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS client_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela client_notes (V10)');

    // Pastas de clientes (V11)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS client_folders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela client_folders (V11)');

    // Coluna folder_id em client_files (V11)
    await runQuery(`
      ALTER TABLE client_files ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES client_folders(id) ON DELETE CASCADE;
    `, 'Coluna folder_id em client_files (V11)');

    // Pastas de projetos (V12)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS project_folders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela project_folders (V12)');

    // Arquivos de projetos (V12)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS project_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        folder_id UUID REFERENCES project_folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela project_files (V12)');

    // Notas de projetos (V12)
    await runQuery(`
      CREATE TABLE IF NOT EXISTS project_notes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `, 'Tabela project_notes (V12)');

    // Coluna project_folder_id em tasks (V12)
    await runQuery(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_folder_id UUID REFERENCES project_folders(id) ON DELETE SET NULL;
    `, 'Coluna project_folder_id em tasks (V12)');

    console.log('✅ Migração V6 finalizada!');
  } catch (err) {
    console.error('❌ ERRO NO PROCESSO DE MIGRAÇÃO:', err);
  }
}

module.exports = migrate;
