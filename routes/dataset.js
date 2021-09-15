const app = require("express");
const router = app.Router();

const express_jwt = require("express-jwt");
const jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const { body, validationResult } = require("express-validator");

const DatasetIndex = require("../model/DatasetIndex");
const Dataset = require("../model/Dataset");
const Device = require("../model/Device");

router.get("/", jwt, async (req, res) => {
  DatasetIndex.find(
    { user_id: req.user.user_id },
    {},
    { sort: { name: -1 } },
    (err, docs) => {
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
    }
  );
});

router.post(
  "/",
  jwt,
  body("name").isLength({ min: 5 }),
  body("type").isLength({ min: 5, max: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!(req.body.type == "number" || req.body.type == "image"))
      return res.status(422).json({ message: "Invalid dataset type." });

    const newDatasetIndex = new DatasetIndex({
      user_id: req.user.user_id,
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
    });

    newDatasetIndex.save((err, doc) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Server error, failed to save the new device.",
        });
      }

      res.json({
        message: "The new dataset has been successfully saved.",
        saved_dataset: {
          name: doc.name,
          description: doc.description,
          type: doc.type,
          createdAt: doc.createdAt,
        },
      });
    });
  }
);

router.get("/:dataset_id", jwt, async (req, res) => {
  const devices = await Device.find({ user_id: req.user.user_id }).exec();
  Dataset.find(
    { index_id: req.params.dataset_id },
    {},
    { sort: { createdAt: 1 } },
    async (err, docs) => {
      if (err) {
        res.status(500).send("Server error. ERRCODE: 2000FDT1");
        return;
      }

      if (docs.length == 0) {
        res.status(404).send("You do not have any dataset document.");
        return;
      }

      const data = docs.map((val) => {
        return {
          device_name: devices.find((dev) => {
            if (val.device_id == dev.token) return true;
            return false;
          }).name,
          value: val.value,
          uploaded: val.createdAt,
        };
      });

      res.json(data);
    }
  );
});

router.delete("/:dataset_id", jwt, async (req, res) => {
  const datasetIndex = await DatasetIndex.findOne({
    _id: req.params.dataset_id,
  })
    .exec()
    .catch(() => res.status(422).json({ message: "Invalid dataset." }));

  if (!datasetIndex) {
    res.status(404).json({ message: "Dataset not found." });
    return;
  }

  DatasetIndex.deleteOne(datasetIndex, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Server error, failed to delete the dataset." });
    }

    return res.json({ message: "The dataset has been successfully deleted." });
  });
});

router.get("/:dataset_id/device", jwt, async (req, res) => {
  const devices = await Device.find({ user_id: req.user.user_id });
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

router.get("/:dataset_id/:device_id", jwt, async (req, res) => {
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

module.exports = router;
