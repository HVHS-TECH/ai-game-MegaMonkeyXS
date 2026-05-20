const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerNameInput = document.getElementById('playerName');
const weaponList = document.getElementById('weaponList');
const startButton = document.getElementById('startButton');
const setupPanel = document.getElementById('setupPanel');
const statusWave = document.getElementById('statusWave');
const statusMonsters = document.getElementById('statusMonsters');
const statusWeapon = document.getElementById('statusWeapon');
const statusWeaponDesc = document.getElementById('statusWeaponDesc');
const statusLevel = document.getElementById('statusLevel');
const roundBanner = document.getElementById('roundBanner');
const xpBar = document.getElementById('xpBar');
const statusHealth = document.getElementById('statusHealth');
const healthBar = document.getElementById('healthBar');
const historyList = document.getElementById('historyList');
const upgradeOverlay = document.getElementById('upgradeOverlay');
const upgradeOptions = document.getElementById('upgradeOptions');
const upgradeText = document.getElementById('upgradeText');

const weapons = [
  {
    id: 'basic-club',
    name: 'Basic Club',
    description: 'A wide melee swing with a strong hitbox. Slow but devastating at close range.',
    damage: 12,
    fireRate: 900,
    speed: 1,
    radius: 14,
    hitRadius: 52,
    swingArc: Math.PI * 0.85,
    unlocked: true,
    type: 'melee'
  },
  {
    id: 'spark-dagger',
    name: 'Spark Dagger',
    description: 'Sharp energy daggers that fly quickly and pierce light enemies.',
    damage: 10,
    fireRate: 500,
    speed: 12,
    radius: 6,
    unlocked: false,
    type: 'ranged',
    pierce: 1
  },
  {
    id: 'brain-blaster',
    name: 'Brain Blaster',
    description: 'A rapid burst of bolts with good range and moderate damage.',
    damage: 13,
    fireRate: 650,
    speed: 10,
    radius: 9,
    unlocked: false,
    type: 'ranged'
  },
  {
    id: 'charged-scepter',
    name: 'Charged Scepter',
    description: 'Slow, powerful orbs that smash through Brainrot defenses.',
    damage: 22,
    fireRate: 1000,
    speed: 6,
    radius: 16,
    unlocked: false,
    type: 'ranged'
  },
  {
    id: 'sonic-swirl',
    name: 'Sonic Swirl',
    description: 'A radial burst that erupts around you, damaging nearby Brainrots.',
    damage: 16,
    fireRate: 1000,
    radius: 78,
    unlocked: false,
    type: 'swirl'
  },
  {
    id: 'mind-spike',
    name: 'Mind Spike',
    description: 'A piercing psychic lance that passes through Brainrots.',
    damage: 15,
    fireRate: 750,
    speed: 13,
    radius: 8,
    pierce: 3,
    unlocked: false,
    type: 'ranged'
  }
];

const monsterTypes = [
  {
    name: 'Tung Tung Tung Sahur',
    color: '#8f52ff',
    image: 'https://cdn.pixabay.com/photo/2020/01/21/21/45/zombie-4787396_1280.png'
  },
  {
    name: 'Tralalelo Tralala',
    color: '#ff6e8b',
    image: 'https://cdn.pixabay.com/photo/2019/10/04/18/00/zombie-4527832_1280.png'
  },
  {
    name: 'Brainrot Blob',
    color: '#4cd6ff',
    image: 'https://cdn.pixabay.com/photo/2018/03/06/21/01/zombie-3201645_1280.png'
  }
];

const worldWidth = 9999;
const worldHeight = 9999;
const monsterImageCache = {};

function loadMonsterImage(src) {
  if (monsterImageCache[src]) return monsterImageCache[src];
  const image = new Image();
  image.src = src;
  monsterImageCache[src] = image;
  return image;
}

let gameWidth = canvas.clientWidth;
let gameHeight = canvas.clientHeight;

