class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 }
  }) {
    this.position = position
    this.width = 50
    this.height = 150
    this.image = new Image()
    this.image.src = imageSrc
    this.scale = scale
    this.framesMax = framesMax
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 8  // 5から8に変更してアニメーションを少し遅く、安定させる
    this.offset = offset
    // this.framesX は Fighter クラスの switchSprite で設定されます
  }

  draw() {
    // 画像が有効でない場合は描画をスキップ
    if (!this.image || !this.image.complete || this.image.naturalWidth === 0) {
      console.warn('Image not loaded or broken:', this.image?.src || 'no image');
      return;
    }

    c.save();
    if (this.color === 'blue') {
      // kenji（enemy）はすべてのアクションで左右反転
      const frameWidth = this.image.width / (this.framesMax || 1);
      c.translate(this.position.x - this.offset.x + frameWidth * this.scale, this.position.y - this.offset.y);
      c.scale(-1, 1);
      c.drawImage(
        this.image,
        this.framesCurrent * frameWidth,
        0,
        frameWidth,
        this.image.height,
        0,
        0,
        frameWidth * this.scale,
        this.image.height * this.scale
      );
    } else {
      // 通常描画（samuraiなど）
      const frameWidth = this.image.width / (this.framesMax || 1);
      c.drawImage(
        this.image,
        this.framesCurrent * frameWidth,
        0,
        frameWidth,
        this.image.height,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        frameWidth * this.scale,
        this.image.height * this.scale
      );
    }
    c.restore();
  }

  animateFrames() {
    this.framesElapsed++

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++
      } else {
        this.framesCurrent = 0
      }
    }
  }

  update() {
    this.draw()
    this.animateFrames()
  }
}

