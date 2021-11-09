const { Sequelize } = require("sequelize");

const connectionString = process.env.POSTGRES_CONNECTION_STRING;

const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

module.exports = sequelize;
