const app = require("express");
const router = app.Router();

const { body, validationResult } = require("express-validator");

const DeveloperAccount = require("../model/DeveloperAccount");
const ControlHistory = require("../model/ControlHistory");
const ControlIndex = require("../model/ControlIndex");
const ControlQueue = require("../model/ControlQueue");
const DatasetIndex = require("../model/DatasetIndex");
const Heartbeat = require("../model/Heartbeat");
const Control = require("../model/Control");
const Dataset = require("../model/Dataset");
const Device = require("../model/Device");

router.use(async (req, res, next) => {
  if (!req.headers["x-devaccount-token"])
    return res.status(400).json({
      message: "No developer account header found.",
    });

  const account = await DeveloperAccount.findOne({
    token: req.headers["x-devaccount-token"],
  }).exec();

  if (!account)
    return res
      .status(401)
      .json({ message: "You do not have right to access this resource." });

  next();
});

router.get("/device", async (req, res) => {
  Device.find({}, {}, { sort: { name: -1 } }, async (err, docs) => {
    if (err) {
      return res.status(500).send("Server error.");
    }

    const deviceList = docs.map((val) => {
      return {
        device_id: val._id,
      };
    });

    let heartbeat = await Heartbeat.find({ $or: deviceList })
      .exec()
      .catch(() => {
        res.status(500).send("Server error.");
      });

    heartbeat = heartbeat.map((val) => {
      return {
        device_id: val.device_id,
        firmware_version: val.firmware_version,
        last_heartbeat: val.updatedAt,
      };
    });

    let devices = docs.map((val) => {
      const findHeartbeat = heartbeat.find((hb) => {
        if (hb.device_id == val._id) return true;
        return false;
      });

      return {
        id: val._id,
        name: val.name,
        description: val.description,
        last_heartbeat: !findHeartbeat ? null : findHeartbeat.last_heartbeat,
        firmware_version: !findHeartbeat
          ? null
          : findHeartbeat.firmware_version,
      };
    });

    res.json(devices);
  });
});

router.get("/device/:device_id", async (req, res) => {
  Device.findOne({ _id: req.params.device_id }, (err, docs) => {
    if (err) {
      res.status(500).send("Server error. ERRCODE: 2000FDV2");
      return;
    }
    if (docs.length == 0) {
      res
        .status(404)
        .json({ message: "The specified device cannot be found." });
      return;
    }
    res.json({
      name: docs.name,
      description: docs.description,
      token: docs.token,
    });
  });
});

router.get("/dataset", (req, res) => {
  DatasetIndex.find({}, {}, { sort: { name: -1 } }, (err, docs) => {
    if (err) {
      res.status(500).send("Server error. ERRCODE: 2000FDI1");
      return;
    }

    if (!docs) {
      res.status(404).send("You do not have any dataset.");
      return;
    }

    const datasets = docs.map((val) => {
      return {
        _id: val._id,
        name: val.name,
        description: val.description,
        data_type: val.type,
        created_at: val.createdAt,
        updated_at: val.updatedAt,
      };
    });
    res.json(datasets);
  });
});

router.get("/dataset/:dataset_id/device", async (req, res) => {
  const devices = await Device.find({});
  Dataset.aggregate([
    { $match: { index_id: req.params.dataset_id } },
    {
      $group: {
        _id: "$device_id",
        last_update: { $max: "$createdAt" },
      },
    },
  ]).exec((err, docs) => {
    if (err) {
      res.status(500).send("Server error. ERRCODE: 2000FDT1");
      return;
    }
    console.log(docs);
    res.json(
      docs.map((val) => {
        const device = devices.find((dev) => {
          if (val._id == dev.token) return true;
          return false;
        });

        return {
          device_id: device.token,
          name: device.name,
          description: device.description,
          last_update: val.last_update,
        };
      })
    );
  });
});

router.get("/dataset/:dataset_id/:device_id", async (req, res) => {
  //ToDo check ownership of dataset

  Dataset.find(
    {
      index_id: req.params.dataset_id,
      device_id: req.params.device_id,
    },
    async (err, docs) => {
      if (err) {
        res.status(500).send("Server error. ERRCODE: 2000FDT1");
        return;
      }

      if (docs.length == 0) {
        res.status(404).send("This device does not have any dataset document.");
        return;
      }

      const data = docs.map((val) => {
        return {
          value: val.value,
          uploaded: val.createdAt,
        };
      });

      res.json(data);
    }
  );
});

router.get("/control", async (req, res) => {
  ControlIndex.find({}, (err, docs) => {
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

router.get("/control/device/:device_id", async (req, res) => {
  const controlIndexes = await ControlIndex.find({}).exec();

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

router.post(
  "/control/:control_id",
  body("value").notEmpty(),
  async (req, res) => {
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

      new ControlHistory({
        control_id: doc.control_id,
        value: doc.value,
      }).save();

      return res.json({ message: "The control queue has been saved." });
    });
  }
);

module.exports = router;
