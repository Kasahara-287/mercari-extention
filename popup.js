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
  
    async function analyzeDescriptionForGreeting(description) {
        const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';
        const openAiApiKey = 'YOUR_OPENAI_API_KEY'; // OpenAIのAPIキーを使用します
  
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ 
                        role: 'user', 
                        content: `あなたはメルカリで売られている商品が危険かどうかを判別し購入を控えるべきか否かを判断するAIです。以下の商品説明文に基づいて危険度の可能性を評価してください。
                        商品説明: ${description}` 
                    }],
                    max_tokens: 200
                })
            });
  
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error during API request:', error);
            return null;
        }
    }
  
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
  
    async function getProductInfo(title, description) {
        const apiKey = 'YOUR_OPENAI_API_KEY';
        const apiEndpoint = 'https://api.openai.iniad.org/api/v1/chat/completions';
  
        const prompt = `商品のタイトル: ${title}\n商品の説明文: ${description}\nこの商品の正式名称、定価、商品説明を提供してください。注意書き、前置きなどは必要としません。定価、商品説明はネットから引用してきてください。定価に関しては簡潔に数字のみで前置き、注意書きなどは記載しないで回答してください。
        価格については価格.com(https://kakaku.com/)というサイトの情報を最優先で参照してください。このサイトに情報がない場合は公式サイト、amazon、楽天などといったサイトから情報を取得してください。特定できる情報が取得できなければ(情報不足により不明)と出力してください。
        またフォーマットは以下の通りです
        商品名:
        
        定価:
        
        商品説明:(出力した文字数が枠組みに合うようにうまく改行してください)
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
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });
  
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error during API request:', error);
            return null;
        }
    }
  });
  