const app = require("express");
const router = app.Router();

const express_jwt = require("express-jwt");
const jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const Device = require("../model/Device");
const Heartbeat = require("../model/Heartbeat");
const Dataset = require("../model/Dataset");

router.get("/", jwt, async (req, res) => {
  Device.find(
    { user_id: req.user.user_id },
    {},
    { sort: { name: -1 } },
    async (err, docs) => {
      if (err) {
        res.status(500).send("Server error. ERRCODE: 2000FDV1");
        return;
      }

      const deviceList = docs.map((val) => {
        return {
          device_id: val._id,
        };
      });

      let heartbeat = await Heartbeat.find({ $or: deviceList })
        .exec()
        .catch(() => {
          res.status(500).send("Server error. ERRCODE: 2000FHB1");
          return;
        });

      heartbeat = heartbeat.map((val) => {
        return {
          device_id: val.device_id,
          firmware_version: val.firmware_version,
          last_heartbeat: val.updatedAt,
        };
      });

      const lastData = await Dataset.aggregate([
        {
          $group: {
            _id: "$_id",
            last_update: { $max: "$createdAt" },
          },
        },
      ])
        .exec()
        .catch(() => {
          res.status(500).send("Server error. ERRCODE: 2000FDT1");
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
          // last_update: lastData.last_update,
        };
      });

      res.json(devices);
    }
  );
});

router.get("/heartbeat", jwt, async (req, res) => {
  Device.find({ user_id: req.user.user_id }, (err, docs) => {
    if (err) {
      res.status(500).send("Server error. ERRCODE: 2000FDV3");
      return;
    }
    const deviceList = docs.map((val) => {
      return {
        device_id: val._id,
      };
    });

    Heartbeat.find({ $or: deviceList }, (err, doc) => {
      if (err) {
        res.status(500).send("Server error. ERRCODE: 2000FHB2");
        return;
      }

      res.json(doc);
    });
  });
});

router.get("/:device_id", jwt, async (req, res) => {
  Device.findOne(
    { user_id: req.user.user_id, _id: req.params.device_id },
    (err, docs) => {
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
    }
  );
});

module.exports = router;
