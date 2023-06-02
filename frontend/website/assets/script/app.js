const apiUrl = "http://defr83ugf1mfqeqb.myfritz.net:8880/";

// ----------------------- UTIL -----------------------
function editToTimestamps(data) {
  data.forEach((e) => {
    e = new Date(Date.parse(e["roundet_timestamp"]));
  });
  return data;
}

function cssvar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

// Map-Funktion, um ein Wert aus einem Intervall in ein anderes zu Konvertieren. WARUM IST DAS NICHT IN JS IMPLEMENTIERT :Z
function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// chart.js plugin for vertical lines
const arbitraryLine = {
  id: "arbitraryLine",
  beforeDraw(chart, args, options) {
    options.xPosition.forEach((e) => {
      const {
        ctx,
        chartArea: { top, right, bottom, left, width, height },
        scales: { x, y },
      } = chart;
      ctx.save();
      const xWidth = 4;
      ctx.fillStyle = options.arbitraryLineColor;
      ctx.fillRect(x.getPixelForValue(e) - xWidth / 2, top, xWidth, height);
      ctx.restore();
    });
  },
};

// Battery Colors
function getBatteryFillColor(value) {
  // Überprüfe den Wertebereich
  if (value >= 100) {
    return "#00FF00"; // Grün
  } else if (value <= 10) {
    return "#FF0000"; // Rot
  } else if (value <= 25) {
    // Anteil zwischen Gelb und Rot
    const ratio = (value - 10) / (25 - 10);
    const red = Math.round(255 - ratio * (255 - 10));
    const green = 255;
    const blue = 0;

    // RGB in HEX
    return (
      "#" +
      ((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1)
    );
  } else {
    // Anteil zwischen Grün und Gelb
    const ratio = (value - 25) / (100 - 25);
    const red = 0;
    const green = Math.round(255 - ratio * (255 - 100));
    const blue = 0;

    // Konvertiere die RGB-Werte in HEX
    return (
      "#" +
      ((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1)
    );
  }
}

// ----------------------- GET DATA AND BUILD CHARTS -----------------------
//when content loaded fix the button
// fixColorSwitchButton();

// ----------------------- JOBS -----------------------

// ----------------------- OLD SHIT -----------------------

// const ctx = document.getElementById("chart1");

// new Chart(ctx, {
//   type: "bar",
//   data: {
//     labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
//     datasets: [
//       {
//         label: "# of Votes",
//         data: [12, 19, 3, 5, 2, 3],
//         borderWidth: 1,
//       },
//       {
//         label: "# of Negative",
//         data: [3, 14, 3, 3,5, 2.1],
//         borderWidth: 1,
//       },
//     ],
//   },
//   options: {
//     scales: {
//       y: {
//         beginAtZero: true,
//       },
//     },
//   },
// });
