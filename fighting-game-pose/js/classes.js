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

  animateFrames() {
    this.framesElapsed++

    if (this.framesElapsed % this.framesHold === 0) {
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
            break;
          }
        }
      }
    }
  }

  attack(attackType = 'punch') {
    if (!this.isAttacking && !this.dead) {
      this.isAttacking = true;
      this.attackType = attackType;
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

    // overriding all other animations with attack animations
    const attackSprites = ['punch', 'kick', 'crouch_Punch', 'crouch_Kick'];
    for (const attackSprite of attackSprites) {
      if (this.sprites[attackSprite] && 
          this.image === this.sprites[attackSprite].image &&
          this.framesCurrent < this.sprites[attackSprite].framesMax - 1) {
        return;
      }
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
          setSprite(this.sprites.guard);
        } else if (this.sprites.idle) {
          setSprite(this.sprites.idle);
        }
        break
      case 'crouch_guard':
        if (this.sprites.crouchGuard) {
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