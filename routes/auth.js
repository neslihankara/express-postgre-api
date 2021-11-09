var express = require("express");
var router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");

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

/* GET home page. */
router.post("/register", async (req, res, next) => {
  console.log("slm");
  const { firstName, lastName, email, password } = req.body;
  const newUser = await User.create({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
  });

  createSendToken(newUser, 201, req, res);
});

module.exports = router;
