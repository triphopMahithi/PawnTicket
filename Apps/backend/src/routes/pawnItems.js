// src/routes/pawnItems.js
import express from "express";
import pool from "../config/db.js";
import { ALLOWED_ITEM_STATUS, toMySQLDateTime } from "../utils/helpers.js";

const router = express.Router();

// Step-1 (pawn-items)
router.post("/", async (req, res) => {
  try {
    const {
      itemType = "",
      description = "",
      appraisedValue = null,
      itemStatus = "IN_STORAGE",

      staffId = null,
      appraisalDate = null,
      evidence = null,
    } = req.body || {};

    const type = String(itemType).trim();
    const desc = String(description).trim();

    const valueNum = Number(
      typeof appraisedValue === "string"
        ? appraisedValue.replace(/[^\d.-]/g, "")
        : appraisedValue
    );

    const status = String(itemStatus).trim().toUpperCase();

    if (!type || !desc || !Number.isFinite(valueNum) || valueNum <= 0) {
      return res.status(400).json({ error: "bad_request" });
    }

    if (!ALLOWED_ITEM_STATUS.has(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }

    const createAppraisal = staffId !== null && staffId !== undefined;

    // ไม่มี appraisal -> insert แค่ PawnItem
    if (!createAppraisal) {
      const [result] = await pool.execute(
        `
        INSERT INTO PawnItem (item_Type, description, appraised_value, item_status)
        VALUES (?, ?, ?, ?)
      `,
        [type, desc, valueNum, status]
      );

      const insertedId = result.insertId;

      return res.status(201).json({
        item: {
          id: String(insertedId),
          itemType: type,
          description: desc,
          appraisedValue: valueNum,
          itemStatus: status,
        },
      });
    }

    // มี staffId -> สร้างทั้ง PawnItem + Appraisal ใน transaction
    const staffIdNum = Number(staffId);
    if (!Number.isInteger(staffIdNum) || staffIdNum <= 0) {
      return res.status(400).json({ error: "invalid_staff" });
    }

    const appraisalDateStr = toMySQLDateTime(appraisalDate);
    if (appraisalDate && !appraisalDateStr) {
      return res.status(400).json({ error: "invalid_appraisal_date" });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [staffRows] = await conn.query(
        "SELECT Staff_ID FROM Employee WHERE Staff_ID = ?",
        [staffIdNum]
      );
      if (!staffRows.length) {
        await conn.rollback();
        return res.status(400).json({ error: "staff_not_found" });
      }

      const [pawnResult] = await conn.execute(
        `
        INSERT INTO PawnItem (item_Type, description, appraised_value, item_status)
        VALUES (?, ?, ?, ?)
      `,
        [type, desc, valueNum, status]
      );

      const itemId = pawnResult.insertId;

      const evidenceBuf = evidence ? Buffer.from(String(evidence)) : null;

      const [appResult] = await conn.execute(
        `
        INSERT INTO Appraisal
          (appraised_value, appraisal_Date, evidence, item_ID, Staff_ID)
        VALUES (?, ?, ?, ?, ?)
      `,
        [valueNum, appraisalDateStr, evidenceBuf, itemId, staffIdNum]
      );

      await conn.commit();

      return res.status(201).json({
        item: {
          id: String(itemId),
          itemType: type,
          description: desc,
          appraisedValue: valueNum,
          itemStatus: status,
        },
        appraisal: {
          id: String(appResult.insertId),
          appraisedValue: valueNum,
          appraisalDate: appraisalDateStr,
          itemId: String(itemId),
          staffId: staffIdNum,
        },
      });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      return res.status(500).json({ error: "server_error" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
