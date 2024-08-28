document.addEventListener('DOMContentLoaded', () => {
  const analyzeButton = document.getElementById('analyzeButton');
  const resultElement = document.getElementById('result');
  const resultElement2 = document.getElementById('result2');
  const imageResultsElement = document.getElementById('imageResults');

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
                          const trustScore = calculateTrustScore(response.rating, response.ratingCount, response.isVerified);
                          if (result) {
                              resultElement.innerHTML = `
                              <pre>${result}</pre>
                              <h2>信頼度: ${trustScore}</h2>
                              `;
                          } else {
                              resultElement.textContent = 'Failed to analyze description.';
                          }

                          // 2つ目の処理（商品情報取得）
                          const result2 = await getProductInfo(response.title, response.description);
                          if (result2) {
                              resultElement2.innerHTML = `<pre>${result2}</pre>`;
                          } else {
                              resultElement2.textContent = 'Failed to analyze description.';
                          }
                          
                          // 3つ目の処理（自動画像検索）
                          await searchImages(response.description.split(' ')[0]);

                      } catch (error) {
                          console.error("Error during API analysis:", error);
                          resultElement.textContent = 'Failed to analyze description.';
                          resultElement2.textContent = 'Failed to analyze description.';
                      }
                  } else {
                      resultElement.textContent = 'Failed to get description.';
                      resultElement2.textContent = 'Failed to get description.';
                  }
                  analyzeButton.disabled = false;
              });
          });
      } catch (error) {
          console.error("Error during analysis:", error);
          resultElement.textContent = 'Failed to get description.';
          resultElement2.textContent = 'Failed to get description.';
          analyzeButton.disabled = false;
      }
  });

  async function searchImages(query) {
      imageResultsElement.textContent = '画像を検索中...';
      const serpApiKey = 'YOUR_SERPAPI_KEY'; // SerpApiのAPIキーを使用します

      try {
          const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google_images&ijn=0&api_key=${serpApiKey}`);
          const data = await response.json();
          const images = data.images_results;

          imageResultsElement.innerHTML = '';
          images.forEach(image => {
              const imgElement = document.createElement('img');
              imgElement.src = image.thumbnail;
              imgElement.alt = query;
              imgElement.style.maxWidth = '100px';
              imgElement.style.margin = '5px';
              imageResultsElement.appendChild(imgElement);
          });
      } catch (error) {
          console.error("Error fetching images:", error);
          imageResultsElement.textContent = '画像の取得に失敗しました。';
      }
  }
});
