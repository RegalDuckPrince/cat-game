"use strict";
(() => {
  // src/canvas.ts
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;
  var H = canvas.height;

  // src/levels.ts
  var LEVELS = [
    {
      // Level 1 - Easy intro
      startPipe: { x: 350, y: 0, w: 100, h: 60 },
      basket: { x: 620, y: 450, w: 80, h: 50 },
      walls: [],
      spikes: [],
      inventory: { bouncer: 2, well: 1, plank: 2 },
      hint: "Redirect the cat into the basket!"
    },
    {
      // Level 2 - Spikes
      startPipe: { x: 50, y: 0, w: 100, h: 60 },
      basket: { x: 630, y: 440, w: 80, h: 50 },
      walls: [
        { x1: 200, y1: 0, x2: 200, y2: 250 },
        { x1: 200, y1: 250, x2: 450, y2: 250 }
      ],
      spikes: [{ x: 200, y: 530, w: 250 }],
      inventory: { bouncer: 2, well: 2, plank: 2 },
      hint: "Use planks to bridge over the spikes!"
    },
    {
      // Level 3 - Gravity wells
      startPipe: { x: 640, y: 0, w: 100, h: 60 },
      basket: { x: 80, y: 420, w: 80, h: 50 },
      walls: [
        { x1: 380, y1: 0, x2: 380, y2: 320 },
        { x1: 100, y1: 200, x2: 380, y2: 200 }
      ],
      spikes: [
        { x: 80, y: 530, w: 180 },
        { x: 500, y: 530, w: 200 }
      ],
      inventory: { bouncer: 1, well: 3, plank: 2 },
      hint: "Use gravity wells to pull the cat around obstacles!"
    },
    {
      // Level 4 - Hot floor
      startPipe: { x: 360, y: 0, w: 80, h: 60 },
      basket: { x: 50, y: 200, w: 80, h: 55 },
      walls: [
        { x1: 0, y1: 310, x2: 280, y2: 310 },
        { x1: 500, y1: 160, x2: 800, y2: 160 }
      ],
      spikes: [{ x: 0, y: 530, w: 800 }],
      inventory: { bouncer: 2, well: 1, plank: 3 },
      hint: "Don't touch the floor! Guide the cat to the left basket."
    }
  ];

  // src/constants.ts
  var GRAVITY = 0.38;
  var AIR_DAMPING = 0.995;
  var WALL_RESTITUTION = 0.45;
  var BOUNCER_IMPULSE = 14;
  var WELL_STRENGTH = 0.18;
  var WELL_RADIUS = 90;
  var MAX_SPEED = 18;

  // src/physics.ts
  function circleSegmentCollision(cat2, seg) {
    const dx = seg.x2 - seg.x1;
    const dy = seg.y2 - seg.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0)
      return null;
    const t = Math.max(0, Math.min(1, ((cat2.x - seg.x1) * dx + (cat2.y - seg.y1) * dy) / lenSq));
    const closestX = seg.x1 + t * dx;
    const closestY = seg.y1 + t * dy;
    const distX = cat2.x - closestX;
    const distY = cat2.y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);
    if (dist >= cat2.r || dist === 0)
      return null;
    return {
      nx: distX / dist,
      ny: distY / dist,
      overlap: cat2.r - dist
    };
  }
  function circleBouncer(cat2, bouncer) {
    const dx = cat2.x - bouncer.x;
    const dy = cat2.y - bouncer.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = cat2.r + bouncer.r;
    if (dist >= minDist || dist === 0)
      return null;
    return {
      nx: dx / dist,
      ny: dy / dist,
      overlap: minDist - dist
    };
  }
  function resolveSegment(cat2, result) {
    const { nx, ny, overlap } = result;
    cat2.x += nx * overlap;
    cat2.y += ny * overlap;
    const dot = cat2.vx * nx + cat2.vy * ny;
    if (dot < 0) {
      cat2.vx -= (1 + WALL_RESTITUTION) * dot * nx;
      cat2.vy -= (1 + WALL_RESTITUTION) * dot * ny;
    }
  }
  function resolveBouncer(cat2, result) {
    const { nx, ny, overlap } = result;
    cat2.x += nx * overlap;
    cat2.y += ny * overlap;
    const dot = cat2.vx * nx + cat2.vy * ny;
    if (dot < 0) {
      cat2.vx -= 2 * dot * nx;
      cat2.vy -= 2 * dot * ny;
    }
    cat2.vx += nx * BOUNCER_IMPULSE;
    cat2.vy += ny * BOUNCER_IMPULSE;
  }
  function applyWells(cat2, wells) {
    for (const well of wells) {
      const dx = well.x - cat2.x;
      const dy = well.y - cat2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < WELL_RADIUS && dist > 0) {
        const force = WELL_STRENGTH * (1 - dist / WELL_RADIUS);
        cat2.vx += force * dx / dist;
        cat2.vy += force * dy / dist;
      }
    }
  }
  function stepCat(cat2) {
    cat2.vy += GRAVITY;
    cat2.vx *= AIR_DAMPING;
    cat2.vy *= AIR_DAMPING;
    const speed = Math.sqrt(cat2.vx * cat2.vx + cat2.vy * cat2.vy);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      cat2.vx *= scale;
      cat2.vy *= scale;
    }
    cat2.x += cat2.vx;
    cat2.y += cat2.vy;
  }
  var SPIKE_HEIGHT = 20;
  function catOnSpike(cat2, spikes) {
    for (const spike of spikes) {
      if (cat2.x + cat2.r > spike.x && cat2.x - cat2.r < spike.x + spike.w && cat2.y + cat2.r > spike.y - SPIKE_HEIGHT && cat2.y - cat2.r < spike.y) {
        return true;
      }
    }
    return false;
  }
  function catInBasket(cat2, basket) {
    return cat2.x > basket.x + 10 && cat2.x < basket.x + basket.w - 10 && cat2.y > basket.y && cat2.y < basket.y + basket.h;
  }
  function resolveWalls(cat2, W2, H2) {
    if (cat2.x - cat2.r < 0) {
      cat2.x = cat2.r;
      cat2.vx = Math.abs(cat2.vx) * WALL_RESTITUTION;
    }
    if (cat2.x + cat2.r > W2) {
      cat2.x = W2 - cat2.r;
      cat2.vx = -Math.abs(cat2.vx) * WALL_RESTITUTION;
    }
    if (cat2.y - cat2.r < 0) {
      cat2.y = cat2.r;
      cat2.vy = Math.abs(cat2.vy) * WALL_RESTITUTION;
    }
    if (cat2.y - cat2.r > H2) {
      return true;
    }
    return false;
  }

  // src/renderer.ts
  function drawBackground() {
    ctx.fillStyle = "#07111f";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#0d1f35";
    ctx.lineWidth = 1;
    const gridSize = 40;
    ctx.beginPath();
    for (let x = 0; x <= W; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
  }
  function drawWalls(walls) {
    ctx.strokeStyle = "#4a9fd4";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (const seg of walls) {
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    }
  }
  function drawSpikes(spikes) {
    for (const spike of spikes) {
      const triWidth = 20;
      const triHeight = 20;
      const count = Math.floor(spike.w / triWidth);
      ctx.fillStyle = "#e74c3c";
      ctx.strokeStyle = "#ff6b5a";
      ctx.lineWidth = 1;
      for (let i = 0; i < count; i++) {
        const bx = spike.x + i * triWidth;
        const by = spike.y;
        const apex = spike.y - triHeight;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + triWidth / 2, apex);
        ctx.lineTo(bx + triWidth, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  function drawStartPipe(pipe) {
    ctx.fillStyle = "#1a3a5c";
    ctx.strokeStyle = "#4a7aa4";
    ctx.lineWidth = 2;
    ctx.fillRect(pipe.x, pipe.y, pipe.w, pipe.h);
    ctx.beginPath();
    ctx.moveTo(pipe.x, pipe.y + pipe.h);
    ctx.lineTo(pipe.x, pipe.y);
    ctx.lineTo(pipe.x + pipe.w, pipe.y);
    ctx.lineTo(pipe.x + pipe.w, pipe.y + pipe.h);
    ctx.stroke();
  }
  function drawBasket(basket, phase2) {
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    if (phase2 === "won") {
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.fillRect(basket.x, basket.y, basket.w, basket.h);
    }
    ctx.beginPath();
    ctx.moveTo(basket.x, basket.y);
    ctx.lineTo(basket.x, basket.y + basket.h);
    ctx.lineTo(basket.x + basket.w, basket.y + basket.h);
    ctx.lineTo(basket.x + basket.w, basket.y);
    ctx.stroke();
  }
  function drawBouncers(bouncers) {
    for (const b of bouncers) {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00e5ff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 229, 255, 0.2)";
      ctx.fill();
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawWells(wells) {
    for (const w of wells) {
      ctx.beginPath();
      ctx.arc(w.x, w.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#b44fff";
      ctx.fill();
      ctx.strokeStyle = "#d080ff";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.arc(w.x, w.y, WELL_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180, 79, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawPlanks(planks) {
    ctx.strokeStyle = "#78c878";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (const plank of planks) {
      ctx.beginPath();
      ctx.moveTo(plank.x1, plank.y1);
      ctx.lineTo(plank.x2, plank.y2);
      ctx.stroke();
    }
  }
  function drawCat(cat2) {
    const x = cat2.x;
    const y = cat2.y;
    const r = cat2.r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y - r * 0.7);
    ctx.lineTo(x - r * 0.9, y - r * 1.5);
    ctx.lineTo(x - r * 0.1, y - r * 1);
    ctx.closePath();
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.6, y - r * 0.7);
    ctx.lineTo(x + r * 0.9, y - r * 1.5);
    ctx.lineTo(x + r * 0.1, y - r * 1);
    ctx.closePath();
    ctx.fillStyle = "#ffd700";
    ctx.fill();
    ctx.strokeStyle = "#ffaa00";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function drawParticles(particles2) {
    for (const p of particles2) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }
  function drawPlankPreview(start, end) {
    ctx.save();
    ctx.strokeStyle = "#78c878";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.setLineDash([8, 5]);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();
  }
  function drawOverlay(phase2, level) {
    if (phase2 === "building" || phase2 === "playing")
      return;
    ctx.fillStyle = "rgba(7, 17, 31, 0.65)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (phase2 === "won") {
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 56px monospace";
      ctx.fillText("YOU WIN! \u{1F431}", W / 2, H / 2 - 30);
      ctx.fillStyle = "#aaddff";
      ctx.font = "22px monospace";
      const isLastLevel = level >= 2;
      ctx.fillText(
        isLastLevel ? "Click to play again!" : "Click to continue \u2192",
        W / 2,
        H / 2 + 30
      );
    } else if (phase2 === "dead") {
      ctx.fillStyle = "#e74c3c";
      ctx.font = "bold 56px monospace";
      ctx.fillText("OH NO! \u{1F431}", W / 2, H / 2 - 30);
      ctx.fillStyle = "#aaddff";
      ctx.font = "22px monospace";
      ctx.fillText("Click to retry", W / 2, H / 2 + 30);
    }
  }

  // src/main.ts
  var currentLevel = 0;
  var phase = "building";
  var activeTool = null;
  var placedBouncers = [];
  var placedWells = [];
  var placedPlanks = [];
  var plankStart = null;
  var mousePos = { x: 0, y: 0 };
  var cat = { x: 0, y: 0, vx: 0, vy: 0, r: 14 };
  var particles = [];
  var inventory = { bouncer: 0, well: 0, plank: 0 };
  function el(id) {
    return document.getElementById(id);
  }
  function btn(id) {
    return document.getElementById(id);
  }
  function updateCounts() {
    el("count-bouncer").textContent = `\xD7${inventory.bouncer}`;
    el("count-well").textContent = `\xD7${inventory.well}`;
    el("count-plank").textContent = `\xD7${inventory.plank}`;
    btn("btn-bouncer").disabled = inventory.bouncer === 0;
    btn("btn-well").disabled = inventory.well === 0;
    btn("btn-plank").disabled = inventory.plank === 0;
  }
  function selectTool(tool) {
    ["btn-bouncer", "btn-well", "btn-plank", "btn-remove"].forEach(
      (id) => btn(id).classList.remove("active")
    );
    if (tool !== null) {
      const idMap = {
        bouncer: "btn-bouncer",
        well: "btn-well",
        plank: "btn-plank",
        remove: "btn-remove"
      };
      btn(idMap[tool]).classList.add("active");
    }
    plankStart = null;
    activeTool = tool;
  }
  function spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color
      });
    }
  }
  function loadLevel(idx) {
    currentLevel = idx;
    phase = "building";
    activeTool = null;
    const level = LEVELS[idx];
    inventory = { ...level.inventory };
    placedBouncers = [];
    placedWells = [];
    placedPlanks = [];
    plankStart = null;
    particles = [];
    const pipe = level.startPipe;
    cat = {
      x: pipe.x + pipe.w / 2,
      y: pipe.y + pipe.h + 14,
      vx: 0,
      vy: 0,
      r: 14
    };
    el("level-display").textContent = `LEVEL ${idx + 1}`;
    el("status-bar").textContent = level.hint;
    updateCounts();
    selectTool(null);
    btn("btn-play").disabled = false;
    btn("btn-reset").disabled = false;
    btn("btn-bouncer").disabled = inventory.bouncer === 0;
    btn("btn-well").disabled = inventory.well === 0;
    btn("btn-plank").disabled = inventory.plank === 0;
    btn("btn-remove").disabled = false;
  }
  function update() {
    if (phase !== "playing") {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
      }
      particles = particles.filter((p) => p.life > 0);
      return;
    }
    const level = LEVELS[currentLevel];
    applyWells(cat, placedWells);
    stepCat(cat);
    for (const seg of level.walls) {
      const result = circleSegmentCollision(cat, seg);
      if (result)
        resolveSegment(cat, result);
    }
    for (const plank of placedPlanks) {
      const result = circleSegmentCollision(cat, plank);
      if (result)
        resolveSegment(cat, result);
    }
    for (const bouncer of placedBouncers) {
      const result = circleBouncer(cat, bouncer);
      if (result) {
        resolveBouncer(cat, result);
        const cx = cat.x - result.nx * bouncer.r;
        const cy = cat.y - result.ny * bouncer.r;
        spawnParticles(cx, cy, "#00e5ff", 8);
      }
    }
    const fellOff = resolveWalls(cat, W, H);
    if (fellOff) {
      phase = "dead";
      spawnParticles(cat.x, H - 10, "#e74c3c", 12);
      el("status-bar").textContent = "\u{1F480} Oh no! Click to retry...";
      btn("btn-play").disabled = true;
      return;
    }
    if (catOnSpike(cat, level.spikes)) {
      phase = "dead";
      spawnParticles(cat.x, cat.y, "#e74c3c", 12);
      el("status-bar").textContent = "\u{1F480} Oh no! Click to retry...";
      btn("btn-play").disabled = true;
      return;
    }
    if (catInBasket(cat, level.basket)) {
      phase = "won";
      spawnParticles(cat.x, cat.y, "#ffd700", 12);
      spawnParticles(cat.x, cat.y, "#00e5ff", 8);
      el("status-bar").textContent = "\u{1F431} You got in! Click to continue...";
      btn("btn-play").disabled = true;
      return;
    }
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    }
    particles = particles.filter((p) => p.life > 0);
  }
  function render() {
    const level = LEVELS[currentLevel];
    drawBackground();
    drawWalls(level.walls);
    drawSpikes(level.spikes);
    drawStartPipe(level.startPipe);
    drawBasket(level.basket, phase);
    drawPlanks(placedPlanks);
    drawBouncers(placedBouncers);
    drawWells(placedWells);
    drawCat(cat);
    drawParticles(particles);
    if (phase === "building" && activeTool === "plank" && plankStart !== null) {
      drawPlankPreview(plankStart, mousePos);
    }
    drawOverlay(phase, currentLevel);
  }
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    if (phase === "won") {
      if (currentLevel + 1 < LEVELS.length) {
        loadLevel(currentLevel + 1);
      } else {
        loadLevel(currentLevel);
      }
      return;
    }
    if (phase === "dead") {
      loadLevel(currentLevel);
      return;
    }
    if (phase !== "building")
      return;
    if (activeTool === "bouncer" && inventory.bouncer > 0) {
      placedBouncers.push({ x, y, r: 22 });
      inventory.bouncer--;
      updateCounts();
      if (inventory.bouncer === 0)
        selectTool(null);
    } else if (activeTool === "well" && inventory.well > 0) {
      placedWells.push({ x, y });
      inventory.well--;
      updateCounts();
      if (inventory.well === 0)
        selectTool(null);
    } else if (activeTool === "plank" && inventory.plank > 0) {
      if (plankStart === null) {
        plankStart = { x, y };
      } else {
        placedPlanks.push({ x1: plankStart.x, y1: plankStart.y, x2: x, y2: y });
        inventory.plank--;
        plankStart = null;
        updateCounts();
        if (inventory.plank === 0)
          selectTool(null);
      }
    } else if (activeTool === "remove") {
      let removed = false;
      for (let i = 0; i < placedBouncers.length; i++) {
        const b = placedBouncers[i];
        if (Math.hypot(b.x - x, b.y - y) < 30) {
          placedBouncers.splice(i, 1);
          inventory.bouncer++;
          updateCounts();
          removed = true;
          break;
        }
      }
      if (!removed) {
        for (let i = 0; i < placedWells.length; i++) {
          const w = placedWells[i];
          if (Math.hypot(w.x - x, w.y - y) < 30) {
            placedWells.splice(i, 1);
            inventory.well++;
            updateCounts();
            removed = true;
            break;
          }
        }
      }
      if (!removed) {
        for (let i = 0; i < placedPlanks.length; i++) {
          const p = placedPlanks[i];
          const mx = (p.x1 + p.x2) / 2;
          const my = (p.y1 + p.y2) / 2;
          if (Math.hypot(mx - x, my - y) < 40) {
            placedPlanks.splice(i, 1);
            inventory.plank++;
            updateCounts();
            break;
          }
        }
      }
    }
  });
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = (e.clientX - rect.left) * (W / rect.width);
    mousePos.y = (e.clientY - rect.top) * (H / rect.height);
  });
  btn("btn-bouncer").addEventListener("click", () => selectTool("bouncer"));
  btn("btn-well").addEventListener("click", () => selectTool("well"));
  btn("btn-plank").addEventListener("click", () => selectTool("plank"));
  btn("btn-remove").addEventListener("click", () => selectTool("remove"));
  btn("btn-play").addEventListener("click", () => {
    if (phase === "building") {
      phase = "playing";
      el("status-bar").textContent = "PLAYING...";
      btn("btn-play").disabled = true;
      btn("btn-bouncer").disabled = true;
      btn("btn-well").disabled = true;
      btn("btn-plank").disabled = true;
      btn("btn-remove").disabled = true;
    }
  });
  btn("btn-reset").addEventListener("click", () => {
    loadLevel(currentLevel);
  });
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }
  loadLevel(0);
  requestAnimationFrame(loop);
})();
