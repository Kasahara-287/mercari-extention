document.addEventListener('DOMContentLoaded', () => {
  const analyzeButton = document.getElementById('analyzeButton');
  const resultElement = document.getElementById('result');
  const resultElement2 = document.getElementById('result2');

  analyzeButton.addEventListener('click', async () => {
      try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

          resultElement.textContent = '画像を分析中...';
          resultElement2.textContent = '商品説明を分析中...';
          analyzeButton.disabled = true;

          // Content Script から画像URLを取得
          chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
          }, async () => {
              chrome.tabs.sendMessage(tab.id, { action: 'getImageUrl' }, async (response) => {
                  if (response && response.imageUrl) {
                      const imageUrl = response.imageUrl;
                      const apiKey = 'd6d2a8fcdc3c8928cb0c0b57b0b585a05caa3068464b721e577de12331cfb315'; // あなたのAPIキーに置き換え
                      const searchUrl = `https://www.googleapis.com/customsearch/v1?searchType=image&key=${apiKey}&q=${encodeURIComponent(imageUrl)}`;
                      
                      const apiResponse = await fetch(searchUrl);
                      const searchData = await apiResponse.json();

                      if (searchData && searchData.items && searchData.items.length > 0) {
                          resultElement.innerHTML = `<pre>検索結果: ${searchData.items[0].link}</pre>`;
                      } else {
                          resultElement.textContent = '画像に対する結果が見つかりませんでした';
                      }
                  } else {
                      resultElement.textContent = response.error || '画像が見つかりません';
                  }

                  // 商品説明の分析部分
                  chrome.tabs.sendMessage(tab.id, { action: 'getDescription' }, async (response) => {
                      if (response && response.description) {
                          try {
                              // 1つ目の処理（危険度分析）
                              const result = await analyzeDescriptionForGreeting(response.description);
                              const trustScore = calculateTrustScore(response.rating, response.ratingCount, response.isVerified);
                              if (result) {
                                  resultElement2.innerHTML = `
                                  <pre>${result}</pre>
                                  <h2>信頼度: ${trustScore}</h2>
                                  `;
                              } else {
                                  resultElement2.textContent = '商品説明の分析に失敗しました。';
                              }
                          } catch (error) {
                              console.error("API分析中にエラーが発生しました:", error);
                              resultElement2.textContent = '商品説明の分析に失敗しました。';
                          }
                      } else {
                          resultElement2.textContent = '商品説明が見つかりませんでした。';
                      }

                      analyzeButton.disabled = false;
                  });
              });
          });
      } catch (error) {
          console.error("分析中にエラーが発生しました:", error);
          resultElement.textContent = '画像の分析に失敗しました';
          resultElement2.textContent = '商品説明の分析に失敗しました';
          analyzeButton.disabled = false;
      }
  });
});

// 商品説明をGoogle Reverse Image Search APIで分析する関数
async function analyzeDescriptionForGreeting(description) {
  const apiKey = 'd6d2a8fcdc3c8928cb0c0b57b0b585a05caa3068464b721e577de12331cfb315'; // あなたのAPIキーに置き換え
  const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';

  try {
      const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                  { role: 'user', content: `商品の説明文に基づいて、危険度の可能性を評価してください。商品説明:\n${description}` }
              ],
              max_tokens: 200
          })
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error('API request failed with status:', response.status, 'and message:', errorText);
          return null;
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
  } catch (error) {
      console.error('APIリクエスト中にエラーが発生しました:', error);
      return null;
  }
}

// 信頼度を算出する関数
function calculateTrustScore(rating, ratingCount, isVerified) {
  if (rating !== null && ratingCount !== null) {
      let trustPoints = rating * Math.sqrt(ratingCount);
      
      if (isVerified) {
          trustPoints += 10; // 本人確認済みなら10ポイント加算
      }

      let trustLevel;
      if (trustPoints >= 45) {
          trustLevel = "高";
      } else if (trustPoints >= 25) {
          trustLevel = "中";
      } else {
          trustLevel = "低";
      }
      return trustLevel;
  } else {
      return '不明';
  }
}
