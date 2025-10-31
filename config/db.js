import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ตรวจว่าใช้โหมดไหน (local หรือ prod)
const isProd = process.env.DB_MODE === "prod";

// ตั้งค่า config ตามโหมด
const config = {
  host: isProd ? process.env.PROD_DB_HOST : process.env.LOCAL_DB_HOST,
  user: isProd ? process.env.PROD_DB_USER : process.env.LOCAL_DB_USER,
  password: isProd ? process.env.PROD_DB_PASS : process.env.LOCAL_DB_PASS,
  database: isProd ? process.env.PROD_DB_NAME : process.env.LOCAL_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// สร้าง connection pool
const pool = mysql.createPool(config);

// ✅ ทดสอบเชื่อมต่อ DB ตอน start server
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("====================================");
    console.log(`✅ MySQL connected successfully`);
    console.log(`   Mode     : ${isProd ? "Production" : "Local"}`);
    console.log(`   Host     : ${config.host}`);
    console.log(`   Database : ${config.database}`);
    console.log("====================================");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection error:", err.message);
  }
})();

export default pool;
