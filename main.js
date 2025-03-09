// Matter.js のモジュールを初期化
const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

// ゲームの主要な設定
const playArea = document.getElementById("play-area");
const scoreElement = document.getElementById("score");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");

// 次のフルーツ表示要素
const nextFruitImage = document.getElementById("next-fruit-image");

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
    background: '#f0f0f0', // 背景色を設定（猫の画像ではなく単色に）
    pixelRatio: window.devicePixelRatio // デバイスのピクセル比に合わせる
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// 壁（プレイエリアの枠）を作成 - 上辺を削除、左右は途中から
const walls = [
  // 上部の壁を削除
  Bodies.rectangle(playAreaWidth / 2, playAreaHeight, playAreaWidth, 10, { isStatic: true }), // 下部
  Bodies.rectangle(0, playAreaHeight / 2 + 100, 10, playAreaHeight - 100, { isStatic: true }), // 左側（上部100pxは除外）
  Bodies.rectangle(playAreaWidth, playAreaHeight / 2 + 100, 10, playAreaHeight - 100, { isStatic: true }), // 右側（上部100pxは除外）
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
const fruitSizes = [60, 90, 110, 130, 150, 170, 190, 230]; // フルーツごとの直径

let score = 0;
let currentFruitIndex = getRandomFruitIndex();
let nextFruitIndex = getRandomFruitIndex();
let activeFruitBody = null;
let isGameOver = false;
let characterPosition = { x: playAreaWidth / 2, y: 30 };

// キャラクターの追加
const characterElement = document.createElement("div");
characterElement.id = "character";
characterElement.innerHTML = `<img src="assets/character.png" alt="キャラクター">`;
playArea.appendChild(characterElement);

// 次のフルーツ画像を更新
function updateNextFruitPreview() {
  nextFruitImage.src = fruitImages[nextFruitIndex];
}

// 初期フルーツを作成
createNewFruit(playAreaWidth / 2);
updateNextFruitPreview();

// ランダムなフルーツインデックスを取得する関数
function getRandomFruitIndex() {
  return Math.floor(Math.random() * 4); // 初期は小さいフルーツのみ生成
}

// 新しいフルーツを作成する関数
function createNewFruit(xPosition) {
  // キャラクターの位置を保存
  characterPosition.x = xPosition;
  
  // フルーツの物体を作成（キャラクターの少し左に配置）
  activeFruitBody = Bodies.circle(xPosition - 20, 30, fruitSizes[currentFruitIndex] / 2, {
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
  
  // キャラクターの位置を更新
  updateCharacterPosition(xPosition);
}

// キャラクターの位置を更新する関数
function updateCharacterPosition(xPosition) {
  characterPosition.x = xPosition;
  characterElement.style.left = xPosition + 'px';
  characterElement.style.top = '30px'; // フルーツと同じ高さ
}

// タッチ操作でフルーツとキャラクターを移動
playArea.addEventListener("touchstart", (event) => {
  if (isGameOver) return;

  const touch = event.touches[0];
  // タッチ位置をプレイエリア内の座標に変換
  const rect = playArea.getBoundingClientRect();
  const xPosition = touch.clientX - rect.left;
  
  // フルーツとキャラクターの位置を更新
  if (activeFruitBody) {
    Body.setPosition(activeFruitBody, { 
      x: xPosition - 20, // キャラクターの少し左
      y: 30
    });
    updateCharacterPosition(xPosition);
  }
});

// 指が動いたときにフルーツとキャラクターが左右のみ追従する
playArea.addEventListener("touchmove", (event) => {
  if (!activeFruitBody || isGameOver) return;

  const touch = event.touches[0];
  const rect = playArea.getBoundingClientRect();
  const xPosition = touch.clientX - rect.left;
  
  // y座標は固定したまま、x座標のみ更新
  Body.setPosition(activeFruitBody, { 
    x: xPosition - 20, // キャラクターの少し左
    y: 30
  });
  
  // キャラクターの位置も更新
  updateCharacterPosition(xPosition);
});

// 指を離したときにフルーツが落下する
playArea.addEventListener("touchend", () => {
  if (!activeFruitBody || isGameOver) return;

  // 静的状態を解除して重力の影響を受けるようにする
  Body.setStatic(activeFruitBody, false);
  
  // 次のフルーツを準備（ここでは画像更新しない）
  currentFruitIndex = nextFruitIndex;
  nextFruitIndex = getRandomFruitIndex();
  
  // 少し待ってから新しいフルーツを作成（キャラクターはそのまま）
  setTimeout(() => {
    if (!isGameOver) {
      createNewFruit(characterPosition.x);
      // フルーツが作成された時に次のフルーツ画像を更新
      updateNextFruitPreview();
    }
  }, 500);
  
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
  // すでにゲームオーバーなら処理しない
  if (isGameOver) return;
  
  world.bodies.forEach((body) => {
    // 静的でないボディ（フルーツ）が左右の枠線の開始位置より上で一定時間とどまった場合
    if (!body.isStatic && body.position.y < 100 && body.position.y > 0) {
      // フルーツが一定時間上部にとどまっているか確認
      if (!body.gameOverTimer) {
        body.gameOverTimer = 1;
      } else {
        body.gameOverTimer++;
        // 一定時間（例：30フレーム）上部にとどまったらゲームオーバー
        if (body.gameOverTimer > 30) {
          triggerGameOver();
        }
      }
    } else if (body.gameOverTimer) {
      // 上部から離れたらタイマーをリセット
      body.gameOverTimer = 0;
    }
  });
}

// ゲームオーバー処理を関数化
function triggerGameOver() {
  isGameOver = true;
  
  // ゲームオーバー画面を表示
  gameOverScreen.classList.remove("hidden");
  
  // アクティブなフルーツがあれば削除
  if (activeFruitBody) {
    World.remove(world, activeFruitBody);
    activeFruitBody = null;
  }
  
  console.log("ゲームオーバー！");
}

// 定期的にゲームオーバー判定を行う（フレームごとに判定）
Events.on(engine, "afterUpdate", checkGameOver);

// リスタートボタンのクリックイベント
restartButton.addEventListener("click", () => {
  // ゲームをリセット
  resetGame();
});

// ゲームリセット関数
function resetGame() {
  // すべてのフルーツを削除（Composite.clearを使用）
  Composite.clear(world, false, true);
  
  // 壁を再追加（上辺なし、左右は途中から）
  const walls = [
    Bodies.rectangle(playAreaWidth / 2, playAreaHeight, playAreaWidth, 10, { isStatic: true }), // 下部
    Bodies.rectangle(0, playAreaHeight / 2 + 100, 10, playAreaHeight - 100, { isStatic: true }), // 左側（上部100pxは除外）
    Bodies.rectangle(playAreaWidth, playAreaHeight / 2 + 100, 10, playAreaHeight - 100, { isStatic: true }), // 右側（上部100pxは除外）
  ];
  World.add(world, walls);
  
  // スコアリセット
  score = 0;
  scoreElement.textContent = score;
  
  // フルーツリセット
  currentFruitIndex = getRandomFruitIndex();
  nextFruitIndex = getRandomFruitIndex();
  
  // キャラクターの位置をリセット
  characterPosition = { x: playAreaWidth / 2, y: 30 };
  updateCharacterPosition(characterPosition.x);
  
  // 状態リセット
  activeFruitBody = null;
  isGameOver = false;
  
  // ゲームオーバー画面を非表示
  gameOverScreen.classList.add("hidden");
  
  // 新しいフルーツを作成
  createNewFruit(characterPosition.x);
  // フルーツが作成された時に次のフルーツ画像を更新
  updateNextFruitPreview();
}
