const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.7

// ▼▼▼【ここから追加】WebSocket関連のコード ▼▼▼

// 1. HTMLのimg要素を取得
const cameraFeed = document.getElementById('cameraFeed');

// 2. WebSocketサーバーに接続
const socket = new WebSocket('ws://localhost:5000/ws');

// 3. 接続が確立したときの処理
socket.onopen = function () {
  console.log("WebSocket接続成功！ 👾");
};

// 4. サーバーからメッセージを受信したときの処理
socket.onmessage = function (event) {
  try {
    const data = JSON.parse(event.data);

    // ポーズ名を受信した場合
    if (data.pose) {
      // デバッグ用の表示を更新
      document.getElementById('player1-pose').textContent = data.pose;
      poseController.setPlayer1Pose(data.pose);

      // poseControllerオブジェクトに現在のポーズを伝える
      // ※pose-controller.js側で受信したポーズ名を処理する想定です
      // 例えば、poseControllerに以下のような関数を作って連携します。
      // poseController.setCurrentPose('player1', data.pose);
    }

    // カメラ映像を受信した場合
    if (data.image) {
      cameraFeed.src = 'data:image/jpeg;base64,' + data.image;
    }

    // エラーを受信した場合
    if (data.error) {
      console.error("サーバーエラー:", data.error);
    }

  } catch (error) {
    console.error("サーバーからのメッセージ処理中にエラー:", error);
  }
};

