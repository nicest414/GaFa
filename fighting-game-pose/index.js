const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.7

const background = new Sprite({
  position: {
    x: 0,
    y: -150
  },
  imageSrc: './img/backgroundA/background.png'
})

const mountain = new Sprite({
  position: {
    x: 0,
    y: 150
  },
  imageSrc: './img/backgroundA/gra_view_mountA.png',
  scale: 2,
})

const grass = new Sprite({
  position: {
    x: 0,
    y: 400
  },
  imageSrc: './img/backgroundA/gra_ground_grassA.png',
  scale: 2,
})

const wood = new Sprite({
  position: {
    x: 600,
    y: 120
  },
  imageSrc: './img/backgroundA/gra_obj_woodA.png'
})

// const shop = new Sprite({
//   position: {
//     x: 600,
//     y: 128
//   },
//   imageSrc: './img/shop.png',
//   scale: 2.75,
//   framesMax: 6
// })

const player = new Fighter({
  position: {
    x: 0,
    y: 0
  },
  velocity: {
    x: 0,
    y: 0
  },
  offset: {
    x: 0,
    y: 0
  },
  imageSrc: './img/samuraiMack/Idle.png',
  framesMax: 8,
  scale: 1,
  offset: {
    x: 215,
    y: 157
  },
  sprites: {
    //アイドル、走る、パンチ、キック、立ちガード、しゃがみ、しゃがみパンチ、しゃがみキック、しゃがみガード、ダメージを受ける、死亡
    // === 基本アニメーション ===
    idle: {
      imageSrc: './img/samuraiMack/Idle.png',
      framesMax: 8
    },
    run: {
      imageSrc: './img/player1/run.bmp',
      framesMax: 8,
      framesX: 4
    },
    jump: {
      imageSrc: './img/samuraiMack/Jump.png',
      framesMax: 2
    },
    fall: {
      imageSrc: './img/samuraiMack/Fall.png',
      framesMax: 2
    },
    attack1: {
      imageSrc: './img/samuraiMack/Attack1.png',
      framesMax: 6
    },
    takeHit: {
      imageSrc: './img/samuraiMack/Take Hit - white silhouette.png',
      framesMax: 4
    },
    death: {
      imageSrc: './img/samuraiMack/Death.png',
      framesMax: 6
    },

    // === ポーズ対応アニメーション（現在は既存アニメーションを使用） ===

    // 攻撃系
    punch: {
      imageSrc: './img/samuraiMack/Attack1.png',  // 専用アニメーション追加時に変更
      framesMax: 6
    },
    kick: {
      imageSrc: './img/samuraiMack/Attack2.png',  // 専用アニメーション追加時に変更
      framesMax: 4
    },
    crouchPunch: {
      imageSrc: './img/samuraiMack/Attack1.png',  // 専用アニメーション追加時に変更
      framesMax: 6
    },
    crouchKick: {
      imageSrc: './img/samuraiMack/Attack2.png',  // 専用アニメーション追加時に変更
      framesMax: 4
    },

    // 防御系
    guard: {
      imageSrc: './img/samuraiMack/Idle.png',     // 専用アニメーション追加時に変更
      framesMax: 8
    },
    crouchGuard: {
      imageSrc: './img/samuraiMack/Idle.png',     // 専用アニメーション追加時に変更
      framesMax: 8
    },

    // 移動系
    forward: {
      imageSrc: './img/player1/run.bmp',      // 専用アニメーション追加時に変更
      framesMax: 8,
      framesX: 4
    },
    backward: {
      imageSrc: './img/player1/run.bmp',      // 専用アニメーション追加時に変更
      framesMax: 8,
      framesX: 4
    },

    // 姿勢系
    crouch: {
      imageSrc: './img/samuraiMack/Idle.png',     // 専用アニメーション追加時に変更
      framesMax: 8
    },
    stand: {
      imageSrc: './img/samuraiMack/Idle.png',
      framesMax: 8
    }
  },
  attackBox: {
    offset: {
      x: 100,
      y: 50
    },
    width: 160,
    height: 50
  }
})

