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
app.get("/api/employees", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "20", 10) || 20, 50));

    if (!q) return res.json({ items: [] });

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

    const items = rows.map(r => ({
      id: String(r.id),                        
      first_name: String(r.first_name ?? ""),
      last_name:  String(r.last_name  ?? ""),
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


app.listen(process.env.PORT, () => {
  console.log(`API listening on http://${process.env.HOST_DOMAIN}:${process.env.PORT}`);
});