const state = {
  running: false,
  lastTime: 0,
  spawnTimer: 0,
  attackTimer: 0,
  waveTimer: 0,
  wave: 0,
  xp: 0,
  level: 1,
  xpNeeded: 100,
  enemies: [],
  projectiles: [],
  camera: {
    x: 0,
    y: 0
  },
  player: {
    x: worldWidth / 2,
    y: worldHeight / 2,
    radius: 18,
    color: '#81e3ff',
    health: 999,
    maxHealth: 999,
    name: 'Brainiac',
    weapon: weapons[0],
    mouseX: gameWidth / 2,
    mouseY: gameHeight / 2,
    targetX: worldWidth / 2,
    targetY: worldHeight / 2,
    speed: 4.5
  }
};

function updateUI() {
  const roundText = `Round ${state.wave}`;
  statusWave.textContent = roundText;
  if (roundBanner) roundBanner.textContent = roundText;
  statusMonsters.textContent = `${state.enemies.length} Brainrots`;
  statusWeapon.textContent = state.player.weapon.name;
  statusWeaponDesc.textContent = state.player.weapon.description;
  statusLevel.textContent = `Level ${state.level}`;
  xpBar.style.width = `${Math.min(100, (state.xp / state.xpNeeded) * 100)}%`;
  statusHealth.textContent = `Health ${state.player.health} / ${state.player.maxHealth}`;
  healthBar.style.width = `${Math.max(0, (state.player.health / state.player.maxHealth) * 100)}%`;
}

function appendLog(message) {
  if (!historyList) return;
  const entry = document.createElement('li');
  entry.textContent = message;
  historyList.prepend(entry);
  if (historyList.children.length > 12) {
    historyList.removeChild(historyList.lastChild);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getWeaponButton(weapon) {
  const button = document.createElement('button');
  button.className = 'weapon-button';
  button.type = 'button';
  button.dataset.weaponId = weapon.id;
  button.innerHTML = `<span class="weapon-name">${weapon.name}</span><span class="weapon-details">${weapon.description}</span>`;
  if (weapon.unlocked) {
    button.classList.add('active');
  }
  button.addEventListener('click', () => {
    selectWeapon(weapon.id);
  });
  return button;
}

function renderWeaponChoices() {
  weaponList.innerHTML = '';
  weapons.forEach(weapon => {
    const button = getWeaponButton(weapon);
    weaponList.appendChild(button);
  });
}

function selectWeapon(id) {
  const weapon = weapons.find(w => w.id === id);
  if (!weapon) return;
  state.player.weapon = weapon;
  state.player.weapon.unlocked = true;
  updateUI();
  Array.from(weaponList.children).forEach(button => {
    button.classList.toggle('active', button.dataset.weaponId === id);
  });
}

function levelUp() {
  state.level += 1;
  state.xp -= state.xpNeeded;
  state.xpNeeded = 100 * state.level;
  appendLog(`${state.player.name} reached level ${state.level}! Choose an upgrade.`);
  showUpgradeOptions();
}

function gainXP(amount) {
  state.xp += amount;
  appendLog(`Gained ${amount} XP.`);
  while (state.xp >= state.xpNeeded) {
    levelUp();
  }
}

function getRandomSpawnPosition() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = -60;
    y = Math.random() * worldHeight;
  } else if (edge === 1) {
    x = worldWidth + 60;
    y = Math.random() * worldHeight;
  } else if (edge === 2) {
    x = Math.random() * worldWidth;
    y = -60;
  } else {
    x = Math.random() * worldWidth;
    y = worldHeight + 60;
  }
  return { x, y };
}

function updateCamera() {
  state.camera.x = state.player.x - gameWidth / 2;
  state.camera.y = state.player.y - gameHeight / 2;
}

