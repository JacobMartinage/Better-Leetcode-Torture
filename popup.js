document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("currentProblem", (data) => {
    if (data.currentProblem) {
      document.getElementById("problemLink").href = data.currentProblem.url;
      document.getElementById("problemLink").innerText = data.currentProblem.name;
    } else {
      document.getElementById("problemLink").innerText = "No problem assigned.";
    }
  });
});
