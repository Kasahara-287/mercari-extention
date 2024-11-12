
let scamPhrases = [];

// CSVファイルを読み込んで詐欺構文リストを生成
async function loadScamPhrases() {
  const response = await fetch('model2.csv'); // ファイルパスを指定
  const csvData = await response.text();

  // 各行を配列に分割
  scamPhrases = csvData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
}

// この関数を最初に実行して詐欺構文リストを読み込む
loadScamPhrases();

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
              const result = await analyzeDescriptionForGreeting(response.description, response.imageUrls, response.title);
              const trustScore = calculateTrustScore(response.rating, response.ratingCount, response.isVerified);
              
              let trustClass = '';
              if (trustScore === '高') {
                trustClass = 'high-trust';
              } else if (trustScore === '中') {
                trustClass = 'medium-trust';
              } else if (trustScore === '低') {
                trustClass = 'low-trust';
              }
              
              if (result) {
                formatAndDisplayResult(result, trustScore, trustClass);
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
  価格については価格.com(https://kakaku.com/)というサイトの情報を最優先で参照してください。このサイトに情報がない場合は公式サイト、amazon(https://www.amazon.co.jp/)、楽天(https://www.rakuten.co.jp/)などといったサイトから情報を取得してください。特定できる情報が取得できなければ(情報不足により不明)と出力してください。
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
async function analyzeDescriptionForGreeting(description, imageUrls, title) {
  const apiKey = 'YOUR_API_KEY';
  const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';

  // 詐欺構文の検出
  let scamRiskLevel = "低";
  let detectedPhrases = [];

  // 商品説明に詐欺構文が含まれているかをチェック
  scamPhrases.forEach(phrase => {
    if (description.includes(phrase)) {
      scamRiskLevel = "高"; // 詐欺構文が見つかったら危険度を「高」に設定
      detectedPhrases.push(phrase);
    }
  });

  const message = `
    あなたはメルカリで売られている商品が詐欺の可能性があるかどうかを判別し、購入を控えるべきかを判断するAIです。
    以下の商品名、商品説明文、メインの商品画像に基づき、詐欺のリスクと危険度を評価してください。

    危険度が(0%-40%)の際は「危険度:低」、(41%-70%)では「危険度:中」、(71%-100%)では「危険度:高」としてください。
    検出された詐欺構文があった場合は危険度を高めてください。

    **商品情報**  
    - 商品名: ${title}  
    - 商品説明: ${description}  
    - 検出された詐欺構文: ${detectedPhrases.join(", ")}  
    - 初期危険度: ${scamRiskLevel}

    **商品画像**  
    ${imageUrls}

    **リスク評価の基準**  
    - 商品説明文に不自然な文章や詐欺と考えられる表現がある場合、危険度を上げてください。
    - 詐欺の疑いがある「箱のみ」「本体なし」などの文言がある場合も危険度を高めてください。
    - 商品画像が説明文と異なる場合や、不明瞭な点がある場合は危険度を「中」以上に設定してください。
    - 「無言取引NG」などのフレーズがある場合、他サイトにも出品している可能性があるため、危険度を上げてください。

    なお、出力は次の形式でお願いします：

    - 危険度： [高, 中, 低]
    - 画像： [画像についての分析結果]
    - リスク： [リスクを箇条書きで記載]
    - 理由： [リスクに対する理由を簡潔に記載]
  `;

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: message }],
        max_tokens: 350
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
