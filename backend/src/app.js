// src/app.js
import express from "express";
import cors from "cors";

import customerRoutes from "./routes/customers.js";
import employeeRoutes from "./routes/employees.js";
import pawnItemRoutes from "./routes/pawnItems.js";
import itemRoutes from "./routes/items.js";
import pawnTicketRoutes from "./routes/pawnTickets.js";
import paymentRoutes from "./routes/payments.js";
import dispositionRoutes from "./routes/dispositions.js";
import appraisalRoutes from "./routes/appraisals.js";
import statisticsRoutes from "./routes/statistics.js";
import topCustomersRoutes from "./routes/topCustomersRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ---- Mount routes (path ต้องตรงของเดิม) ----
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/pawn-items", pawnItemRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/pawn-tickets", pawnTicketRoutes);

// /api/payment
app.use("/api", paymentRoutes);

// /api/dispositions
app.use("/api/dispositions", dispositionRoutes);

// /api/appraisals
app.use("/api/appraisals", appraisalRoutes);

// api/statistics
app.use("/api/statistics", statisticsRoutes);

// api/top-customers
app.use("/api/top-customers", topCustomersRoutes);

export default app;
