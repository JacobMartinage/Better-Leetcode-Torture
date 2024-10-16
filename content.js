// Function to check the network response for submission success
function checkSubmissionStatus(response) {
  const statusMessage = response.status_msg;

  if (statusMessage && statusMessage === "Accepted") {
    console.log("Problem solved successfully!");

    // Send a message to the background script indicating the problem is solved
    chrome.runtime.sendMessage({ action: "problemSolved" });
  }
}

// Intercept network requests
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes("/check/")) {
      fetch(details.url)
        .then((response) => response.json())
        .then((data) => checkSubmissionStatus(data))
        .catch((error) => console.error("Error checking submission status:", error));
    }
  },
  { urls: ["*://leetcode.com/submissions/detail/*/check/*"] }
);

console.log("Content script loaded and observing network requests.");
