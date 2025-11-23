// src/utils/helpers.js

// escape สำหรับ LIKE
export const escapeLike = (s = "") =>
  String(s).replace(/([%_\\])/g, "\\$1");

// เอาเฉพาะตัวเลข
export const onlyDigits = (s = "") =>
  String(s).replace(/\D/g, "");

// แปลง Date/ISO -> MySQL DATETIME "YYYY-MM-DD HH:MM:SS"
export const toMySQLDateTime = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

// item_status ที่อนุญาต
export const ALLOWED_ITEM_STATUS = new Set([
  "IN_STORAGE",
  "RETURNED_TO_CUSTOMER",
  "FORFEITED_READY_FOR_SALE",
  "SOLD",
  "OTHER",
]);

// contract_status ที่อนุญาต
export const ALLOWED_CONTRACT_STATUS = new Set([
  "ACTIVE",
  "ROLLED_OVER",
  "CANCELLED",
  "EXPIRED",
]);

// payment_type ที่อนุญาต
export const VALID_PAYMENT_TYPES = new Set([
  "CASH",
  "TRANSFER",
  "CARD",
  "ONLINE",
]);

// sale_method ที่อนุญาต
export const VALID_SALE_METHODS = new Set([
  "AUCTION",
  "DIRECT_SALE",
  "ONLINE",
  "SCRAP",
]);

// ตำแหน่งพนักงานที่อนุญาต
export const ALLOWED_EMP_POSITIONS = ["STAFF", "SUPERVISOR", "MANAGER"];
