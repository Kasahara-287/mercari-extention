// メルカリページからタイトルと説明文を取得
function extractProductDetails() {
    const titleElement = document.querySelector('.item-name'); // タイトルのセレクタ（正しいクラス名を確認してください）
    const descriptionElement = document.querySelector('.item-description'); // 説明文のセレクタ
  
    const title = titleElement ? titleElement.textContent : '';
    const description = descriptionElement ? descriptionElement.textContent : '';
  
    return { title, description };
  }
  
  // メッセージを受け取って商品情報を返す
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDescription') {
      const productDetails = extractProductDetails();
      sendResponse(productDetails);
    }
  });
  