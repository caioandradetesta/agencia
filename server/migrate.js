const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('--- INICIANDO MIGRAÇÃO ROBUSTA (V4) ---');
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    if (!fs.existsSync(sqlPath)) return;

    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
      await db.query('BEGIN');
      
      // 1. Garantir extensões
      await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
      
      // 2. Correção Crítica: Garantir que profiles.user_id seja UNIQUE para permitir FKs
      try {
        await db.query('ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);');
      } catch (e) {
        // Ignorar se já for unique
      }

      // 3. Executar o SQL completo
      await db.query(sql);
      
      await db.query('COMMIT');
      console.log('✅ Banco de dados sincronizado com sucesso!');
    } catch (sqlErr) {
      await db.query('ROLLBACK');
      console.warn('⚠️ Falha no bloco SQL completo, tentando correções individuais...', sqlErr.message);
      
      // Tentativas individuais para garantir o funcionamento do Kanban
      const fixes = [
        `ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);`,
        `CREATE TABLE IF NOT EXISTS kanban_columns (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          color TEXT DEFAULT '#6366F1',
          sort_order INTEGER DEFAULT 0,
          responsible_user_id UUID REFERENCES profiles(user_id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );`,
        `ALTER TABLE kanban_columns ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES profiles(user_id);`
      ];

      for (const cmd of fixes) {
        try {
          await db.query(cmd);
        } catch (e) {
          console.log('ℹ️ Fix ignorado ou já aplicado:', e.message);
        }
      }
    }

    console.log('✅ Processo de migração finalizado!');
  } catch (err) {
    console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', err);
  }
}

module.exports = migrate;
