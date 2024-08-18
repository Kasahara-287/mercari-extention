document.addEventListener('DOMContentLoaded', () => {


  const analyzeButton2 = document.getElementById('analyzeButton2');
  const resultElement2 = document.getElementById('result2');

  analyzeButton2.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      resultElement2.textContent = 'Analyzing...';
      analyzeButton2.disabled = true;
      

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, async () => {
        chrome.tabs.sendMessage(tab.id, { action: 'getDescription' }, async (response) => {
          if (response && response.description) {
            try {
              const result = await getProductInfo(response.title, response.description);
              if (result) {
                resultElement2.innerHTML = `<pre>${result}</pre>`;
              } else {
                resultElement2.textContent = 'Failed to analyze description.';
              }
            } catch (error) {
              console.error("Error during API analysis:", error);
              resultElement2.textContent = 'Failed to analyze description.';
            }
          } else {
            resultElement2.textContent = 'Failed to get description.';
          }
          analyzeButton2.disabled = false;
        });
      });
    } catch (error) {
      console.error("Error during analysis:", error);
      resultElement2.textContent = 'Failed to get description.';
      analyzeButton2.disabled = false;
    }
  });
});



async function getProductInfo(title, description) {
  const apiKey = 'olqg0fgAIftacajXdBcyI2pc1TpyOGGOP0fzdOF7yHVRK0y7uMh9hF6LvpJ0J5TcpbELz6ys6NhBcKKZODQpl3A';
  const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';

  const prompt = `商品のタイトル: ${title}\n商品の説明文: ${description}\nこの商品の正式名称、定価、商品説明を提供してください。注意書き、前置きなどは必要としません。定価、商品説明はネットから引用してきてください。定価に関しては簡潔に数字のみで前置き、注意書きなどは記載しないで回答してください。またその価格はAmazonや楽天などのサイトを参考にしてください`;

  const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
          model: 'gpt-4',
          messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: prompt }
          ]
      })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// メルカリページからタイトルと説明文を取得
function extractProductDetails() {
  const titleElement = document.querySelector('.item-title'); // タイトルのセレクタ
  const descriptionElement = document.querySelector('.item-description'); // 説明文のセレクタ

  const title = titleElement ? titleElement.textContent : '';
  const description = descriptionElement ? descriptionElement.textContent : '';

  return { title, description };
}

// 商品情報を表示する関数
async function displayProductInfo() {
  const { title, description } = extractProductDetails();

  if (title && description) {
      const productInfo = await getProductInfo(title, description);
      console.log('商品情報:', productInfo);

      // 商品情報をページに表示
      const productInfoElement = document.createElement('div');
      productInfoElement.innerText = productInfo;
      document.body.appendChild(productInfoElement);
  } else {
      console.log('商品情報を取得できませんでした。');
  }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
  displayProductInfo();
});