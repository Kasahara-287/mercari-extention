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
        messages: [{ role: 'user', content:  `挨拶して
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