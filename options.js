document.getElementById("savePreferences").addEventListener("click", () => {
  const problemSet = document.getElementById("problemSet").value;
  const difficulty = document.getElementById("difficulty").value;

  // Save the selected problem set and difficulty to chrome storage
  chrome.storage.local.set({ problemSet, difficulty }, () => {
    alert("Preferences saved!");
  });
});

// Load saved preferences when the page loads
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["problemSet", "difficulty"], (data) => {
    if (data.problemSet) document.getElementById("problemSet").value = data.problemSet;
    if (data.difficulty) document.getElementById("difficulty").value = data.difficulty;
  });
});
