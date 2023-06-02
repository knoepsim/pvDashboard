let chart12;
function getchart12Data() {
  return new Promise((resolve, reject) => {
    $.get(apiUrl + "beta/clouds", function (data) {
      resolve(data); // Resolve with the desired data
    }).fail(function () {
      $("#chart12error").html("Keine Daten verfügbar.");
      reject("Failed to fetch data"); // Reject with an error message
      const btn = $("#chart12-reload");
      btn.html("aktualisieren");
      btn.prop("disabled", false);
    });
  });
}

async function buildchart12() {
  //create chart
  const [timestamp, clouds] = await getchart12Data();
  chart12 = new Chart($("#chart12"), {
    type: "line",
    data: {
      labels: timestamp,
      datasets: [
        {
          label: "Bewölkung",
          data: clouds,
          borderColor: cssvar("--chart1"),
          fill: false,
          cubicInterpolationMode: "monotone",
          tension: 1,
        },
      ],
    },
    options: {
      bezierCurve: true,
      responsive: true,
      plugins: {
        arbitraryLine: {
          arbitraryLineColor: "red",
          xPosition: [],
        },
        // title: {
        //   display: true,
        //   text: "Leistungsübersicht",
        // },
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
          text: "Bewölkung in Prozent",
        },
      },
    },
    plugins: [arbitraryLine], // Plugin registrieren
  });
}

async function updatechart12() {
  const btn = $("#chart12-reload");
  btn.prop("disabled", true);
  btn.html(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>`
  );
  const [timestamp, clouds] = await getchart12Data();
  chart12.data = {
    labels: timestamp,
    datasets: [
      {
        label: "Bewölkung",
        data: clouds,
        borderColor: cssvar("--chart1"),
        fill: false,
        cubicInterpolationMode: "monotone",
        tension: 1,
      },
    ],
  };
  chart12.update();

  btn.html("aktualisieren");
  btn.prop("disabled", false);
}

buildchart12();
