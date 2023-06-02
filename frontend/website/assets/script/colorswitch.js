function colorSwitch() {
  let theme = localStorage.getItem("theme");
  if (theme == null) {
    theme = "dark";
  } else if (theme == "bright") {
    localStorage.setItem("theme", "dark");
  } else if (theme == "dark") {
    localStorage.setItem("theme", "bright");
  } else {
    localStorage.setItem("theme", "bright");
    console.log("color switch error: local storage");
  }
  colorUpdate();
}

function colorUpdate() {
  let theme = localStorage.getItem("theme");
  if (theme == "bright") {
    // wenn dunkel dann hell machen
    document.documentElement.style.setProperty("--main-bg-color", "white");
    document.documentElement.style.setProperty("--primary", "black");
    document.documentElement.style.setProperty("--secondary", "#696969");
    document.documentElement.style.setProperty("--head", "#5727b0");
    document.documentElement.style.setProperty("--outline", "#9c27b0");
    document.documentElement.style.setProperty("--table", "#1460aa");
    document.documentElement.style.setProperty("--chart1", "#5727b0");
    document.documentElement.style.setProperty("--chart2", "#1b7742");
    $("#lightToggler").html("🌙");
  } else if (theme == "dark") {
    // sonst ist es hell, dann dunkel machen
    document.documentElement.style.setProperty("--main-bg-color", "#171717");
    document.documentElement.style.setProperty("--primary", "#ededed");
    document.documentElement.style.setProperty("--secondary", "#edededa9");
    document.documentElement.style.setProperty("--head", "#9c27b0");
    document.documentElement.style.setProperty("--outline", "#57abdc80");
    document.documentElement.style.setProperty("--table", "#5727b094");
    document.documentElement.style.setProperty("--chart1", "#5727B0");
    document.documentElement.style.setProperty("--chart2", "#1b7742");
    $("#lightToggler").html("💡");
  } else {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      console.log("Browser Dark Mode detected");
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "bright");
    }
    colorUpdate();
  }
}

colorUpdate();

function fixColorSwitchButton() {
  let theme = JSON.parse(localStorage.getItem("theme"));
  if (theme == true) {
    $("#lightToggler").html("🌙");
  } else if (theme == false) {
    $("#lightToggler").html("💡");
  }
}
