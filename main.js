// 直接initGame関数を呼び出す
window.onload = function() {
  initGame();
};


function initGame() {
  const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
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

  // ゲーム変数
  let game = new Phaser.Game(config);
  let score = 0;
  let scoreText;
  let nextFruit;
  let canDrop = true;
  let gameOver = false;
  let fruitSizes = [20, 30, 40, 50, 60, 70, 80, 90];
  let fruitColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3, 0xff1493];

  function preload() {



   // フルーツ画像の読み込み
  for (let i = 1; i <= 8; i++) {
    this.load.image(`fruit${i}`, `assets/fruit${i}.png`); // 相対パスを使用
  }
  this.load.image('background', 'assets/background.png'); // 相対パスを使用
  this.load.image('game-over', 'assets/game-over.png'); // 相対パスを使用
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
    
    // 上部の境界線（ゲームオーバーライン）
    const gameOverLine = this.add.rectangle(config.width / 2, 100, config.width, 2, 0xff0000);
    
    // 次のフルーツを準備
    prepareNextFruit.call(this);
    
    // タッチ/クリックイベントの設定
    this.input.on('pointerdown', function(pointer) {
      if (canDrop && !gameOver) {
        dropFruit.call(this, pointer.x);
      }
    }, this);
    
    // フルーツ同士の衝突検出
    this.matter.world.on('collisionstart', function(event) {
      let pairs = event.pairs;
      
      for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;
        
        if (bodyA.gameObject && bodyB.gameObject && 
            bodyA.gameObject.getData('fruitType') === bodyB.gameObject.getData('fruitType')) {
          
          const fruitType = bodyA.gameObject.getData('fruitType');
          
          if (fruitType < 8) { // 最大サイズでなければ合体
            const x = (bodyA.position.x + bodyB.position.x) / 2;
            const y = (bodyA.position.y + bodyB.position.y) / 2;
            
            // 古いフルーツを削除
            bodyA.gameObject.destroy();
            bodyB.gameObject.destroy();
            
            // 新しい大きなフルーツを作成
            createFruit.call(this, x, y, fruitType + 1);
            
            // スコア加算
            score += (fruitType + 1) * 10;
            scoreText.setText('スコア: ' + score);
          }
        }
        
        // ゲームオーバー判定
        if (bodyA.gameObject && bodyA.position.y < 120 && bodyA.velocity.y < 0.1) {
          gameOver = true;
          showGameOver.call(this);
        }
        if (bodyB.gameObject && bodyB.position.y < 120 && bodyB.velocity.y < 0.1) {
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
    // ランダムなフルーツタイプ（1〜3の小さいフルーツのみ）
    const fruitType = Phaser.Math.Between(1, 3);
    
    // 次に落とすフルーツを表示
    nextFruit = this.add.image(this.input.x, 50, `fruit${fruitType}`);
    nextFruit.setData('fruitType', fruitType);
    nextFruit.setAlpha(0.7);
  }

  function dropFruit(x) {
    const fruitType = nextFruit.getData('fruitType');
    
    // フルーツを作成して落とす
    createFruit.call(this, x, 120, fruitType);
    
    // 次のフルーツを準備
    nextFruit.destroy();
    
    // 連続ドロップ防止のためのクールダウン
    canDrop = false;
    setTimeout(() => {
      canDrop = true;
      prepareNextFruit.call(this);
    }, 500);
  }

  function createFruit(x, y, fruitType) {
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
    // ゲームオーバー画像を表示
    this.add.image(config.width / 2, config.height / 2, 'game-over')
      .setDisplaySize(config.width * 0.8, config.height * 0.5);
    
    // 最終スコアを表示
    this.add.text(config.width / 2, config.height / 2 + 50, `最終スコア: ${score}`, {
      fontSize: '32px',
      fill: '#fff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // リスタートボタン
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