function updatePlayerPosition(delta) {
  const targetX = state.player.targetX;
  const targetY = state.player.targetY;
  let dx = targetX - state.player.x;
  let dy = targetY - state.player.y;
  const distance = Math.hypot(dx, dy);

  if (distance > 6) {
    dx /= distance;
    dy /= distance;
    state.player.x += dx * state.player.speed * delta;
    state.player.y += dy * state.player.speed * delta;
  }

  state.player.x = clamp(state.player.x, state.player.radius, worldWidth - state.player.radius);
  state.player.y = clamp(state.player.y, state.player.radius, worldHeight - state.player.radius);
  updateCamera();
}

function spawnEnemy() {
  const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
  const levelVariance = Math.max(1, state.wave + Math.floor(Math.random() * 2));
  const health = 34 + state.wave * 4 + levelVariance * 4;
  const speed = 0.35 + Math.min(0.8, state.wave * 0.025 + Math.random() * 0.2);
  const spawn = getRandomSpawnPosition();
  state.enemies.push({
    id: String(Date.now()) + Math.random(),
    name: monsterType.name,
    color: monsterType.color,
    image: monsterType.image,
    x: spawn.x,
    y: spawn.y,
    radius: 22 + Math.min(10, state.wave * 0.8),
    hp: health,
    maxHp: health,
    speed: speed,
    level: levelVariance,
    hitCooldown: 0
  });
}

function nextWave() {
  state.wave += 1;
  state.spawnTimer = 0;
  state.waveTimer = 0;
  appendLog(`Round ${state.wave} begins!`);
}

function moveEnemies(delta) {
  for (const enemy of state.enemies) {
    enemy.hitCooldown = Math.max(0, enemy.hitCooldown - delta);
    const dx = state.player.x - enemy.x;
    const dy = state.player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / dist) * enemy.speed * delta;
    enemy.y += (dy / dist) * enemy.speed * delta;
    if (Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) <= enemy.radius + state.player.radius) {
      if (enemy.hitCooldown <= 0) {
        const damage = 1 + Math.floor(state.wave * 0.2);
        state.player.health -= damage;
        state.player.health = Math.max(0, state.player.health);
        enemy.hitCooldown = 180;
        appendLog(`Hit by ${enemy.name} for ${damage} damage.`);
      }
    }
  }
}

function fireProjectile() {
  const weapon = state.player.weapon;
  const targetX = state.camera.x + state.player.mouseX;
  const targetY = state.camera.y + state.player.mouseY;
  const dx = targetX - state.player.x;
  const dy = targetY - state.player.y;
  const dist = Math.hypot(dx, dy) || 1;

  if (weapon.type === 'melee') {
    state.projectiles.push({
      type: 'melee',
      x: state.player.x,
      y: state.player.y,
      radius: weapon.hitRadius || weapon.radius * 3,
      damage: weapon.damage,
      life: 10,
      hitTargets: [],
      angle: Math.atan2(dy, dx),
      arc: weapon.swingArc || Math.PI * 0.8
    });
    return;
  }

  if (weapon.type === 'swirl') {
    state.projectiles.push({
      type: 'swirl',
      x: state.player.x,
      y: state.player.y,
      radius: weapon.radius,
      damage: weapon.damage,
      life: 18,
      hitTargets: []
    });
    return;
  }

  state.projectiles.push({
    type: 'ranged',
    x: state.player.x,
    y: state.player.y,
    dx: dx / dist,
    dy: dy / dist,
    speed: weapon.speed * 1.4,
    damage: weapon.damage,
    radius: weapon.radius,
    life: 1200,
    pierce: weapon.pierce || 0
  });
}

function updateProjectiles(delta) {
  for (const projectile of state.projectiles) {
    if (projectile.type === 'ranged') {
      projectile.x += projectile.dx * projectile.speed * delta;
      projectile.y += projectile.dy * projectile.speed * delta;
    } else {
      projectile.x = state.player.x;
      projectile.y = state.player.y;
    }
    projectile.life -= delta;
  }
  state.projectiles = state.projectiles.filter(p => {
    if (p.life <= 0) return false;
    if (p.type === 'melee') return true;
    return p.x >= -50 && p.x <= worldWidth + 50 && p.y >= -50 && p.y <= worldHeight + 50;
  });
}