class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    color = 'red',
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined }
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    })
    this.velocity = velocity
    this.width = 120        // 実際のキャラクター幅に近づける（150→120で少し余裕を持たせる）
    this.height = 220       // 実際のキャラクター高さに近づける（256→220で少し余裕を持たせる）
    this.originalHeight = 220
    this.lastKey
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    }
    this.color = color
    this.isAttacking = false
    this.isGuarding = false
    this.isCrouching = false
    this.health = 100

    // しゃがみガード用の状態管理
    this.isGuardHolding = false      // ガード状態を保持中かどうか
    this.guardExitRequested = false  // ガード終了が要求されたかどうか
    this.currentAction = null        // 現在のアクション名

    // 当たり判定表示用フラグ（全キャラクター共通）
    Fighter.showHitboxes = Fighter.showHitboxes || false
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 4
    this.sprites = sprites
    this.dead = false

    for (const spriteKey in this.sprites) {
      const sprite = this.sprites[spriteKey]
      sprite.image = new Image()
      sprite.image.onload = () => {
        // もしスプライトにframesMaxが手動で設定されていなければ、自動計算する
        if (!sprite.framesMax) {
          sprite.framesX = Math.floor(sprite.image.width / 256)
          const framesY = Math.floor(sprite.image.height / 256)
          sprite.framesMax = sprite.framesX * framesY
        }
      }
      sprite.image.src = sprite.imageSrc
    }
  }
  update() {
    this.draw()
    if (!this.dead) this.animateFrames()

    // 攻撃種別ごとにattackBoxの位置・サイズを切り替え
    switch (this.attackType) {
      case 'crouch_Punch':
        this.attackBox.offset = { x: 0, y: 150 }   // しゃがみパンチ用
        this.attackBox.width = 70
        this.attackBox.height = 40
        break
      case 'crouch_Kick':
        this.attackBox.offset = { x: 30, y: 150 }  // しゃがみキック用
        this.attackBox.width = 70
        this.attackBox.height = 30
        break
      case 'punch':
        this.attackBox.offset = { x: 0, y: 50 }   // 通常パンチ用
        this.attackBox.width = 70
        this.attackBox.height = 50
        break
      case 'kick':
        this.attackBox.offset = { x: 30, y: 80 }   // 通常キック用
        this.attackBox.width = 70
        this.attackBox.height = 40
        break
      default:
        // 攻撃していないときはデフォルト値
        this.attackBox.offset = { x: 100, y: 50 }
        this.attackBox.width = 160
        this.attackBox.height = 50
        break
    }
    if (this.color === 'blue') {
      this.attackBox.position.x = this.position.x - this.attackBox.offset.x - this.attackBox.width + this.width;
      this.attackBox.position.y = this.position.y + this.attackBox.offset.y;
    } else {
      this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
      this.attackBox.position.y = this.position.y + this.attackBox.offset.y;
    }

    // attack boxes
    // this.attackBox.position.x = this.position.x
    // this.attackBox.position.y = this.position.y

    // しゃがみ時の当たり判定調整
    if (this.isCrouching) {
      this.height = this.originalHeight * 0.6
    } else {
      this.height = this.originalHeight
    }

    // 当たり判定の表示（デバッグ用）
    if (Fighter.showHitboxes) {
      this.drawHitboxes()
    }
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y    // 画面左右の境界チェック
    const leftBoundary = -20  // 少し左に出られるように
    const rightBoundary = canvas.width - 30  // 右端ももう少し外まで

    if (this.position.x < leftBoundary) {
      this.position.x = leftBoundary
    } else if (this.position.x > rightBoundary) {
      this.position.x = rightBoundary
    }    // gravity function
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0
      this.position.y = 330
    } else this.velocity.y += gravity
  }

  // 当たり判定表示メソッド
  drawHitboxes() {
    c.save()

    // キャラクター本体の当たり判定（透明な青色）
    c.fillStyle = 'rgba(0, 0, 255, 0.3)'  // 透明な青色
    c.strokeStyle = 'rgba(0, 0, 255, 0.8)'  // 境界線用の青色
    c.lineWidth = 2

    // キャラクターの当たり判定を描画
    c.fillRect(this.position.x - this.offset.x + 75, this.position.y, this.width, this.height)
    c.strokeRect(this.position.x - this.offset.x + 75, this.position.y, this.width, this.height)

    // 攻撃判定も表示（攻撃中のみ）
    if (this.isAttacking && this.attackBox.width && this.attackBox.height) {
      c.fillStyle = 'rgba(255, 0, 0, 0.3)'  // 透明な赤色
      c.strokeStyle = 'rgba(255, 0, 0, 0.8)'  // 境界線用の赤色

      c.fillRect(
        this.attackBox.position.x,
        this.attackBox.position.y,
        this.attackBox.width,
        this.attackBox.height
      )
      c.strokeRect(
        this.attackBox.position.x,
        this.attackBox.position.y,
        this.attackBox.width,
        this.attackBox.height
      )
    }
    c.restore()
  }

  // 当たり判定表示の切り替え（静的メソッド）
  static toggleHitboxDisplay() {
    Fighter.showHitboxes = !Fighter.showHitboxes
    console.log(`当たり判定表示: ${Fighter.showHitboxes ? 'ON' : 'OFF'}`)
  } animateFrames() {
    this.framesElapsed++

    if (this.framesElapsed % this.framesHold === 0) {
      // しゃがみガードの特別な制御
      if (this.currentAction === 'crouch_guard') {
        // 1-4フレーム目：ガード入りアニメーション
        if (this.framesCurrent < 3) { // 0,1,2,3 = 1-4フレーム目
          this.framesCurrent++
        }
        // 4フレーム目で停止（信号が続く限り）
        else if (this.framesCurrent === 3 && this.isGuardHolding) {
          // フレームを進めない（停止）
          return;
        }
        // 5-8フレーム目：ガード抜けアニメーション
        else if (this.guardExitRequested && this.framesCurrent < 7) {
          this.framesCurrent++
        }
        // 8フレーム目まで完了したらアクション終了
        else if (this.framesCurrent >= 7) {
          this.framesCurrent = 0
          this.guardExitRequested = false
          this.isGuardHolding = false
          this.currentAction = null
          // 通常の立ちポーズに戻る
          this.switchSprite('stand')
        }
      }
      // 通常ガードの特別な制御
      else if (this.currentAction === 'guard') {
        // 1-3フレーム目：ガード入りアニメーション
        if (this.framesCurrent < 2) { // 0,1,2 = 1-3フレーム目
          this.framesCurrent++
        }
        // 3フレーム目で停止（信号が続く限り）
        else if (this.framesCurrent === 2 && this.isGuardHolding) {
          // フレームを進めない（停止）
          return;
        }
        // 4-6フレーム目：ガード抜けアニメーション（通常ガードは6フレーム想定）
        else if (this.guardExitRequested && this.framesCurrent < 5) {
          this.framesCurrent++
        }
        // 6フレーム目まで完了したらアクション終了
        else if (this.framesCurrent >= 5) {
          this.framesCurrent = 0
          this.guardExitRequested = false
          this.isGuardHolding = false
          this.currentAction = null
          // 通常の立ちポーズに戻る
          this.switchSprite('stand')
        }
      }
      // しゃがみの特別な制御
      else if (this.currentAction === 'crouch') {
        // 1-5フレーム目：しゃがみ入りアニメーション
        if (this.framesCurrent < 4) { // 0,1,2,3,4 = 1-5フレーム目
          this.framesCurrent++
        }
        // 5フレーム目で停止（信号が続く限り）
        else if (this.framesCurrent === 4 && this.isGuardHolding) {
          // フレームを進めない（停止）
          return;
        }
        // 6-10フレーム目：しゃがみ抜けアニメーション
        else if (this.guardExitRequested && this.framesCurrent < 9) {
          this.framesCurrent++
        }
        // 10フレーム目まで完了したらアクション終了
        else if (this.framesCurrent >= 9) {
          this.framesCurrent = 0
          this.guardExitRequested = false
          this.isGuardHolding = false
          this.currentAction = null
          // 通常の立ちポーズに戻る
          this.switchSprite('stand')
        }
      } else {
        // 他のアニメーションは従来通り
        if (this.framesCurrent < this.framesMax - 1) {
          this.framesCurrent++
        } else {
          this.framesCurrent = 0

          // 攻撃アニメーションが終了した場合、攻撃状態をリセット
          const attackSprites = ['punch', 'kick', 'crouch_Punch', 'crouch_Kick'];
          for (const attackSprite of attackSprites) {
            if (this.sprites[attackSprite] &&
              this.image === this.sprites[attackSprite].image) {
              this.isAttacking = false;
              console.log(`攻撃アニメーション完了: ${attackSprite}`)
              break;
            }
          }
        }
      }
    }
  }
  attack(attackType = 'punch') {
    // 攻撃中または死亡中は新しい攻撃を受け付けない
    if (this.isAttacking || this.dead) {
      console.log(`攻撃中のため新しい攻撃を無視: ${attackType}`)
      return;
    }

    // 攻撃アニメーション中かどうかもチェック
    const attackSprites = ['punch', 'kick', 'crouch_Punch', 'crouch_Kick'];
    for (const attackSprite of attackSprites) {
      if (this.sprites[attackSprite] &&
        this.image === this.sprites[attackSprite].image &&
        this.framesCurrent < this.sprites[attackSprite].framesMax - 1) {
        console.log(`攻撃アニメーション中のため新しい攻撃を無視: ${attackType}`)
        return;
      }
    }
    this.isAttacking = true;
    this.attackType = attackType;
  }

  guard() {
    if (!this.dead) {
      this.isGuarding = true
    }
  }

  stopGuard() {
    this.isGuarding = false
  }

  crouch() {
    if (!this.dead) {
      this.isCrouching = true
    }
  }
  stopCrouch() {
    this.isCrouching = false
  }
  // しゃがみガード終了要求
  exitCrouchGuard() {
    if (this.currentAction === 'crouch_guard' && this.isGuardHolding) {
      this.guardExitRequested = true
      this.isGuardHolding = false
      console.log('しゃがみガード終了要求')
    }
  }
  // 通常ガード終了要求
  exitGuard() {
    if (this.currentAction === 'guard' && this.isGuardHolding) {
      this.guardExitRequested = true
      this.isGuardHolding = false
      console.log('通常ガード終了要求')
    }
  }

  // しゃがみ終了要求
  exitCrouch() {
    if (this.currentAction === 'crouch' && this.isGuardHolding) {
      this.guardExitRequested = true
      this.isGuardHolding = false
      console.log('しゃがみ終了要求')
    }
  }

  takeHit() {
    let damage = 20

    // ガード中はダメージを半分に
    if (this.isGuarding) {
      damage = 10
    }

    this.health -= damage

    if (this.health <= 0) {
      this.switchSprite('death')
    } else if (!this.isGuarding) {
      this.switchSprite('takeHit')
    }
  } switchSprite(sprite) {
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true
      return
    }

    // 攻撃アニメーション中は他のアニメーションを受け付けない（最優先）
    const attackSprites = ['punch', 'kick', 'crouch_Punch', 'crouch_Kick'];
    for (const attackSprite of attackSprites) {
      if (this.sprites[attackSprite] &&
        this.image === this.sprites[attackSprite].image &&
        this.framesCurrent < this.sprites[attackSprite].framesMax - 1) {
        console.log(`攻撃中のため入力を無視: ${sprite}`)
        return;
      }
    }    // 特別な制御中のアニメーションから他のアニメーションに切り替わる場合、状態をリセット
    if (this.currentAction && sprite !== this.currentAction &&
      sprite !== 'crouch_guard' && sprite !== 'guard' && sprite !== 'crouch_punch' && sprite !== 'crouch') {
      console.log(`アニメーション強制切り替え: ${this.currentAction} → ${sprite}`)
      this.currentAction = null
      this.isGuardHolding = false
      this.guardExitRequested = false
    }

    // override when fighter gets hit
    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return

    const setSprite = (newSprite) => {
      // スプライトが存在しない場合は何もしない
      if (!newSprite || !newSprite.image) {
        console.warn(`Sprite not found or invalid:`, newSprite);
        return;
      }

      // スプライトを設定（常に実行してアニメーションの一貫性を保つ）
      this.image = newSprite.image;
      this.framesMax = newSprite.framesMax;
      this.framesX = newSprite.framesX || newSprite.framesMax;

      // 異なるスプライトの場合のみフレームをリセット
      if (this.framesCurrent >= this.framesMax) {
        this.framesCurrent = 0;
      }
    }

    switch (sprite) {
      case 'idle':
        if (this.sprites.idle) setSprite(this.sprites.idle);
        break
      case 'run':
        if (this.sprites.run) setSprite(this.sprites.run);
        break
      case 'jump':
        if (this.sprites.jump) setSprite(this.sprites.jump);
        break
      case 'fall':
        if (this.sprites.fall) setSprite(this.sprites.fall);
        break
      case 'takeHit':
        if (this.sprites.takeHit) setSprite(this.sprites.takeHit);
        break
      case 'death':
        if (this.sprites.death) setSprite(this.sprites.death);
        break

      // Attack sprites - 4種類の攻撃を個別に処理
      case 'punch':
        if (this.sprites.punch) setSprite(this.sprites.punch);
        break
      case 'kick':
        if (this.sprites.kick) setSprite(this.sprites.kick);
        break
      case 'crouch_punch':
      case 'crouch_Punch':
        if (this.sprites.crouch_Punch) setSprite(this.sprites.crouch_Punch);
        break
      case 'crouch_kick':
      case 'crouch_Kick':
        if (this.sprites.crouch_Kick) setSprite(this.sprites.crouch_Kick);
        break
      case 'guard':
        if (this.sprites.guard) {
          // 通常ガード開始時の状態設定
          this.currentAction = 'guard'
          this.isGuardHolding = true
          this.guardExitRequested = false
          this.framesCurrent = 0  // アニメーションを最初から開始
          setSprite(this.sprites.guard);
        } else if (this.sprites.idle) {
          setSprite(this.sprites.idle);
        }
        break
      case 'crouch_guard':
        if (this.sprites.crouchGuard) {
          // しゃがみガード開始時の状態設定
          this.currentAction = 'crouch_guard'
          this.isGuardHolding = true
          this.guardExitRequested = false
          this.framesCurrent = 0  // アニメーションを最初から開始
          setSprite(this.sprites.crouchGuard);
        } else if (this.sprites.idle) {
          setSprite(this.sprites.idle);
        }
        break
      case 'forward':
        if (this.sprites.forward) {
          setSprite(this.sprites.forward);
        } else if (this.sprites.run) {
          setSprite(this.sprites.run);
        }
        break
      case 'backward':
        if (this.sprites.backward) {
          setSprite(this.sprites.backward);
        } else if (this.sprites.run) {
          setSprite(this.sprites.run);
        }
        break
      case 'crouch':
        if (this.sprites.crouch) {
          // しゃがみ開始時の状態設定
          this.currentAction = 'crouch'
          this.isGuardHolding = true
          this.guardExitRequested = false
          this.framesCurrent = 0  // アニメーションを最初から開始
          setSprite(this.sprites.crouch);
        } else if (this.sprites.idle) {
          setSprite(this.sprites.idle);
        }
        break
      case 'stand':
        if (this.sprites.stand) {
          setSprite(this.sprites.stand);
        } else if (this.sprites.idle) {
          setSprite(this.sprites.idle);
        }
        break
    }
  }
}