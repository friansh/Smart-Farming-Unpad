const mongoose = require("mongoose");

const imagelistSchema = new mongoose.Schema(
  {
    index_id: String,
    device_id: String,
  },
  {
    timestamps: true,
  }
);

const Imagelist = mongoose.model("liveimagefeeds", imagelistSchema);

module.exports = Imagelist;
