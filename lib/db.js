import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "drinksbutwal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.DB_SSL === "true" && {
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  }),
});

export async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

export async function getConnection() {
  return await pool.getConnection();
}

export default pool;
