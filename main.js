const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#ffffff',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload,
    create,
    update,
  },
};

let game = new Phaser.Game(config);
let score = 0;
let scoreText;
let fruits;
let gameOver = false;

function preload() {
  this.load.image('fruit', 'assets/fruit.png'); // フルーツ画像をロード
}

function create() {
  // スコア表示
  scoreText = this.add.text(10, 10, 'スコア: 0', { fontSize: '24px', fill: '#333' });

  // フルーツグループの作成
  fruits = this.physics.add.group();

  // フルーツを定期的に生成
  this.time.addEvent({
    delay: 1000,
    callback: spawnFruit,
    callbackScope: this,
    loop: true
  });

  // 地面を追加
  const ground = this.add.rectangle(config.width / 2, config.height - 50, config.width, 20, 0x00ff00);
  this.physics.add.existing(ground, true);

  // 衝突判定
  this.physics.add.collider(fruits, ground, hitGround, null, this);
}

function update() {
  if (gameOver) return;

  // スマホのタッチ操作に対応
  if (this.input.activePointer.isDown) {
    fruits.children.iterate((fruit) => {
      if (fruit.getBounds().contains(this.input.x, this.input.y)) {
        fruit.destroy();
        score += 10; // スコア加算
        scoreText.setText('スコア: ' + score);
      }
    });
  }
}

function spawnFruit() {
  const x = Phaser.Math.Between(0, config.width);
  const fruit = fruits.create(x, -50, 'fruit');
  
  // フルーツの物理設定
  fruit.setVelocityY(Phaser.Math.Between(100, 200));
  
  // フルーツが画面外に出た場合の処理
  fruit.setCollideWorldBounds(true);
}

function hitGround(fruit) {
  fruit.destroy(); // 地面に衝突したフルーツを削除
  gameOver = true; // ゲームオーバー状態に設定

  // ゲームオーバー画面を表示
  showGameOver();
}

function showGameOver() {
  const gameOverText = document.createElement('div');
  gameOverText.id = 'game-over';
  
  gameOverText.innerHTML = `
    <h2>ゲームオーバー</h2>
    <p>最終スコア: ${score}</p>
    <button id="restart-button">再スタート</button>
  `;
  
  document.body.appendChild(gameOverText);

  document.getElementById('restart-button').addEventListener('click', () => {
    location.reload(); // ページをリロードして再スタート
  });
}
