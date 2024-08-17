chrome.runtime.onInstalled.addListener(() => {
  console.log("Mercari Scam Detector installed and ready to use.");
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
});