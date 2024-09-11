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

// 商品ページから最初の画像URLを取得する関数
function getImageUrl() {
    const imgElement = document.querySelector('img[data-testid="product-image"]');
    if (imgElement) {
        return imgElement.src;
    }
    return null;
}

// ポップアップからのメッセージを受け取る
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getImageUrl') {
        const imageUrl = getImageUrl();
        if (imageUrl) {
            sendResponse({ imageUrl: imageUrl });
        } else {
            sendResponse({ error: '画像が見つかりません' });
        }
    }
    return true; // 非同期でsendResponseを使用するため
});
