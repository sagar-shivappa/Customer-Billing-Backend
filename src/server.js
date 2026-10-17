const path = require("path");
const dotenv = require("dotenv");

const envFile = process.argv.includes("--production")
  ? ".env.production"
  : ".env";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

const app = require("./app");
const connectDB = require("./config/database");

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
