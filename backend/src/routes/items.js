// src/routes/items.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// Item summary: ใช้ตอนพิมพ์ item_ID เพื่อเอาไปแสดง item_Type + ticket_ID
router.get("/:id/summary", async (req, res) => {
  try {
    const idParam = req.params.id;
    const itemId = Number(idParam);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ error: "invalid_item_id" });
    }

    const [itemRows] = await pool.query(
      `
      SELECT
        item_ID,
        item_Type,
        description,
        item_status
      FROM PawnItem
      WHERE item_ID = ?
      `,
      [itemId]
    );

    if (!itemRows.length) {
      return res.status(404).json({ error: "item_not_found" });
    }

    const item = itemRows[0];

    const [ticketRows] = await pool.query(
      `
      SELECT
        ticket_ID,
        Contract_Date,
        contract_status
      FROM PawnTicket
      WHERE item_ID = ?
      ORDER BY Contract_Date DESC, ticket_ID DESC
      LIMIT 1
      `,
      [itemId]
    );

    const latestTicket = ticketRows.length
      ? {
          ticket_ID: ticketRows[0].ticket_ID,
          contract_status: ticketRows[0].contract_status,
          contract_date: ticketRows[0].Contract_Date,
        }
      : null;

    return res.json({
      item: {
        item_ID: item.item_ID,
        item_type: item.item_Type,
        description: item.description,
        item_status: item.item_status,
      },
      latestTicket,
    });
  } catch (err) {
    console.error("Error in GET /api/items/:id/summary:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
