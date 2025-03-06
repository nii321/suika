// main.js

// キャンバスとコンテキストの取得
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// キャンバスサイズをスマホ画面に合わせる
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 画像のロード
const assetsPath = './assets/';
const backgroundImage = new Image();
backgroundImage.src = `${assetsPath}background.png`;

const fruitImages = [];
for (let i = 1; i <= 8; i++) {
  const img = new Image();
  img.src = `${assetsPath}fruit${i}.png`;
  fruitImages.push(img);
}

// フルーツオブジェクトの定義
class Fruit {
  constructor(x, y, image) {
    this.x = x;
    this.y = y;
    this.image = image;
    this.size = 50; // フルーツのサイズ
    this.speedY = Math.random() * 2 + 1; // 落下速度
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }

  update() {
    this.y += this.speedY;
    if (this.y > canvas.height) {
      this.y = -this.size; // 上から再出現
      this.x = Math.random() * (canvas.width - this.size);
    }
  }
}

// フルーツリストを作成
const fruits = [];
for (let i = 0; i < 10; i++) {
  const randomImage =
    fruitImages[Math.floor(Math.random() * fruitImages.length)];
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height - canvas.height;
  fruits.push(new Fruit(x, y, randomImage));
}

// ゲームループ
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景描画
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // フルーツ描画と更新
  fruits.forEach((fruit) => {
    fruit.update();
    fruit.draw();
  });

  requestAnimationFrame(gameLoop);
}

// ゲーム開始
gameLoop();

// タッチイベント処理（フルーツをタップして消す）
canvas.addEventListener('touchstart', (e) => {
  const touchX = e.touches[0].clientX;
  const touchY = e.touches[0].clientY;

  fruits.forEach((fruit, index) => {
    if (
      touchX > fruit.x &&
      touchX < fruit.x + fruit.size &&
      touchY > fruit.y &&
      touchY < fruit.y + fruit.size
    ) {
      // フルーツを削除して再生成
      fruits.splice(index, 1);
      const randomImage =
        fruitImages[Math.floor(Math.random() * fruitImages.length)];
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height - canvas.height;
      fruits.push(new Fruit(x, y, randomImage));
    }
  });
});
