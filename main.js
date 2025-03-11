// Matter.js のモジュールを初期化
const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

// ゲームの主要な設定
const playArea = document.getElementById("play-area");
const scoreElement = document.getElementById("score");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const gameContainer = document.getElementById("game-container");

// 次のフルーツ表示要素
const nextFruitImage = document.getElementById("next-fruit-image");

// Web Audio API の初期化
let audioContext;
let soundBuffers = {};
const soundFiles = {
  drop: "assets/drop.mp3",
  merge: "assets/merge.mp3",
  fail: "assets/fail.mp3",
  watermelon_created: "assets/watermelon_created.mp3",
  watermelon: "assets/watermelon.mp3"
};

// AudioContext の初期化とサウンドの読み込み
function initAudio() {
  // AudioContext はユーザーのインタラクションが必要なため、遅延初期化
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // 各サウンドファイルを読み込む
  Object.keys(soundFiles).forEach(soundName => {
    const request = new XMLHttpRequest();
    request.open('GET', soundFiles[soundName], true);
    request.responseType = 'arraybuffer';
    
    request.onload = function() {
      audioContext.decodeAudioData(request.response, function(buffer) {
        soundBuffers[soundName] = buffer;
      }, function(error) {
        console.error('デコードエラー:', error);
      });
    };
    
    request.onerror = function() {
      console.error('サウンドファイルの読み込みに失敗しました');
    };
    
    request.send();
  });
}

// 効果音を再生する関数
function playSound(soundName) {
  if (!audioContext) {
    // 初回のユーザーインタラクション時にオーディオを初期化
    initAudio();
    return; // 初回は音を鳴らさない（バッファがまだ読み込まれていないため）
  }
  
  // 一時停止状態の場合は再開
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const buffer = soundBuffers[soundName];
  if (buffer) {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
  }
}

// プレイエリアのサイズを取得・設定
const playAreaWidth = window.innerWidth - 20; // 余白を考慮
const playAreaHeight = playAreaWidth * 1.2; // 横幅の1.2倍

// プレイエリアのサイズを設定
playArea.style.width = playAreaWidth + 'px';
playArea.style.height = playAreaHeight + 'px';

// Matter.js のエンジンとワールドを作成
const engine = Engine.create();
const world = engine.world;

