console.log("Server-side code running");

const express = require("express");
const cors = require("cors");

var fs = require("fs");
var http = require("http");
var https = require("https");
var privateKey = fs.readFileSync("sslcert/server.key", "utf8");
var certificate = fs.readFileSync("sslcert/server.crt", "utf8");

var credentials = { key: privateKey, cert: certificate };

const app = express();

const mysql = require("mysql");
require("dotenv").config();
const request = require("request");
const moment = require("moment");
const ss = require("simple-statistics");

let connection;
let connected = false;
let port = 8880;

function connectToDatabase() {
  // create a new connection to the database
  connection = mysql.createConnection({
    host: "127.0.0.1",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "db_sonnen",
  });

  // connect to the database
  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to MySQL server:", err);
      connected = false;
      // handle the error here
      setTimeout(() => {
        connectToDatabase();
      }, 10000);
    } else {
      console.log("Connected to MySQL server");
      connected = true;
    }
  });

  // handle database connection errors
  connection.on("error", (err) => {
    connected = false;
    console.error("Database connection error:", err);
    // handle the error here
    setTimeout(() => {
      connectToDatabase();
    }, 10000);
  });
}

// connect to the database initially
connectToDatabase();

// serve files from the public directory
app.use(express.static("www"));
app.use(cors());

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8880);
httpsServer.listen(8443);

// serve the homepage
app.get("/", (req, res) => {
  if (!connected) return res.sendFile(__dirname + "/www/dbError.html");
  res.sendFile(__dirname + "/www/index.html");
});

// test command, for checking database connection
app.get("/test", (req, res) => {
  if (!connected) return res.sendStatus(500);
  res.sendStatus(200);
});

app.get("/lastHour-perMinute", (req, res) => {
  if (!connected) {
    res.status(500);
    return res.sendFile(__dirname + "/www/dbError.html");
  }
  const query = `SELECT ROUND(AVG(Consumption_W)) as avg_cons, ROUND(AVG(Production_W)) as avg_prod, 
    DATE_FORMAT(FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(Timestamp)/60)*60), '%Y-%m-%d %H:%i:00') as rounded_timestamp
    FROM api_data 
    GROUP BY rounded_timestamp 
    ORDER BY Timestamp DESC 
    LIMIT 60;`;
  connection.query(query, (selectErr, rows) => {
    if (selectErr) {
      res.send(null);
      throw selectErr;
    } else {
      res.send(rows);
    }
  });
});

app.get("/current", (req, res) => {
  if (!connected) {
    res.status(500);
    return res.sendFile(__dirname + "/www/dbError.html");
  }
  const query = `SELECT * FROM api_data ORDER BY Timestamp DESC LIMIT 1;`;
  connection.query(query, (selectErr, rows) => {
    if (selectErr) {
      res.send(null);
      throw selectErr;
    } else {
      res.send(rows);
    }
  });
});

app.get("/beta/regression", (req, res) => {
  if (!connected) {
    res.status(500);
    return res.sendFile(__dirname + "/www/dbError.html");
  }

  // console.log(req.query);

  // parameter
  if (isValidUnixTimestamp(req.query.timestamp)) {
    console.log("timestamp error");
    return res.sendStatus(400);
  }

  let ts = +req.query.timestamp; // (+) timestamp parameter von string to int umwandeln
  const reg = +req.query.reg;
  const pred = +req.query.pred;

  // limit and timestamp for the sql request
  // first one has to be ts - reg minutes
  const apiStartDate = new Date(
    Math.floor(ts / (60 * 1000)) * (60 * 1000) - reg * 60000
  );
  // api limit has to be whole datapoint
  const apiLimit = reg + pred;

  const formattedApiStartDate = apiStartDate
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  if (isNaN(apiLimit)) return res.sendStatus(400);

  const query = `
      SELECT  
      DATE_FORMAT(Timestamp, '%Y-%m-%d %H:%i:00') as rounded_timestamp,
      ROUND(AVG(Production_W)) as avg_prod
      FROM api_data
      WHERE Timestamp >= '${formattedApiStartDate}'
      GROUP BY rounded_timestamp
      ORDER BY Timestamp 
      LIMIT ${apiLimit};
  `;

  connection.query(query, (selectErr, rows) => {
    if (selectErr) {
      res.send(null);
      throw selectErr;
    } else {
      // console.log("query", rows);
      // console.log("ts", ts);
      // console.log("reg", reg);
      // console.log("pred", pred);
      // console.log("apiStartDate", formattedApiStartDate);
      // console.log("limit", apiLimit);

      if (rows == []) {
        console.log("no rows");
        return res.send(null);
      }
      // console.log(rows);
      // data for the regression
      let data = [];

      // if there is less data available than requested, do the regession with less data
      let c = reg;
      if (rows.length < reg) c = rows.length;

      for (let i = 0; i < c; i++) {
        const e = rows[i];
        data.push([
          moment(e.rounded_timestamp, "YYYY-MM-DD HH:mm:ss").toDate().getTime(),
          e.avg_prod,
        ]);
      }

      const regression = ss.linearRegression(data);

      let returnValues = [];

      for (let i = 0; i < c + pred; i++) {
        let d = rows[i];
        let timestamp;
        if (d) {
          timestamp = moment(d.rounded_timestamp, "YYYY-MM-DD HH:mm:ss")
            .toDate()
            .getTime();
        } else {
          timestamp =
            moment(
              returnValues[i - 1]?.rounded_timestamp,
              "YYYY-MM-DD HH:mm:ss"
            )
              .toDate()
              .getTime() + 60000;
        }
        let production = d?.avg_prod || null;
        let prediction = timestamp * regression.m + regression.b;
        returnValues.push([timestamp, production, prediction]);
      }
      // console.log(data);
      res.send([c, returnValues]);
    }
  });
});

