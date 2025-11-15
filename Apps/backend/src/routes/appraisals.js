// src/routes/appraisals.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// PATCH /api/appraisals/:appraisalId
router.patch("/:appraisalId", async (req, res) => {
  const { appraisalId } = req.params;

  const allowedFields = ["appraised_value", "appraisal_Date", "Staff_ID"];

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
      .json({ error: "No valid fields to update for Appraisal" });
  }

  params.push(appraisalId);

  try {
    const [result] = await pool.query(
      `UPDATE Appraisal SET ${setClauses.join(", ")} WHERE appraisal_ID = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Appraisal not found" });
    }

    return res.json({ message: "Appraisal updated successfully" });
  } catch (err) {
    console.error("Error updating appraisal:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

export default router;
