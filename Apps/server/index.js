import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import 'dotenv/config';
const app = express();
app.use(cors());
app.use(express.json());

// ---- MySQL connection pool ----
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

// ช่วยหนีอักขระสำหรับ LIKE
const escapeLike = (s = "") => String(s).replace(/([%_\\])/g, "\\$1");
const onlyDigits = (s = "") => String(s).replace(/\D/g, "");


app.get("/api/customers", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "20", 10) || 20, 50));

    if (!q) return res.json({ items: [] });

    const like = `%${escapeLike(q)}%`;
    const qDigits = q.replace(/\D/g, "");

    // สร้าง SQL ทีละส่วน + เก็บ params ให้พอดีกับจำนวน ?
    let sql = `
      SELECT
        Customer_ID AS id,
        CONCAT_WS(' ', first_name, last_name) AS name,
        national_ID AS nationalId,
        phone_number AS phone,
        address AS addressLine
      FROM Customer
      WHERE
        CONCAT_WS(' ', first_name, last_name) LIKE ?
        OR national_ID LIKE ?
        OR phone_number LIKE ?
        OR address LIKE ?
    `;
    const params = [like, like, like, like];

    if (qDigits) {
      sql += `
        OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(national_ID,'-',''),' ',''),'(',''),')',''),'+','') LIKE ?
        OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone_number,'-',''),' ',''),'(',''),')',''),'+','') LIKE ?
      `;
      const likeDigits = `%${qDigits}%`;
      params.push(likeDigits, likeDigits);
    }

    sql += ` ORDER BY Customer_ID DESC LIMIT ${limit}`;

    // ดีบักจำนวน placeholder vs params ถ้าต้องการ
    // console.log('placeholders:', (sql.match(/\?/g)||[]).length, 'params:', params.length);

    // ใช้ query หรือ execute ก็ได้ (ตรงนี้ไม่มี LIMIT ? แล้ว)
    const [rows] = await pool.query(sql, params);

    const items = rows.map(r => ({
      id: String(r.id),
      name: r.name,
      nationalId: String(r.nationalId ?? ""),
      phone: String(r.phone ?? ""),
      address: r.addressLine ? { raw: r.addressLine } : undefined,
    }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "20", 10) || 20, 50));

    if (!q) return res.json({ items: [] });

    const like = `%${escapeLike(q)}%`;
    const qDigits = onlyDigits(q);

    let sql = `
      SELECT
        Staff_ID   AS id,
        first_name,
        last_name,
        phone_number,
        position
      FROM Employee
      WHERE
        Staff_ID LIKE ?
        OR CONCAT_WS(' ', first_name, last_name) LIKE ?
        OR first_name LIKE ?
        OR last_name  LIKE ?
        OR phone_number LIKE ?
        OR position LIKE ?
    `;
    const params = [like, like, like, like, like, like];

    if (qDigits) {
      sql += `
        OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone_number,'-',''),' ',''),'(',''),')',''),'+','') LIKE ?
      `;
      params.push(`%${qDigits}%`);
    }

    // ฝัง LIMIT เป็นตัวเลข (เลี่ยงปัญหา LIMIT ?)
    sql += ` ORDER BY Staff_ID DESC LIMIT ${limit}`;

    const [rows] = await pool.query(sql, params);

    const items = rows.map(r => ({
      id: String(r.id),                        // map -> staff_ID
      first_name: String(r.first_name ?? ""),
      last_name:  String(r.last_name  ?? ""),
      phone_number: String(r.phone_number ?? ""), // digits-only แนะนำให้เก็บ/แสดงตามจริง
      position: String(r.position ?? "STAFF"),    // 'STAFF'|'SUPERVISOR'|'MANAGER'
    }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`API listening on http://${process.env.HOST_DOMAIN}:${process.env.PORT}`);
});
