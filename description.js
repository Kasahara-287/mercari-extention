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
              const result = await analyzeDescriptionForScams(response.description);
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



// OpenAI API にリクエストを送信する関数
async function analyzeDescriptionForScams(description2) {

  apiKey='olqg0fgAIftacajXdBcyI2pc1TpyOGGOP0fzdOF7yHVRK0y7uMh9hF6LvpJ0J5TcpbELz6ys6NhBcKKZODQpl3A'
  const apiEndpoint1 = 'https://api.openai.iniad.org/api/v1/chat/completions';

  try {
    const response1 = await fetch(apiEndpoint1, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content:  `あなたはメルカリで売られている商品が詐欺かどうかを判別するAIです。以下の商品説明文に基づいて詐欺の可能性を評価してください。ただし、商品画像や販売者の信頼性も考慮し、画像が不足している場合や、説明文が不十分な場合はそのことも評価に反映してください。
詐欺の可能性のパーセンテージは基本低めで、文章がいびつであったり、詐欺または悪意があると思わしき用語がある場合はパーセンテージを上げてください。また、説明文に「箱のみ」「本体は付属しません」などといった箱だけを送って本体を送らないような詐欺も存在するため、そのような文言が見受けられた場合には危険度を高めてください。
危険度が(0%-29%)の際は危険度:低、(30%-59%)では危険度:中、(60%-100%)では危険度:高と表記してください。
出力は次の形式でお願いします：

[危険度:高,危険度:中,危険度:低]

[箇条書きでリスクを列挙]

理由: [リスクに対する理由を簡潔に説明]

商品説明:
${description2}
`  }],
        max_tokens: 400
      })
    });

    if (!response1.ok) {
      const errorText = await response1.text();
      console.error('API request failed with status:', response1.status, 'and message:', errorText);
      return null;
    }

    const data = await response1.json();
    console.log('API response1:', data);
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error during API request:', error);
    return null;
  }

  
}