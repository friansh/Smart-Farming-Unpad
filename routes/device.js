const app = require("express");
const router = app.Router();

const express_jwt = require("express-jwt");
const jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});
const { body, validationResult } = require("express-validator");

const generateRandomString = require("../context/random");

const Device = require("../model/Device");
const Heartbeat = require("../model/Heartbeat");
const Dataset = require("../model/Dataset");

router.get("/", jwt, async (req, res) => {
  Device.find(
    { user_id: req.user.user_id },
    {},
    { sort: { name: -1 } },
    (err, devices) => {
      if (err) {
        res.status(500).send("Server error. ERRCODE: 2000FDV1");
        console.log(err);
        return;
      }

      const deviceList = devices.map((val) => {
        return {
          device_id: val._id,
        };
      });

      Heartbeat.find({ $or: deviceList }, (err, heartbeats) => {
        if (err) {
          res.status(500).send("Server error. ERRCODE: 2000FHB1");
          return;
        }

        heartbeat = heartbeats.map((val) => {
          return {
            device_id: val.device_id,
            firmware_version: val.firmware_version,
            last_heartbeat: val.updatedAt,
          };
        });

        // const lastData = await Dataset.aggregate([
        //   {
        //     $group: {
        //       _id: "$_id",
        //       last_update: { $max: "$createdAt" },
        //     },
        //   },
        // ])
        //   .exec()
        //   .catch(() => {
        //     res.status(500).send("Server error. ERRCODE: 2000FDT1");
        //   });

        let devicesMapped = devices.map((val) => {
          const findHeartbeat = heartbeat.find((hb) => {
            if (hb.device_id == val._id) return true;
            return false;
          });

          return {
            id: val._id,
            name: val.name,
            description: val.description,
            last_heartbeat: !findHeartbeat
              ? null
              : findHeartbeat.last_heartbeat,
            firmware_version: !findHeartbeat
              ? null
              : findHeartbeat.firmware_version,
            // last_update: lastData.last_update,
          };
        });

        res.json(devicesMapped);
      });
    }
  );
});

router.post("/", jwt, body("name").isLength({ min: 5 }), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let searchToken = [0];
  let newToken;

  // Assure there is no duplicate device token
  while (searchToken.length != 0) {
    newToken = generateRandomString(32);

    searchToken = await Device.find({ token: newToken })
      .exec()
      .catch(() => console.log("Err1"));
  }

  const newDevice = new Device({
    user_id: req.user.user_id,
    name: req.body.name,
    description: req.body.description,
    token: newToken,
  });

  newDevice.save((err, doc) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Server error, failed to save the new device.",
      });
    }

    res.json({
      message: "The new device has been successfully saved.",
      saved_device: {
        name: doc.name,
        description: doc.description,
        token: doc.token,
        createdAt: doc.createdAt,
      },
    });
  });
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

router.delete("/:device_id", jwt, async (req, res) => {
  const device = await Device.findOne({ _id: req.params.device_id })
    .exec()
    .catch(() => res.status(422).json({ message: "Invalid device id." }));

  if (!device) {
    res.status(404).json({ message: "Device not found." });
    return;
  }

  Device.deleteOne(device, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Server error, failed to delete the device." });
    }

    return res.json({ message: "The device has been successfully deleted." });
  });
});

module.exports = router;
