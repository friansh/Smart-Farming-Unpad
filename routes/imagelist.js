const app = require("express");
const router = app.Router();

const express_jwt = require("express-jwt");
const jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const Imagelist = require("../model/Imagelist");
const Device = require("../model/Device");

router.get("/:dataset_id/live", jwt, async (req, res) => {
  const devices = await Device.find({ user_id: req.user.user_id });

  const imagelists = await Imagelist.find({
    index_id: req.params.dataset_id,
  }).exec();

  res.json(
    imagelists.map((il) => {
      const device = devices.find((dev) => {
        if (dev._id == il.device_id) return dev;
      });

      return {
        device_id: il.device_id,
        name: device.name,
        description: device.description,
      };
    })
  );
});

module.exports = router;
