const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pug = require("pug");
const User = require("../models/user");
const EmailToken = require("../models/emailToken");
const transporter = require("../nodemailer-config");
const path = require("path");
const dayjs = require("dayjs");
const { nanoid } = require("nanoid");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN);
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id);

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
    isActive: false,
  });

  const emailVerificationToken = await EmailToken.create({
    emailToken: nanoid(),
    userId: newUser.id,
    expirationDate: dayjs().add(2, "week"),
  });

  const verificationUrl = `http://localhost:8080/auth/activateAccount?emailToken=${emailVerificationToken.emailToken}`;

  const mailOptions = {
    from: "neslihan.backendchallenge@gmail.com",
    to: newUser.email,
    subject: "Your verification mail",
    html: pug.renderFile(
      path.join(__dirname, "../views/email-verification.pug"),
      {
        verificationUrl,
      }
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

  createSendToken(newUser, 201, req, res);
});

router.post("/loginRequired", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: { email: email },
  });

  if (!user) {
    console.log("User couldn't found");
    return res.sendStatus(401);
  }

  if (user) createSendToken(user, 200, req, res);
  else res.status(401).send({ message: "Wrong credentials" });
});

router.get("/activateAccount", async (req, res, next) => {
  if (!req.query.emailToken) return next({ status: 400 });

  const tokenItem = await EmailToken.findOne({
    where: { emailToken: req.query.emailToken },
  });

  try {
    const user = await User.findOne({
      where: { id: tokenItem.userId },
    });

    user.isActive = true;

    user.save();

    console.log("User is activated");
    res.sendStatus(200);
  } catch (err) {
    res.status(401).status({ message: err.message });
  }
});

module.exports = router;
