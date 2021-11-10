const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pug = require("pug");
const User = require("../models/user");
const EmailVerificationToken = require("../models/emailVerificationToken");
const EmailLoginToken = require("../models/emailLoginToken");
const transporter = require("../nodemailer-config");
const path = require("path");
const dayjs = require("dayjs");
const { nanoid } = require("nanoid");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN);
};

const createSendToken = (user) => {
  const token = signToken(user.id);

  return token;
};

const isPasswordCorrect = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
};

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

  const emailVerificationToken = await EmailVerificationToken.create({
    emailVerificationToken: nanoid(),
    userId: newUser.id,
    expirationDate: dayjs().add(2, "week"),
  });

  const verificationUrl = `${process.env.BASE_URL}/auth/activate-account?emailVerificationToken=${emailVerificationToken.emailVerificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL,
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

router.post("/login-magiclink", async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });

  const emailLoginToken = await EmailLoginToken.create({
    emailLoginToken: nanoid(),
    userId: user.id,
  });

  const verificationUrl = `${process.env.BASE_URL}/auth/login-magiclink?emailLoginToken=${emailLoginToken.emailLoginToken}`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: "Login without your password",
    html: pug.renderFile(
      path.join(__dirname, "../views/login-without-password.pug"),
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
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: { email: email },
  });

  if (!user) {
    return res
      .status(401)
      .send({ message: "A user with the provided email couldn't be found" });
  }

  if (await isPasswordCorrect(password, user.password)) {
    const token = createSendToken(user);

    return res.send({
      status: "success",
      token,
      data: {
        user,
      },
    });
  }

  res.status(401).send({ message: "Wrong password!" });
});

router.get("/activate-account", async (req, res, next) => {
  if (!req.query.emailVerificationToken) return next({ status: 400 });

  const tokenItem = await EmailVerificationToken.findOne({
    where: { emailVerificationToken: req.query.emailVerificationToken },
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
    res.status(401).send({ message: err.message });
  }
});

router.get("/login-magiclink", async (req, res, next) => {
  try {
    const emailLoginToken = await EmailLoginToken.findOne({
      where: { emailLoginToken: req.query.emailLoginToken },
    });

    const user = await User.findOne({ where: { id: emailLoginToken.userId } });

    const token = createSendToken(user);

    return res.send({
      status: "success",
      token,
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(404).send({ message: err.message });
  }
});

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
    });

    res.status(200).send(user);
  } catch (e) {
    res.send({ message: e.message });
  }
});

module.exports = router;
