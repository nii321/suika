// キャンバスとコンテキストの取得
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// キャンバスサイズを設定（スマホ対応）
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ゲーム用変数
const fruits = [];
const fruitImages = [
    "assets/fruit1.png", "assets/fruit2.png", "assets/fruit3.png",
    "assets/fruit4.png", "assets/fruit5.png", "assets/fruit6.png",
    "assets/fruit7.png", "assets/fruit8.png"
];
let isGameOver = false;

// フルーツクラス
class Fruit {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.image = new Image();
        this.image.src = image;
        this.size = 50; // フルーツのサイズ
        this.speed = Math.random() * 2 + 1; // 落下速度
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }

    update() {
        this.y += this.speed; // フルーツを下に移動
        if (this.y > canvas.height) {
            isGameOver = true; // フルーツが画面外に出たらゲームオーバー
        }
    }
}

// フルーツをランダムに生成する関数
function spawnFruit() {
    const x = Math.random() * (canvas.width - 50); // ランダムなX座標
    const y = -50; // 画面上からスタート
    const image = fruitImages[Math.floor(Math.random() * fruitImages.length)];
    fruits.push(new Fruit(x, y, image));
}

// ゲームオーバー画面の表示
function showGameOver() {
    const gameOverDiv = document.getElementById("game-over");
    gameOverDiv.classList.remove("hidden");
}

// ゲームの初期化
function initGame() {
    isGameOver = false;
    fruits.length = 0;

    // ゲームオーバー画面を非表示にする
    const gameOverDiv = document.getElementById("game-over");
    gameOverDiv.classList.add("hidden");

    // フルーツを定期的に生成
    setInterval(spawnFruit, 1000);
}

// ゲームループ
function gameLoop() {
    if (isGameOver) {
        showGameOver();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height); // 画面をクリア

    // 背景画像の描画（オプション）
    const backgroundImage = new Image();
    backgroundImage.src = "assets/background.png";
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // フルーツの描画と更新
    fruits.forEach((fruit) => {
        fruit.update();
        fruit.draw();
    });

    requestAnimationFrame(gameLoop); // 次のフレームへ
}

// 再スタートボタンのイベントリスナー
document.getElementById("restart-button").addEventListener("click", () => {
    initGame();
});

// ゲーム開始
initGame();
gameLoop();

      .setStyle({
       backgroundColor:"red"
       })
