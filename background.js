// Load problems from the selected JSON file based on the user's problem set selection
async function loadProblemsFromSet(problemSet) {
  try {
    // Construct the full path using the assets folder
    const response = await fetch(chrome.runtime.getURL(`assets/${problemSet}`));  
    const problems = await response.json();
    return problems;
  } catch (error) {
    console.error(`Error loading problems from ${problemSet}:`, error);
    throw error;
  }
}

// Apply the redirect rule to block other sites until the problem is solved
const setRedirectRule = async (problemUrl) => {
  const RULE_ID = 1;

  console.log("Applying redirect to:", problemUrl);

  const redirectRule = {
    id: RULE_ID,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: problemUrl },
    },
    condition: {
      urlFilter: "*://*/*",  // Catch any non-LeetCode domains
      excludedInitiatorDomains: ["leetcode.com"],  // Exclude LeetCode itself from the redirect
      resourceTypes: ["main_frame", "sub_frame", "script", "xmlhttprequest"],  // Apply to various request types
    },
  };

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID],
      addRules: [redirectRule],
    });

    console.log("Redirect rule set successfully");
  } catch (error) {
    console.error("Error setting redirect rule:", error);
  }
};

// Randomly assign a LeetCode problem based on user preferences
const handleProblemAssignment = async () => {
  try {
    // Get the saved preferences from storage
    chrome.storage.local.get(["problemSet", "difficulty"], async (data) => {
      const { problemSet, difficulty } = data;

      if (!problemSet) {
        throw new Error("No problem set selected.");
      }

      // Load problems from the selected problem set
      const problems = await loadProblemsFromSet(problemSet);

      // Filter based on difficulty if provided
      const filteredProblems = difficulty === "all" ? problems : problems.filter(problem => problem.difficulty.toLowerCase() === difficulty.toLowerCase());

      if (!filteredProblems || filteredProblems.length === 0) {
        throw new Error("No problems available for the selected difficulty");
      }

      // Select a random problem
      const randomProblem = filteredProblems[Math.floor(Math.random() * filteredProblems.length)];

      console.log("Assigned problem:", randomProblem.text);

      // Set redirect rule to the selected problem
      const problemUrl = randomProblem.href;

      // Mark problem as unsolved
      chrome.storage.local.set({ problemSolved: false, currentProblem: { url: problemUrl } });

      // Apply redirect rule
      await setRedirectRule(problemUrl);
    });
  } catch (error) {
    console.error("Error assigning a problem:", error);
  }
};

// Listen for tab updates and check if the problem is solved
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.local.get(["currentProblem", "problemSolved"], async (storageData) => {
      const currentProblem = storageData.currentProblem;
      const problemSolved = storageData.problemSolved;

      // Check if tab.url is defined and then check if it includes "leetcode.com"
      if (tab.url && !tab.url.includes("leetcode.com") && currentProblem && !problemSolved) {
        console.log("User attempted to leave, redirecting back to:", currentProblem.url);
        chrome.tabs.update(tabId, { url: currentProblem.url });
      }
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received from content script:", message);

  if (message.action === "problemSolved") {
    console.log("Problem solved, removing redirect rule!");

    // Mark the problem as solved in storage
    chrome.storage.local.set({ problemSolved: true });

    // Remove the redirect rule after problem is solved
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1]  // Remove the redirect rule once the problem is solved
    });

    console.log("Redirect rule removed, you can now browse freely.");
  } else {
    console.log("Unrecognized message from content script.");
  }
});


// Set up an alarm to assign problems at set intervals (every 60 minutes)
chrome.alarms.create("leetcodeReminder", { periodInMinutes: 10 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "leetcodeReminder") {
    handleProblemAssignment();  // You can pass difficulty preferences here if needed
  }
});

// Initialize when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  handleProblemAssignment();  // Assign a problem immediately upon installation
});
