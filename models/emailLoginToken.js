const sequelize = require("../database-connection");
const { DataTypes } = require("sequelize");

const EmailLoginToken = sequelize.define(
  "EmailLoginToken",
  {
    emailLoginToken: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "EmailLoginToken",
  }
);

module.exports = EmailLoginToken;
