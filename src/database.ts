import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

pool.connect(() => console.log(`Postgreslq connected on ${process.env.PG_HOST} as ${process.env.PG_USER}`));

export default pool;
