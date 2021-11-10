const sequelize = require("../database-connection");
const { DataTypes } = require("sequelize");

const EmailVerificationToken = sequelize.define(
  "EmailVerificationToken",
  {
    emailVerificationToken: {
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
    modelName: "EmailVerificationToken",
  }
);

module.exports = EmailVerificationToken;
