const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(morgan("dev"));

app.use("/api", require("./routes"));

// Must be after all routes
app.use(errorHandler);

module.exports = app;
