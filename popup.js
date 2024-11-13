
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
              // 1つ目の処理（信頼度分析）
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

  apiKey='olqg0fgAIftacajXdBcyI2pc1TpyOGGOP0fzdOF7yHVRK0y7uMh9hF6LvpJ0J5TcpbELz6ys6NhBcKKZODQpl3A'
  const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';
  
  try {
    const message = `あなたはメルカリで売られている商品が危険かどうかを判別し購入を控えるべきか否かを判断するAIです。以下の商品名、商品説明文、またメインの商品画像に基づいて商品購入についての危険度(詐欺の可能性があるか、不当な取引であるか、等)を評価してください。

危険度が(0%-40%)の際は危険度:低、(41%-70%)では危険度:中、(71%-100%)では危険度:高と表記してください。
以下が、商品を解析する際の条件です。    
1,危険度は基本低めで設定してください。
2,商品説明文において、文章がいびつであったり、詐欺または悪意があると思わしき用語がある場合は危険度を上げてください。また、説明文に「箱のみ」「本体は付属しません」などといった箱だけを送って本体を送らないような詐欺も存在するため、そのような文言が見受けられた場合にはさらに危険度を高めてください。
3,商品画像については、商品説明で述べられていることとの差異や、詐欺または悪意などが見受けられる場合はより危険度を挙げてください。画像と商品説明文の差異が大きい場合、危険度：中以上まで大きく危険度を挙げてください。
4,また、商品画像の詳細についても分析し述べてください。何が写っているか、どんなものかをわかりやすく記述してください。（どんな物体か、どんな色か、等）
5,「無言取引NG」等の文言があった場合は、他フリマサイトと取引を同時に行っている可能性があります。その場合は「他サイトにも出品している可能性があり、取引時のトラブルに発展しやすい」と記載し、危険度を上げてください。
6,「無言取引NG」等の文言がなかった場合に無言取引等に関する文章の記載は一切しないでください。「無言取引NG」等の文言がないというのはリスクにはなりません。またそれらの文言はないのが当たり前であるため、ないからと言って危険度を下げる、またはそれについての記述はしないでください。
7,できるだけ詳しく記載してください。
8,文章は一画面で収まるように約30文字で必ず改行を加えてください。
また、出力は次の形式でお願いします：

[商品の危険度： 高,商品の危険度： 中,商品の危険度： 低]

画像： [画像についての解析結果(何が写っているか、どのようなものか)を詳しく標示 文字などが書いている場合書き起こしてください。]

リスク： [箇条書きでリスクを列挙]

理由： [リスクに対する理由を簡潔に説明](出力した文字数が枠組みに合うようにうまく改行してください)

商品名:
${title}
商品説明:
${description}

画像URL:
${imageUrls}
`;
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ 
          role: 'user',
          content: message
         }],
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

// フォーマットして結果を表示する関数
async function formatAndDisplayResult(aiResponse, trustScore, trustClass) {
  const resultContainer = document.getElementById('result');

  // 正規表現で各セクションを抽出
  const riskLevel = aiResponse.match(/商品の危険度：\s*(高|中|低)/)?.[0] || '不明';
  const imageAnalysis = aiResponse.match(/画像：\s*([\s\S]*?)リスク：/)?.[1] || '情報がありません';
  const risks = aiResponse.match(/リスク：\s*([\s\S]*?)理由：/)?.[1]?.split('\n') || ['リスクが見つかりません'];
  const reason = aiResponse.match(/理由：\s*([\s\S]*)/)?.[1] || '理由の記載がありません';

  // 色を設定するクラスを riskLevel に基づいて設定
  let riskColorClass = '';
  if (riskLevel.includes('高')) {
    riskColorClass = 'high-risk';
  } else if (riskLevel.includes('中')) {
    riskColorClass = 'medium-risk';
  } else if (riskLevel.includes('低')) {
    riskColorClass = 'low-risk';
  }

 // HTML形式で整形
 const formattedHTML = `
 <h2 class="${riskColorClass}">${riskLevel}</h2>
 <h2 class="${trustClass}">出品者の信頼度： ${trustScore}</h2>
 <h3>画像解析結果</h3>
 <p>${imageAnalysis}</p>
 <h3>リスクの詳細</h3>
 <ul>
   ${risks.map(risk => `<li>${risk}</li>`).join('')}
 </ul>
 <h3>理由</h3>
 <p>${reason}</p>
`;

// 結果をHTMLとして表示
const resultElement = document.getElementById('result')
resultContainer.innerHTML = formattedHTML;

}