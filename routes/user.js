const express = require("express");
const router = express.Router();

const express_jwt = require("express-jwt");
const jsonwebtoken = require("jsonwebtoken");

const mw_jwt = express_jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const bcrypt = require("bcrypt");

const DeveloperAccount = require("../model/DeveloperAccount");
const User = require("../model/User");

const random = require("../context/random");

router.get("/", mw_jwt, async (req, res) => {
  const user = await User.findById(req.user.user_id);

  res.status(200).send({
    email: user.email,
    fullname: user.fullname,
    address: user.address,
  });
});

router.post("/login", async (req, res) => {
  const loggingInUser = await User.findOne({ email: req.body.email });

  if (!loggingInUser) {
    res.status(401).send({ message: "Invalid email or password." });
    return;
  }

  const compareHash = await bcrypt.compare(
    req.body.password,
    loggingInUser.password
  );

  if (compareHash) {
    const ttl = 3600;
    let token = jsonwebtoken.sign(
      {
        user_id: loggingInUser._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: ttl,
      }
    );

    res.status(200).send({ token, ttl });
  } else res.status(401).send({ message: "Invalid email or password." });
});

router.patch("/", mw_jwt, async (req, res) => {
  const updatingUser = await User.findOne({ _id: req.user.user_id });

  if (req.body.email != updatingUser.email) {
    const checkExistingEmail = await User.findOne({ email: req.body.email });
    if (checkExistingEmail) {
      res.status(409).send({
        message: "This email is already registered in the system.",
      });
      return;
    }
  }

  if (!updatingUser) {
    res.status(401).send({ message: "Invalid email or password." });
    return;
  }

  await User.updateOne(
    { _id: req.user.user_id },
    {
      email: req.body.email,
      fullname: req.body.fullname,
      address: req.body.address,
    }
  ).catch(() => {
    res.status(500).send({ message: "Failed to update the user profile." });
    return;
  });

  res
    .status(200)
    .send({ message: "The user profile has been successfully updated." });
});

router.patch("/password", mw_jwt, async (req, res) => {
  if (req.body.new_password !== req.body.new_password_confirm) {
    res.status(422).send({
      message: "The password and the confirmation field mismatch.",
    });
    return;
  }

  const user = await User.findOne({ _id: req.user.user_id }).catch(() => {
    res.status(500).send({ message: "Failed to update the user password." });
    return;
  });

  const checkOldPassword = await bcrypt
    .compare(req.body.old_password, user.password)
    .catch(() => {
      res.status(500).send({ message: "Failed to update the user password." });
      return;
    });

  if (!checkOldPassword) {
    res.status(401).send({ message: "Invalid old password." });
    return;
  }

  const newPasswordHash = await bcrypt.hash(req.body.new_password, 10);

  User.updateOne(
    { _id: req.user.user_id },
    {
      password: newPasswordHash,
    }
  ).catch(() => {
    res.status(500).send({ message: "Failed to update the user password." });
    return;
  });

  res.status(200).send({
    message: "Your password have been successfully updated.",
  });
});

router.post("/", async (req, res) => {
  const userFound = await User.findOne({ email: req.body.email }).catch(
    (error) => {
      console.log(error);
    }
  );

  if (userFound) {
    res.status(401).send({
      message: "This email is already registered in the system.",
    });
    return;
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);

  const newUser = new User({
    email: req.body.email,
    password: passwordHash,
    fullname: req.body.fullname,
    address: req.body.address,
    device_token: random(64),
  });

  const savedNewUser = await newUser.save().catch(() => {
    res.status(500).send({
      message: "Failed to set up the new user.",
    });
    return;
  });

  res.status(200).send({ message: "Your account have been registered." });
});

router.post("/developer/activate", mw_jwt, async (req, res) => {
  if (!req.body.activation_code == process.env.DEV_ACCOUNT_ACTIVATION_CODE)
    return res.status(403).json({ message: "Invalid activation code" });

  const account = await DeveloperAccount.findOne({
    user_id: req.user.user_id,
  }).exec();

  if (!account) {
    new DeveloperAccount({
      user_id: req.user.user_id,
      token: random(128),
    }).save((err, doc) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Failed to activate your developer account." });

      return res.json({
        message: "Your developer account has been activated.",
        token: doc.token,
      });
    });
  } else {
    DeveloperAccount.findByIdAndUpdate(
      account._id,
      {
        token: random(128),
      },
      {
        new: true,
      },
      (err, doc) => {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({ message: "Failed to re-randomize your token." });
        }

        return res.json({
          token: doc.token,
        });
      }
    );
  }
});

router.get("/developer/token", mw_jwt, (req, res) => {
  DeveloperAccount.findOne(
    {
      user_id: req.user.user_id,
    },
    (err, doc) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({ message: "Failed to get your developer accounts token." });
      }

      if (!doc)
        return res
          .status(404)
          .send({ message: "You dont have a developer accounts token." });

      return res.json({
        token: doc.token,
      });
    }
  );
});

module.exports = router;
