const app = require("express");
const router = app.Router();

const express_jwt = require("express-jwt");
const jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const fs = require("fs");
const { promisify } = require("util");

const Temperature = require("../model/temperature");
const Humidity = require("../model/humidity");
const LightIntensity = require("../model/lightintensity");
const pH = require("../model/ph");
const TDS = require("../model/tds");
const SoilMoisture = require("../model/soilmoisture");
const WaterTemperature = require("../model/watertemperature");
const WindSpeed = require("../model/windspeed");

const redis = require("../context/redis");

router.get("/log", jwt, async (req, res) => {
  const getCachedLog = promisify(redis.GET).bind(redis);
  const cachedLog = await getCachedLog(`${req.user.user_id}:log`);

  if (cachedLog) {
    res.status(200).send(JSON.parse(cachedLog));
    return;
  }

  let agroclimateLog = await Log.find({ user_id: req.user.user_id });

  agroclimateLog = agroclimateLog.map((log) => ({
    temperature: log.temperature,
    humidity: log.humidity,
    ph: log.ph,
    light_intensity: log.light_intensity,
    nutrient_flow: log.nutrient_flow,
    nutrient_level: log.nutrient_level,
    acid_solution_level: log.acid_solution_level,
    base_solution_level: log.base_solution_level,
    tds: log.tds,
    ec: log.ec,
    image_url: `${process.env.APP_URL}/log/image/${req.user.user_id}/${log.image_filename}`,
    createdAt: log.createdAt,
  }));

  redis.SETEX(
    `${req.user.user_id}:log`,
    process.env.REDIS_CACHE_EXPIRES,
    JSON.stringify(agroclimateLog)
  );

  res.status(200).send(
    agroclimateLog.map((log) => ({
      temperature: log.temperature,
      humidity: log.humidity,
      ph: log.ph,
      light_intensity: log.light_intensity,
      nutrient_flow: log.nutrient_flow,
      nutrient_level: log.nutrient_level,
      acid_solution_level: log.acid_solution_level,
      base_solution_level: log.base_solution_level,
      tds: log.tds,
      ec: log.ec,
      image_url: `${process.env.APP_URL}/log/image/${req.user.user_id}/${log.image_filename}`,
      createdAt: log.createdAt,
    }))
  );
});

router.get("/log/humidity", jwt, async (req, res) => {
  const getCachedLog = promisify(redis.GET).bind(redis);
  const cachedLog = await getCachedLog(`${req.user.user_id}:humidities`);

  if (cachedLog) {
    res.status(200).send(JSON.parse(cachedLog));
    return;
  }

  let humidityLog = await Humidity.find({ user_id: req.user.user_id });

  redis.SETEX(
    `${req.user.user_id}:humidities`,
    process.env.REDIS_CACHE_EXPIRES,
    JSON.stringify(humidityLog)
  );

  res.status(200).send(humidityLog);
});

router.get("/log/lightintensity", jwt, async (req, res) => {
  const getCachedLog = promisify(redis.GET).bind(redis);
  const cachedLog = await getCachedLog(`${req.user.user_id}:lightintensities`);

  if (cachedLog) {
    res.status(200).send(JSON.parse(cachedLog));
    return;
  }

  let lightIntensityLog = await LightIntensity.find({
    user_id: req.user.user_id,
  });

  redis.SETEX(
    `${req.user.user_id}:lightintensities`,
    process.env.REDIS_CACHE_EXPIRES,
    JSON.stringify(lightIntensityLog)
  );

  res.status(200).send(lightIntensityLog);
});

router.get("/log/ph", jwt, async (req, res) => {
  const getCachedLog = promisify(redis.GET).bind(redis);
  const cachedLog = await getCachedLog(`${req.user.user_id}:phs`);

  if (cachedLog) {
    res.status(200).send(JSON.parse(cachedLog));
    return;
  }

  let pHLog = await pH.find({
    user_id: req.user.user_id,
  });

  redis.SETEX(
    `${req.user.user_id}:phs`,
    process.env.REDIS_CACHE_EXPIRES,
    JSON.stringify(pHLog)
  );

  res.status(200).send(pHLog);
});

router.get("/log/soilmoisture", jwt, async (req, res) => {
  const getCachedLog = promisify(redis.GET).bind(redis);
  const cachedLog = await getCachedLog(`${req.user.user_id}:soilmoistures`);

  if (cachedLog) {
    res.status(200).send(JSON.parse(cachedLog));
    return;
  }

  let SoilMoistureLog = await SoilMoisture.find({
    user_id: req.user.user_id,
  });

  redis.SETEX(
    `${req.user.user_id}:soilmoistures`,
    process.env.REDIS_CACHE_EXPIRES,
    JSON.stringify(SoilMoistureLog)
  );

  res.status(200).send(SoilMoistureLog);
});

router.get("/log/tds", jwt, async (req, res) => {
  const getCachedLog = promisify(redis.GET).bind(redis);
  const cachedLog = await getCachedLog(`${req.user.user_id}:tdses`);

  if (cachedLog) {
    res.status(200).send(JSON.parse(cachedLog));
    return;
  }

  let TDSLog = await TDS.find({ user_id: req.user.user_id });

  redis.SETEX(
    `${req.user.user_id}:tdses`,
    process.env.REDIS_CACHE_EXPIRES,
    JSON.stringify(TDSLog)
  );

  res.status(200).send(TDSLog);
});

router.get("/log/temperature", jwt, async (req, res) => {
  const getCachedLog = promisify(redis.GET).bind(redis);
  const cachedLog = await getCachedLog(`${req.user.user_id}:temperatures`);

  if (cachedLog) {
    res.status(200).send(JSON.parse(cachedLog));
    return;
  }

  let temperatureLog = await Temperature.find({ user_id: req.user.user_id });

  redis.SETEX(
    `${req.user.user_id}:temperatures`,
    process.env.REDIS_CACHE_EXPIRES,
    JSON.stringify(temperatureLog)
  );

  res.status(200).send(temperatureLog);
});

router.get("/log/watertemperature", jwt, async (req, res) => {});
router.get("/log/windspeed", jwt, async (req, res) => {});

router.post("/log/clear", jwt, async (req, res) => {
  await Log.deleteMany({ user_id: req.user.user_id }).catch(() => {
    res.status(500).send({
      message: "Failed to clear your agroclimate parameters database log.",
    });
    return;
  });

  redis.GET(`${req.user.user_id}:log`);

  fs.rmdir(
    `${process.env.IMAGE_DIR}/${req.user.user_id}`,
    { recursive: true },
    (err) => {
      if (!err)
        res.status(200).send({
          message: "Your agroclimate parameters log has been cleared.",
        });
      else
        res.status(500).send({
          message: "Failed to clear your saved image(s).",
        });
    }
  );
});

router.get("/log/image/:user_id/:filename", (req, res) => {
  let imagePath = `${process.env.IMAGE_DIR}/${req.params.user_id}/${req.params.filename}`;
  if (!fs.existsSync(imagePath))
    res.status(422).send({
      message:
        "Invalid image file or you don't have an permission to access the specified image.",
    });
  else res.download(imagePath);
});

module.exports = router;
