const mongoose = require("mongoose");

const developerAccountSchema = new mongoose.Schema(
  {
    user_id: String,
    token: String,
  },
  {
    timestamps: true,
  }
);

const developerAccount = mongoose.model(
  "developeraccounts",
  developerAccountSchema
);

module.exports = developerAccount;
