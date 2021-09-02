const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({
  user_id: String,
  refresh_time: Number,
  logging_time: Number,
  temperature: Number,
  humidity: Number,
  ph: Number,
  light_intensity: Number,
  nutrient_flow: Number,
  nutrient_level: Number,
  acid_solution_level: Number,
  base_solution_level: Number,
  tds: Number,
  ec: Number,
  day_start: Date,
  day_end: Date,
});

const Configurations = mongoose.model("configurations", configSchema);

module.exports = Configurations;
