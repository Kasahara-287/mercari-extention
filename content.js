window.addEventListener('load', () => {
  const images = document.querySelectorAll("img");

  images.forEach(image => {
    const imageUrl = image.src;
    // 画像がクリックされたとき、APIで画像を確認する機能を提供
    image.addEventListener('click', () => {
      checkImageExistence(imageUrl);
    });
  });
});

async function checkImageExistence(imageUrl) {
  const response = await fetch("https://api.openai.iniad.org/check_image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ imageUrl: imageUrl })
  });

  const data = await response.json();
  alert(data.message);
}
