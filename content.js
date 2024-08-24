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
// メルカリの商品ページから画像URLを取得
function getImageUrls() {
    const imageElements = document.querySelectorAll('.item-image-selector img'); // 画像セレクタに合ったクラス名を使用
    const imageUrls = Array.from(imageElements).map(img => img.src);
    return imageUrls;
}

// 画像の類似性をチェックする関数
async function checkImageSimilarity(imageUrl) {
    const apiEndpoint = `https://api.tineye.com/rest/search/?image_url=${encodeURIComponent(imageUrl)}&api_key=YOUR_API_KEY`;
    
    try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        return data.results.length > 0; // 類似画像が見つかったかどうか
    } catch (error) {
        console.error('Error during image similarity check:', error);
        return false;
    }
}

// 商品ページから画像URLを取得し、ネット上に類似画像が存在するか確認する
async function analyzeImages() {
    const imageUrls = getImageUrls();
    let foundSimilarImage = false;

    for (const url of imageUrls) {
        const isSimilar = await checkImageSimilarity(url);
        if (isSimilar) {
            foundSimilarImage = true;
            break;
        }
    }

    if (foundSimilarImage) {
        console.log('ネット上から拾った画像の可能性があります。');
        // 必要に応じて、UIに表示するなどの処理を追加
    } else {
        console.log('画像は独自のものである可能性が高いです。');
    }
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    analyzeImages();
});
