const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pug = require("pug");
const User = require("../models/user");
const transporter = require("../nodemailer-config");
const path = require("path");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN);
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}

router.post("/register", async (req, res, next) => {
  const salt = await bcrypt.genSalt(10);
  const { firstName, lastName, email, password } = req.body;
  const newUser = await User.create({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: await bcrypt.hash(req.body.password, salt),
  });

  createSendToken(newUser, 201, req, res);
});

router.post("/loginRequired", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email: email,
  });

  if (!user) {
    console.log("User couldn't found");
    return res.sendStatus(401);
  }

  if (user) createSendToken(user, 200, req, res);
  else res.status(401).send({ message: "Wrong credentials" });
});

router.post("/emailVerification", async (req, res, next) => {
  if (!req.body.email) return next({ status: 400 });

  const user = await User.findOne({
    email: req.body.email,
    isActive: false,
  });

  const mailOptions = {
    from: "neslihan.backendchallenge@gmail.com",
    to: user.email,
    subject: "Your verification mail",
    html: pug.renderFile(
      path.join(__dirname, "../views/email-verification.pug")
    ),
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      console.log("Email sent" + info.response);
      res.sendStatus(200);
    }
  });
});

module.exports = router;
