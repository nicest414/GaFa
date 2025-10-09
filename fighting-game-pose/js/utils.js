function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
    rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  )
}

function determineWinner({ player, enemy, timerId }) {
  clearTimeout(timerId)

  // グローバル変数にゲーム終了フラグを設定
  window.gameOver = true

  const displayText = document.querySelector('#displayText')
  const resultText = document.querySelector('#resultText')
  const gameWrapper = document.querySelector('#game-wrapper')

  // リザルト画面を表示（アニメーション準備）
  displayText.style.display = 'flex'

  // 勝敗テキストを設定
  if (player.health === enemy.health) {
    resultText.innerHTML = 'Tie'
    resultText.style.color = '#FFD700' // 金色
  } else if (player.health > enemy.health) {
    resultText.innerHTML = 'Player 1 Wins'
    resultText.style.color = '#00FF00' // 緑色
  } else if (player.health < enemy.health) {
    resultText.innerHTML = 'Player 2 Wins'
    resultText.style.color = '#FF4444' // 赤色
  }

  // カットイン演出を開始（少し遅延させて）
  setTimeout(() => {
    gameWrapper.classList.add('show-result')
  }, 100)
}

let timer = 60
let timerId
function decreaseTimer() {
  if (timer > 0) {
    timerId = setTimeout(decreaseTimer, 1000)
    timer--
    document.querySelector('#timer').innerHTML = timer
  }

  if (timer === 0) {
    determineWinner({ player, enemy, timerId })
  }
}
