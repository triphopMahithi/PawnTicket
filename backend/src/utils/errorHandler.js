// src/utils/errorHandler.js
export const handleServerError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: "server_error" });
};
