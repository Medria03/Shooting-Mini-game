const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const hpEl = document.getElementById("hp");
const enemyCountEl = document.getElementById("enemyCount");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const W = canvas.width;
const H = canvas.height;

const state = {
  running: false,
  keys: new Set(),
  mouse: { x: W / 2, y: H / 2, down: false },
  bullets: [],
  enemies: [],
  enemyBullets: [],
  score: 0,
  enemySpawnTimer: 0,
  enemySpawnGap: 0.9,
  levelTimer: 0,
};

const player = {
  x: W / 2,
  y: H / 2,
  r: 16,
  speed: 220,
  hp: 100,
  shootCd: 0,
  dashCd: 0,
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function resetGame() {
  state.bullets = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.score = 0;
  state.enemySpawnTimer = 0;
  state.enemySpawnGap = 0.9;
  state.levelTimer = 0;
  player.x = W / 2;
  player.y = H / 2;
  player.hp = 100;
  player.shootCd = 0;
  player.dashCd = 0;
  state.running = true;
  syncHud();
}

function syncHud() {
  scoreEl.textContent = state.score.toString();
  hpEl.textContent = Math.max(0, Math.floor(player.hp)).toString();
  enemyCountEl.textContent = state.enemies.length.toString();
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  const m = 24;
  let x = 0;
  let y = 0;
  if (side === 0) {
    x = Math.random() * W;
    y = -m;
  } else if (side === 1) {
    x = W + m;
    y = Math.random() * H;
  } else if (side === 2) {
    x = Math.random() * W;
    y = H + m;
  } else {
    x = -m;
    y = Math.random() * H;
  }
  const elite = Math.random() < 0.16;
  state.enemies.push({
    x,
    y,
    r: elite ? 18 : 14,
    hp: elite ? 45 : 25,
    speed: elite ? 95 : 120,
    shootCd: elite ? 1.1 : 1.8,
    elite,
  });
}

function shootFromPlayer() {
  const angle = Math.atan2(state.mouse.y - player.y, state.mouse.x - player.x);
  state.bullets.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * 550,
    vy: Math.sin(angle) * 550,
    r: 4,
    damage: 20,
  });
}

function shootFromEnemy(enemy) {
  const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const spd = enemy.elite ? 260 : 220;
  state.enemyBullets.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * spd,
    vy: Math.sin(angle) * spd,
    r: enemy.elite ? 5 : 4,
    damage: enemy.elite ? 14 : 9,
  });
}

function update(dt) {
  if (!state.running) return;

  state.levelTimer += dt;
  player.shootCd -= dt;
  player.dashCd -= dt;
  state.enemySpawnTimer -= dt;

  if (state.levelTimer > 10 && state.enemySpawnGap > 0.48) {
    state.levelTimer = 0;
    state.enemySpawnGap -= 0.05;
  }

  if (state.enemySpawnTimer <= 0) {
    state.enemySpawnTimer = state.enemySpawnGap;
    spawnEnemy();
  }

  let dx = 0;
  let dy = 0;
  if (state.keys.has("w")) dy -= 1;
  if (state.keys.has("s")) dy += 1;
  if (state.keys.has("a")) dx -= 1;
  if (state.keys.has("d")) dx += 1;
  if (dx || dy) {
    const l = Math.hypot(dx, dy);
    player.x += (dx / l) * player.speed * dt;
    player.y += (dy / l) * player.speed * dt;
  }
  player.x = clamp(player.x, player.r, W - player.r);
  player.y = clamp(player.y, player.r, H - player.r);

  if (state.mouse.down && player.shootCd <= 0) {
    shootFromPlayer();
    player.shootCd = 0.13;
  }

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
  }
  state.bullets = state.bullets.filter(
    (b) => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20,
  );

  for (const bullet of state.enemyBullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (dist(bullet, player) < bullet.r + player.r) {
      player.hp -= bullet.damage;
      bullet.hit = true;
    }
  }
  state.enemyBullets = state.enemyBullets.filter(
    (b) => !b.hit && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30,
  );

  for (const enemy of state.enemies) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed * dt;
    enemy.y += Math.sin(angle) * enemy.speed * dt;
    enemy.shootCd -= dt;

    if (enemy.shootCd <= 0) {
      shootFromEnemy(enemy);
      enemy.shootCd = enemy.elite ? 1 : 1.6;
    }

    if (dist(enemy, player) < enemy.r + player.r) {
      player.hp -= enemy.elite ? 20 * dt : 14 * dt;
    }
  }

  for (const bullet of state.bullets) {
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      if (dist(bullet, enemy) < bullet.r + enemy.r) {
        enemy.hp -= bullet.damage;
        bullet.hit = true;
        if (enemy.hp <= 0) {
          enemy.dead = true;
          state.score += enemy.elite ? 25 : 10;
        }
        break;
      }
    }
  }

  state.bullets = state.bullets.filter((b) => !b.hit);
  state.enemies = state.enemies.filter((e) => !e.dead);

  if (player.hp <= 0) {
    gameOver();
  }

  syncHud();
}

function drawPlayer() {
  const angle = Math.atan2(state.mouse.y - player.y, state.mouse.x - player.x);
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle);
  ctx.fillStyle = "#8cff5f";
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d9ffe7";
  ctx.fillRect(0, -4, player.r + 12, 8);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  drawPlayer();

  for (const b of state.bullets) {
    ctx.fillStyle = "#ffe87a";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of state.enemyBullets) {
    ctx.fillStyle = "#ff6a3d";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const e of state.enemies) {
    ctx.fillStyle = e.elite ? "#ff4e6a" : "#ff906e";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2, 4);
    ctx.fillStyle = "#8cff5f";
    ctx.fillRect(e.x - e.r, e.y - e.r - 8, (e.hp / (e.elite ? 45 : 25)) * e.r * 2, 4);
  }
}

function gameOver() {
  state.running = false;
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").textContent = "游戏结束";
  overlay.querySelector("p").textContent = `最终得分 ${state.score}，点击按钮重新开局`;
  startBtn.textContent = "再来一局";
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(k)) state.keys.add(k);
  if (e.code === "Space" && state.running && player.dashCd <= 0) {
    const angle = Math.atan2(state.mouse.y - player.y, state.mouse.x - player.x);
    player.x += Math.cos(angle) * 90;
    player.y += Math.sin(angle) * 90;
    player.x = clamp(player.x, player.r, W - player.r);
    player.y = clamp(player.y, player.r, H - player.r);
    player.dashCd = 1.2;
  }
});

window.addEventListener("keyup", (e) => {
  state.keys.delete(e.key.toLowerCase());
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  state.mouse.x = ((e.clientX - rect.left) / rect.width) * W;
  state.mouse.y = ((e.clientY - rect.top) / rect.height) * H;
});

canvas.addEventListener("mousedown", () => {
  state.mouse.down = true;
});

window.addEventListener("mouseup", () => {
  state.mouse.down = false;
});

startBtn.addEventListener("click", () => {
  overlay.classList.add("hidden");
  overlay.querySelector("h1").textContent = "Pixel Firefight";
  overlay.querySelector("p").textContent = "WASD 移动，鼠标瞄准，左键射击，空格冲刺";
  startBtn.textContent = "开始游戏";
  resetGame();
});

draw();
requestAnimationFrame(loop);
