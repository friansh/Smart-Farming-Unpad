const mongoose = require("mongoose");

const firmwareSchema = new mongoose.Schema(
  {
    device_id: String,
    file_name: String,
    version: String,
    update_notes: String,
  },
  {
    timestamps: true,
  }
);

const Firmware = mongoose.model("firmware", firmwareSchema);

module.exports = Firmware;
