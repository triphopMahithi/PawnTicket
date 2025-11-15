// src/routes/payments.js
import express from "express";
import pool from "../config/db.js";
import { VALID_PAYMENT_TYPES, toMySQLDateTime } from "../utils/helpers.js";

const router = express.Router();

// Step-3: Create Payment Record
router.post("/payment", async (req, res) => {
  try {
    const { ticket_ID, payment_date, amount_paid, payment_type } =
      req.body || {};

    const amountNum = Number(amount_paid);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: "invalid_amount_paid" });
    }

    const type = String(payment_type || "").toUpperCase();
    if (!VALID_PAYMENT_TYPES.has(type)) {
      return res.status(400).json({ error: "invalid_payment_type" });
    }

    const paymentDateStr = toMySQLDateTime(payment_date);
    if (!paymentDateStr) {
      return res.status(400).json({ error: "invalid_payment_date" });
    }

    const [ticketRows] = await pool.query(
      `
      SELECT 
        pt.ticket_ID,
        pt.Contract_Date,
        pt.Loan_Amount,
        pt.interest_rate,
        pt.due_date_date,
        pt.notice_date,
        pt.contract_status,
        c.Customer_ID,
        CONCAT_WS(' ', c.first_name, c.last_name) AS customerName
      FROM PawnTicket pt
      JOIN Customer c ON pt.Customer_ID = c.Customer_ID
      WHERE pt.ticket_ID = ?
      `,
      [ticket_ID]
    );

    if (!ticketRows.length) {
      return res.status(404).json({ error: "ticket_not_found" });
    }

    const ticketData = ticketRows[0];

    const [result] = await pool.execute(
      `
      INSERT INTO Payment (ticket_ID, payment_date, amount_paid, payment_type)
      VALUES (?, ?, ?, ?)
      `,
      [ticket_ID, paymentDateStr, amountNum, type]
    );

    return res.status(201).json({
      payment: {
        payment_ID: result.insertId,
        ticket_ID,
        payment_date: paymentDateStr,
        amount_paid: amountNum,
        payment_type: type,
      },
      ticket: {
        ticket_ID: ticketData.ticket_ID,
        contractDate: ticketData.Contract_Date,
        loanAmount: ticketData.Loan_Amount,
        interestRate: ticketData.interest_rate,
        dueDate: ticketData.due_date_date,
        noticeDate: ticketData.notice_date,
        contractStatus: ticketData.contract_status,
        customer: {
          id: ticketData.Customer_ID,
          name: ticketData.customerName,
        },
      },
    });
  } catch (err) {
    console.error("Error in /api/payment:", err);
    return res
      .status(500)
      .json({ error: "server_error", details: err.message });
  }
});

export default router;