// 5. 接続が切断したときの処理
socket.onclose = function () {
  console.log("WebSocket切断。");
};

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
    x: 400, // ← enemyと同じx座標
    y: 100  // ← enemyと同じy座標
  },
  velocity: {
    x: 0,
    y: 0
  },
  offset: {
    x: 0,
    y: 0
  },
  imageSrc: './img/samuraiMack/Stand.png',
  framesMax: 10,
  scale: 1,
  offset: {
    x: 256,
    y: 65
  },
  sprites: {
    //アイドル、走る、パンチ、キック、立ちガード、しゃがみ、しゃがみパンチ、しゃがみキック、しゃがみガード、死亡
    // === 基本アニメーション ===
    idle: {
      imageSrc: './img/samuraiMack/Stand.png',
      framesMax: 10
    },
    run: {
      imageSrc: './img/samuraiMack/Forward.png',
      framesMax: 8
    },
    jump: {
      imageSrc: './img/samuraiMack/Stand.png',
      framesMax: 10
    },
    fall: {
      imageSrc: './img/samuraiMack/Stand.png',
      framesMax: 10
    },
    takeHit: {
      imageSrc: './img/samuraiMack/Takehit.png',
      framesMax: 7
    },
    death: {
      imageSrc: './img/samuraiMack/Death.png',
      framesMax: 13
    },

    // === ポーズ対応アニメーション（現在は既存アニメーションを使用） ===

    // 攻撃系
    punch: {
      imageSrc: './img/samuraiMack/Punch.png',  // 専用アニメーション追加時に変更
      framesMax: 11
    },
    kick: {
      imageSrc: './img/samuraiMack/Kick.png',  // 専用アニメーション追加時に変更
      framesMax: 9
    },
    crouch_Punch: {
      imageSrc: './img/samuraiMack/Crouch_Punch.png',  // 専用アニメーション追加時に変更
      framesMax: 10
    },
    crouch_Kick: {
      imageSrc: './img/samuraiMack/Crouch_Kick.png',  // 専用アニメーション追加時に変更
      framesMax: 8
    },

    // 防御系
    guard: {
      imageSrc: './img/samuraiMack/Guard.png',     // 専用アニメーション追加時に変更
      framesMax: 6
    },
    crouchGuard: {
      imageSrc: './img/samuraiMack/Crouch_Guard.png',     // 専用アニメーション追加時に変更
      framesMax: 8
    },

    // 移動系
    forward: {
      imageSrc: './img/samuraiMack/Forward.png',      // samuraiMackフォルダに修正
      framesMax: 8
    },
    backward: {
      imageSrc: './img/samuraiMack/Backward.png',      // samuraiMackフォルダに修正
      framesMax: 8
    },

    // 姿勢系
    crouch: {
      imageSrc: './img/samuraiMack/Crouch.png',     // 専用アニメーション追加時に変更
      framesMax: 10
    },
    stand: {
      imageSrc: './img/samuraiMack/Stand.png',
      framesMax: 10
    },
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
  imageSrc: './img/kenji/Stand.png',
  framesMax: 10,
  scale: 1,
  offset: {
    x: -256,
    y: 65
  },
  sprites: {
    // === 基本アニメーション ===
    idle: {
      imageSrc: './img/kenji/Stand.png',
      framesMax: 10
    },
    run: {
      imageSrc: './img/kenji/Forward.png',
      framesMax: 8
    },
    jump: {
      imageSrc: './img/kenji/Stand.png',
      framesMax: 10
    },
    fall: {
      imageSrc: './img/kenji/Stand.png',
      framesMax: 10
    },
    takeHit: {
      imageSrc: './img/kenji/Takehit.png',
      framesMax: 7
    },
    death: {
      imageSrc: './img/kenji/Death.png',
      framesMax: 13
    },

    // === ポーズ対応アニメーション（現在は既存アニメーションを使用） ===

    // 攻撃系
    punch: {
      imageSrc: './img/kenji/Punch.png',       // 専用アニメーション追加時に変更
      framesMax: 11
    },
    kick: {
      imageSrc: './img/kenji/Kick.png',       // 専用アニメーション追加時に変更
      framesMax: 9
    },
    crouchPunch: {
      imageSrc: './img/kenji/Crouch_Punch.png',       // 専用アニメーション追加時に変更
      framesMax: 10
    },
    crouchKick: {
      imageSrc: './img/kenji/Crouch_Kick.png',       // 専用アニメーション追加時に変更
      framesMax: 8
    },

    // 防御系
    guard: {
      imageSrc: './img/kenji/Guard.png',          // 専用アニメーション追加時に変更
      framesMax: 6
    },
    crouchGuard: {
      imageSrc: './img/kenji/Crouch_Guard.png',          // 専用アニメーション追加時に変更
      framesMax: 8
    },

    // 移動系
    forward: {
      imageSrc: './img/kenji/Forward.png',           // 専用アニメーション追加時に変更
      framesMax: 8
    },
    backward: {
      imageSrc: './img/kenji/Backward.png',           // 専用アニメーション追加時に変更
      framesMax: 8
    },

    // 姿勢系
    crouch: {
      imageSrc: './img/kenji/Crouch.png',          // 専用アニメーション追加時に変更
      framesMax: 10
    },
    stand: {
      imageSrc: './img/kenji/Stand.png',
      framesMax: 10
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

// プレイヤーの現在状態を追跡
let player1CurrentState = 'stand';
let player2CurrentState = 'stand';

decreaseTimer()
let frameCount = 0 // ← これを追加

function animate() {
  window.requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height) // ← これを追加
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
  let newPlayer1State = player1Input.animationName || 'stand';

  const player1LeftEdge = player.position.x + player.offset.x;
  const player1RightEdge = player.position.x + player.offset.x + player.width;
  const gosa = 420;

  // 攻撃中は他の動作を制限
  if (player.isAttacking) {
    // 現在のアニメーション名をそのまま使用
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.guard) {
    player.guard()
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.kick && !player1Input.crouch) {
    player.attack('kick');
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.attack && !player1Input.crouch) {
    player.attack('punch');
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.kick && player1Input.crouch) {  // ← しゃがみキックの独立判定
    player.attack('crouch_Kick');
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.attack && player1Input.crouch) {  // ← しゃがみパンチの独立判定
    console.log(`[フレーム: ${frameCount}] 1. 入力検知: しゃがみパンチ`);
    player.attack('crouch_Punch');
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.crouch) {
    player.crouch()
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.left && player1LeftEdge > gosa) { // ← 修正：左端チェックを追加
    player.velocity.x = -5
    newPlayer1State = player1Input.animationName;
  } else if (player1Input.right && player1RightEdge < canvas.width + gosa) { // ← 修正：右端チェックを追加
    player.velocity.x = 5
    newPlayer1State = player1Input.animationName;
  }

  // 状態が変わった時のみスプライトを切り替え
  if (newPlayer1State !== player1CurrentState || newPlayer1State === 'stand') {
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
  let newPlayer2State = player2Input.animationName || 'stand';

  const player2LeftEdge = enemy.position.x + enemy.offset.x;
  const player2RightEdge = enemy.position.x + enemy.offset.x + enemy.width;
  if (enemy.isAttacking) {
    // 現在のアニメーション名をそのまま使用
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.guard) {
    enemy.guard()
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.crouch) {
    enemy.crouch()
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.kick) {
    enemy.attack('kick');
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.attack) {
    enemy.attack('punch');
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.crouchKick) {  // ← しゃがみキックの独立判定
    enemy.attack('crouch_Kick');
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.crouchPunch) {  // ← しゃがみパンチの独立判定
    enemy.attack('crouch_Punch');
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.left && player2LeftEdge > gosa) { // ← 修正：左端チェックを追加
    enemy.velocity.x = -5
    newPlayer2State = player2Input.animationName;
  } else if (player2Input.right && player2RightEdge < canvas.width + gosa) { // ← 修正：右端チェックを追加
    enemy.velocity.x = 5
    newPlayer2State = player2Input.animationName;
  }

  // 状態が変わった時のみスプライトを切り替え
  if (newPlayer2State !== player2CurrentState || newPlayer2State === 'stand') {
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
      rectangle1: {
        attackBox: player.attackBox,
        position: {
          x: player.position.x - player.offset.x + 75,
          y: player.position.y
        },
        width: player.width,
        height: player.height
      },
      rectangle2: {
        position: {
          x: enemy.position.x - enemy.offset.x + 75,
          y: enemy.position.y
        },
        width: enemy.width,
        height: enemy.height
      }
    }) &&
    player.isAttacking
    && player.framesCurrent === 4
  ) {
    enemy.takeHit()
    player.isAttacking = false

    gsap.to('#enemyHealth', {
      width: enemy.health + '%'
    })
  }

  // if player misses
  if (player.isAttacking && player.framesCurrent === 4) {
    player.isAttacking = false
  }

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
// const keys = {
//   a: { pressed: false },
//   d: { pressed: false },
//   ArrowRight: { pressed: false },
//   ArrowLeft: { pressed: false }
// }

// window.addEventListener('keydown', (event) => {
//   // 通常のキーボード制御（デバッグ用）
//   if (!player.dead) {
//     switch (event.key) {
//       case 'd':
//         keys.d.pressed = true
//         player.lastKey = 'd'
//         break
//       case 'a':
//         keys.a.pressed = true
//         player.lastKey = 'a'
//         break
//       case 'w':
//         player.velocity.y = -20
//         break
//       case ' ':
//         player.attack()
//         break
//       case 's':
//         player.crouch()
//         break
//       case 'x':
//         player.guard()
//         break
//     }
//   }

//   if (!enemy.dead) {
//     switch (event.key) {
//       case 'ArrowRight':
//         keys.ArrowRight.pressed = true
//         enemy.lastKey = 'ArrowRight'
//         break
//       case 'ArrowLeft':
//         keys.ArrowLeft.pressed = true
//         enemy.lastKey = 'ArrowLeft'
//         break
//       case 'ArrowUp':
//         enemy.velocity.y = -20
//         break
//       case 'ArrowDown':
//         enemy.attack()
//         break
//       case 'z':
//         enemy.crouch()
//         break
//       case 'c':
//         enemy.guard()
//         break
//     }
//   }
// })

// window.addEventListener('keyup', (event) => {
//   switch (event.key) {
//     case 'd':
//       keys.d.pressed = false
//       break
//     case 'a':
//       keys.a.pressed = false
//       break
//     case 's':
//       player.stopCrouch()
//       break
//     case 'x':
//       player.stopGuard()
//       break
//   }

//   // enemy keys
//   switch (event.key) {
//     case 'ArrowRight':
//       keys.ArrowRight.pressed = false
//       break
//     case 'ArrowLeft':
//       keys.ArrowLeft.pressed = false
//       break
//     case 'z':
//       enemy.stopCrouch()
//       break
//     case 'c':
//       enemy.stopGuard()
//       break
//   }
// })
