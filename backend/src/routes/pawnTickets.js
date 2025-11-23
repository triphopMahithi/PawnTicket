// src/routes/pawnTickets.js
import express from "express";
import pool from "../config/db.js";
import { ALLOWED_CONTRACT_STATUS, toMySQLDateTime } from "../utils/helpers.js";

const router = express.Router();

// Step-2 : create pawn ticket
router.post("/", async (req, res) => {
  try {
    const {
      customerId,
      staffId,
      itemId,
      contractDate,
      loanAmount,
      interestRate,
      dueDate = null,
      noticeDate = null,
      contractStatus = "ACTIVE",
    } = req.body || {};

    const customerIdNum = Number(customerId);
    const staffIdNum = Number(staffId);
    const itemIdNum = Number(itemId);
    const loanAmountNum = Number(loanAmount);
    const interestRateNum = Number(interestRate);

    if (
      !Number.isInteger(customerIdNum) ||
      !Number.isInteger(staffIdNum) ||
      !Number.isInteger(itemIdNum) ||
      customerIdNum <= 0 ||
      staffIdNum <= 0 ||
      itemIdNum <= 0
    ) {
      return res.status(400).json({ error: "invalid_foreign_key" });
    }

    if (!Number.isFinite(loanAmountNum) || loanAmountNum <= 0) {
      return res.status(400).json({ error: "invalid_loan_amount" });
    }

    if (
      !Number.isFinite(interestRateNum) ||
      interestRateNum < 0 ||
      interestRateNum > 100
    ) {
      return res.status(400).json({ error: "invalid_interest_rate" });
    }

    const status = String(contractStatus || "").toUpperCase();
    if (!ALLOWED_CONTRACT_STATUS.has(status)) {
      return res.status(400).json({ error: "invalid_contract_status" });
    }

    const contractDateStr = toMySQLDateTime(contractDate);
    const dueDateStr = dueDate ? toMySQLDateTime(dueDate) : null;
    const noticeDateStr = noticeDate ? toMySQLDateTime(noticeDate) : null;

    if (!contractDateStr) {
      return res.status(400).json({ error: "invalid_contract_date" });
    }

    if (dueDateStr) {
      const c = new Date(contractDateStr);
      const d = new Date(dueDateStr);
      if (d.getTime() < c.getTime()) {
        return res
          .status(400)
          .json({ error: "due_date_before_contract_date" });
      }
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [[customerRow]] = await conn.query(
        "SELECT Customer_ID FROM Customer WHERE Customer_ID = ?",
        [customerIdNum]
      );
      if (!customerRow) {
        await conn.rollback();
        return res.status(400).json({ error: "customer_not_found" });
      }

      const [[staffRow]] = await conn.query(
        "SELECT Staff_ID FROM Employee WHERE Staff_ID = ?",
        [staffIdNum]
      );
      if (!staffRow) {
        await conn.rollback();
        return res.status(400).json({ error: "staff_not_found" });
      }

      const [[itemRow]] = await conn.query(
        "SELECT item_ID FROM PawnItem WHERE item_ID = ?",
        [itemIdNum]
      );
      if (!itemRow) {
        await conn.rollback();
        return res.status(400).json({ error: "item_not_found" });
      }

      const [result] = await conn.execute(
        `
        INSERT INTO PawnTicket
          (Contract_Date, Loan_Amount, interest_rate, due_date, notice_date, contract_status,
           Customer_ID, Staff_ID, item_ID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          contractDateStr,
          loanAmountNum,
          interestRateNum,
          dueDateStr,
          noticeDateStr,
          status,
          customerIdNum,
          staffIdNum,
          itemIdNum,
        ]
      );

      const ticketId = result.insertId;

      await conn.commit();

      return res.status(201).json({
        item: {
          id: String(ticketId),
          contractDate: contractDateStr,
          loanAmount: loanAmountNum,
          interestRate: interestRateNum,
          dueDate: dueDateStr,
          noticeDate: noticeDateStr,
          contractStatus: status,
          customerId: customerIdNum,
          staffId: staffIdNum,
          itemId: itemIdNum,
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
// ดึงรายละเอียดเต็มของตั๋ว 1 ใบ
// GET /api/pawn-tickets/:ticketId/detail
router.get("/:ticketId/detail", async (req, res) => {
  try {
    const idParam = req.params.ticketId;
    const ticketId = Number(idParam);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: "invalid_ticket_id" });
    }

    // 1) ดึงข้อมูลหลัก: Ticket + Customer + PawnItem + Employee (ผู้ทำสัญญา) + Appraisal (ล่าสุดถ้ามี)
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
        pt.Customer_ID,
        pt.Staff_ID,
        pt.item_ID,

        c.first_name            AS customer_first_name,
        c.last_name             AS customer_last_name,
        c.national_ID           AS customer_national_ID,
        c.date_of_birth         AS customer_dob,
        c.address               AS customer_address,
        c.phone_number          AS customer_phone,
        c.kyc_status            AS customer_kyc_status,

        e.first_name            AS staff_first_name,
        e.last_name             AS staff_last_name,
        e.phone_number          AS staff_phone,
        e.position              AS staff_position,

        pi.item_Type,
        pi.description,
        pi.appraised_value,
        pi.item_status,

        ap.appraisal_ID,
        ap.appraised_value      AS appraisal_value,
        ap.appraisal_Date,
        ap.Staff_ID             AS appraisal_staff_id
      FROM PawnTicket pt
      JOIN Customer c ON pt.Customer_ID = c.Customer_ID
      JOIN PawnItem pi ON pt.item_ID = pi.item_ID
      LEFT JOIN Employee e ON pt.Staff_ID = e.Staff_ID
      LEFT JOIN Appraisal ap ON pi.item_ID = ap.item_ID
      WHERE pt.ticket_ID = ?
      LIMIT 1
      `,
      [ticketId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "ticket_not_found" });
    }

    const row = rows[0];

    // 2) ดึง Payment ทั้งหมดของ ticket นี้
    const [paymentRows] = await pool.query(
      `
      SELECT
        payment_ID,
        ticket_ID,
        payment_date,
        amount_paid,
        payment_type
      FROM Payment
      WHERE ticket_ID = ?
      ORDER BY payment_date ASC, payment_ID ASC
      `,
      [ticketId]
    );

    const payments = paymentRows.map((p) => ({
      payment_ID: p.payment_ID,
      ticket_ID: p.ticket_ID,
      payment_date: p.payment_date,
      amount_paid: Number(p.amount_paid),
      payment_type: p.payment_type,
    }));

    // 3) ดึง Disposition (การหลุดจำนำ/ขาย) ล่าสุดของ item นี้ (ถ้ามี)
    const [dispRows] = await pool.query(
      `
      SELECT
        disposition_ID,
        item_ID,
        sale_date,
        sale_method,
        sale_price
      FROM Disposition
      WHERE item_ID = ?
      ORDER BY sale_date DESC, disposition_ID DESC
      LIMIT 1
      `,
      [row.item_ID]
    );

    const disposition = dispRows.length
      ? {
          disposition_ID: dispRows[0].disposition_ID,
          item_ID: dispRows[0].item_ID,
          sale_date: dispRows[0].sale_date,
          sale_method: dispRows[0].sale_method,
          sale_price: Number(dispRows[0].sale_price),
        }
      : null;

    // 4) ประกอบ response ให้ตรงกับ 5 กล่องใน Detail Ticket
    const response = {
      ticket: {
        ticket_ID: row.ticket_ID,
        contract_date: row.Contract_Date,
        loan_amount: Number(row.Loan_Amount),
        interest_rate: Number(row.interest_rate),
        due_date: row.due_date,
        notice_date: row.notice_date,
        contract_status: row.contract_status,
        customer_ID: row.Customer_ID,
        staff_ID: row.Staff_ID,
        item_ID: row.item_ID,
      },
      customer: {
        customer_ID: row.Customer_ID,
        first_name: row.customer_first_name,
        last_name: row.customer_last_name,
        national_ID: row.customer_national_ID,
        date_of_birth: row.customer_dob,
        address: row.customer_address,
        phone_number: row.customer_phone,
        kyc_status: row.customer_kyc_status,
      },
      pawnItem: {
        item_ID: row.item_ID,
        item_Type: row.item_Type,
        description: row.description,
        appraised_value: Number(row.appraised_value),
        item_status: row.item_status,
      },
      appraiser: row.Staff_ID
        ? {
            Staff_ID: row.Staff_ID,
            first_name: row.staff_first_name,
            last_name: row.staff_last_name,
            phone_number: row.staff_phone,
            position: row.staff_position,
          }
        : null,
      appraisal: row.appraisal_ID
        ? {
            appraisal_ID: row.appraisal_ID,
            appraised_value: Number(row.appraisal_value),
            appraisal_Date: row.appraisal_Date,
            Staff_ID: row.appraisal_staff_id,
          }
        : null,
      payments,
      disposition,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error in GET /api/pawn-tickets/:ticketId/detail:", err);
    return res.status(500).json({ error: "server_error" });
  }
});
// ลบตั๋วจำนำ 1 ใบ และ ลบ payment ที่เกี่ยวข้อง
router.delete("/:ticketId", async (req, res) => {
  try {
    const idParam = req.params.ticketId;
    const ticketId = Number(idParam);

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: "invalid_ticket_id" });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1) ลบ payment ทั้งหมดของ ticket นี้ (กัน FK error)
      const [paymentResult] = await conn.execute(
        "DELETE FROM Payment WHERE ticket_ID = ?",
        [ticketId]
      );

      // 2) ลบตัวตั๋วเอง
      const [ticketResult] = await conn.execute(
        "DELETE FROM PawnTicket WHERE ticket_ID = ?",
        [ticketId]
      );

      if (ticketResult.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "ticket_not_found" });
      }

      await conn.commit();

      return res.json({
        success: true,
        deletedTicketId: ticketId,
        deletedPayments: paymentResult.affectedRows,
      });
    } catch (err) {
      await conn.rollback();
      console.error("Error in DELETE /api/pawn-tickets/:ticketId:", err);
      return res.status(500).json({ error: "server_error" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Error in outer DELETE /api/pawn-tickets/:ticketId:", err);
    return res.status(500).json({ error: "server_error" });
  }
});


// ... endpoint เดิมของคุณ เช่น POST /, GET /:id ฯลฯ

// PATCH /api/pawn-tickets/:ticketId
router.patch("/:ticketId", async (req, res) => {
  const { ticketId } = req.params;

  const allowedFields = [
    "Contract_Date",
    "Loan_Amount",
    "interest_rate",
    "due_date",
    "notice_date",
    "contract_status",
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
      .json({ error: "No valid fields to update for PawnTicket" });
  }

  params.push(ticketId);

  try {
    const [result] = await pool.query(
      `UPDATE PawnTicket SET ${setClauses.join(", ")} WHERE ticket_ID = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.json({ message: "Ticket updated successfully" });
  } catch (err) {
    console.error("Error updating ticket:", err);
    return res.status(500).json({ error: "server_error" });
  }
});


export default router;
