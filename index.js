console.log("[INFO] Program started...");

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

mongoose.connect(
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@smartfarmingunpad.usves.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  // `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_AUTH}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    dbName: process.env.DB_NAME,
  }
);

app.get("/", (req, res) => {
  res.status(200).send({
    message: "The smart-farmer backend is running...",
    config: {
      APP_URL: process.env.APP_URL,
      MQTT_SERVER: process.env.MQTT_SERVER,
      DB_CLUSTER: process.env.DB_HOST,
      DB_NAME: process.env.DB_NAME,
      IMAGE_ENCODING: process.env.IMAGE_ENCODING,
      IMAGE_DIR: process.env.IMAGE_DIR,
      FIRMWARE_DIR: process.env.FIRMWARE_DIR,
    },
  });
});

const userRoutes = require("./routes/user");
const firmwareRoutes = require("./routes/firmware");
const deviceRoutes = require("./routes/device");
const datasetRoute = require("./routes/dataset");
const imagelistRoute = require("./routes/imagelist");
const controlRoute = require("./routes/control");
const developerRoute = require("./routes/developer");

app.use("/user", userRoutes);
app.use("/firmware", firmwareRoutes);
app.use("/device", deviceRoutes);
app.use("/dataset", datasetRoute);
app.use("/imagelist", imagelistRoute);
app.use("/control", controlRoute);
app.use("/developer", developerRoute);

app.use((req, res, next) => {
  res.status(404).send({ message: "Cannot find the specified resource." });
});

app.use((err, req, res, next) => {
  console.error(`[ERRR] ${err.name}: ${err.message}`);
  if (err.name === "UnauthorizedError") {
    res.status(err.status).send({
      message: `Authentication error, reason: ${err.message.toLowerCase()}`,
    });
    return;
  }
});

const port = process.env.PORT || 8000;

app.listen(port);
console.log(`[INFO] Express is listening on ${process.env.APP_URL}`);
