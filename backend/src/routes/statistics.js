// src/routes/statistics.js
import express from "express";
import pool from "../config/db.js"; 

const router = express.Router();

// API route สำหรับการดึงข้อมูลสถิติ
router.get("/", async (req, res) => {
  try {
    // SQL สำหรับนับจำนวนลูกค้าทั้งหมด
    const [totalCustomersResult] = await pool.query(
      `SELECT COUNT(*) AS totalCustomers FROM Customer`
    );

    // SQL สำหรับนับจำนวนตั๋วทั้งหมด
    const [totalTicketsResult] = await pool.query(
      `SELECT COUNT(*) AS totalTickets FROM PawnTicket`
    );

    // SQL สำหรับนับจำนวนตั๋วที่ใช้งานอยู่
    const [activeTicketsResult] = await pool.query(
      `SELECT COUNT(*) AS activeTickets FROM PawnTicket WHERE contract_status = 'ACTIVE'`
    );

    // SQL สำหรับนับจำนวนตั๋วที่หมดอายุ
    const [expiredTicketsResult] = await pool.query(
      `SELECT COUNT(*) AS expiredTickets FROM PawnTicket WHERE contract_status = 'EXPIRED'`
    );

    // ส่งข้อมูลสถิติกลับ
    res.json({
      totalCustomers: totalCustomersResult[0].totalCustomers,
      totalTickets: totalTicketsResult[0].totalTickets,
      activeTickets: activeTicketsResult[0].activeTickets,
      expiredTickets: expiredTicketsResult[0].expiredTickets,
    });
  } catch (err) {
    console.error("Error fetching statistics:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/top-customers", async (req, res) => {
  const query = `
    SELECT 
      c.id,
      c.name,
      c.phone,
      COUNT(t.id) AS ticketCount
    FROM 
      Customers c
    LEFT JOIN 
      Tickets t ON c.id = t.customerId
    GROUP BY 
      c.id
    ORDER BY 
      ticketCount DESC
    LIMIT 10;
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
