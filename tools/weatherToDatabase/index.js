const cron = require("cron");
const request = require("request");
const mysql = require("mysql");
const moment = require("moment");
require("dotenv").config();

// import secret credentials of .env config file
const openweatherAPIKey = process.env.OPENWEATHER_API_KEY;
const db_user = process.env.DB_USER;
const db_pw = process.env.DB_PASSWORD;

// some settings and counting variables
const count = 160;
let ccount = 0;

// open weather api url
const apiUrl = `https://history.openweathermap.org/data/2.5/history/city?units=metric&lat=48.04996005196938&lon=7.8005587994414265&type=minute&start=0&cnt=${count}&appid=${openweatherAPIKey}`;

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

// cron job, to run this every 2 minutes - one run takes about 90 seconds. there are addidional 30s for currently slow internet connection, etc ...
const job = new cron.CronJob("*/2 * * * *", function () {
  // Select the first row in the table where weather_temp is NULL
  const selectQuery =
    "SELECT * FROM api_data WHERE weather_temp IS NULL LIMIT 1";

  connection.query(selectQuery, (selectErr, rows) => {
    if (selectErr) throw selectErr;

    if (rows.length > 0) {
      const row = rows[0];
      // console.log(row);
      const firstTime = new Date(row.Timestamp);
      console.log("timestamp: " + firstTime + "  " + firstTime.getTime()); // log the timestamp for debbuging purpose
      const firstAPItime = new Date(
        firstTime.getTime() -
          firstTime.getSeconds() * 1000 -
          firstTime.getMinutes() * 60 * 1000 +
          3600000
      ); // first API time = last full hour: 18:30:12 -> will be changed to 18:00:00; otherwise the api will return 19:00:00 as first dataset
      console.log(
        "first api call: " + firstAPItime + "  " + firstAPItime.getTime()
      ); // log time of first api call for debugging purpose
      // DEBUG: console.log(firstAPItime / 1000);

      // request the weather data, first entry of list of return data has the starting time, which is the first empty row in database
      const apiRequestUrl = apiUrl.replace(
        `start=0`,
        `start=${firstAPItime.getTime() / 1000}`
      );

      request(apiRequestUrl, function (apiErr, apiResponse, apiBody) {
        if (apiErr) throw apiErr;
        const data = JSON.parse(apiBody); // parse the api response -> making it usable
        ccount++; // increment the counting variable for the runs of the script 

        if (data && data.list && data.list.length > 0) {
          const weatherData = data.list;

          for (let i = 0; i < weatherData.length; i++) {
            const weather = weatherData[i];
            const temperature = weather.main.temp;
            const clouds = weather.clouds.all;
            const dt = new Date(weather.dt * 1000 - 3600000); // now i want the time differnece between CET and UTC

            // DEBUG: console.log(dt.get);
            // sql command to insert the data. There will be only one api dataset per hour. Only Date and Hour have to be compared.
            const updateQuery = `UPDATE api_data SET weather_temp = ?, weather_clouds = ? WHERE DATE(Timestamp) = ? AND HOUR(Timestamp) = ?`;
            const updateParams = [
              temperature,
              clouds,
              moment(dt).format("YYYY-MM-DD"),
              dt.getHours(),
            ];
            console.log(updateParams);
            // DEBUG: console.log(new Date().getHours());
            // sql query with query command filled wit h the parameters
            connection.query(
              updateQuery,
              updateParams,
              (updateErr, updateResult) => {
                if (updateErr) throw updateErr;
                console.log(
                  `[${ccount}][ ${(i + 1).toString().padStart(3, "0")} / ${
                    weatherData.length
                  } ] ${updateResult.affectedRows} rows updated.`
                ); // nice looking console output to understand what is happening
              }
            );
          }
        } else {
          // if api doesnt return a weather list
          console.log("Invalid API response.");
        }
      });
    } else {
      // if there isnt any empty (=NULL) weather_temp, then log this
      console.log("No empty rows. Table is entirely filled");
    }
  });
});

job.start(); // start the cron job
