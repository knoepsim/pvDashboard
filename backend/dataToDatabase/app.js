const cron = require("cron");
const request = require("request");
const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "db_sonnen",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL server");
});

const job = new cron.CronJob("0,10,20,30,40,50 * * * * *", function () {
  // Abfrage der PV-Anlage API
  request(
    "http://192.168.178.8:8080/api/v1/status",
    { json: true },
    (err, res, pvData) => {
      if (err) {
        return console.log(err);
      }
      console.log("PV-Anlage Daten:", pvData);

      // Abfrage der Wetterdaten von OpenWeatherMap API
      const apiKey = process.env.OPENWEATHER_API_KEY; // Ersetze mit deinem OpenWeatherMap API-Schlüssel
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=48.04996005196938&lon=7.8005587994414265&appid=${apiKey}`;
      request(weatherUrl, { json: true }, (err, res, weatherData) => {
        if (err) {
          return console.log(err);
        }
        console.log("Wetterdaten:", weatherData);

        // Kombinieren der PV-Daten und Wetterdaten
        const combinedData = {
          ...pvData,
          weather_temp: weatherData.main.temp,
          weather_clouds: weatherData.clouds.all,
        };

        // Speichern der kombinierten Daten in der Datenbank
        connection.query(
          "INSERT INTO api_data SET ?",
          combinedData,
          function (error, results, fields) {
            if (error) throw error;
            console.log("Daten in Datenbank gespeichert");
          }
        );
      });
    }
  );
});

job.start();
