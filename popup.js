document.addEventListener('DOMContentLoaded', () => {
  const analyzeButton = document.getElementById('analyzeButton');
  const searchImageButton = document.getElementById('searchImageButton'); // 画像検索ボタンの取得
  const resultElement = document.getElementById('result');
  const resultElement2 = document.getElementById('result2');

  analyzeButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      resultElement.textContent = '読み込み中です';
      resultElement2.textContent = '読み込み中です';
      analyzeButton.disabled = true;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, async () => {
        chrome.tabs.sendMessage(tab.id, { action: 'getDescription' }, async (response) => {
          if (response && response.description) {
            try {
              // 1つ目の処理（危険度分析）
              const result = await analyzeDescriptionForGreeting(response.description);
              if (result) {
                resultElement.innerHTML = `<pre>${result}</pre>`;
              } else {
                resultElement.textContent = '危険度の分析に失敗しました。';
              }

              // 2つ目の処理（商品情報取得）
              const result2 = await getProductInfo(response.title, response.description);
              if (result2) {
                resultElement2.innerHTML = `<pre>${result2}</pre>`;
              } else {
                resultElement2.textContent = '商品情報の取得に失敗しました。';
              }
            } catch (error) {
              console.error("API分析中のエラー:", error);
              resultElement.textContent = '分析に失敗しました。';
              resultElement2.textContent = '分析に失敗しました。';
            }
          } else {
            resultElement.textContent = '説明文の取得に失敗しました。';
            resultElement2.textContent = '説明文の取得に失敗しました。';
          }
          analyzeButton.disabled = false;
        });
      });
    } catch (error) {
      console.error("分析中のエラー:", error);
      resultElement.textContent = '分析に失敗しました。';
      resultElement2.textContent = '分析に失敗しました。';
      analyzeButton.disabled = false;
    }
  });

  // 画像検索ボタンのクリックイベントを追加
  searchImageButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        chrome.tabs.sendMessage(tab.id, { action: 'getDescription' }, (response) => {
          if (response && response.title) {
            const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(response.title)}`;
            chrome.tabs.create({ url: searchUrl });
          } else {
            console.error("商品タイトルの取得に失敗しました。");
          }
        });
      });
    } catch (error) {
      console.error("画像検索中のエラー:", error);
    }
  });
});
