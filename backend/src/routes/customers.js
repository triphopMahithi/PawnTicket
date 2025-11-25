// src/routes/customers.js
import express from "express";
import pool from "../config/db.js";
import { escapeLike, onlyDigits } from "../utils/helpers.js";

const router = express.Router();

// Step-1 (customers) : search
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit || "20", 10) || 20, 50)
    );

    if (!q) return res.json({ items: [] });

    const like = `%${escapeLike(q)}%`;
    const qDigits = onlyDigits(q);

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
    const [rows] = await pool.query(sql, params);

    const items = rows.map((r) => ({
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

// Step-1 (customers) : create
router.post("/", async (req, res) => {
  try {
    const {
      name = "",
      nationalId = "",
      phone = "",
      dateOfBirthISO = null,
      address = null, // { houseNo, street, tambon, amphoe, province, postalCode, note, raw? }
    } = req.body || {};

    const fullName = String(name).trim();
    const nat = onlyDigits(nationalId);
    const phoneDigits = onlyDigits(phone);
    const dob =
      dateOfBirthISO && /^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirthISO))
        ? String(dateOfBirthISO)
        : null;

    let first_name = "";
    let last_name = "";
    if (fullName) {
      const parts = fullName.split(/\s+/);
      first_name = parts.shift() || "";
      last_name = parts.join(" ");
    }

    const addressLine =
      (address && address.raw && String(address.raw).trim()) ||
      [
        address?.houseNo && `เลขที่ ${address.houseNo}`,
        address?.street && `ถ.${address.street}`,
        address?.tambon && `ต.${address.tambon}`,
        address?.amphoe && `อ.${address.amphoe}`,
        address?.province && `จ.${address.province}`,
        address?.postalCode && `${address.postalCode}`,
      ]
        .filter(Boolean)
        .join(" ");

    if (!fullName || nat.length !== 13 || !phoneDigits) {
      return res.status(400).json({ error: "bad_request" });
    }

    const [dup] = await pool.query(
      `
      SELECT Customer_ID FROM Customer
      WHERE national_ID = ?
         OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone_number,'-',''),' ',''),'(',''),')',''),'+','') = ?
    `,
      [nat, phoneDigits]
    );
    if (dup.length) {
      return res.status(409).json({ error: "duplicate" });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO Customer
        (first_name, last_name, national_ID, date_of_birth, address, phone_number, kyc_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [first_name, last_name, nat, dob, addressLine || null, phoneDigits, "PENDING"]
    );

    const insertedId = result.insertId;

    return res.status(201).json({
      item: {
        id: String(insertedId),
        name: fullName,
        nationalId: nat,
        phone: phoneDigits,
        dateOfBirthISO: dob,
        address: addressLine ? { raw: addressLine } : undefined,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ดึงตั๋วทั้งหมดของลูกค้าคนนั้น ๆ
// GET /api/customers/:id/tickets
router.get("/:id/tickets", async (req, res) => {
  try {
    const idParam = req.params.id;
    const customerId = Number(idParam);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: "invalid_customer_id" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        pt.ticket_ID,
        pt.Contract_Date,
        pt.Loan_Amount,
        pt.interest_rate,
        pt.due_date,
        pt.notice_date,
        pt.contract_status,
        pt.Staff_ID,
        pt.item_ID,
        c.Customer_ID,
        c.first_name,
        c.last_name
      FROM PawnTicket pt
      JOIN Customer c ON pt.Customer_ID = c.Customer_ID
      WHERE c.Customer_ID = ?
      ORDER BY pt.Contract_Date DESC, pt.ticket_ID DESC
      `,
      [customerId]
    );

    const items = rows.map((r) => ({
      ticket_ID: r.ticket_ID,
      first_name: r.first_name,
      last_name: r.last_name,
      customer_ID: r.Customer_ID,
      contract_date: r.Contract_Date,      
      loan_amount: Number(r.Loan_Amount),
      interest_rate: Number(r.interest_rate),
      due_date: r.due_date,
      notice_date: r.notice_date,
      contract_status: r.contract_status,
      staff_ID: r.Staff_ID,
      item_ID: r.item_ID,
    }));

    return res.json({ items });
  } catch (err) {
    console.error("Error in GET /api/customers/:id/tickets:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

router.delete("/:customerId/tickets", async (req, res) => {
  try {
    const idParam = req.params.customerId;
    const customerId = Number(idParam);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: "invalid_customer_id" });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1) ดึง ticket_ID ทุกใบของลูกค้าคนนี้
      const [ticketRows] = await conn.query(
        `
        SELECT ticket_ID
        FROM PawnTicket
        WHERE Customer_ID = ?
        `,
        [customerId]
      );

      if (!ticketRows.length) {
        // ไม่มีตั๋วให้ลบ แต่ก็ถือว่าทำงานสำเร็จ
        await conn.commit();
        return res.json({
          success: true,
          deletedTickets: 0,
          deletedPayments: 0,
        });
      }

      const ticketIds = ticketRows.map((r) => r.ticket_ID);

      // สร้าง placeholders (?, ?, ?, ...)
      const placeholders = ticketIds.map(() => "?").join(",");

      // 2) ลบ Payment ที่อ้างถึง ticket เหล่านี้ก่อน (กัน FK error)
      const [paymentResult] = await conn.execute(
        `
        DELETE FROM Payment
        WHERE ticket_ID IN (${placeholders})
        `,
        ticketIds
      );

      // 3) ลบ PawnTicket ทุกใบของลูกค้าคนนี้
      const [ticketResult] = await conn.execute(
        `
        DELETE FROM PawnTicket
        WHERE ticket_ID IN (${placeholders})
        `,
        ticketIds
      );

      await conn.commit();

      return res.json({
        success: true,
        deletedTickets: ticketResult.affectedRows,
        deletedPayments: paymentResult.affectedRows,
      });
    } catch (err) {
      await conn.rollback();
      console.error("Error in DELETE /api/customers/:customerId/tickets:", err);
      return res.status(500).json({ error: "server_error" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error in outer DELETE /api/customers/:customerId/tickets:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// PATCH /api/customers/:customerId
router.patch("/:customerId", async (req, res) => {
  const { customerId } = req.params;

  const allowedFields = [
    "first_name",
    "last_name",
    "national_ID",
    "date_of_birth",
    "address",
    "phone_number",
    "kyc_status",
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      setClauses.push(`${field} = ?`);
      params.push(req.body[field]);
    }
  }

  if (setClauses.length === 0) {
    return res
      .status(400)
      .json({ error: "No valid fields to update for Customer" });
  }

  params.push(customerId);

  try {
    const [result] = await pool.query(
      `UPDATE Customer SET ${setClauses.join(", ")} WHERE Customer_ID = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("Error updating customer:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// GET /api/customers/:customerId  - รายละเอียดลูกค้าคนเดียว
router.get("/:customerId", async (req, res) => {
  try {
    const idParam = req.params.customerId;
    const customerId = Number(idParam);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: "invalid_customer_id" });
    }

    const [rows] = await pool.query(
      `
      SELECT
        Customer_ID,
        first_name,
        last_name,
        national_ID,
        date_of_birth,
        address,
        phone_number,
        kyc_status
      FROM Customer
      WHERE Customer_ID = ?
      `,
      [customerId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "customer_not_found" });
    }

    const r = rows[0];

    return res.json({
      id: String(r.Customer_ID),
      first_name: r.first_name,
      last_name: r.last_name,
      national_ID: r.national_ID,
      date_of_birth: r.date_of_birth
        ? new Date(r.date_of_birth).toISOString().slice(0, 10) // YYYY-MM-DD
        : null,
      address: r.address,
      phone_number: String(r.phone_number ?? ""),
      kyc_status: r.kyc_status,
    });
  } catch (err) {
    console.error("Error in GET /api/customers/:customerId:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// DELETE /api/customers/:customerId
router.delete("/:customerId", async (req, res) => {
  const { customerId } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM Customer WHERE Customer_ID = ?`,
      [customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    return res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Error deleting customer:", err);
    return res.status(500).json({ error: "server_error" });
  }
});


export default router;
