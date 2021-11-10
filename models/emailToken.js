const sequelize = require("../database-connection");
const { DataTypes } = require("sequelize");

const EmailToken = sequelize.define(
  "EmailToken",
  {
    emailToken: {
      type: DataTypes.STRING,
    },
    userId: {
      type: DataTypes.STRING,
    },
    expirationDate: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "EmailToken",
  }
);

module.exports = EmailToken;
