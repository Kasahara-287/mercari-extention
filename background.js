chrome.runtime.onInstalled.addListener(() => {
  console.log("Mercari Scam Detector installed and ready to use.");
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
});
chrome.runtime.onInstalled.addListener(() => {
  console.log("Mercari Scam Detector installed and ready to use.");
});

// この部分はバックエンドで実行されることを想定して書かれています
require('dotenv').config();

const serpApiKey = process.env.SERPAPI_KEY;
const openAiApiKey = process.env.OPENAI_API_KEY;

chrome.runtime.onInstalled.addListener(() => {
    console.log("Mercari Scam Detector installed and ready to use.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getDescription') {
        const { description, imageUrls } = message;

        // SerpApiを使って画像を解析する
        if (imageUrls.length > 0) {
            fetch('https://serpapi.com/images-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serpApiKey}`
                },
                body: JSON.stringify({
                    image_urls: imageUrls,
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log("SerpApi Image Analysis Result:", data);
                sendResponse({ description, imageAnalysis: data });
            })
            .catch(error => {
                console.error("Error in SerpApi request:", error);
                sendResponse({ description, imageAnalysis: null });
            });
        } else {
            sendResponse({ description, imageAnalysis: null });
        }
    }
    return true;
});
