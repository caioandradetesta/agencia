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

    console.log('✅ Migração V6 finalizada!');
  } catch (err) {
    console.error('❌ ERRO NO PROCESSO DE MIGRAÇÃO:', err);
  }
}

module.exports = migrate;
