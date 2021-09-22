const mongoose = require("mongoose");

const controlHistorySchema = new mongoose.Schema(
  {
    control_id: String,
    value: String,
  },
  {
    timestamps: true,
  }
);

const controlHistory = mongoose.model("controlhistories", controlHistorySchema);

module.exports = controlHistory;
