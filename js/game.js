import {
  PALETTE, generateLevel, generateDaily, cloneTubes,
  canPour, pourAmount, doPour, isSolved
} from "./levels.js";
import { PRODUCTS, shouldShowInterstitial, simulateAd, buyProduct } from "./monetization.js";

const LIFE_MAX = 5;
const LIFE_MS = 20 * 60 * 1000;
const UNDO_COST = 20;
const HINT_COST = 40;
const SAVE = "lumora_v1";

const $ = s => document.querySelector(s);
const t = (ua, en) => state.lang === "en" ? en : ua;

const defaultState = () => ({
  coins: 80, lives: LIFE_MAX, lifeAt: Date.now(), level: 1, maxUnlocked: 1,
  completed: {}, noAds: false, undos: 3, lang: "ua", sfx: true,
  dailyDate: "", dailyDone: false, totalWins: 0, totalPours: 0
});

let state = load();
let session = null;

function load() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(SAVE) || "{}") }; }
  catch { return defaultState(); }
}
function save() { localStorage.setItem(SAVE, JSON.stringify(state)); }

function buzz(ms = 12) {
  if (state.sfx && navigator.vibrate) navigator.vibrate(ms);
}

function beep(freq = 440, dur = 0.06) {
  if (!state.sfx) return;
  try {
    const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.value = 0.04; o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch {}
}

function refillLives() {
  if (state.lives >= LIFE_MAX) { state.lifeAt = Date.now(); return; }
  const gained = Math.floor((Date.now() - state.lifeAt) / LIFE_MS);
  if (gained > 0) {
    state.lives = Math.min(LIFE_MAX, state.lives + gained);
    state.lifeAt += gained * LIFE_MS;
    if (state.lives >= LIFE_MAX) state.lifeAt = Date.now();
  }
}

function nextLifeLabel() {
  refillLives();
  if (state.lives >= LIFE_MAX) return t("повні", "full");
  const left = LIFE_MS - ((Date.now() - state.lifeAt) % LIFE_MS);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast.tid);
  toast.tid = setTimeout(() => el.classList.remove("show"), 1800);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

function today() { return new Date().toISOString().slice(0, 10); }

function applyLang() {
  $("[data-i=shop]").textContent = t("Магазин", "Shop");
  $("[data-i=levels]").textContent = t("Рівні", "Levels");
  $("[data-i=settings]").textContent = t("Налаштування", "Settings");
  $(".tag").textContent = t("Розлий світло. Ще один раз.", "Pour the glow. One more try.");
}

function renderHome() {
  refillLives();
  $("#coins-home").textContent = state.coins;
  $("#lives-home").textContent = `${state.lives}/${LIFE_MAX}`;
  $("#life-timer").textContent = nextLifeLabel();
  $("#stat-level").textContent = state.maxUnlocked;
  $("#stat-wins").textContent = state.totalWins;
  $("#stat-coins").textContent = state.coins;
  $("#play-label").textContent = t(`Рівень ${state.level}`, `Level ${state.level}`);
  $("#daily-label").textContent = today() === state.dailyDate && state.dailyDone
    ? t("Щоденний ✓", "Daily ✓")
    : t("Щоденний виклик", "Daily challenge");
  $("#ad-home").classList.toggle("on", !state.noAds);
  applyLang();
}

function startLevel(n, daily = false) {
  refillLives();
  if (!daily && state.lives <= 0) { openModal("lives"); return; }
  const pack = daily ? generateDaily(today()) : generateLevel(n);
  session = { level: n, daily, tubes: cloneTubes(pack.tubes), cap: pack.cap, selected: -1, history: [], moves: 0, busy: false };
  $("#level-title").textContent = daily ? t("Щоденний", "Daily") : t(`Рівень ${n}`, `Level ${n}`);
  renderBoard();
  showScreen("#game");
  updateGameHud();
  $("#ad-game").classList.toggle("on", !state.noAds);
}

function updateGameHud() {
  $("#g-coins").textContent = state.coins;
  $("#g-lives").textContent = state.lives;
  $("#g-undos").textContent = state.undos;
}

function renderBoard() {
  const board = $("#board");
  board.innerHTML = "";
  session.tubes.forEach((tube, i) => {
    const el = document.createElement("button");
    el.className = "tube" + (session.selected === i ? " selected" : "");
    el.onclick = () => onTube(i);
    for (const c of tube) {
      const layer = document.createElement("div");
      layer.className = "layer";
      layer.style.background = PALETTE[c];
      el.appendChild(layer);
    }
    board.appendChild(el);
  });
}

function onTube(i) {
  if (!session || session.busy) return;
  if (session.selected < 0) {
    if (!session.tubes[i].length) { shake(i); return; }
    session.selected = i; beep(520, 0.05); buzz(8); renderBoard(); return;
  }
  if (session.selected === i) { session.selected = -1; renderBoard(); return; }
  const from = session.tubes[session.selected];
  const to = session.tubes[i];
  const n = pourAmount(from, to, session.cap);
  if (!n || !canPour(from, to, session.cap)) {
    shake(i);
    session.selected = session.tubes[i].length ? i : -1;
    renderBoard();
    return;
  }
  session.history.push(cloneTubes(session.tubes));
  doPour(from, to, session.cap);
  session.moves++; state.totalPours++; session.selected = -1;
  beep(660 + n * 40, 0.07); buzz(14); spark(); renderBoard(); save();
  if (isSolved(session.tubes, session.cap)) onWin();
}

function shake(i) {
  const el = $("#board").children[i];
  if (!el) return;
  el.classList.add("shake"); beep(180, 0.08);
  setTimeout(() => el.classList.remove("shake"), 280);
}

function spark() {
  const host = $(".app");
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("div");
    s.className = "spark";
    s.style.left = 40 + Math.random() * 60 + "%";
    s.style.top = "46%";
    s.style.background = PALETTE[Math.floor(Math.random() * 6)];
    s.style.setProperty("--x", (Math.random() * 120 - 60) + "px");
    s.style.setProperty("--y", (Math.random() * -90 - 20) + "px");
    host.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}

async function onWin() {
  session.busy = true;
  const reward = session.daily ? 80 : 20 + Math.min(session.level, 40);
  state.coins += reward; state.totalWins++;
  if (session.daily) { state.dailyDate = today(); state.dailyDone = true; }
  else {
    state.completed[session.level] = true;
    state.maxUnlocked = Math.max(state.maxUnlocked, session.level + 1);
    state.level = Math.max(state.level, session.level + 1);
  }
  save(); beep(880, 0.12); setTimeout(() => beep(1040, 0.14), 90);
  if (shouldShowInterstitial(state)) {
    toast(t("Реклама між рівнями…", "Interstitial ad…"));
    await simulateAd("interstitial");
  }
  openModal("win", reward);
}

function loseLife() {
  refillLives();
  if (state.lives > 0) { state.lives--; state.lifeAt = Date.now(); }
  save();
}

function undo() {
  if (!session?.history.length) { toast(t("Немає ходів", "No moves")); return; }
  if (state.undos <= 0) {
    if (state.coins >= UNDO_COST) { state.coins -= UNDO_COST; state.undos += 1; }
    else { openModal("adundo"); return; }
  }
  state.undos--; session.tubes = session.history.pop(); session.selected = -1;
  save(); updateGameHud(); renderBoard();
}

function hint() {
  if (state.coins < HINT_COST) { toast(t("Мало монет", "Not enough coins")); openModal("shop"); return; }
  const tubes = session.tubes;
  for (let i = 0; i < tubes.length; i++) {
    for (let j = 0; j < tubes.length; j++) {
      if (canPour(tubes[i], tubes[j], session.cap)) {
        const same = tubes[i].length && tubes[i].every(c => c === tubes[i][0]);
        if (same && tubes[j].length === 0) continue;
        state.coins -= HINT_COST; session.selected = i; save(); updateGameHud(); renderBoard();
        toast(t("Перелий цю колбу", "Pour this vial")); return;
      }
    }
  }
  toast(t("Ходу не видно", "No hint"));
}

function openModal(kind, extra) {
  const back = $("#modal-back");
  const box = $("#modal");
  let html = "";
  if (kind === "win") {
    html = `<h2>${t("Розлито!", "Sorted!")}</h2><p>${t("Монети", "Coins")}: +${extra}</p><div class="menu"><button class="btn btn-primary" id="m-next">${session.daily ? t("На головну", "Home") : t("Далі", "Next")}</button><button class="btn btn-ghost" id="m-home">${t("Меню", "Menu")}</button></div>`;
  } else if (kind === "lives") {
    html = `<h2>${t("Немає життів", "No lives")}</h2><p>${t("Наступне через", "Next in")} ${nextLifeLabel()}</p><div class="menu"><button class="btn btn-primary" id="m-adlife">${t("Реклама = +1 життя", "Watch ad = +1 life")}</button><button class="btn btn-gold" id="m-buylife">${t("30 монет = +1", "30 coins = +1")}</button><button class="btn btn-ghost" id="m-close">${t("Закрити", "Close")}</button></div>`;
  } else if (kind === "adundo") {
    html = `<h2>${t("Немає відмін", "No undos")}</h2><div class="menu"><button class="btn btn-primary" id="m-adundo">${t("Реклама = 1 відміна", "Ad = 1 undo")}</button><button class="btn btn-ghost" id="m-close">${t("Закрити", "Close")}</button></div>`;
  } else if (kind === "shop") {
    html = `<h2>${t("Магазин", "Shop")}</h2><p>${t("Монети", "Coins")}: ${state.coins} · ${state.noAds ? t("без реклами", "ads off") : t("з рекламою", "ads on")}</p><div class="shop-list">${PRODUCTS.map(p => `<div class="shop-item"><div><strong>${p.title[state.lang]}</strong><small>${p.price}</small></div><button class="btn btn-primary buy" data-id="${p.id}">${t("Купити", "Buy")}</button></div>`).join("")}</div><button class="btn btn-ghost" id="m-close" style="width:100%;margin-top:12px">${t("Закрити", "Close")}</button>`;
  } else if (kind === "pause") {
    html = `<h2>${t("Пауза", "Pause")}</h2><div class="menu"><button class="btn btn-primary" id="m-close">${t("Продовжити", "Resume")}</button><button class="btn btn-ghost" id="m-home">${t("Вийти з рівня", "Quit level")}</button></div>`;
  } else if (kind === "settings") {
    html = `<h2>${t("Налаштування", "Settings")}</h2><div class="settings-row"><span>UA / EN</span><button class="btn btn-ghost" id="m-lang">${state.lang.toUpperCase()}</button></div><div class="settings-row"><span>${t("Звук / вібрація", "Sound / haptics")}</span><button class="btn btn-ghost" id="m-sfx">${state.sfx ? "ON" : "OFF"}</button></div><p style="margin-top:14px">${t("Це демо з локальними покупками. Для сторів підключіть AdMob і IAP.", "Demo purchases are local. Wire AdMob + IAP in monetization.js for stores.")}</p><button class="btn btn-ghost" id="m-close" style="width:100%">${t("Закрити", "Close")}</button>`;
  } else if (kind === "levels") {
    const cells = Array.from({ length: 60 }, (_, i) => i + 1).map(n => {
      const lock = n > state.maxUnlocked;
      const done = !!state.completed[n];
      const cur = n === state.level;
      return `<button class="lvl ${lock ? "lock" : ""} ${done ? "done" : ""} ${cur ? "current" : ""}" data-n="${n}" ${lock ? "disabled" : ""}>${n}</button>`;
    }).join("");
    html = `<h2>${t("Рівні", "Levels")}</h2><div class="level-grid">${cells}</div><button class="btn btn-ghost" id="m-close" style="width:100%;margin-top:12px">${t("Закрити", "Close")}</button>`;
  }
  box.innerHTML = html;
  back.classList.add("show");
  box.querySelector("#m-close")?.addEventListener("click", closeModal);
  box.querySelector("#m-home")?.addEventListener("click", () => { closeModal(); quitLevel(); });
  box.querySelector("#m-next")?.addEventListener("click", () => {
    closeModal();
    if (session?.daily) { quitLevel(); return; }
    startLevel((session?.level || state.level) + 1);
  });
  box.querySelector("#m-adlife")?.addEventListener("click", async () => {
    toast(t("Реклама…", "Ad…")); await simulateAd("rewarded");
    refillLives(); state.lives = Math.min(LIFE_MAX, state.lives + 1); save(); closeModal(); startLevel(state.level);
  });
  box.querySelector("#m-buylife")?.addEventListener("click", () => {
    if (state.coins < 30) { toast(t("Мало монет", "Need coins")); return; }
    state.coins -= 30; refillLives(); state.lives = Math.min(LIFE_MAX, state.lives + 1); save(); closeModal(); startLevel(state.level);
  });
  box.querySelector("#m-adundo")?.addEventListener("click", async () => {
    await simulateAd("rewarded"); state.undos += 1; save(); closeModal(); undo();
  });
  box.querySelector("#m-lang")?.addEventListener("click", () => { state.lang = state.lang === "ua" ? "en" : "ua"; save(); openModal("settings"); renderHome(); });
  box.querySelector("#m-sfx")?.addEventListener("click", () => { state.sfx = !state.sfx; save(); openModal("settings"); });
  box.querySelectorAll(".buy").forEach(b => b.addEventListener("click", () => purchase(b.dataset.id)));
  box.querySelectorAll(".lvl").forEach(b => b.addEventListener("click", () => { closeModal(); startLevel(Number(b.dataset.n)); }));
}

function closeModal() { $("#modal-back").classList.remove("show"); }

function quitLevel() {
  if (session && !session.daily && !isSolved(session.tubes, session.cap) && session.moves > 0) loseLife();
  session = null; showScreen("#home"); renderHome();
}

async function purchase(id) {
  const res = await buyProduct(id);
  if (!res.ok) return;
  const p = res.product;
  if (p.coins) state.coins += p.coins;
  if (p.lives) { refillLives(); state.lives = Math.min(LIFE_MAX, state.lives + p.lives); }
  if (p.undos) state.undos += p.undos;
  if (p.noAds) state.noAds = true;
  save(); toast(t("Покупка успішна (демо)", "Purchase ok (demo)"));
  openModal("shop"); renderHome(); if (session) updateGameHud();
}

function bind() {
  $("#btn-play").onclick = () => startLevel(state.level);
  $("#btn-daily").onclick = () => {
    if (today() === state.dailyDate && state.dailyDone) { toast(t("Вже пройдено сьогодні", "Already done today")); return; }
    startLevel(0, true);
  };
  $("#btn-shop").onclick = () => openModal("shop");
  $("#btn-levels").onclick = () => openModal("levels");
  $("#btn-settings").onclick = () => openModal("settings");
  $("#btn-back").onclick = () => openModal("pause");
  $("#btn-undo").onclick = undo;
  $("#btn-hint").onclick = hint;
  $("#btn-adhint").onclick = async () => {
    toast(t("Реклама…", "Ad…")); await simulateAd("rewarded"); state.coins += HINT_COST; hint();
  };
}

function boot() {
  bind(); renderHome(); showScreen("#home");
  setInterval(() => {
    if ($("#home").classList.contains("active")) {
      refillLives();
      $("#lives-home").textContent = `${state.lives}/${LIFE_MAX}`;
      $("#life-timer").textContent = nextLifeLabel();
    }
  }, 1000);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
}

boot();
