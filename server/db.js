const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Desativa SSL para conexões locais no Dokploy
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
