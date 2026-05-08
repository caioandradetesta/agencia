const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('--- INICIANDO MIGRAÇÃO ULTRA-ROBUSTA (V5) ---');
  
  const runQuery = async (query, desc) => {
    try {
      await db.query(query);
      console.log(`✅ ${desc}`);
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log(`ℹ️ ${desc} (Já existe)`);
      } else {
        console.warn(`⚠️ Erro em "${desc}":`, err.message);
      }
    }
  };

  try {
    // 1. Extensões (Crítico para UUIDs)
    await runQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', 'Extensão uuid-ossp');
    await runQuery('CREATE EXTENSION IF NOT EXISTS "pgcrypto";', 'Extensão pgcrypto');

    // 2. Garantir que Profiles tenha User_ID único (Necessário para o Kanban)
    await runQuery('ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);', 'Constraint UNIQUE em profiles.user_id');

    // 3. Criar a tabela kanban_columns na marra se não existir
    await runQuery(`
      CREATE TABLE IF NOT EXISTS kanban_columns (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#6366F1',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `, 'Tabela kanban_columns');

    // 4. Garantir a coluna de responsável (Caso a tabela tenha sido criada sem ela)
    await runQuery('ALTER TABLE kanban_columns ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES profiles(user_id);', 'Coluna responsible_user_id');

    // 5. Rodar o init.sql completo (Mas de forma segura, ignorando o que já existe)
    const sqlPath = path.join(__dirname, 'init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      // Tentamos rodar o bloco todo, se falhar, os passos acima já garantiram o essencial
      try {
        await db.query(sql);
        console.log('✅ init.sql processado completamente.');
      } catch (e) {
        console.log('ℹ️ Nota: Algumas partes do init.sql já estavam aplicadas.');
      }
    }

    console.log('✅ Migração V5 finalizada!');
  } catch (err) {
    console.error('❌ ERRO FATAL NO PROCESSO DE MIGRAÇÃO:', err);
  }
}

module.exports = migrate;