// Matter.js のレンダラーを作成
const render = Render.create({
  element: playArea,
  engine: engine,
  options: {
    width: playAreaWidth,
    height: playAreaHeight,
    wireframes: false, // 実際の画像を表示するためワイヤーフレームを無効化
    background: '#f0f0f0', // 背景色を設定
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

// フルーツのサイズを画面サイズに応じて計算
const baseFruitSize = playAreaWidth / 3; // fruit6のサイズ（画面横幅の1/3）
const sizeRatios = [35, 60, 100, 130, 160, 180, 200, 300];
const fruitSizes = sizeRatios.map(ratio => (baseFruitSize * ratio / 180)); // 180はfruit6の比率

let score = 0;
let currentFruitIndex = getRandomFruitIndex();
let nextFruitIndex = getRandomFruitIndex();
let activeFruitBody = null;
let isGameOver = false;
let characterPosition = { x: playAreaWidth / 2, y: 20 };
let imagesLoaded = 0;
let totalImages = fruitImages.length;
const preloadedImages = [];

// キャラクターの追加
const characterElement = document.createElement("div");
characterElement.id = "character";
characterElement.innerHTML = `<img src="assets/character.png" alt="キャラクター">`;
playArea.appendChild(characterElement);
// 画像のプリロード処理
function preloadImages() {
  fruitImages.forEach((src, index) => {
    const img = new Image();
    img.onload = function() {
      preloadedImages[index] = {
        width: this.width,
        height: this.height,
        aspectRatio: this.width / this.height
      };
      imagesLoaded++;
      
      // すべての画像が読み込まれたら初期化
      if (imagesLoaded === totalImages) {
        initializeGame();
      }
    };
    img.src = src;
  });
}

// ゲームの初期化
function initializeGame() {
  // 初期フルーツを作成
  createNewFruit(playAreaWidth / 2);
  updateNextFruitPreview();
}

// 次のフルーツ画像を更新
function updateNextFruitPreview() {
  nextFruitImage.src = fruitImages[nextFruitIndex];
  // 次のフルーツのプレビュー画像サイズを調整
  nextFruitImage.style.width = "30px";
  nextFruitImage.style.height = "30px";
}

// ランダムなフルーツインデックスを取得する関数
function getRandomFruitIndex() {
  return Math.floor(Math.random() * 4); // 初期は小さいフルーツのみ生成
}

// 画像のスケールを計算する関数
function calculateImageScale(fruitIndex, size) {
  // 画像がプリロードされていない場合はデフォルト値を使用
  if (!preloadedImages[fruitIndex]) {
    return size / 100; // デフォルトの比率
  }
  
  // 画像の実際のサイズに基づいてスケールを計算
  const imgWidth = preloadedImages[fruitIndex].width;
  return size / imgWidth;
}

// 新しいフルーツを作成する関数
function createNewFruit(xPosition) {
  // キャラクターの位置を保存
  characterPosition.x = xPosition;
  characterPosition.y = 20; // 高さを20に固定
  
  const fruitSize = fruitSizes[currentFruitIndex];
  const radius = fruitSize / 2;
  
  // 画像のスケールを計算
  const scale = calculateImageScale(currentFruitIndex, fruitSize);
  
  // フルーツの物体を作成（キャラクターの少し左に配置）
  activeFruitBody = Bodies.circle(xPosition - 20, 30, radius, {
    render: {
      sprite: {
        texture: fruitImages[currentFruitIndex],
        xScale: scale,
        yScale: scale,
      },
    },
    restitution: 0.8,
    friction: 0.5,
    density: 0.01,
    isStatic: true, // 静的にして重力の影響を受けないようにする
    fruitIndex: currentFruitIndex // フルーツの種類を保存
  });
  
  World.add(world, activeFruitBody);
  
  // キャラクターの位置を更新
  updateCharacterPosition(xPosition);
}

// キャラクターの位置を更新する関数
function updateCharacterPosition(xPosition) {
  characterPosition.x = xPosition;
  characterPosition.y = 20; // 高さを20に固定
  characterElement.style.left = xPosition + 'px';
  characterElement.style.top = '20px'; // 高さを20pxに固定
}

// タッチ操作でフルーツとキャラクターを移動（game-container全体に設定）
gameContainer.addEventListener("touchstart", (event) => {
  if (isGameOver) return;

  // 初回のユーザーインタラクション時にオーディオを初期化
  if (!audioContext) {
    initAudio();
  }

  const touch = event.touches[0];
  // タッチ位置をプレイエリア内の座標に変換
  const rect = playArea.getBoundingClientRect();
  const xPosition = Math.min(Math.max(touch.clientX - rect.left, 0), playAreaWidth);
  
  // フルーツとキャラクターの位置を更新
  if (activeFruitBody) {
    Body.setPosition(activeFruitBody, { 
      x: xPosition - 20, // キャラクターの少し左
      y: 30 // フルーツの高さは30で固定
    });
    updateCharacterPosition(xPosition);
  }
});

// 指が動いたときにフルーツとキャラクターが左右のみ追従する
gameContainer.addEventListener("touchmove", (event) => {
  if (!activeFruitBody || isGameOver) return;

  const touch = event.touches[0];
  const rect = playArea.getBoundingClientRect();
  const xPosition = Math.min(Math.max(touch.clientX - rect.left, 0), playAreaWidth);
  
  // y座標は固定したまま、x座標のみ更新
  Body.setPosition(activeFruitBody, { 
    x: xPosition - 20, // キャラクターの少し左
    y: 30 // フルーツの高さは30で固定
  });
  
  // キャラクターの位置も更新
  updateCharacterPosition(xPosition);
});

// 指を離したときにフルーツが落下する
gameContainer.addEventListener("touchend", () => {
  if (!activeFruitBody || isGameOver) return;

  // 静的状態を解除して重力の影響を受けるようにする
  Body.setStatic(activeFruitBody, false);
  
  // 落下音を再生
  playSound("drop");
  
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
      
      // スイカ同士の合体の場合は両方消す
      if (fruitIndex === 7) { // fruit8（スイカ）の場合
        World.remove(world, bodyA);
        World.remove(world, bodyB);
        
        // スイカ同士の合体音を再生
        playSound("watermelon");
        
        // スコア加算（スイカ同士の合体でボーナス）
        score += 100;
        scoreElement.textContent = score;
        return;
      }
      
      const nextIndex = Math.min(fruitIndex + 1, fruitImages.length - 1);
      const newSize = fruitSizes[nextIndex];
      
      // 画像のスケールを計算
      const scale = calculateImageScale(nextIndex, newSize);

      const mergedBody = Bodies.circle(
        (bodyA.position.x + bodyB.position.x) / 2,
        (bodyA.position.y + bodyB.position.y) / 2,
        newSize / 2,
        {
          render: {
            sprite: {
              texture: fruitImages[nextIndex],
              xScale: scale,
              yScale: scale,
            },
          },
          restitution: bodyA.restitution,
          friction: bodyA.friction,
          density: bodyA.density,
          fruitIndex: nextIndex // フルーツの種類を保存
        }
      );

      World.add(world, mergedBody);
      World.remove(world, bodyA);
      World.remove(world, bodyB);

      // fruit7が合体してスイカができた場合、特別な効果音を再生
      if (fruitIndex === 6) { // fruit7の場合
        playSound("watermelon_created");
      } else {
        // 通常の合体音を再生
        playSound("merge");
      }

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
  
  // 失敗音を再生
  playSound("fail");
  
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
characterPosition = { x: playAreaWidth / 2, y: 20 };
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

// 画像のプリロードを開始
preloadImages();


