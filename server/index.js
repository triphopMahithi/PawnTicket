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

const escapeLike = (s = "") => String(s).replace(/([%_\\])/g, "\\$1");
const onlyDigits = (s = "") => String(s).replace(/\D/g, "");

// Date/ISO string for MySQL DATETIME
const toMySQLDateTime = (value) => {
  if (!value) return null;
const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// item_status
const ALLOWED_ITEM_STATUS = new Set([
  "IN_STORAGE",
  "RETURNED_TO_CUSTOMER",
  "FORFEITED_READY_FOR_SALE",
  "SOLD",
  "OTHER",
]);

// contract_status
const ALLOWED_CONTRACT_STATUS = new Set([
  "ACTIVE",
  "ROLLED_OVER",
  "CANCELLED",
  "EXPIRED",
]);




// Step-1 (customers) : search
app.get("/api/customers", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "20", 10) || 20, 50));

    if (!q) return res.json({ items: [] });

    const like = `%${escapeLike(q)}%`;
    const qDigits = q.replace(/\D/g, "");

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

// Step-1 (employees)
// Step-1 (employees) : ใช้ทั้ง list + search
app.get("/api/employees", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(
      1,
      Math.min(parseInt(req.query.limit || "20", 10) || 20, 50)
    );

    // ถ้าไม่มี q -> ดึงทุกพนักงาน (หรือจำกัดตาม limit)
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

    // ----- มี q -> ทำ search แบบเดิม -----
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


// Step-1 (customers) 
app.post("/api/customers", async (req, res) => {
  try {
    const onlyDigits = (s = "") => String(s).replace(/\D/g, "");

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
      `INSERT INTO Customer
        (first_name, last_name, national_ID, date_of_birth, address, phone_number, kyc_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

// Step-1 (pawn-items)
app.post("/api/pawn-items", async (req, res) => {
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

// Step-2 
app.post("/api/pawn-tickets", async (req, res) => {
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

    if (!Number.isFinite(interestRateNum) || interestRateNum < 0 || interestRateNum > 100) {
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
        return res.status(400).json({ error: "due_date_before_contract_date" });
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
          (Contract_Date, Loan_Amount, interest_rate, due_date_date, notice_date, contract_status,
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
const VALID_PAYMENT_TYPES = new Set(["CASH", "TRANSFER", "CARD", "ONLINE"]);

const VALID_SALE_METHODS = new Set([
  "AUCTION",
  "DIRECT_SALE",
  "ONLINE",
  "SCRAP",
]);
// Step-3: Create Payment Record
app.post("/api/payment", async (req, res) => {
  try {
    const { ticket_ID, payment_date, amount_paid, payment_type } = req.body || {};

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

    // --- insert payment ---
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
    return res.status(500).json({ error: "server_error", details: err.message });
  }
});


// ---- Disposition: list ----
app.get("/api/dispositions", async (req, res) => {
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
      sale_date: r.sale_date,      // front-end จะได้ string/Date ไปจัดการต่อเอง
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
app.post("/api/dispositions", async (req, res) => {
  try {
    const {
      itemId,
      saleDate,
      saleMethod,
      salePrice,
    } = req.body || {};

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

    // ตรวจว่า item_ID นี้มีอยู่จริงใน PawnItem หรือไม่
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
app.put("/api/dispositions/:id", async (req, res) => {
  try {
    const idParam = req.params.id;
    const dispositionId = Number(idParam);

    if (!Number.isInteger(dispositionId) || dispositionId <= 0) {
      return res.status(400).json({ error: "invalid_disposition_id" });
    }

    const {
      saleDate,
      saleMethod,
      salePrice,
    } = req.body || {};

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

    // เอา item_ID เดิมมาไว้ตอบกลับ (แต่ไม่ให้แก้)
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
        item_ID: existing.item_ID,   // ยืนยันว่า item เดิม ไม่ได้ถูกแก้
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
app.delete("/api/dispositions/:id", async (req, res) => {
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

// Item summary: ใช้ตอนพิมพ์ item_ID เพื่อเอาไปแสดง item_Type + ticket_ID
app.get("/api/items/:id/summary", async (req, res) => {
  try {
    const idParam = req.params.id;
    const itemId = Number(idParam);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ error: "invalid_item_id" });
    }

    // 1) ดึงข้อมูลทรัพย์จาก PawnItem
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

    // 2) ดึง ticket ล่าสุดที่อ้างอิง item นี้ (ถ้ามี)
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


// ---------- 1) เพิ่มข้อมูลพนักงาน (Create) ----------
app.post("/api/employees", async (req, res) => {
  try {
    const { first_name, last_name, phone_number, position } = req.body;

    // ตรวจสอบค่าที่จำเป็น
    if (!first_name || !last_name || !phone_number || !position) {
      return res.status(400).json({
        error: "missing_fields",
        message: "ต้องส่ง first_name, last_name, phone_number, position ครบ",
      });
    }

    // (ถ้าอยากจำกัดรูปแบบตำแหน่งงาน)
    const allowedPositions = ["STAFF", "SUPERVISOR", "MANAGER"];
    const posUpper = String(position).toUpperCase();
    if (!allowedPositions.includes(posUpper)) {
      return res.status(400).json({
        error: "invalid_position",
        message: `position ต้องเป็นหนึ่งใน: ${allowedPositions.join(", ")}`,
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

// ---------- 2) แก้ไขข้อมูลพนักงาน (Update) ----------
app.put("/api/employees/:id", async (req, res) => {
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

    const allowedPositions = ["STAFF", "SUPERVISOR", "MANAGER"];
    const posUpper = String(position).toUpperCase();
    if (!allowedPositions.includes(posUpper)) {
      return res.status(400).json({
        error: "invalid_position",
        message: `position ต้องเป็นหนึ่งใน: ${allowedPositions.join(", ")}`,
      });
    }

    // เช็กก่อนว่ามีพนักงานคนนี้จริงไหม
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

    // อัปเดต
    const [result] = await pool.execute(
      `
      UPDATE Employee
      SET first_name = ?, last_name = ?, phone_number = ?, position = ?
      WHERE Staff_ID = ?
      `,
      [first_name, last_name, phone_number, posUpper, staffId]
    );

    // ดึงข้อมูลใหม่หลังอัปเดต
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

// ---------- 3) ลบข้อมูลพนักงาน (Delete) ----------
app.delete("/api/employees/:id", async (req, res) => {
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

// (แถม) ดึงรายชื่อพนักงานทั้งหมด เผื่อใช้ debug / ดูข้อมูล
//app.get("/api/employees", async (req, res) => {
//  try {
//    const [rows] = await pool.execute(
//      "SELECT * FROM Employee ORDER BY Staff_ID DESC"
//    );
//    res.json({ employees: rows });
//  } catch (error) {
//    handleServerError(res, error);
//  }
//});


app.listen(process.env.PORT, () => {
  console.log(`API listening on http://${process.env.HOST_DOMAIN}:${process.env.PORT}`);
});
