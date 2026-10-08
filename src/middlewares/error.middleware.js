const errorHandler = (err, req, res, next) => {
  console.error("API Error:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong.",
  });
};

module.exports = errorHandler;
