import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export const query = async (text, params = []) => {
  const result = await pool.query(text, params);
  return result;
};

export const withTransaction = async (handler) => {
  const client = await pool.connect();

  try {
    await client.query("begin");
    const result = await handler(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
};