function checkProjectileCollisions() {
  for (const projectile of state.projectiles) {
    for (const enemy of state.enemies) {
      if ((projectile.type === 'melee' || projectile.type === 'swirl') && projectile.hitTargets.includes(enemy.id)) {
        continue;
      }
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
      if (projIntersectsEnemy(projectile, enemy, dist)) {
        enemy.hp -= projectile.damage;
        if (projectile.type === 'ranged' && projectile.pierce <= 0) {
          projectile.life = 0;
        }
        if (projectile.type === 'melee' || projectile.type === 'swirl') {
          projectile.hitTargets.push(enemy.id);
        }
        if (projectile.type === 'ranged' && projectile.pierce > 0) {
          projectile.pierce -= 1;
        }
        if (enemy.hp <= 0) {
          const expGain = 18 + enemy.level * 12 + state.wave * 5;
          gainXP(expGain);
          appendLog(`${enemy.name} defeated! +${expGain} XP.`);
          const index = state.enemies.indexOf(enemy);
          if (index !== -1) state.enemies.splice(index, 1);
        }
      }
    }
  }
}

function projIntersectsEnemy(projectile, enemy, dist) {
  if (projectile.type === 'swirl') {
    return dist < projectile.radius + enemy.radius;
  }
  return dist < projectile.radius + enemy.radius;
}

function chooseUpgrade(choice) {
  if (choice.type === 'weapon-upgrade') {
    choice.weapon.damage += choice.value;
    choice.weapon.fireRate = Math.max(220, choice.weapon.fireRate - 60);
    appendLog(`${choice.weapon.name} upgraded by +${choice.value} damage.`);
  } else if (choice.type === 'unlock-weapon') {
    const weapon = weapons.find(w => w.id === choice.weaponId);
    if (weapon) {
      weapon.unlocked = true;
      state.player.weapon = weapon;
      appendLog(`Unlocked new weapon: ${weapon.name}.`);
    }
  }
  hideUpgradeOptions();
}

