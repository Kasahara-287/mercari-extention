
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
  const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';

  const prompt = `商品のタイトル: ${title}\n商品の説明文: ${description}\nこの商品の正式名称、定価、商品説明を提供してください。注意書き、前置きなどは必要としません。定価、商品説明はネットから引用してきてください。定価に関しては簡潔に数字のみで前置き、注意書きなどは記載しないで回答してください。
  価格については価格.com(https://kakaku.com/)というサイトの情報を最優先で参照してください。このサイトに情報がない場合は公式サイト、amazon(https://www.amazon.co.jp/)、楽天(https://www.rakuten.co.jp/)などといったサイトから情報を取得してください。特定できる情報が取得できなければ(情報不足により不明)と出力してください。
  またフォーマットは以下の通りです
  商品名:
  
  定価:
  
  商品説明:(出力した文字数が枠組みに合うようにうまく改行してください)
  `;

  return new Promise((resolve, reject) => {
    // `chrome.storage.local`からAPIキーを取得
    chrome.storage.local.get('apikey', async (result) => {
      const apiKey = result.apikey;
      if (!apiKey) {
        console.error('APIキーが取得できませんでした');
        reject('APIキーが取得できませんでした');
        return;
      }

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
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: prompt }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API request failed with status:', response.status, 'and message:', errorText);
          reject(errorText);
          return;
        }

        const data = await response.json();
        resolve(data.choices[0].message.content);
      } catch (error) {
        console.error('Error during API request:', error);
        reject(error);
      }
    });
  });
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

// OpenAI APIにリクエストを送信する関数
async function analyzeDescriptionForGreeting(description, imageUrls, title) {
  const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';

  // 非同期でAPIキーを取得
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('apikey', async (result) => {
      if (!result.apikey) {
        console.error('APIキーが取得できませんでした');
        reject('APIキーが取得できませんでした');
        return;
      }

      const apiKey = result.apikey;
      const message = `あなたはメルカリで売られている商品が危険かどうかを判別し購入を控えるべきか否かを判断するAIです。以下の商品名、商品説明文、またメインの商品画像に基づいて商品購入についての危険度(詐欺の可能性があるか、不当な取引であるか、等)を評価してください。
次の手順に沿って解析を進めてください。
1,商品説明文を解析する。
2,商品画像を解析する。
3,解析結果をもとに危険度を算出する。
以下が、商品説明を解析する際の条件です。    
1,「無言取引NG」等の文言があった場合は、他フリマサイトと取引を同時に行っている可能性があります。その場合は「他サイトにも出品している可能性があり、取引時のトラブルに発展しやすい」と記載し、危険度を上げてください。
2,「無言取引NG」等の文言がなかった場合に無言取引等に関する文章の記載は一切しないでください。「無言取引NG」等の文言がないというのはリスクにはなりません。またそれらの文言はないのが当たり前であるため、ないからと言って危険度を下げる、またはそれについての記述はしないでください。
3,商品説明文において、文章がいびつであったり、詐欺または悪意があると思わしき用語がある場合は危険度を上げてください。また、説明文に「箱のみ」「本体は付属しません」などといった箱だけを送って本体を送らないような詐欺も存在するため、そのような文言が見受けられた場合にはさらに危険度を高めてください。
以下が、商品画像を解析する際の条件です。
1,まず、どのような商品が写っているか記載してください。（モノ、色、形、など）
2,商品画像のみから読み取れないことについては記載しないでください。
3,写っているものについて、商品説明で述べられていることとの差異や、詐欺または悪意などが見受けられる場合はより危険度を挙げてください。画像と商品説明文の差異が大きい場合、危険度：中以上まで大きく危険度を挙げてください。
以下が、危険度を算出する際の条件です。
1,危険度が(0%-40%)の際は危険度:安心、(41%-70%)では危険度:少し注意、(71%-100%)では危険度:リスクありと表記してください。
2,危険度は基本低めで設定してください。
3,できるだけ詳しく記載してください。
以下の[]で囲まれてる文章が詐欺によく使われている文章です。これを詐欺によく使われる文と定義しました。また含まれた場合は危険度にも反映させてください。
[
 [早い者勝ち！今だけ○○円！」
「事情があって急いで売ります」
「新品同様！一度も使用していません！」
「返品・返金は一切受け付けません」
「正規品ですが、箱はありません」
「動作確認していませんが動くと思います」
「支払いは外部の○○アプリでお願いします」
「取引後、評価前に連絡ください」
「コメント欄で直接取引を希望」
「高額なものですが格安でお譲りします」
「発送は○○日後になります」
「詳しい写真はお見せできません」
「付属品はありませんが本体のみで十分です」
「出品者都合でキャンセルする場合があります」
「新品未開封（実物写真なし）」
「撮影のために箱を開けただけ」
「動作確認済みですが保証はありません」
「購入前に必ずコメントください」
「高額商品ですが現金で取引したい」
「ブランド品のため早くお買い求めください」
「非正規ルートで手に入れた商品です」
「購入後に詳細をお知らせします」
「数量限定での出品」
「アカウントが停止されるかもしれないので早めに」
「こちらの指定する方法で受け取りをお願いします」
「家族が使わなくなったものです」
「知人から譲ってもらいました」
「商品の詳細は問い合わせてください」
「一度きりの出品です」
「クーポンが利用できません」
「購入後すぐに評価してください」
「この価格で購入できるのは今だけ」
「理由は言えませんが格安です」
「特別価格でお譲りします」
「家電ですが説明書や保証書はありません」
「商品は友人からの預かりものです」
「購入後はノークレーム・ノーリターンで」
「直接会って取引をしたい」
「写真はイメージです」
「状態は良好ですが詳細は不明です」
「別のサイトにも出品しているため在庫確認を」
「早急に対応していただける方のみ」
「即日発送をお約束します（条件あり）」
「メルカリではなく直接銀行振込を希望」
「○○ポイント付きでお得！」

]


また、出力は次の形式でお願いします：

[商品の危険度： リスクあり,商品の危険度： 少し注意,商品の危険度： 安心]

リスク： [箇条書きでリスクを列挙]

詐欺によく使われる文： [箇条書きで詐欺構文を列挙]

理由： [リスクに対する理由を簡潔に説明](出力した文字数が枠組みに合うようにうまく改行してください)

画像： [画像についての解析結果(何が写っているか、どのようなものか)を詳しく標示 文字などが書いている場合書き起こしてください。]

商品名:
${title}
商品説明:
${description}

画像URL:
${imageUrls}
`; // メッセージ部分は省略しています

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
            max_tokens: 500
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('APIリクエストが失敗しました:', response.status, 'メッセージ:', errorText);
          reject(errorText);
        }

        const data = await response.json();
        resolve(data.choices[0].message.content.trim());
      } catch (error) {
        console.error('APIリクエスト中にエラーが発生しました:', error);
        reject(error);
      }
    });
  });
}

