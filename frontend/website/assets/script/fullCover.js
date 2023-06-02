checkDB().then((dbStatus) => {
  const checkForCoverRemove = setInterval(() => {
    if (
      dbStatus === "OK" &&
      chart1 !== undefined &&
      chart10 !== undefined &&
      chart11 !== undefined &&
      chart12 !== undefined &&
      $("#updateTime").html != "" &&
      $("#batteryPercent").html != "⌛ %"
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
    if ($("#batteryPercent").html != "⌛ %") {
      $("#cover2").html("✅");
    }
    if (
      chart1 !== undefined &&
      chart10 !== undefined &&
      chart11 !== undefined &&
      chart12 !== undefined
    ) {
      $("#cover3").html("✅");
    }
  }, 100);
});

function removeFullCover() {
  $("#fullcover").css("opacity", "0");
  setTimeout(() => {
    $("#fullcover").css("display", "none");
  }, 500);
}
