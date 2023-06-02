const cron = require("cron");
const mysql = require("mysql");
require("dotenv").config();

// import secret credentials of .env config file
const db_user = process.env.DB_USER;
const db_pw = process.env.DB_PASSWORD;

// configure mysql connection with secret credentials
const connection = mysql.createConnection({
  host: "localhost",
  user: db_user,
  password: db_pw,
  database: "db_sonnen",
});

// connect to database with the config
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL server");
});

const job = new cron.CronJob("* * * * * *", function () {
  const updateQuery = `UPDATE api_data 
                       SET Unix = Timestamp
                       WHERE Unix IS NULL 
                       ORDER BY Timestamp ASC
                       `;

  connection.query(updateQuery, (updateErr, result) => {
    if (updateErr) throw updateErr;

    if (result.affectedRows > 0) {
      console.log("Updated row successfully");
    } else {
      console.log("No rows to update");
    }
  });
});
job.start(); // start the cron job
