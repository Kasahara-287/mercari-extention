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
// 既存のコードの最後に以下のコードを追加

const MIN_RATING_COUNT = 10;
const MIN_LISTING_COUNT = 5;

function analyzeSeller(ratingCount, listingCount) {
    if (ratingCount < MIN_RATING_COUNT || listingCount < MIN_LISTING_COUNT) {
        return '警告: この出品者は活動が少ないため、注意が必要です。';
    }
    return '出品者の活動は正常です。';
}

function checkDuplicateListings(listings) {
    const listingTitles = listings.map(listing => listing.title);
    const duplicates = listingTitles.filter((title, index) => listingTitles.indexOf(title) !== index);
    
    if (duplicates.length > 0) {
        return '警告: 同じ商品が複数出品されています。詐欺の可能性があります。';
    }
    return '重複した出品はありません。';
}

const SCAM_KEYWORDS = ['箱のみ', '本体は付属しません'];

function detectScamKeywords(description) {
    for (const keyword of SCAM_KEYWORDS) {
        if (description.includes(keyword)) {
            return `警告: 説明文に「${keyword}」という疑わしいフレーズが含まれています。`;
        }
    }
    return '怪しいキーワードは見つかりませんでした。';
}

const MAX_LISTING_AGE = 30;

function checkListingAge(listingDate) {
    const currentDate = new Date();
    const ageInDays = (currentDate - new Date(listingDate)) / (1000 * 60 * 60 * 24);
    
    if (ageInDays > MAX_LISTING_AGE) {
        return '警告: この出品は長期間放置されています。注意が必要です。';
    }
    return '出品からの経過時間は正常です。';
}
