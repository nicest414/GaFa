// filepath: c:\\Users\\ketya\\GaFa\\frontend\\sketch.js
let x = 200;
let y = 200;
let speed = 4;

function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("container");
  noStroke();
}

function draw() {
  background(20);
  // 入力
  if (keyIsDown(LEFT_ARROW)) x -= speed;
  if (keyIsDown(RIGHT_ARROW)) x += speed;
  if (keyIsDown(UP_ARROW)) y -= speed;
  if (keyIsDown(DOWN_ARROW)) y += speed;

  // 表示
  fill(200, 160, 40);
  circle(x, y, 50);
}
