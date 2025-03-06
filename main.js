window.onload = function() {
  initGame();
};

function initGame() {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth, // ウィンドウ幅を取得
    height: window.innerHeight, // ウィンドウ高さを取得
    backgroundColor: '#ffffff',
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: 1 },
        debug: false,
        setBounds: {
          left: true,
          right: true,
          top: false,
          bottom: true
        }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };

  const game = new Phaser.Game(config);

  let score = 0;
  let scoreText;
  let nextFruit;
  let canDrop = true;
  let gameOver = false;

  function preload() {
    // フルーツ画像の読み込み
    for (let i = 1; i <= 8; i++) {
      this.load.image(`fruit${i}`, `assets/fruit${i}.png`);
    }
    this.load.image('background', 'assets/background.png');
    this.load.image('game-over', 'assets/game-over.png');
  }

  function create() {
    // 背景画像
    this.add.image(config.width / 2, config.height / 2, 'background').setDisplaySize(config.width, config.height);

    // スコア表示
    scoreText = this.add.text(10, 10, 'スコア: 0', { 
      fontSize: '24px', 
      fill: '#333',
      fontFamily: 'Arial'
    });

    // 次のフルーツを準備
    prepareNextFruit.call(this);

    // タッチ/クリックイベントの設定
    this.input.on('pointerdown', function(pointer) {
      if (canDrop && !gameOver) {
        dropFruit.call(this, pointer.x);
      }
    }, this);

    // 衝突検出
    this.matter.world.on('collisionstart', function(event) {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;

        if (bodyA.gameObject && bodyB.gameObject && 
            bodyA.gameObject.getData('fruitType') === bodyB.gameObject.getData('fruitType')) {

          const fruitType = bodyA.gameObject.getData('fruitType');

          if (fruitType < 8) { // 最大サイズでなければ合体
            const x = (bodyA.position.x + bodyB.position.x) / 2;
            const y = (bodyA.position.y + bodyB.position.y) / 2;

            bodyA.gameObject.destroy();
            bodyB.gameObject.destroy();

            createFruit.call(this, x, y, fruitType + 1);

            score += (fruitType + 1) * 10;
            scoreText.setText('スコア: ' + score);
          }
        }

        // ゲームオーバー判定
        if ((bodyA.gameObject && bodyA.position.y < config.height * 0.15 && bodyA.velocity.y < 0.1) ||
            (bodyB.gameObject && bodyB.position.y < config.height * 0.15 && bodyB.velocity.y < 0.1)) {
          gameOver = true;
          showGameOver.call(this);
        }
      }
    }, this);
  }

  function update() {
    if (gameOver) return;

    // 次のフルーツの位置を更新
    if (nextFruit) {
      nextFruit.x = this.input.x;
    }
  }

  function prepareNextFruit() {
    const fruitType = Phaser.Math.Between(1, 3);

    nextFruit = this.add.image(this.input.x, config.height * 0.05, `fruit${fruitType}`);
    nextFruit.setData('fruitType', fruitType);
    nextFruit.setAlpha(0.7);
  }

  function dropFruit(x) {
    const fruitType = nextFruit.getData('fruitType');

    createFruit.call(this, x, config.height * 0.15, fruitType);

    nextFruit.destroy();

    canDrop = false;
    setTimeout(() => {
      canDrop = true;
      prepareNextFruit.call(this);
    }, 500);
  }

  function createFruit(x, y, fruitType) {
    const fruitSizes = [20, 30, 40, 50, 60, 70, 80, 90];

    const fruit = this.matter.add.image(x, y, `fruit${fruitType}`, null, {
      circleRadius: fruitSizes[fruitType - 1],
      restitution: 0.6,
      friction: 0.005,
      density: 0.001
    });

    fruit.setData('fruitType', fruitType);
    return fruit;
  }

   function showGameOver() {
    this.add.image(config.width / 2, config.height / 2, 'game-over')
      .setDisplaySize(config.width * 0.8, config.height * 0.5);

    this.add.text(config.width / 2, config.height / 2 + 50, `最終スコア: ${score}`, {
      fontSize: '32px',
      fill: '#fff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    const restartButton = this.add.text(config.width / 2, config.height / 2 + 120, 'もう一度遊ぶ', {
      fontSize: '28px',
      fill: '#fff',
      backgroundColor: '#4CAF50',
      padding: {
        left: 20,
        right: 20,
        top: 10,
        bottom: 10
      },
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    restartButton.on('pointerdown', function() {
      location.reload();
    });
  }
}