const enemy = new Fighter({
  position: {
    x: 400,
    y: 100
  },
  velocity: {
    x: 0,
    y: 0
  },
  color: 'blue',
  offset: {
    x: -50,
    y: 0
  },
  imageSrc: './img/kenji/Idle.png',
  framesMax: 4,
  scale: 2.5,
  offset: {
    x: 215,
    y: 167
  },
  sprites: {
    // === 基本アニメーション ===
    idle: {
      imageSrc: './img/kenji/Idle.png',
      framesMax: 4
    },
    run: {
      imageSrc: './img/kenji/Run.png',
      framesMax: 8
    },
    jump: {
      imageSrc: './img/kenji/Jump.png',
      framesMax: 2
    },
    fall: {
      imageSrc: './img/kenji/Fall.png',
      framesMax: 2
    },
    attack1: {
      imageSrc: './img/kenji/Attack1.png',
      framesMax: 4
    },
    takeHit: {
      imageSrc: './img/kenji/Take hit.png',
      framesMax: 3
    },
    death: {
      imageSrc: './img/kenji/Death.png',
      framesMax: 7
    },

    // === ポーズ対応アニメーション（現在は既存アニメーションを使用） ===

    // 攻撃系
    punch: {
      imageSrc: './img/kenji/Attack1.png',       // 専用アニメーション追加時に変更
      framesMax: 4
    },
    kick: {
      imageSrc: './img/kenji/Attack2.png',       // 専用アニメーション追加時に変更
      framesMax: 4
    },
    crouchPunch: {
      imageSrc: './img/kenji/Attack1.png',       // 専用アニメーション追加時に変更
      framesMax: 4
    },
    crouchKick: {
      imageSrc: './img/kenji/Attack2.png',       // 専用アニメーション追加時に変更
      framesMax: 4
    },

    // 防御系
    guard: {
      imageSrc: './img/kenji/Idle.png',          // 専用アニメーション追加時に変更
      framesMax: 4
    },
    crouchGuard: {
      imageSrc: './img/kenji/Idle.png',          // 専用アニメーション追加時に変更
      framesMax: 4
    },

    // 移動系
    forward: {
      imageSrc: './img/kenji/Run.png',           // 専用アニメーション追加時に変更
      framesMax: 8
    },
    backward: {
      imageSrc: './img/kenji/Run.png',           // 専用アニメーション追加時に変更
      framesMax: 8
    },

    // 姿勢系
    crouch: {
      imageSrc: './img/kenji/Idle.png',          // 専用アニメーション追加時に変更
      framesMax: 4
    },
    stand: {
      imageSrc: './img/kenji/Idle.png',
      framesMax: 4
    }
  },
  attackBox: {
    offset: {
      x: -170,
      y: 50
    },
    width: 170,
    height: 50
  }
})

console.log(player)

// --- WebSocket 接続 ---
// サーバーのWebSocketエンドポイントに接続します。
// 'ws://' スキームを使い、ホスト名とポート番号は自動で現在のページのものを使います。
const socket = new WebSocket('ws://' + window.location.host + '/ws');

// --- DOM要素の取得 ---
// HTMLからポーズ名を表示するための<span>要素を取得します。
const playerPoseElement = document.getElementById('player1-pose');

// --- WebSocket イベントリスナー ---

// 接続が確立したときにコンソールにメッセージを表示します。
socket.onopen = (event) => {
  console.log("✅ WebSocket connection established.");
};

// サーバーからメッセージを受信したときに実行されるメインの処理です。
socket.onmessage = (event) => {
  // 受信データはJSON形式の文字列なので、JavaScriptオブジェクトに変換（パース）します。
  const data = JSON.parse(event.data);

  // 'pose'というキーがデータに含まれていれば、その値で画面の表示を更新します。
  // これにより、映像データ('image')は完全に無視されます。
  if (data.pose) {
    poseController.setPlayer1Pose(data.pose);
    if (playerPoseElement) {
      playerPoseElement.textContent = data.pose;
    }
  }

  // デバッグ用の表示
  if (data.image) {
    const videoFeedElement = document.getElementById('video-feed');
    videoFeedElement.src = 'data:image/jpeg;base64,' + data.image;
  }
  // デバッグ用の表示

  // サーバーからエラーメッセージが送られてきた場合はコンソールに表示します。
  if (data.error) {
    console.error("Server error:", data.error);
  }
};

