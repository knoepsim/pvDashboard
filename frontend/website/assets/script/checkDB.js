function checkDB() {
  return new Promise((resolve, reject) => {
    $.get(apiUrl + `test`, function (data) {
      resolve(data);
    }).fail(function () {
      resolve(404);
    });
  });
}
