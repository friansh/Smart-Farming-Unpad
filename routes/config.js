const app = require("express");
const router = app.Router();

const Configuration = require("../model/config");

const express_jwt = require("express-jwt");
const jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const { promisify } = require("util");
const redis = require("../context/redis");

router.patch("/agroclimate", jwt, async (req, res) => {
  const agroclimateConfig = await Configuration.findOneAndUpdate(
    { user_id: req.user.user_id },
    {
      refresh_time: req.body.refresh_time,
      logging_time: req.body.logging_time,
      temperature: req.body.temperature,
      humidity: req.body.humidity,
      ph: req.body.ph,
      light_intensity: req.body.light_intensity,
      nutrient_flow: req.body.nutrient_flow,
      nutrient_level: req.body.nutrient_level,
      acid_solution_level: req.body.acid_solution_level,
      base_solution_level: req.body.base_solution_level,
      tds: req.body.tds,
      ec: req.body.ec,
      day_start: req.body.day_start,
      day_end: req.body.day_end,
    }
  );

  redis.DEL(`${req.user.user_id}:config`);

  res.status(200).json({
    message: "Your new agroclimate configurations has been saved.",
    new_configs: agroclimateConfig,
  });
});

router.get("/agroclimate", jwt, async (req, res) => {
  const getCachedConfig = promisify(redis.HGETALL).bind(redis);

  const cachedConfig = await getCachedConfig(`${req.user.user_id}:config`);

  if (cachedConfig) {
    res.status(200).send({
      refresh_time: parseInt(cachedConfig.refresh_time),
      logging_time: parseInt(cachedConfig.logging_time),
      temperature: parseInt(cachedConfig.temperature),
      humidity: parseInt(cachedConfig.humidity),
      ph: parseInt(cachedConfig.ph),
      light_intensity: parseInt(cachedConfig.light_intensity),
      nutrient_flow: parseInt(cachedConfig.nutrient_flow),
      nutrient_level: parseInt(cachedConfig.nutrient_level),
      acid_solution_level: parseInt(cachedConfig.acid_solution_level),
      base_solution_level: parseInt(cachedConfig.base_solution_level),
      tds: parseInt(cachedConfig.tds),
      ec: parseInt(cachedConfig.ec),
      day_start: new Date(cachedConfig.day_start),
      day_end: new Date(cachedConfig.day_end),
    });
    return;
  }

  const agroclimateConfig = await Configuration.findOne({
    user_id: req.user.user_id,
  });

  redis.HMSET(
    `${req.user.user_id}:config`,
    "refresh_time",
    agroclimateConfig.refresh_time,
    "logging_time",
    agroclimateConfig.logging_time,
    "temperature",
    agroclimateConfig.temperature,
    "humidity",
    agroclimateConfig.humidity,
    "ph",
    agroclimateConfig.ph,
    "light_intensity",
    agroclimateConfig.light_intensity,
    "nutrient_flow",
    agroclimateConfig.nutrient_flow,
    "nutrient_level",
    agroclimateConfig.nutrient_level,
    "acid_solution_level",
    agroclimateConfig.acid_solution_level,
    "base_solution_level",
    agroclimateConfig.base_solution_level,
    "tds",
    agroclimateConfig.tds,
    "ec",
    agroclimateConfig.ec,
    "day_start",
    agroclimateConfig.day_start,
    "day_end",
    agroclimateConfig.day_end
  );

  res.status(200).json({
    refresh_time: agroclimateConfig.refresh_time,
    logging_time: agroclimateConfig.logging_time,
    temperature: agroclimateConfig.temperature,
    humidity: agroclimateConfig.humidity,
    ph: agroclimateConfig.ph,
    light_intensity: agroclimateConfig.light_intensity,
    nutrient_flow: agroclimateConfig.nutrient_flow,
    nutrient_level: agroclimateConfig.nutrient_level,
    acid_solution_level: agroclimateConfig.acid_solution_level,
    base_solution_level: agroclimateConfig.base_solution_level,
    tds: agroclimateConfig.tds,
    ec: agroclimateConfig.ec,
    day_start: agroclimateConfig.day_start,
    day_end: agroclimateConfig.day_end,
  });
});

module.exports = router;
