// src/routes/dispositions.js
import express from "express";
import pool from "../config/db.js";
import { VALID_SALE_METHODS, toMySQLDateTime } from "../utils/helpers.js";

const router = express.Router();

// ---- Disposition: list ----
router.get("/", async (req, res) => {
  try {
    const itemIdParam = req.query.itemId;
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit || "50", 10) || 50, 200)
    );

    const params = [];
    let sql = `
      SELECT
        disposition_ID,
        item_ID,
        sale_date,
        sale_method,
        sale_price
      FROM Disposition
    `;

    if (itemIdParam !== undefined) {
      const itemIdNum = Number(itemIdParam);
      if (!Number.isInteger(itemIdNum) || itemIdNum <= 0) {
        return res.status(400).json({ error: "invalid_item_id" });
      }
      sql += " WHERE item_ID = ?";
      params.push(itemIdNum);
    }

    sql += ` ORDER BY sale_date DESC, disposition_ID DESC LIMIT ${limit}`;

    const [rows] = await pool.query(sql, params);

    const items = rows.map((r) => ({
      disposition_ID: r.disposition_ID,
      item_ID: r.item_ID,
      sale_date: r.sale_date,
      sale_method: r.sale_method,
      sale_price: Number(r.sale_price),
    }));

    return res.json({ items });
  } catch (err) {
    console.error("Error in GET /api/dispositions:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ---- Disposition: create ----
router.post("/", async (req, res) => {
  try {
    const { itemId, saleDate, saleMethod, salePrice } = req.body || {};

    const itemIdNum = Number(itemId);
    const priceNum = Number(salePrice);
    const method = String(saleMethod || "").toUpperCase();

    if (!Number.isInteger(itemIdNum) || itemIdNum <= 0) {
      return res.status(400).json({ error: "invalid_item_id" });
    }

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: "invalid_sale_price" });
    }

    if (!VALID_SALE_METHODS.has(method)) {
      return res.status(400).json({ error: "invalid_sale_method" });
    }

    const saleDateStr = toMySQLDateTime(saleDate);
    if (!saleDateStr) {
      return res.status(400).json({ error: "invalid_sale_date" });
    }

    const [[itemRow]] = await pool.query(
      "SELECT item_ID FROM PawnItem WHERE item_ID = ?",
      [itemIdNum]
    );
    if (!itemRow) {
      return res.status(400).json({ error: "item_not_found" });
    }

    const [result] = await pool.execute(
      `
      INSERT INTO Disposition (item_ID, sale_date, sale_method, sale_price)
      VALUES (?, ?, ?, ?)
      `,
      [itemIdNum, saleDateStr, method, priceNum]
    );

    const dispositionId = result.insertId;

    return res.status(201).json({
      disposition: {
        disposition_ID: dispositionId,
        item_ID: itemIdNum,
        sale_date: saleDateStr,
        sale_method: method,
        sale_price: priceNum,
      },
    });
  } catch (err) {
    console.error("Error in POST /api/dispositions:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ---- Disposition: update ----
router.put("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    const dispositionId = Number(idParam);

    if (!Number.isInteger(dispositionId) || dispositionId <= 0) {
      return res.status(400).json({ error: "invalid_disposition_id" });
    }

    const { saleDate, saleMethod, salePrice } = req.body || {};

    const priceNum = Number(salePrice);
    const method = String(saleMethod || "").toUpperCase();

    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: "invalid_sale_price" });
    }

    if (!VALID_SALE_METHODS.has(method)) {
      return res.status(400).json({ error: "invalid_sale_method" });
    }

    const saleDateStr = toMySQLDateTime(saleDate);
    if (!saleDateStr) {
      return res.status(400).json({ error: "invalid_sale_date" });
    }

    const [[existing]] = await pool.query(
      `
      SELECT disposition_ID, item_ID
      FROM Disposition
      WHERE disposition_ID = ?
      `,
      [dispositionId]
    );

    if (!existing) {
      return res.status(404).json({ error: "disposition_not_found" });
    }

    await pool.execute(
      `
      UPDATE Disposition
      SET sale_date = ?, sale_method = ?, sale_price = ?
      WHERE disposition_ID = ?
      `,
      [saleDateStr, method, priceNum, dispositionId]
    );

    return res.json({
      disposition: {
        disposition_ID: existing.disposition_ID,
        item_ID: existing.item_ID,
        sale_date: saleDateStr,
        sale_method: method,
        sale_price: priceNum,
      },
    });
  } catch (err) {
    console.error("Error in PUT /api/dispositions/:id:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ---- Disposition: delete ----
router.delete("/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    const dispositionId = Number(idParam);

    if (!Number.isInteger(dispositionId) || dispositionId <= 0) {
      return res.status(400).json({ error: "invalid_disposition_id" });
    }

    const [result] = await pool.execute(
      "DELETE FROM Disposition WHERE disposition_ID = ?",
      [dispositionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "disposition_not_found" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/dispositions/:id:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
