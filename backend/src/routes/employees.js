// src/routes/employees.js
import express from "express";
import pool from "../config/db.js";
import { escapeLike, onlyDigits, ALLOWED_EMP_POSITIONS } from "../utils/helpers.js";
import { handleServerError } from "../utils/errorHandler.js";

const router = express.Router();

// Step-1 (employees) : list + search
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit || "20", 10) || 20, 50)
    );

    // ถ้าไม่มี q -> ดึงทุกพนักงาน (จำกัดตาม limit)
    if (!q) {
      const [rows] = await pool.query(
        `
        SELECT
          Staff_ID   AS id,
          first_name,
          last_name,
          phone_number,
          position
        FROM Employee
        ORDER BY Staff_ID DESC
        LIMIT ?
        `,
        [limit]
      );

      const items = rows.map((r) => ({
        id: String(r.id),
        first_name: String(r.first_name ?? ""),
        last_name: String(r.last_name ?? ""),
        phone_number: String(r.phone_number ?? ""),
        position: String(r.position ?? "STAFF"),
      }));

      return res.json({ items });
    }

    // มี q -> search
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

    sql += ` ORDER BY Staff_ID DESC LIMIT ${limit}`;

    const [rows] = await pool.query(sql, params);

    const items = rows.map((r) => ({
      id: String(r.id),
      first_name: String(r.first_name ?? ""),
      last_name: String(r.last_name ?? ""),
      phone_number: String(r.phone_number ?? ""),
      position: String(r.position ?? "STAFF"),
    }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

// Create employee
router.post("/", async (req, res) => {
  try {
    const { first_name, last_name, phone_number, position } = req.body;

    if (!first_name || !last_name || !phone_number || !position) {
      return res.status(400).json({
        error: "missing_fields",
        message: "ต้องส่ง first_name, last_name, phone_number, position ครบ",
      });
    }

    const posUpper = String(position).toUpperCase();
    if (!ALLOWED_EMP_POSITIONS.includes(posUpper)) {
      return res.status(400).json({
        error: "invalid_position",
        message: `position ต้องเป็นหนึ่งใน: ${ALLOWED_EMP_POSITIONS.join(", ")}`,
      });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO Employee (first_name, last_name, phone_number, position)
      VALUES (?, ?, ?, ?)
      `,
      [first_name, last_name, phone_number, posUpper]
    );

    const insertedId = result.insertId;

    const [rows] = await pool.execute(
      "SELECT * FROM Employee WHERE Staff_ID = ?",
      [insertedId]
    );

    res.status(201).json({
      message: "created",
      employee: rows[0],
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const staffId = Number(req.params.id);
    const { first_name, last_name, phone_number, position } = req.body;

    if (!staffId || Number.isNaN(staffId)) {
      return res.status(400).json({
        error: "invalid_id",
        message: "id ต้องเป็นเลข",
      });
    }

    if (!first_name || !last_name || !phone_number || !position) {
      return res.status(400).json({
        error: "missing_fields",
        message: "ต้องส่ง first_name, last_name, phone_number, position ครบ",
      });
    }

    const posUpper = String(position).toUpperCase();
    if (!ALLOWED_EMP_POSITIONS.includes(posUpper)) {
      return res.status(400).json({
        error: "invalid_position",
        message: `position ต้องเป็นหนึ่งใน: ${ALLOWED_EMP_POSITIONS.join(", ")}`,
      });
    }

    const [foundRows] = await pool.execute(
      "SELECT * FROM Employee WHERE Staff_ID = ?",
      [staffId]
    );

    if (foundRows.length === 0) {
      return res.status(404).json({
        error: "not_found",
        message: "ไม่พบพนักงานที่ต้องการแก้ไข",
      });
    }

    await pool.execute(
      `
      UPDATE Employee
      SET first_name = ?, last_name = ?, phone_number = ?, position = ?
      WHERE Staff_ID = ?
      `,
      [first_name, last_name, phone_number, posUpper, staffId]
    );

    const [rows] = await pool.execute(
      "SELECT * FROM Employee WHERE Staff_ID = ?",
      [staffId]
    );

    res.json({
      message: "updated",
      employee: rows[0],
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// Delete employee
router.delete("/:id", async (req, res) => {
  try {
    const staffId = Number(req.params.id);

    if (!staffId || Number.isNaN(staffId)) {
      return res.status(400).json({
        error: "invalid_id",
        message: "id ต้องเป็นเลข",
      });
    }

    const [result] = await pool.execute(
      "DELETE FROM Employee WHERE Staff_ID = ?",
      [staffId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "not_found",
        message: "ไม่พบพนักงานที่ต้องการลบ",
      });
    }

    res.json({
      message: "deleted",
      Staff_ID: staffId,
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

// Partial update employee (เช่น สำหรับอัปเดตผู้ประเมินจาก TicketDetailModal)
router.patch("/:id", async (req, res) => {
  try {
    const staffId = Number(req.params.id);
    if (!staffId || Number.isNaN(staffId)) {
      return res.status(400).json({
        error: "invalid_id",
        message: "id ต้องเป็นเลข",
      });
    }

    const { first_name, last_name, phone_number, position } = req.body;

    const fields = [];
    const params = [];

    if (first_name !== undefined) {
      fields.push("first_name = ?");
      params.push(first_name);
    }

    if (last_name !== undefined) {
      fields.push("last_name = ?");
      params.push(last_name);
    }

    if (phone_number !== undefined) {
      fields.push("phone_number = ?");
      params.push(phone_number);
    }

    if (position !== undefined) {
      const posUpper = String(position).toUpperCase();
      if (!ALLOWED_EMP_POSITIONS.includes(posUpper)) {
        return res.status(400).json({
          error: "invalid_position",
          message: `position ต้องเป็นหนึ่งใน: ${ALLOWED_EMP_POSITIONS.join(", ")}`,
        });
      }
      fields.push("position = ?");
      params.push(posUpper);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        error: "no_fields_to_update",
        message: "ไม่มีฟิลด์ใด ๆ ให้แก้ไข",
      });
    }

    params.push(staffId);

    const [result] = await pool.execute(
      `
      UPDATE Employee
      SET ${fields.join(", ")}
      WHERE Staff_ID = ?
      `,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "not_found",
        message: "ไม่พบพนักงานที่ต้องการแก้ไข",
      });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM Employee WHERE Staff_ID = ?",
      [staffId]
    );

    return res.json({
      message: "updated",
      employee: rows[0],
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

export default router;
