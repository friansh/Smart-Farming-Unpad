const app = require("express");
const router = app.Router();
const multer = require("multer");
const upload = multer({ dest: `${process.env.FIRMWARE_DIR}/` });
const fs = require("fs");

const Firmware = require("../model/Firmware");

router.post("/:device_id", upload.single("firmware_file"), (req, res) => {
  const firmwareFileName = `${Date.now()}.bin`;
  fs.renameSync(
    req.file.path,
    `${process.env.FIRMWARE_DIR}/${req.params.device_id}/${firmwareFileName}`
  );

  const newFirmware = new Firmware({
    device_id: req.params.device_id,
    file_name: firmwareFileName,
    version: req.body.version,
    update_notes: req.body.update_notes,
  });

  newFirmware.save().then((doc) =>
    res.json({
      message: "The new firmware has been uploaded.",
      saved: doc,
    })
  );
});

router.get("/:device_id/version", (req, res) => {
  Firmware.findOne(
    { device_id: req.params.device_id },
    {},
    { sort: { createdAt: -1 } },
    (err, doc) => {
      if (!doc) {
        res.status(404).json({ message: "Entry not found." });
        return;
      }
      if (!err)
        res.json({
          version: doc.version,
          board: "ESP8266",
          update_notes: doc.update_notes,
        });
      else
        res
          .status(500)
          .json({ message: "Failed fetching data from the database." });
    }
  );
});

router.get("/:device_id/download", (req, res) => {
  Firmware.findOne(
    { device_id: req.params.device_id },
    {},
    { sort: { createdAt: -1 } },
    (err, doc) => {
      if (!err)
        res.download(
          `${process.env.FIRMWARE_DIR}/${doc.device_id}/${doc.file_name}`
        );
      else
        res
          .status(500)
          .json({ message: "Failed fetching data from the database." });
    }
  );
});

module.exports = router;
