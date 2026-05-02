import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";

const start = async () => {
  await pool.query("select 1");
  app.listen(env.port, () => {
    console.log(`CampusConnect API running on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
