const mongoose = require("mongoose");

const controlIndexSchema = new mongoose.Schema(
  {
    user_id: String,
    name: String,
    description: String,
  },
  {
    timestamps: true,
  }
);

const controlIndex = mongoose.model("controlindexes", controlIndexSchema);

module.exports = controlIndex;
