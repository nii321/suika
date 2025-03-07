// Matter.js のモジュールを初期化
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// ゲームの主要な設定
const playArea = document.getElementById("play-area");
const scoreElement = document.getElementById("score");
const nextFruitImage = document.getElementById("next-fruit-image");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");

// HTML要素の追加: 次の次のフルーツ表示用
const nextFruitContainer = document.getElementById("next-fruit");
const afterNextContainer = document.createElement("div");
afterNextContainer.className = "next-fruit-preview";
afterNextContainer.innerHTML = `<h2>次の次:</h2><img id="after-next-fruit-image" src="" alt="次の次のフルーツ">`;
nextFruitContainer.appendChild(afterNextContainer);
const afterNextFruitImage = document.getElementById("after-next-fruit-image");

// Matter.js のエンジンとワールドを作成
const engine = Engine.create();
const world = engine.world;

// プレイエリアのサイズを取得
const playAreaWidth = playArea.offsetWidth;
const playAreaHeight = playArea.offsetHeight;

// Matter.js のレンダラーを作成
const render = Render.create({
  element: playArea,
  engine: engine,
  options: {
    width: playAreaWidth,
    height: playAreaHeight,
    wireframes: false, // 実際の画像を表示するためワイヤーフレームを無効化
    background: 'transparent',
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// 壁（プレイエリアの枠）を作成
const walls = [
  Bodies.rectangle(playAreaWidth / 2, 0, playAreaWidth, 10, { isStatic: true }), // 上部
  Bodies.rectangle(playAreaWidth / 2, playAreaHeight, playAreaWidth, 10, { isStatic: true }), // 下部
  Bodies.rectangle(0, playAreaHeight / 2, 10, playAreaHeight, { isStatic: true }), // 左側
  Bodies.rectangle(playAreaWidth, playAreaHeight / 2, 10, playAreaHeight, { isStatic: true }), // 右側
];
World.add(world, walls);

// フルーツの画像リストとサイズ設定
const fruitImages = [
  "assets/fruit1.png",
  "assets/fruit2.png",
  "assets/fruit3.png",
  "assets/fruit4.png",
  "assets/fruit5.png",
  "assets/fruit6.png",
  "assets/fruit7.png",
  "assets/fruit8.png",
];
const fruitSizes = [40, 50, 60, 70, 80, 90, 100, 110]; // フルーツごとの直径

let score = 0;
let currentFruitIndex = getRandomFruitIndex();
let nextFruitIndex = getRandomFruitIndex();
let activeFruitBody = null;
let isGameOver = false;

// 次のフルーツ画像を更新
function updateNextFruit() {
  nextFruitImage.src = fruitImages[currentFruitIndex];
  afterNextFruitImage.src = fruitImages[nextFruitIndex];
}
updateNextFruit();

// ランダムなフルーツインデックスを取得する関数
function getRandomFruitIndex() {
  return Math.floor(Math.random() * 4); // 初期は小さいフルーツのみ生成
}

// タッチ操作でフルーツを生成し、指に追従させる
playArea.addEventListener("touchstart", (event) => {
  if (isGameOver || activeFruitBody) return;

  const touch = event.touches[0];
  const xPosition = touch.pageX;
  
  // フルーツの物体を作成（上部に固定）
  activeFruitBody = Bodies.circle(xPosition, 50, fruitSizes[currentFruitIndex] / 2, {
    render: {
      sprite: {
        texture: fruitImages[currentFruitIndex],
        xScale: fruitSizes[currentFruitIndex] / fruitSizes[0],
        yScale: fruitSizes[currentFruitIndex] / fruitSizes[0],
      },
    },
    restitution: 0.8,
    friction: 0.5,
    density: 0.01,
    isStatic: true, // 静的にして重力の影響を受けないようにする
  });
  
  World.add(world, activeFruitBody);
});

// 指が動いたときにフルーツが左右のみ追従する
playArea.addEventListener("touchmove", (event) => {
  if (!activeFruitBody || isGameOver) return;

  const touch = event.touches[0];
  
  // y座標は固定したまま、x座標のみ更新
  Body.setPosition(activeFruitBody, { 
    x: touch.pageX, 
    y: 50 // 上部に固定
  });
});

// 指を離したときにフルーツが落下する
playArea.addEventListener("touchend", () => {
  if (!activeFruitBody || isGameOver) return;

  // 静的状態を解除して重力の影響を受けるようにする
  Body.setStatic(activeFruitBody, false);
  
  // 次のフルーツを準備
  currentFruitIndex = nextFruitIndex;
  nextFruitIndex = getRandomFruitIndex();
  updateNextFruit();
  
  // フルーツの参照をリセット
  activeFruitBody = null;
});

// 合体ロジック（同じ種類のフルーツが接触した場合）
Events.on(engine, "collisionStart", (event) => {
  const pairs = event.pairs;

  pairs.forEach((pair) => {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    // 壁との衝突は無視
    if (bodyA.isStatic && bodyA !== activeFruitBody) return;
    if (bodyB.isStatic && bodyB !== activeFruitBody) return;

    if (bodyA.render.sprite && bodyB.render.sprite && 
        bodyA.render.sprite.texture === bodyB.render.sprite.texture) {
      // 合体処理：次の段階のフルーツに進化させる
      const fruitIndex = fruitImages.indexOf(bodyA.render.sprite.texture);
      if (fruitIndex < 0) return;
      
      const nextIndex = Math.min(fruitIndex + 1, fruitImages.length - 1);
      const newSize = fruitSizes[nextIndex];

      const mergedBody = Bodies.circle(
        (bodyA.position.x + bodyB.position.x) / 2,
        (bodyA.position.y + bodyB.position.y) / 2,
        newSize / 2,
        {
          render: {
            sprite: {
              texture: fruitImages[nextIndex],
              xScale: newSize / fruitSizes[0],
              yScale: newSize / fruitSizes[0],
            },
          },
          restitution: bodyA.restitution,
          friction: bodyA.friction,
          density: bodyA.density,
        }
      );

      World.add(world, mergedBody);
      World.remove(world, bodyA);
      World.remove(world, bodyB);

      score += (nextIndex + 1) * 10; // スコア加算（大きなフルーツほど高得点）
      scoreElement.textContent = score;
    }
  });
});

// ゲームオーバー判定
function checkGameOver() {
  world.bodies.forEach((body) => {
    // 静的でないボディ（フルーツ）が上部を超えた場合
    if (!body.isStatic && body.position.y < 50 && body.position.y > 0) {
      isGameOver = true;
      gameOverScreen.classList.remove("hidden");
    }
  });
}

// 定期的にゲームオーバー判定を行う
setInterval(checkGameOver, 1000);

// リスタートボタンのクリックイベント
restartButton.addEventListener("click", () => {
  location.reload(); // ページをリロードしてゲームを再スタート 
});

