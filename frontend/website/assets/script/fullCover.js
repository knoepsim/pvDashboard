checkDB().then((dbStatus) => {
  const checkForCoverRemove = setInterval(() => {
    if (
      dbStatus === "OK" &&
      chart1 !== undefined &&
      chart10 !== undefined &&
      (chart11 !== undefined ||
        $("#chart11error").html() == "Keine Daten verfügbar.") &&
      (chart12 !== undefined ||
        $("#chart12error").html() == "Keine Daten verfügbar.") &&
      $("#updateTime").html() != "" &&
      $("#batteryPercent").html() != "⌛ %"
    ) {
      clearInterval(checkForCoverRemove);
      setTimeout(() => {
        removeFullCover();
      }, 200);
    }
    if (dbStatus === "OK") {
      $("#cover1").html("✅");
    } else if (dbStatus === 404) {
      $("#cover1").html("❌");
    }
    if ($("#batteryPercent").html() != "⌛ %") {
      $("#cover2").html("✅");
    }
    if (chart11 !== undefined) {
      $("#cover3").html("✅");
    } else if ($("#chart11error").html() == "Keine Daten verfügbar.") {
      $("#cover3").html("❌");
    }
    if (
      chart1 !== undefined &&
      chart10 !== undefined &&
      (chart11 !== undefined ||
        $("#chart11error").html() == "Keine Daten verfügbar.") &&
      (chart12 !== undefined ||
        $("#chart12error").html() == "Keine Daten verfügbar.") 
    ) {
      $("#cover4").html("✅");
    }
  }, 100);
});

function removeFullCover() {
  $("#fullcover").css("opacity", "0");
  setTimeout(() => {
    $("#fullcover").css("display", "none");
  }, 500);
}