// 接続が閉じたときの処理です。
socket.onclose = (event) => {
  if (event.wasClean) {
    console.log(`WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // サーバープロセスが落ちた場合など
    console.error('❌ WebSocket connection died');
  }
};

// 通信中にエラーが発生したときの処理です。
socket.onerror = (error) => {
  console.error(`WebSocket error: ${error.message}`);
};
// プレイヤーの現在状態を追跡
// let player1CurrentState = 'idle';
// let player2CurrentState = 'idle';

decreaseTimer()

function animate() {
  window.requestAnimationFrame(animate)
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)
  // 表示
  background.update()
  mountain.update()
  grass.update()
  wood.update()
  // shop.update()
  // 表示
  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  // ポーズコントローラーの更新
  poseController.update()

  // ポーズからの入力を取得
  const player1Input = poseController.getPlayer1Input()
  const player2Input = poseController.getPlayer2Input()

  player.update()
  enemy.update()

  player.velocity.x = 0
  enemy.velocity.x = 0

  // プレイヤー1の状態リセット
  player.isGuarding = false
  player.isCrouching = false

  // プレイヤー2の状態リセット
  enemy.isGuarding = false
  enemy.isCrouching = false  // プレイヤー1のポーズ制御
  let newPlayer1State = 'idle';
  
  // 攻撃中は他の動作を制限
  if (player.isAttacking) {
    newPlayer1State = 'attack1';
  } else if (player1Input.guard) {
    player.guard()
    newPlayer1State = 'guard';
  } else if (player1Input.crouch) {
    player.crouch()
    newPlayer1State = 'crouch';
  } else if (player1Input.attack) {
    player.attack()
    newPlayer1State = 'attack1';
  } else if (player1Input.left) {
    player.velocity.x = -5
    newPlayer1State = 'run';
  } else if (player1Input.right) {
    player.velocity.x = 5
    newPlayer1State = 'run';
  }

  // 状態が変わった時のみスプライトを切り替え
  if (newPlayer1State !== player1CurrentState) {
    player.switchSprite(newPlayer1State);
    player1CurrentState = newPlayer1State;
  }
  // ジャンプ処理（しゃがみ中でも可能）
  if (player1Input.jump && player.position.y >= 330) {
    player.velocity.y = -20
  }

  // ジャンプ状態の優先処理
  if (player.velocity.y < 0) {
    if (player1CurrentState !== 'jump') {
      player.switchSprite('jump')
      player1CurrentState = 'jump';
    }
  } else if (player.velocity.y > 0) {
    if (player1CurrentState !== 'fall') {
      player.switchSprite('fall')
      player1CurrentState = 'fall';
    }
  }  // プレイヤー2のポーズ制御  
  let newPlayer2State = 'idle';
  
  // 攻撃中は他の動作を制限
  if (enemy.isAttacking) {
    newPlayer2State = 'attack1';
  } else if (player2Input.guard) {
    enemy.guard()
    newPlayer2State = 'guard';
  } else if (player2Input.crouch) {
    enemy.crouch()
    newPlayer2State = 'crouch';
  } else if (player2Input.attack) {
    enemy.attack()
    newPlayer2State = 'attack1';
  } else if (player2Input.left) {
    enemy.velocity.x = -5
    newPlayer2State = 'run';
  } else if (player2Input.right) {
    enemy.velocity.x = 5
    newPlayer2State = 'run';
  }

  // 状態が変わった時のみスプライトを切り替え
  if (newPlayer2State !== player2CurrentState) {
    enemy.switchSprite(newPlayer2State);
    player2CurrentState = newPlayer2State;
  }
  // ジャンプ処理（しゃがみ中でも可能）
  if (player2Input.jump && enemy.position.y >= 330) {
    enemy.velocity.y = -20
  }

  // ジャンプ状態の優先処理
  if (enemy.velocity.y < 0) {
    if (player2CurrentState !== 'jump') {
      enemy.switchSprite('jump')
      player2CurrentState = 'jump';
    }
  } else if (enemy.velocity.y > 0) {
    if (player2CurrentState !== 'fall') {
      enemy.switchSprite('fall')
      player2CurrentState = 'fall';
    }
  }

  // detect for collision & enemy gets hit
  if (
    rectangularCollision({
      rectangle1: player,
      rectangle2: enemy
    }) &&
    player.isAttacking &&
    player.framesCurrent === 4
  ) {    enemy.takeHit()
    player.isAttacking = false

    gsap.to('#enemyHealth', {
      width: enemy.health + '%'
    })
  }

  // この部分は削除（updateメソッドで処理）
  // if player misses
  // if (player.isAttacking && player.framesCurrent === 4) {
  //   player.isAttacking = false
  // }

  // this is where our player gets hit
  if (
    rectangularCollision({
      rectangle1: enemy,
      rectangle2: player
    }) &&
    enemy.isAttacking &&
    enemy.framesCurrent === 2
  ) {
    player.takeHit()
    enemy.isAttacking = false

    gsap.to('#playerHealth', {
      width: player.health + '%'
    })
  }

  // if enemy misses
  if (enemy.isAttacking && enemy.framesCurrent === 2) {
    enemy.isAttacking = false
  }

  // end game based on health
  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId })
  }
}

animate()

// キーボード入力は保持（テスト用）
const keys = {
  a: { pressed: false },
  d: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false }
}

window.addEventListener('keydown', (event) => {
  // 通常のキーボード制御（デバッグ用）
  if (!player.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player.lastKey = 'd'
        break
      case 'a':
        keys.a.pressed = true
        player.lastKey = 'a'
        break
      case 'w':
        player.velocity.y = -20
        break
      case ' ':
        player.attack()
        break
      case 's':
        player.crouch()
        break
      case 'x':
        player.guard()
        break
    }
  }

  if (!enemy.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
        break
      case 'ArrowUp':
        enemy.velocity.y = -20
        break
      case 'ArrowDown':
        enemy.attack()
        break
    }
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
    case 's':
      player.stopCrouch()
      break
    case 'x':
      player.stopGuard()
      break
  }

  // enemy keys
  switch (event.key) {
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
  }
})
