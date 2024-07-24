chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "checkItems") {
      let items = document.querySelectorAll(".items-box .item");
      items.forEach(item => {
        let title = item.querySelector(".item-name").innerText;
        let price = item.querySelector(".item-price").innerText;
        console.log("Item:", title, price);
      });
    }
  });