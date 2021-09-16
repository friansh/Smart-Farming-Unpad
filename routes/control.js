const app = require("express");
const router = app.Router();

const express_jwt = require("express-jwt");
const jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const { body, validationResult } = require("express-validator");

const ControlIndex = require("../model/ControlIndex");
const ControlQueue = require("../model/ControlQueue");
const Control = require("../model/Control");
const Device = require("../model/Device");

router.get("/", jwt, async (req, res) => {
  ControlIndex.find({ user_id: req.user.user_id }, (err, docs) => {
    const controlIndexes = docs.map((val) => {
      return {
        control_id: val._id,
        name: val.name,
        description: val.description,
      };
    });

    res.json(controlIndexes);
  });
});

router.get("/device/:device_id", jwt, async (req, res) => {
  const controlIndexes = await ControlIndex.find({
    user_id: req.user.user_id,
  }).exec();

  Control.find({ device_id: req.params.device_id }, (err, docs) => {
    const controls = docs.map((val) => {
      const control = controlIndexes.find((con) => {
        if (con._id == val.control_id) return true;
        return false;
      });

      return {
        control_id: control._id,
        control_name: control.name,
        control_description: control.description,
      };
    });

    res.json(controls);
  });
});

router.get("/queue", jwt, async (req, res) => {
  const controlIndexes = await ControlIndex.find({
    user_id: req.user.user_id,
  }).exec();

  const controlIndexesList = controlIndexes.map((val) => {
    return {
      control_id: val._id,
    };
  });

  ControlQueue.find({ $or: controlIndexesList }, (err, docs) => {
    const controlQueues = docs.map((val) => {
      const controlIndex = controlIndexes.find((con) => {
        if (val.control_id == con._id) return true;
        return false;
      });

      return {
        control_id: val.control_id,
        control_name: controlIndex.name,
        control_description: controlIndex.description,
        value: val.value,
        createdAt: val.createdAt,
      };
    });

    res.json(controlQueues);
  });
});

router.get("/:control_id", jwt, async (req, res) => {
  const devices = await Device.find({ user_id: req.user.user_id }).exec();

  Control.find({ control_id: req.params.control_id }, async (err, docs) => {
    if (docs.length == 0)
      return res
        .status(404)
        .send("You do not have any device(s) assigned to this control.");

    const control = docs.map((val) => {
      return {
        device_name: devices.find((dev) => {
          if (val.device_id == dev._id) return true;
          return false;
        }).name,
      };
    });

    res.json(control);
  });
});

router.post("/:control_id", jwt, body("value").notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.params.control_id == ":control_id")
    return res.status(400).json({ message: "Invalid control id." });

  const newControlQueue = new ControlQueue({
    control_id: req.params.control_id,
    value: req.body.value,
  });

  newControlQueue.save((err, doc) => {
    if (err)
      return res.status(500).json({
        message: "Server error, failed to save the new control queue.",
      });

    return res.json({ message: "The control queue has been saved." });
  });
});

module.exports = router;
