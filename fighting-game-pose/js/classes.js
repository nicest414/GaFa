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
    this.framesHold = 5
    this.offset = offset
  }

  draw() {
    c.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax),
      0,
      this.image.width / this.framesMax,
      this.image.height,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      (this.image.width / this.framesMax) * this.scale,
      this.image.height * this.scale
    )
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
    this.framesHold = 5
    this.sprites = sprites
    this.dead = false

    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image()
      sprites[sprite].image.src = sprites[sprite].imageSrc
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

    switch (sprite) {
      case 'idle':
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image
          this.framesMax = this.sprites.idle.framesMax
          this.framesCurrent = 0
        }
        break
      case 'run':
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image
          this.framesMax = this.sprites.run.framesMax
          this.framesCurrent = 0
        }
        break
      case 'jump':
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image
          this.framesMax = this.sprites.jump.framesMax
          this.framesCurrent = 0
        }
        break
      case 'fall':
        if (this.image !== this.sprites.fall.image) {
          this.image = this.sprites.fall.image
          this.framesMax = this.sprites.fall.framesMax
          this.framesCurrent = 0
        }
        break
      case 'attack1':
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image
          this.framesMax = this.sprites.attack1.framesMax
          this.framesCurrent = 0
        }
        break
      
      // === ポーズ対応モーション ===
      
      // 攻撃系ポーズ
      case 'punch':
        // パンチモーション（現在はattack1を使用）
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image
          this.framesMax = this.sprites.attack1.framesMax
          this.framesCurrent = 0
        }
        break
      case 'kick':
        // キックモーション（将来的に専用アニメーション追加可能）
        if (this.sprites.kick && this.image !== this.sprites.kick.image) {
          this.image = this.sprites.kick.image
          this.framesMax = this.sprites.kick.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: attack1を使用
          this.image = this.sprites.attack1.image
          this.framesMax = this.sprites.attack1.framesMax
          this.framesCurrent = 0
        }
        break
      case 'crouch_punch':
        // しゃがみパンチモーション
        if (this.sprites.crouchPunch && this.image !== this.sprites.crouchPunch.image) {
          this.image = this.sprites.crouchPunch.image
          this.framesMax = this.sprites.crouchPunch.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: attack1を使用
          this.image = this.sprites.attack1.image
          this.framesMax = this.sprites.attack1.framesMax
          this.framesCurrent = 0
        }
        break
      case 'crouch_kick':
        // しゃがみキックモーション
        if (this.sprites.crouchKick && this.image !== this.sprites.crouchKick.image) {
          this.image = this.sprites.crouchKick.image
          this.framesMax = this.sprites.crouchKick.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: attack1を使用
          this.image = this.sprites.attack1.image
          this.framesMax = this.sprites.attack1.framesMax
          this.framesCurrent = 0
        }
        break
      
      // 防御系ポーズ
      case 'guard':
        // ガードモーション
        if (this.sprites.guard && this.image !== this.sprites.guard.image) {
          this.image = this.sprites.guard.image
          this.framesMax = this.sprites.guard.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: idleを使用
          this.image = this.sprites.idle.image
          this.framesMax = this.sprites.idle.framesMax
          this.framesCurrent = 0
        }
        break
      case 'crouch_guard':
        // しゃがみガードモーション
        if (this.sprites.crouchGuard && this.image !== this.sprites.crouchGuard.image) {
          this.image = this.sprites.crouchGuard.image
          this.framesMax = this.sprites.crouchGuard.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: idleを使用
          this.image = this.sprites.idle.image
          this.framesMax = this.sprites.idle.framesMax
          this.framesCurrent = 0
        }
        break
      
      // 移動系ポーズ
      case 'forward':
        // 前進モーション
        if (this.sprites.forward && this.image !== this.sprites.forward.image) {
          this.image = this.sprites.forward.image
          this.framesMax = this.sprites.forward.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: runを使用
          this.image = this.sprites.run.image
          this.framesMax = this.sprites.run.framesMax
          this.framesCurrent = 0
        }
        break
      case 'backward':
        // 後退モーション
        if (this.sprites.backward && this.image !== this.sprites.backward.image) {
          this.image = this.sprites.backward.image
          this.framesMax = this.sprites.backward.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: runを使用
          this.image = this.sprites.run.image
          this.framesMax = this.sprites.run.framesMax
          this.framesCurrent = 0
        }
        break
      
      // 姿勢系ポーズ
      case 'crouch':
        // しゃがみモーション
        if (this.sprites.crouch && this.image !== this.sprites.crouch.image) {
          this.image = this.sprites.crouch.image
          this.framesMax = this.sprites.crouch.framesMax
          this.framesCurrent = 0
        } else {
          // フォールバック: idleを使用
          this.image = this.sprites.idle.image
          this.framesMax = this.sprites.idle.framesMax
          this.framesCurrent = 0
        }
        break
      case 'stand':
        // 通常立ちモーション
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image
          this.framesMax = this.sprites.idle.framesMax
          this.framesCurrent = 0
        }
        break
      
      // === 既存モーション ===
      
      case 'takeHit':
        if (this.image !== this.sprites.takeHit.image) {
          this.image = this.sprites.takeHit.image
          this.framesMax = this.sprites.takeHit.framesMax
          this.framesCurrent = 0
        }
        break
      case 'death':
        if (this.image !== this.sprites.death.image) {
          this.image = this.sprites.death.image
          this.framesMax = this.sprites.death.framesMax
          this.framesCurrent = 0
        }
        break
    }
  }
}
