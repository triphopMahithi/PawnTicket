// src/routes/topCustomersRoutes.js
import express from "express";
import pool from "../config/db.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const query = `
    SELECT 
      c.Customer_ID,
      c.first_name,
      c.last_name,
      COUNT(t.ticket_ID) AS ticketCount
    FROM 
      Customer c
    LEFT JOIN 
      PawnTicket t ON c.Customer_ID = t.Customer_ID
    GROUP BY 
      c.Customer_ID
    ORDER BY 
      ticketCount DESC
    LIMIT 3;
  `;
  
  try {
    const [rows] = await pool.query(query); 
    res.json(rows); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

export default router;
