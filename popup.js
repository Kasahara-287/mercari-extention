  document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyzeButton');
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
                  resultElement.textContent = 'Failed to analyze description.';
                }
  
                // 2つ目の処理（商品情報取得）
                const result2 = await getProductInfo(response.title, response.description);
                if (result2) {
                  resultElement2.innerHTML = `<pre>${result2}</pre>`;
                } else {
                  resultElement2.textContent = 'Failed to analyze description.';
                }
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
  });




async function getProductInfo(title, description) {
  const apiKey = 'olqg0fgAIftacajXdBcyI2pc1TpyOGGOP0fzdOF7yHVRK0y7uMh9hF6LvpJ0J5TcpbELz6ys6NhBcKKZODQpl3A';
  const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';

  const prompt = `商品のタイトル: ${title}\n商品の説明文: ${description}\nこの商品の正式名称、定価、商品説明を提供してください。注意書き、前置きなどは必要としません。定価、商品説明はネットから引用してきてください。定価に関しては簡潔に数字のみで前置き、注意書きなどは記載しないで回答してください。
  価格については価格.com(https://kakaku.com/)というサイトの情報を最優先で参照してください。このサイトに情報がない場合は公式サイト、amazon、楽天などといったサイトから情報を取得してください。特定できる情報が取得できなければ(情報不足により不明)と出力してください。
  またフォーマットは以下の通りです
  商品名:
  
  定価:
  
  商品説明:(出力した文字数が枠組みに合うようにうまく改行してください)
  `;

  const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
          model: 'gpt-4o-mini',
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

// OpenAI API にリクエストを送信する関数
async function analyzeDescriptionForGreeting(description) {

  apiKey='olqg0fgAIftacajXdBcyI2pc1TpyOGGOP0fzdOF7yHVRK0y7uMh9hF6LvpJ0J5TcpbELz6ys6NhBcKKZODQpl3A'
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
        messages: [{ role: 'user', content:  `あなたはメルカリで売られている商品が危険かどうかを判別し購入を控えるべきか否かを判断するAIです。以下の商品説明文に基づいて危険度の可能性を評価してください。ただし、商品画像や販売者の信頼性も考慮し、画像が不足している場合や、説明文が不十分な場合はそのことも評価に反映してください。
危険度は基本低めで、文章がいびつであったり、詐欺または悪意があると思わしき用語がある場合はパーセンテージを上げてください。また、説明文に「箱のみ」「本体は付属しません」などといった箱だけを送って本体を送らないような詐欺も存在するため、そのような文言が見受けられた場合には危険度を高めてください。また写真読み込み機能はないため、写真については言及しないでください。
危険度が(0%-40%)の際は危険度:低、(41%-70%)では危険度:中、(71%-100%)では危険度:高と表記してください。
出力は次の形式でお願いします：

[危険度:高,危険度:中,危険度:低]

[箇条書きでリスクを列挙]

理由: [リスクに対する理由を簡潔に説明](出力した文字数が枠組みに合うようにうまく改行してください)

商品説明:
${description}
`  }],
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed with status:', response.status, 'and message:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('API response:', data);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error during API request:', error);
    return null;
  }
}

