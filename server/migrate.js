const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('--- INICIANDO MIGRAÇÃO ROBUSTA ---');
  try {
    // 1. Tentar habilitar extensões silenciosamente
    const extensions = ['uuid-ossp', 'pgcrypto'];
    for (const ext of extensions) {
      try {
        await db.query(`CREATE EXTENSION IF NOT EXISTS "${ext}";`);
      } catch (e) {
        console.log(`ℹ️ Nota: Extensão ${ext} já ativa ou requer superuser.`);
      }
    }

    const sqlPath = path.join(__dirname, 'init.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Dividir o SQL por ponto e vírgula e executar cada comando individualmente para isolar falhas
      // Isso evita que um erro de "tabela já existe" cancele o resto da migração
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);

      for (const cmd of commands) {
        try {
          await db.query(cmd);
        } catch (err) {
          // Ignorar erros comuns de "já existe"
          if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
            console.warn(`⚠️ Comando falhou, mas continuando: ${cmd.substring(0, 50)}... -> ${err.message}`);
          }
        }
      }
    }

    console.log('✅ Processo de migração finalizado!');
  } catch (err) {
    console.error('❌ FALHA NO PROCESSO DE MIGRAÇÃO:', err);
  }
}

module.exports = migrate;
