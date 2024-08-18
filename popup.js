document.addEventListener('DOMContentLoaded', () => {


  const analyzeButton = document.getElementById('analyzeButton');
  const resultElement = document.getElementById('result');

  analyzeButton.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      resultElement.textContent = 'Analyzing...';
      analyzeButton.disabled = true;

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, async () => {
        chrome.tabs.sendMessage(tab.id, { action: 'getDescription' }, async (response) => {
          if (response && response.description) {
            try {
              const result = await analyzeDescriptionForGreeting(response.description);
              if (result) {
                resultElement.innerHTML = `<pre>${result}</pre>`;
              } else {
                resultElement.textContent = 'Failed to analyze description.';
              }
            } catch (error) {
              console.error("Error during API analysis:", error);
              resultElement.textContent = 'Failed to analyze description.';
            }
          } else {
            resultElement.textContent = 'Failed to get description.';
          }
          analyzeButton.disabled = false;
        });
      });
    } catch (error) {
      console.error("Error during analysis:", error);
      resultElement.textContent = 'Failed to get description.';
      analyzeButton.disabled = false;
    }
  });
});

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
        messages: [{ role: 'user', content:  `あなたはメルカリで売られている商品が詐欺かどうかを判別するAIです。以下の商品説明文に基づいて詐欺の可能性を評価してください。ただし、商品画像や販売者の信頼性も考慮し、画像が不足している場合や、説明文が不十分な場合はそのことも評価に反映してください。
詐欺の可能性のパーセンテージは基本低めで、文章がいびつであったり、詐欺または悪意があると思わしき用語がある場合はパーセンテージを上げてください。また、説明文に「箱のみ」「本体は付属しません」などといった箱だけを送って本体を送らないような詐欺も存在するため、そのような文言が見受けられた場合には危険度を高めてください。
危険度が(0%-29%)の際は危険度:低、(30%-59%)では危険度:中、(60%-100%)では危険度:高と表記してください。
出力は次の形式でお願いします：

[危険度:高,危険度:中,危険度:低]

[箇条書きでリスクを列挙]

理由: [リスクに対する理由を簡潔に説明]

商品説明:
${description}
`  }],
        max_tokens: 400
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