app.get("/beta/sun", async (req, res) => {
  if (!connected) {
    res.status(500);
    return res.sendFile(__dirname + "/www/dbError.html");
  }
  let Weatherurl = `https://pro.openweathermap.org/data/2.5/weather?units=metric&lat=48.04996005196938&lon=7.8005587994414265&appid=${process.env.OPENWEATHER_API_KEY}`;
  request(Weatherurl, (error, response, body) => {
    if (error) {
      return res.sendStatus(400);
    }
    if (response.statusCode !== 200) {
      return res.sendStatus(400);
    } else {
      body = JSON.parse(body);
      //sunrise
      const sunrise = moment(body.sys.sunrise * 1000).format(
        "DD.MM.YY HH:mm:ss"
      );

      //sunmid
      const sunmid = moment(
        (body.sys.sunrise + (body.sys.sunset - body.sys.sunrise) / 2) * 1000
      ).format("DD.MM.YY HH:mm:ss");
      //sunset
      const sunset = moment(body.sys.sunset * 1000).format("DD.MM.YY HH:mm:ss");
      const sun = [sunrise, sunmid, sunset];
      res.send(sun);
    }
  });

  // const timestamp = new Date(1676894391000);
  // if (!timestamp.getTime()) return res.sendStatus(400);
  // const APIstartDate = new Date(timestamp).toISOString().split("T")[0];

  // const query = `
  // SELECT
  //   CONCAT(
  //     DATE_FORMAT(Timestamp, '%Y-%m-%d %H:'),
  //     FLOOR(MINUTE(Timestamp) / 15) * 15,
  //     ':00'
  //   ) as rounded_timestamp,
  //   ROUND(AVG(Production_W)) as avg_prod
  // FROM api_data
  // WHERE DATE(Timestamp) = DATE('${APIstartDate}')
  // GROUP BY rounded_timestamp
  // ORDER BY Timestamp
  // LIMIT ${150};
  // `;
  // connection.query(query, (selectErr, rows) => {
  //   if (selectErr) {
  //     res.send(null);
  //     throw selectErr;
  //   } else {
  // if(rows.length > 2) return res.send(null)
  // let timestamp = [];
  // let pvDat = [];
  // for (let i = 0; i < rows.length + 3; i++) {
  //   if (i < rows.length) {
  //     timestamp.push(rows[i].rounded_timestamp);
  //     pvDat.push(rows[i].avg_prod);
  //   } else {
  //     pvDat.push(null);
  //   }
  // }
  // let Weatherurl = `https://pro.openweathermap.org/data/2.5/weather?units=metric&lat=48.04996005196938&lon=7.8005587994414265&appid=${process.env.OPENWEATHER_API_KEY}`;
  // request(Weatherurl, (error, response, body) => {
  //   if (error) {
  //     return res.sendStatus(400);
  //   }
  //   // Überprüfen des Statuscodes der Antwort
  //   if (response.statusCode !== 200) {
  //     return res.sendStatus(400);
  //   } else {
  //     body = JSON.parse(body);
  //     let weatherDat = [];
  //     for (let i = 0; i < rows.length; i++) {
  //       weatherDat.push(null);
  //     }
  //     //sunrise
  //     timestamp.push(
  //       moment(body.sys.sunrise * 1000).format("YYYY-MM-DD HH:mm:ss")
  //     );
  //     weatherDat.push(0);
  //     //sunmid
  //     timestamp.push(
  //       moment(
  //         (body.sys.sunrise + (body.sys.sunset - body.sys.sunrise) / 2) *
  //           1000
  //       ).format("YYYY-MM-DD HH:mm:ss")
  //     );
  //     weatherDat.push(ss.max(pvDat));
  //     //sunset
  //     timestamp.push(
  //       moment(body.sys.sunset * 1000).format("YYYY-MM-DD HH:mm:ss")
  //     );
  //     weatherDat.push(0);

  //     res.send([timestamp, pvDat, weatherDat]);
  // const sunrise = {
  //   rounded_timestamp: moment(weatherDat.sys.sunrise * 1000).format(
  //     "YYYY-MM-DD HH:mm:ss"
  //   ),
  //   avg_prod: 0,
  // };
  // const sunmid = {
  //   rounded_timestamp: moment(
  //     (weatherDat.sys.sunset +
  //       (weatherDat.sys.sunset - weatherDat.sys.sunrise) / 2) *
  //       1000
  //   ).format("YYYY-MM-DD HH:mm:ss"),
  //   avg_prod: 5000,
  // };
  // const sunset = {
  //   rounded_timestamp: moment(weatherDat.sys.sunset * 1000).format(
  //     "YYYY-MM-DD HH:mm:ss"
  //   ),
  //   avg_prod: 0,
  // };

  // res.send([pvDat, [sunrise, sunmid, sunset]]);
  // console.log(weatherDat.sys.sunrise);
  //       }
  //     });
  //   }
  // });

  // const sunrise = weatherDat.sys.sunrise;
  // const sunset = weatherDat.sys.sunset;

  // console.log(sunrise, sunset);
  // res.sendStatus(200);
});