function showUpgradeOptions() {
  upgradeOptions.innerHTML = '';
  const unlocked = weapons.filter(w => w.unlocked);
  const locked = weapons.filter(w => !w.unlocked);
  const choices = [];

  const upgradeWeapon = unlocked[Math.floor(Math.random() * unlocked.length)];
  choices.push({
    title: `Upgrade ${upgradeWeapon.name}`,
    description: `Increase damage and fire speed for your current weapon.`,
    type: 'weapon-upgrade',
    weapon: upgradeWeapon,
    value: 4
  });

  if (locked.length > 0) {
    const newWeapon = locked[Math.floor(Math.random() * locked.length)];
    choices.push({
      title: `Unlock ${newWeapon.name}`,
      description: newWeapon.description,
      type: 'unlock-weapon',
      weaponId: newWeapon.id
    });
  }

  if (choices.length < 3) {
    const extraChoice = {
      title: `Increase Max Health`,
      description: 'Gain extra stamina for future waves.',
      type: 'health-upgrade',
      value: 10
    };
    choices.push(extraChoice);
  }

  while (choices.length < 3) {
    const weaponChoice = unlocked[Math.floor(Math.random() * unlocked.length)];
    choices.push({
      title: `Boost ${weaponChoice.name}`,
      description: 'Slightly increase your weapon power.',
      type: 'weapon-upgrade',
      weapon: weaponChoice,
      value: 3
    });
  }

  for (const option of choices) {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<h4>${option.title}</h4><p>${option.description}</p><button type="button">Select</button>`;
    card.querySelector('button').addEventListener('click', () => {
      if (option.type === 'health-upgrade') {
        state.player.maxHealth += option.value;
        state.player.health = Math.min(state.player.maxHealth, state.player.health + 10);
        appendLog(`Max health increased by ${option.value}.`);
        hideUpgradeOptions();
      } else {
        chooseUpgrade(option);
      }
      updateUI();
    });
    upgradeOptions.appendChild(card);
  }

  upgradeText.textContent = `Level ${state.level} reached! Pick one reward to keep your run going.`;
  upgradeOverlay.style.display = 'flex';
  state.running = false;
}

function hideUpgradeOptions() {
  upgradeOverlay.style.display = 'none';
  state.running = true;
}

function resetGame() {
  state.running = false;
  state.wave = 0;
  state.xp = 0;
  state.level = 1;
  state.xpNeeded = 100;
  state.enemies = [];
  state.projectiles = [];
  state.player.health = 120;
  state.player.maxHealth = 120;
  state.player.x = worldWidth / 2;
  state.player.y = worldHeight / 2;
  state.player.mouseX = gameWidth / 2;
  state.player.mouseY = gameHeight / 2;
  state.player.targetX = worldWidth / 2;
  state.player.targetY = worldHeight / 2;
  updateCamera();
  if (setupPanel) setupPanel.style.display = '';
  startButton.textContent = 'Start Run';
  appendLog('Run reset. Choose a weapon and begin again.');
  updateUI();
}

function startRun() {
  if (!state.player.weapon) {
    appendLog('Please choose a weapon before starting.');
    return;
  }
  state.player.name = playerNameInput.value.trim() || 'Brainiac';
  resetGame();
  nextWave();
  state.running = true;
  state.lastTime = performance.now();
  if (setupPanel) setupPanel.style.display = 'none';
  startButton.textContent = 'Restart Run';
  appendLog(`${state.player.name} enters the Brainrot arena.`);
  requestAnimationFrame(gameLoop);
}

function updateState(delta) {
  if (!state.running) return;

  state.spawnTimer += delta;
  state.waveTimer += delta;
  state.attackTimer += delta;
  updatePlayerPosition(delta / 16);

  if (state.enemies.length === 0 && state.wave > 0 && state.waveTimer > 2000) {
    nextWave();
  }

  const spawnInterval = Math.max(2400, 3800 - state.wave * 60);
  if (state.spawnTimer >= spawnInterval) {
    state.spawnTimer = 0;
    const spawnCount = 1 + Math.floor(state.wave / 5);
    for (let i = 0; i < spawnCount; i += 1) {
      spawnEnemy();
    }
  }

  if (state.attackTimer >= state.player.weapon.fireRate) {
    state.attackTimer = 0;
    fireProjectile();
  }

  moveEnemies(delta / 16);
  updateProjectiles(delta / 16);
  checkProjectileCollisions();

  if (state.player.health <= 0) {
    state.player.health = 0;
    state.running = false;
    appendLog(`${state.player.name} has been consumed by Brainrot. Game over.`);
    startButton.textContent = 'Restart Run';
  }
}

function drawGrassBackground() {
  ctx.fillStyle = '#162e1b';
  ctx.fillRect(state.camera.x, state.camera.y, gameWidth, gameHeight);
  ctx.fillStyle = 'rgba(48, 105, 48, 0.16)';
  const bladeSpacing = 28;
  const startX = Math.floor(state.camera.x / bladeSpacing) * bladeSpacing;
  const startY = Math.floor(state.camera.y / bladeSpacing) * bladeSpacing;

  for (let x = startX; x < state.camera.x + gameWidth + bladeSpacing; x += bladeSpacing) {
    for (let y = startY; y < state.camera.y + gameHeight + bladeSpacing; y += bladeSpacing) {
      const offsetX = x + ((x + y) % 2 ? 6 : -6);
      const offsetY = y + ((x + y) % 2 ? 3 : -3);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(offsetX + 3, offsetY - 12);
      ctx.lineTo(offsetX + 6, offsetY);
      ctx.strokeStyle = 'rgba(186, 236, 125, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function drawScene() {
  if (!gameWidth || !gameHeight) return;
  
  ctx.clearRect(0, 0, gameWidth, gameHeight);

  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);
  drawGrassBackground();

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.arc(state.player.x, state.player.y, state.player.radius + 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const projectile of state.projectiles) {
    if (projectile.type === 'melee') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 190, 90, 0.9)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, projectile.angle - projectile.arc / 2, projectile.angle + projectile.arc / 2);
      ctx.stroke();
      ctx.restore();
    } else if (projectile.type === 'swirl') {
      ctx.save();
      ctx.strokeStyle = 'rgba(135, 255, 250, 0.85)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const enemy of state.enemies) {
    const monster = monsterTypes.find(m => m.color === enemy.color) || monsterTypes[0];
    const image = loadMonsterImage(monster.image);

    if (image.complete) {
      const size = enemy.radius * 2.4;
      ctx.save();
      ctx.drawImage(image, enemy.x - size / 2, enemy.y - size / 2, size, size);
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = enemy.color;
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, enemy.x, enemy.y - enemy.radius - 10);
    ctx.restore();

    const lifePercent = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(enemy.x - enemy.radius, enemy.y + enemy.radius + 8, enemy.radius * 2, 6);
    ctx.fillStyle = '#7ef3c8';
    ctx.fillRect(enemy.x - enemy.radius, enemy.y + enemy.radius + 8, enemy.radius * 2 * lifePercent, 6);
    ctx.restore();
  }

  for (const projectile of state.projectiles) {
    if (projectile.type === 'ranged') {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = projectile.pierce > 0 ? '#54f6ff' : '#f7f07d';
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();

  const centerX = gameWidth / 2;
  const centerY = gameHeight / 2;

  ctx.save();
  ctx.fillStyle = state.player.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, state.player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b7eeff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(state.player.name, centerX, centerY - state.player.radius - 12);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(state.player.mouseX, state.player.mouseY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function resizeCanvas() {
  gameWidth = canvas.clientWidth || 1080;
  gameHeight = canvas.clientHeight || 600;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = gameWidth * ratio;
  canvas.height = gameHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  state.player.x = clamp(state.player.x, state.player.radius, worldWidth - state.player.radius);
  state.player.y = clamp(state.player.y, state.player.radius, worldHeight - state.player.radius);
  updateCamera();
}

function gameLoop(currentTime) {
  const delta = currentTime - state.lastTime;
  state.lastTime = currentTime;
  updateState(delta);
  drawScene();
  updateUI();
  requestAnimationFrame(gameLoop);
}

function updateMousePositionFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clamp(event.clientX - rect.left, 0, rect.width);
  const mouseY = clamp(event.clientY - rect.top, 0, rect.height);
  state.player.mouseX = mouseX;
  state.player.mouseY = mouseY;
  state.player.targetX = state.camera.x + mouseX;
  state.player.targetY = state.camera.y + mouseY;
}

canvas.addEventListener('mousemove', updateMousePositionFromEvent);

document.addEventListener('mousemove', event => {
  if (event.target !== canvas && !canvas.contains(event.target)) {
    updateMousePositionFromEvent(event);
  }
});

window.addEventListener('resize', () => {
  resizeCanvas();
});

startButton.addEventListener('click', startRun);

playerNameInput.addEventListener('input', () => {
  state.player.name = playerNameInput.value.trim() || 'Brainiac';
});

resizeCanvas();
renderWeaponChoices();
selectWeapon(weapons[0].id);
updateUI();

const observer = new MutationObserver(() => {
  state.player.weapon = weapons.find(w => w.id === state.player.weapon.id) || state.player.weapon;
});
observer.observe(weaponList, { childList: true, subtree: true });

requestAnimationFrame(gameLoop);