// フォーマットして結果を表示する関数
// フォーマットして結果を表示する関数
async function formatAndDisplayResult(aiResponse, trustScore, trustClass) {
  const resultContainer = document.getElementById('result');

  // 正規表現で各セクションを抽出
  const riskLevel = aiResponse.match(/商品の危険度：\s*(リスクあり|少し注意|安心)/)?.[0] || '不明';
  const risks = aiResponse.match(/リスク：\s*([\s\S]*?)詐欺によく使われる文：/)?.[1]
    ?.split('\n')
    .map(risk => risk.replace(/^-/, '').trim()) // 文頭の '-' を削除してトリム
    .filter(risk => risk !== '') || ['リスクが見つかりません'];
  const koubunns = aiResponse.match(/詐欺によく使われる文：\s*([\s\S]*?)理由：/)?.[1] 
    ?.split('\n')
    .map(koubunn => koubunn.replace(/^-/, '').trim()) // 文頭の '-' を削除してトリム
    .filter(koubunn => koubunn !== '') || ['特に説明文の記載に問題はありませんでした'];
  const reason = aiResponse.match(/理由：\s*([\s\S]*?)画像：/)?.[1] || '理由の記載がありません';
  const imageAnalysis = aiResponse.match(/画像：\s*([\s\S]*)/)?.[1] || '情報がありません';

  // 色を設定するクラスを riskLevel に基づいて設定
  let riskColorClass = '';
  if (riskLevel.includes('リスクあり')) {
    riskColorClass = 'high-risk';
  } else if (riskLevel.includes('少し注意')) {
    riskColorClass = 'medium-risk';
  } else if (riskLevel.includes('安心')) {
    riskColorClass = 'low-risk';
  }

  // HTML形式で整形
  const formattedHTML = `
    <h2 class="${riskColorClass}">${riskLevel}</h2>
    <h2 class="${trustClass}">出品者の信頼度： ${trustScore}</h2>
    <h3>リスクの詳細</h3>
    <ul>
      ${risks.map(risk => `<li>${risk}</li>`).join('')}
    </ul>
    <h3>詐欺によく使われる文</h3>
    <ul>
      ${koubunns.map(koubunn => `<li>${koubunn}</li>`).join('')}
    </ul>
    <h3>理由</h3>
    <p>${reason}</p>
    <h3>画像解析結果</h3>
    <p>${imageAnalysis}</p>
  `;

  resultContainer.innerHTML = formattedHTML;
}