app.get("/beta/clouds", async (req, res) => {
  if (!connected) {
    res.status(500);
    return res.sendFile(__dirname + "/www/dbError.html");
  }
  let WeatherForecasturl = `https://pro.openweathermap.org/data/2.5/forecast/hourly?units=metric&lat=48.04996005196938&lon=7.8005587994414265&cnt=3&appid=${process.env.OPENWEATHER_API_KEY}`;

  request(WeatherForecasturl, (error, response, body) => {
    if (error) {
      return res.sendStatus(400);
    }
    if (response.statusCode !== 200) {
      return res.sendStatus(400);
    }
    body = JSON.parse(body);
    let timestamp = [];
    let clouds = [];
    body.list.forEach((e) => {
      timestamp.push(
        moment(+e.dt * 1000)
          .utcOffset(2)
          .format("DD.MM.YY HH:mm:ss")
      );
      clouds.push(+e.clouds.all);
    });
    // console.log(timestamp);
    // console.log(clouds);

    let WeatherNowurl = `https://pro.openweathermap.org/data/2.5/weather?units=metric&lat=48.04996005196938&lon=7.8005587994414265&appid=${process.env.OPENWEATHER_API_KEY}`;

    request(WeatherNowurl, (error, response, body) => {
      if (error) {
        return res.sendStatus(400);
      }
      if (response.statusCode !== 200) {
        return res.sendStatus(400);
      }
      body = JSON.parse(body);
      clouds.unshift(body.clouds.all);
      timestamp.unshift(
        moment(body.dt * 1000)
          .utcOffset(2)
          .format("DD.MM.YY HH:mm:ss")
      );
      res.send([timestamp, clouds]);
    });
  });
});

// ------------------------------ UTIL ------------------------------
function isValidUnixTimestamp(timestampStr) {
  const timestamp = parseInt(timestampStr, 13); // Parse the string as an integer
  if (isNaN(timestamp)) {
    // The string is not a valid number
    return false;
  }

  // Check if the timestamp is within the valid Unix timestamp range
  const minTimestamp = 0; // Minimum Unix timestamp (January 1, 1970)
  const maxTimestamp = 9999999999999; // Maximum Unix timestamp (sometime in 5138)
  return timestamp >= minTimestamp && timestamp <= maxTimestamp;
}
