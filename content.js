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

        // 画像URLを取得

        document.addEventListener('DOMContentLoaded', () => {
            const imageDiv = document.querySelector('div[aria-label="商品画像1枚目"]');
            if (imageDiv) {
              // 要素が見つかったら処理を開始
            }
          });

          
        const imageUrls = [];
        const imageDiv = document.querySelector('div[aria-label="商品画像1枚目"]');
        if (imageDiv) {
            const figureElement = imageDiv.querySelector('figure');
            if (figureElement) {
                const pictureElement = figureElement.querySelector('picture');
                if (pictureElement) {
                    const img = pictureElement.querySelector('img');
                    if (img) {
                        imageUrls.push(img.src);
                        console.log('画像URL:', imageUrls)
                    } else {
                        console.warn('画像が見つかりませんでした。');
                    }
                } else {
                    console.warn('<picture>要素が見つかりませんでした。');
                }
            } else {
                console.warn('<figure>要素が見つかりませんでした。');
            }
        } else {
            console.warn('指定の<div>が見つかりませんでした。');
        }
      // 結果をレスポンスとして送信
      sendResponse({
        description: descriptionElement ? 
        descriptionElement.textContent.trim() : null,
        rating: rating,
        ratingCount: ratingCount,
        isVerified: isVerified,
        imageUrls: imageUrls,
      });
  }
  return true; // 非同期で sendResponse を使用するため
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getDescription') {
    const { title, description } = extractProductDetails();
    sendResponse({ title, description });
  }
});
