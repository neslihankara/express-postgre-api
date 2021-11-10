const express = require("express");
const User = require("../models/user");
const router = express.Router();

router.get("/", async (req, res, next) => {
  const users = await User.findAll({});

  res.status(200).send(users);
});

module.exports = router;
