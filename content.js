chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDescription') {
      const descriptionElement = document.querySelector('pre[data-testid="description"]');

      // 星評価を計算する部分
      const ratingElements = document.querySelectorAll('.merRating .star__60fe6cce svg'); // 星評価を示すSVG要素
      let rating = 0;
      if (ratingElements.length > 0) {
          rating = ratingElements.length; // 星の数がそのまま評価値
      }

      // 評価件数を取得する部分
      const ratingCountElement = document.querySelector('.merRating .count__60fe6cce');
      let ratingCount = 0;
      if (ratingCountElement) {
          ratingCount = parseInt(ratingCountElement.textContent.trim());
      }

      // 本人確認のチェック
      const verificationElement = document.querySelector('.merVerificationBadge.verified__fafde459');
      let isVerified = false;
      if (verificationElement) {
          isVerified = true; // 本人確認済み
      }

      if (descriptionElement) {
          const description = descriptionElement.textContent.trim();
          sendResponse({ 
              description: description, 
              rating: rating, 
              ratingCount: ratingCount,
              isVerified: isVerified
          });
      } else {
          console.error("Description element not found.");
          sendResponse({ 
              description: null, 
              rating: null, 
              ratingCount: null,
              isVerified: null 
          });
      }
  }
  return true; // 非同期で sendResponse を使用するため
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getDescription') {
    const { title, description } = extractProductDetails();
    sendResponse({ title, description });
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDescription') {
        const descriptionElement = document.querySelector('pre[data-testid="description"]');
        const categoryElement = document.querySelector('.item-category'); // カテゴリのセレクタ例

        let category = 'カテゴリ不明';
        if (categoryElement) {
            category = categoryElement.textContent.trim();
        }

        // ... 既存のコード ...

        if (descriptionElement) {
            const description = descriptionElement.textContent.trim();
            sendResponse({
                description: description,
                category: category,
                rating: rating,
                ratingCount: ratingCount,
                isVerified: isVerified
            });
        } else {
            console.error("Description element not found.");
            sendResponse({
                description: null,
                category: null,
                rating: null,
                ratingCount: null,
                isVerified: null
            });
        }
    }
    return true;
});
