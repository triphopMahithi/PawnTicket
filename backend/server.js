// server.js
import "dotenv/config";
import app from "./src/app.js";

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST_DOMAIN || "localhost";
const DATABASE = process.env.MYSQL_DATABASE;
console.clear();
app.listen(PORT, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
  console.log(`db_name : ${DATABASE}`);
});
