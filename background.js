chrome.runtime.onInstalled.addListener(() => {
  console.log("Mercari Scam Detector installed and ready to use.");
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
});

// background.jsでAPIキーを保存
chrome.runtime.onInstalled.addListener(() => {
  const apiKey = "olqg0fgAIftacajXdBcyI2pc1TpyOGGOP0fzdOF7yHVRK0y7uMh9hF6LvpJ0J5TcpbELz6ys6NhBcKKZODQpl3A";  // ここに実際のAPIキーを入力してください
  chrome.storage.local.set({ apikey: apiKey }, () => {
    console.log('APIキーが正常に保存されました');
  });
});
chrome.runtime.onInstalled.addListener(() => {
  console.log("拡張機能がインストールされました！");
});

// ボタンがクリックされた時の処理
chrome.action.onClicked.addListener((tab) => {
  console.log("アクションボタンがクリックされました！", tab);
});

