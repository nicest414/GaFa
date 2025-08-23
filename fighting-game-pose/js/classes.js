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
    // framesMaxが1の場合は単一画像として扱う（背景など）
    if (this.framesMax === 1) {
      c.drawImage(
        this.image,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        this.image.width * this.scale,
        this.image.height * this.scale
      );
      return;
    }

    // スプライトシートの場合の処理
    // フレームサイズを256x256に固定
    const frameWidth = 256;
    const frameHeight = 256;

    // スプライトシートの横のフレーム数を取得（未定義ならframesMaxを代入）
    const framesInRow = this.framesX || this.framesMax;

    // 現在のフレームの行と列を計算
    const currentColumn = this.framesCurrent % framesInRow;
    const currentRow = Math.floor(this.framesCurrent / framesInRow);

    // 切り出す画像のソース位置を決定
    const sourceX = currentColumn * frameWidth;
    const sourceY = currentRow * frameHeight;

    c.drawImage(
      this.image,
      sourceX,
      sourceY,
      frameWidth, // 固定値
      frameHeight, // 固定値
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      frameWidth * this.scale, // スケールを適用
      frameHeight * this.scale // スケールを適用
    );
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
    this.width = 50
    this.height = 150
    this.originalHeight = 150
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
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 8
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

    // attack boxes
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y

    // しゃがみ時の当たり判定調整
    if (this.isCrouching) {
      this.height = this.originalHeight * 0.6
    } else {
      this.height = this.originalHeight
    }

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // gravity function
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0
      this.position.y = 330
    } else this.velocity.y += gravity
  }

  attack() {
    if (!this.isAttacking && !this.dead) {
      this.switchSprite('attack1')
      this.isAttacking = true
    }
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
  }

  switchSprite(sprite) {
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true
      return
    }

    // overriding all other animations with the attack animation
    if (
      this.image === this.sprites.attack1.image &&
      this.framesCurrent < this.sprites.attack1.framesMax - 1
    )
      return

    // override when fighter gets hit
    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return

    const setSprite = (newSprite) => {
        // 同じスプライトの場合は何もしない（アニメーション継続）
        if (this.image === newSprite.image) {
            return;
        }
        
        // 新しいスプライトに切り替え
        this.image = newSprite.image;
        this.framesMax = newSprite.framesMax;
        this.framesX = newSprite.framesX || newSprite.framesMax;
        this.framesCurrent = 0; // 新しいスプライトの場合のみリセット
    }

    switch (sprite) {
      case 'idle':
        setSprite(this.sprites.idle);
        break
      case 'run':
        setSprite(this.sprites.run);
        break
      case 'jump':
        setSprite(this.sprites.jump);
        break
      case 'fall':
        setSprite(this.sprites.fall);
        break
      case 'attack1':
        setSprite(this.sprites.attack1);
        break
      case 'takeHit':
        setSprite(this.sprites.takeHit);
        break
      case 'death':
        setSprite(this.sprites.death);
        break
      
      // Pose-related sprites
      case 'punch':
        setSprite(this.sprites.punch || this.sprites.attack1);
        break
      case 'kick':
        setSprite(this.sprites.kick || this.sprites.attack1);
        break
      case 'crouch_punch':
        setSprite(this.sprites.crouchPunch || this.sprites.attack1);
        break
      case 'crouch_kick':
        setSprite(this.sprites.crouchKick || this.sprites.attack1);
        break
      case 'guard':
        setSprite(this.sprites.guard || this.sprites.idle);
        break
      case 'crouch_guard':
        setSprite(this.sprites.crouchGuard || this.sprites.idle);
        break
      case 'forward':
        setSprite(this.sprites.forward || this.sprites.run);
        break
      case 'backward':
        setSprite(this.sprites.backward || this.sprites.run);
        break
      case 'crouch':
        setSprite(this.sprites.crouch || this.sprites.idle);
        break
      case 'stand':
        setSprite(this.sprites.stand || this.sprites.idle);
        break
    }
  }
}