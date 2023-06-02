// slider anzeige
$("#chart10reg").on("input change", function () {
  $("#chart10regVal").html($(this).val());
});
$("#chart10pred").on("input change", function () {
  $("#chart10predVal").html($(this).val());
});

$("#chart10ts").val(moment().format("YYYY-MM-DDTHH:mm"));

//get user input for individual regression
function getChart10input() {
  const reg = $("#chart10reg").val();
  const pred = $("#chart10pred").val();
  let ts = new Date(1677596744000).getTime();
  if ($("#chart10ts").val()) ts = new Date($("#chart10ts").val()).getTime();
  // console.log(reg, pred, ts);
  return [reg, pred, ts];
}
function getChart10Data() {
  return new Promise((resolve, reject) => {
    const [reg, pred, ts] = getChart10input();
    $.get(
      apiUrl + `beta/regression?timestamp=${ts}&reg=${reg}&pred=${pred}`,
      function (data) {
        let time = [];
        let production = [];
        let regression = [];
        let c = data[0];
        if (!data[1]) {
          return resolve([null, null, null, null]);
        }
        data[1] = editToTimestamps(data[1]);
        data[1].forEach((e) => {
          time.push(dateFormat(e[0], "dd.mm.yy H:MM"));
          production.push(e[1]);
          regression.push(e[2]);
        });
        resolve([time, production, regression, c]); // Resolve with the desired data
      }
    ).fail(function () {
      $("#chart10error").html("Keine Daten verfügbar.");
      reject("Failed to fetch data"); // Reject with an error message
      const btn = $("#chart10-reload");
      btn.html("aktualisieren");
      btn.prop("disabled", false);
    });
  });
}

let chart10;

async function buildChart10() {
  //create chart
  const [time, production, regression, c] = await getChart10Data();
  chart10 = new Chart($("#chart10"), {
    type: "line",
    data: {
      labels: time,
      datasets: [
        {
          label: "Produktion",
          data: production,
          borderColor: cssvar("--chart1"),
          fill: false,
          cubicInterpolationMode: "monotone",
          tension: 1,
        },
        {
          label: "Regression (Produktion)",
          data: regression,
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
          text: `${time[c]} - Input: ${+c}min - Output: ${time.length - c}min`,
        },
        arbitraryLine: {
          arbitraryLineColor: "red",
          xPosition: [+c],
        },
      },
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          display: true,
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
    plugins: [arbitraryLine], // Plugin registrieren
  });
}

async function updateChart10() {
  const btn = $("#chart10-reload");
  btn.prop("disabled", true);
  btn.html(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>`
  );
  const [time, production, regression, c] = await getChart10Data();
  //chart10.options.plugins.arbitraryLine.xPosition = reg;
  chart10.options.plugins.arbitraryLine.xPosition = [+c];
  chart10.options.plugins.title.text = `${
    time[c]
  } - Input: ${+c}min - Output: ${time.length - c}min`;
  chart10.data = {
    labels: time,
    datasets: [
      {
        label: "Produktion",
        data: production,
        borderColor: cssvar("--chart1"),
        fill: false,
        cubicInterpolationMode: "monotone",
        tension: 1,
      },
      {
        label: "Regression (Produktion)",
        data: regression,
        borderColor: cssvar("--chart2"),
        fill: false,
        cubicInterpolationMode: "monotone",
        tension: 1,
      },
    ],
  };
  chart10.update();
  btn.html("aktualisieren");
  btn.prop("disabled", false);
}

buildChart10();
