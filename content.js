chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDescription') {
    const descriptionElement = document.querySelector('pre[data-testid="description"]');
    if (descriptionElement) {
      const description = descriptionElement.textContent.trim();
      console.log("Description found:", description);
      sendResponse({ description: description });
    } else {
      console.error("Description element not found.");
      sendResponse({ description: null });
    }
  }
  return true; // 非同期で sendResponse を使用するため
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getDescription') {
    const { title, description } = extractProductDetails();
    sendResponse({ title, description });
  }
});