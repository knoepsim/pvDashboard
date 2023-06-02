function clockUpdate() {
  $("#clock").html(dateFormat(new Date(), "H:MM:ss"));

  let date = dateFormat(new Date(), "dd.mm.yyyy");
  if ($("#date").html() != date) $("#date").html(date);
}

clockUpdate();
setInterval(() => {
  clockUpdate();
}, 1000);
