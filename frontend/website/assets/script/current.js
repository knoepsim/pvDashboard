// CURRENT TABLE AND BATTERY PERCENTAGE

function currentData() {
  $.get(apiUrl + "current", function (data) {
    // console.log(data);

    const hausverbrauch = data[0].Consumption_W * 1;
    const produktion = data[0].Production_W * 1; // *1 to get integer

    const batterieleistung = data[0].Pac_total_W * 1;
    //batterieleistung = Pac_total_W
    //>0 ladung
    //<0 entladung
    let ladung = 0;
    let entladung = 0;
    if (batterieleistung > 0) {
      ladung = batterieleistung;
    } else {
      entladung = -batterieleistung;
    }

    const netzleistung = data[0].GridFeedIn_W * 1;
    // Netzleistung
    //>0 Verkauf
    //<0 Bezug
    let verkauf = 0;
    let bezug = 0;
    if (netzleistung > 0) {
      verkauf = netzleistung;
    } else {
      bezug = -netzleistung;
    }

    const gesammt = hausverbrauch + verkauf + ladung;

    const sources = [
      {
        name: "Netz",
        value: bezug,
      },
      { name: "Produktion", value: produktion },
      { name: "Batterie", value: ladung },
    ];
    sources.sort((b, a) => a.value - b.value);

    let sources_html = "<tr><th>Quellen</th><th>Leistung [W]</th></tr>";
    sources.forEach((e) => {
      sources_html +=
        "<tr><td>" + e["name"] + "</td><td>" + e["value"] + "</td></tr>";
    });
    sources_html += "<tr><th>Gesammt</th><th>" + gesammt + "</th></tr>";
    $("#sources").html(sources_html);

    const consumer = [
      {
        name: "Netz",
        value: verkauf,
      },
      { name: "Haushalt", value: hausverbrauch },
      { name: "Batterie", value: entladung },
    ];
    consumer.sort((b, a) => a.value - b.value);

    let consumer_html = "<tr><th>Verbraucher</th><th>Leistung [W]</th></tr>";
    consumer.forEach((e) => {
      consumer_html +=
        "<tr><td>" + e["name"] + "</td><td>" + e["value"] + "</td></tr>";
    });
    consumer_html += "<tr><th>Gesammt</th><th>" + gesammt + "</th></tr>";
    $("#consumer").html(consumer_html);



    $("#updateTime").html("(Stand: " + moment(new Date(data[0].Timestamp).getTime()-2*3600000 ).format("DD.MM.YYYY [um] HH:mm:ss") + ")");
    //update Battery
    updateBattery(data[0].USOC);
  }).fail(function () {
    console.log("Error");
    document.getElementById("current").innerHTML = "<p>Error</p>";
    return;
  });
}

function updateBattery(value) {
  $("#batteryPercent").html(value + "%");
  $("#batteryLevel").css("width", map(value, 0, 100, 0, 150));
  $("#batteryLevel").css("background-color", getBatteryFillColor(value));
}

currentData();
setInterval(() => {
  currentData();
}, 10000);
