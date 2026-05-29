const mongoose = require("mongoose");

// Factory: validateObjectId("id", "studentId") checks multiple params in one middleware
const validateObjectId = (...params) =>
  (req, res, next) => {
    for (const param of params) {
      if (!mongoose.isValidObjectId(req.params[param])) {
        return res.status(400).json({ error: `Invalid ID format: ${param}` });
      }
    }
    return next();
  };

module.exports = validateObjectId;
