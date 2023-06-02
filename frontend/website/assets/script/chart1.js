let chart1;
function getChart1Data() {
  return new Promise((resolve, reject) => {
    $.get(apiUrl + "lastHour-PerMinute", function (data) {
      let time = [];
      let consumption = [];
      let production = [];
      data = editToTimestamps(data);
      data.forEach((e) => {
        time.unshift(dateFormat(e["rounded_timestamp"], "H:MM"));
        consumption.unshift(e["avg_cons"]);
        production.unshift(e["avg_prod"]);
      });
      resolve([time, consumption, production]); // Resolve with the desired data
    }).fail(function () {
      $("#chart1error").html("Keine Daten verfügbar.");
      reject("Failed to fetch data"); // Reject with an error message
      const btn = $("#chart1-reload");
      btn.html("aktualisieren");
      btn.prop("disabled", false);
    });
  });
}

async function buildChart1() {
  //create chart
  const [time, consuption, production] = await getChart1Data();
  chart1 = new Chart($("#chart1"), {
    type: "line",
    data: {
      labels: time,
      datasets: [
        {
          label: "Verbrauch",
          data: consuption,
          borderColor: cssvar("--chart1"),
          fill: false,
          cubicInterpolationMode: "monotone",
          tension: 1,
        },
        {
          label: "Produktion",
          data: production,
          borderColor: cssvar("--chart2"),
          fill: false,
          cubicInterpolationMode: "monotone",
          tension: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Leistungsübersicht",
        },
      },
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: "Leistung [W]",
          },
          suggestedMin: 0,
        },
      },
    },
  });
}

async function updateChart1() {
  const btn = $("#chart1-reload");
  btn.prop("disabled", true);
  btn.html(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>`
  );
  const [time, consuption, production] = await getChart1Data();
  chart1.data = {
    labels: time,
    datasets: [
      {
        label: "Verbrauch",
        data: consuption,
        borderColor: cssvar("--chart1"),
        fill: false,
        cubicInterpolationMode: "monotone",
        tension: 1,
      },
      {
        label: "Produktion",
        data: production,
        borderColor: cssvar("--chart2"),
        fill: false,
        cubicInterpolationMode: "monotone",
        tension: 1,
      },
    ],
  };
  chart1.update();

  btn.html("aktualisieren");
  btn.prop("disabled", false);
}

buildChart1();
