chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkImageExistence",
    title: "Check if image exists online",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "checkImageExistence") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: checkImageExistence,
      args: [info.srcUrl]
    });
  }
});

async function checkImageExistence(imageUrl) {
  const response = await fetch("https://api.openai.iniad.org/check_image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ imageUrl: imageUrl })
  });

  const data = await response.json();
  alert(data.message);
}
