// Matter.js のモジュールを初期化
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// ゲームの主要な設定
const playArea = document.getElementById("play-area");
const scoreElement = document.getElementById("score");
const nextFruitImage = document.getElementById("next-fruit-image");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");

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
let activeFruitBody = null;
let isGameOver = false;

// 次のフルーツ画像を更新
function updateNextFruit() {
  nextFruitImage.src = fruitImages[currentFruitIndex];
}
updateNextFruit();

// ランダムなフルーツインデックスを取得する関数
function getRandomFruitIndex() {
  return Math.floor(Math.random() * fruitImages.length);
}

// タッチ操作でフルーツを生成し、指に追従させる
playArea.addEventListener("touchstart", (event) => {
  if (isGameOver) return;

  const touch = event.touches[0];
  
  const xPosition = touch.pageX;
  
  // フルーツの物体を作成
  activeFruitBody = Bodies.circle(xPosition, fruitSizes[currentFruitIndex] / 2, fruitSizes[currentFruitIndex] / 2, {
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
  });
  
  World.add(world, activeFruitBody);
});

// 指が動いたときにフルーツが追従する
playArea.addEventListener("touchmove", (event) => {
  if (!activeFruitBody || isGameOver) return;

  const touch = event.touches[0];
  
  Body.setPosition(activeFruitBody, { x: touch.pageX, y: activeFruitBody.position.y });
});

// 指を離したときにフルーツが落下する（重力に任せる）
playArea.addEventListener("touchend", () => {
  if (!activeFruitBody || isGameOver) return;

  activeFruitBody = null; // フルーツの操作を解除

  currentFruitIndex = getRandomFruitIndex(); // 次のフルーツを準備
  updateNextFruit();
});

// 合体ロジック（同じ種類のフルーツが接触した場合）
Events.on(engine, "collisionStart", (event) => {
  const pairs = event.pairs;

  pairs.forEach((pair) => {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    if (bodyA.render.sprite.texture === bodyB.render.sprite.texture) {
      // 合体処理：次の段階のフルーツに進化させる
      const nextIndex = Math.min(fruitImages.indexOf(bodyA.render.sprite.texture) + 1, fruitImages.length - 1);
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

      score += nextIndex * 10; // スコア加算（大きなフルーツほど高得点）
      scoreElement.textContent = score;
    }
});
});

// ゲームオーバー判定
function checkGameOver() {
  world.bodies.forEach((body) => {
    if (body.position.y < -50 && !body.isStatic) { // プレイエリア外に出た場合
      isGameOver = true;
      gameOverScreen.classList.remove("hidden");
    }
});
}

// リスタートボタンのクリックイベント
restartButton.addEventListener("click", () => {
 location.reload(); // ページをリロードしてゲームを再スタート 
});

