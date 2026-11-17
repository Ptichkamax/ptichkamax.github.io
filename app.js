/* =========================================================================
   Mijia Robot Vacuum M30 Pro (xiaomi.vacuum.c107) — Русский веб-плагин
   100% на русском языке, без китайских надписей и без 3D-кнопки на карте
   ========================================================================= */

let STATE = {
  "2.2": 2,
  "2.3": 0,
  "2.4": 3,
  "2.5": 1,
  "2.6": 2288,
  "2.7": 1560,
  "2.8": 1,
  "2.9": 4,
  "2.10": 3,
  "2.11": true,
  "2.16": "",
  "2.17": 1794738211,
  "2.18": "",
  "2.19": '{"time_labels":[]}',
  "2.20": false,
  "2.21": false,
  "2.22": false,
  "2.23": true,
  "2.28": true,
  "2.29": 0,
  "2.30": 1,
  "2.31": 1,
  "2.32": true,
  "2.33": 2,
  "2.34": true,
  "2.36": false,
  "2.37": false,
  "2.41": true,
  "2.42": '{"user_labels":[]}',
  "2.44": false,
  "2.45": true,
  "2.46": false,
  "2.47": true,
  "2.48": true,
  "2.49": true,
  "2.50": false,
  "2.51": false,
  "2.52": true,
  "2.54": 0,
  "2.55": false,
  "2.59": false,
  "2.60": 0,
  "2.61": 2,
  "2.62": false,
  "2.63": true,
  "2.64": 4,
  "2.68": 1,
  "2.69": false,
  "2.71": false,
  "2.73": 0,
  "2.74": 1,
  "2.75": 0,
  "2.76": false,
  "2.77": true,
  "3.1": 100,
  "3.2": 1,
  "4.2": 100,
  "5.1": false,
  "9.1": 88,
  "9.2": 160,
  "10.3": '{"total_time":70380,"total_area":1020910,"total_count":48,"history_list":[]}',
  "10.5": '{"index":1794817870,"map_array":[{"map_name":"Карта 1","obj_name":"4249155778/1144572847/2","map_id":1760460394,"is_current":true}]}',
  "10.6": 1760460394,
  "11.1": true,
  "11.2": 369100800,
  "11.3": false,
  "12.1": 94,
  "12.2": 340,
  "13.1": 88,
  "13.2": 160,
  "14.1": 88,
  "14.2": 160,
  "15.1": "en_US",
  "15.2": "en_US",
  "18.1": 100,
  "18.2": false,
  "18.3": 0,
  "18.4": 200,
  "19.1": 100,
  "19.2": 60
};

let ACTIVE_SUBPAGE = null;
let ACTIVE_SHEET = null;
let SELECTED_ROOMS = new Set();

const STATUS_MAP = {
  1: "В режиме ожидания",
  2: "Подключено",
  3: "Подзарядка для продолжения",
  4: "Сухая уборка",
  5: "Пауза",
  6: "Возврат на базу",
  7: "Возврат на промывку салфеток",
  8: "Дистанционное управление",
  9: "Подключено",
  10: "Построение карты",
  11: "Обновление прошивки",
  12: "Работа базы",
  13: "Подзарядка в процессе",
  14: "База работает",
  15: "Ошибка устройства",
  16: "Сухая и влажная уборка",
  17: "Влажная уборка",
  18: "Пауза построения карты",
  19: "Возврат на подзарядку",
  20: "Прерывание промывки",
  21: "Возврат при построении карты"
};

const SWEEP_MOP_SHORT = {
  1: "Только сухая",
  2: "Только влажная",
  3: "Сухая и влажная",
  4: "Сначала сухая, затем влажная"
};

const SWEEP_SCOPE_NAMES = {
  1: "Вся квартира",
  2: "Выбранная зона",
  3: "По комнатам",
  7: "Индивидуальная",
  11: "ИИ-управление"
};

const SUCTION_NAMES = {
  1: "Тихий",
  2: "Стандартный",
  3: "Интенсивный",
  4: "Турбо"
};

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toastBox");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

function formatUnixDate(ts) {
  if (!ts || ts <= 0) return "Нет данных";
  const d = new Date(ts * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function decodeDndPeriod(val) {
  const n = Number(val) >>> 0;
  const sh = (n >>> 24) & 0xff;
  const sm = (n >>> 16) & 0xff;
  const eh = (n >>> 8) & 0xff;
  const em = n & 0xff;
  const pad = (x) => String(x).padStart(2, "0");
  return {
    sh, sm, eh, em,
    startStr: `${pad(sh)}:${pad(sm)}`,
    endStr: `${pad(eh)}:${pad(em)}`,
    text: `${pad(sh)}:${pad(sm)}–${pad(eh)}:${pad(em)}`
  };
}

function encodeDndPeriod(sh, sm, eh, em) {
  return (((sh & 0xff) << 24) | ((sm & 0xff) << 16) | ((eh & 0xff) << 8) | (em & 0xff)) >>> 0;
}

function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function toggleTheme() {
  const next = isDarkTheme() ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  const icon = document.getElementById("themeToggleIcon");
  if (icon) icon.textContent = next === "dark" ? "☀️" : "🌙";
  renderAll();
  showToast(next === "dark" ? "Включена тёмная тема" : "Включена светлая тема Mi Home");
}

function toggleRoomTap(roomId, roomName) {
  if (SELECTED_ROOMS.has(roomId)) {
    SELECTED_ROOMS.delete(roomId);
  } else {
    SELECTED_ROOMS.add(roomId);
  }
  const el = document.getElementById(`roomHit_${roomId}`);
  if (el) {
    el.classList.toggle("selected-room", SELECTED_ROOMS.has(roomId));
  }
  if (SELECTED_ROOMS.size > 0) {
    STATE["2.5"] = 3;
    renderAll();
    showToast(`Выбрано комнат: ${SELECTED_ROOMS.size} (${roomName})`);
  } else {
    STATE["2.5"] = 1;
    renderAll();
    showToast("Выбрана вся квартира");
  }
}

const API_BASE = location.hostname.endsWith("github.io") ? "https://mijia-m30pro-ru.netlify.app" : "";

async function syncFromRobot(mode = "none", notify = false) {
  try {
    if (notify) showToast("Обновление данных с пылесоса...");
    const resp = await fetch(`${API_BASE}/api/state?sync=${encodeURIComponent(mode)}`);
    const data = await resp.json();
    if (data && data.state) {
      STATE = Object.assign({}, STATE, data.state);
      renderAll();
      if (notify) showToast("Данные синхронизированы");
    }
  } catch (err) {
    if (notify) showToast("Используется сохранённое состояние");
  }
}

async function apiSetProps(props, successMsg) {
  try {
    for (const p of props) {
      STATE[`${p.siid}.${p.piid}`] = p.value;
    }
    renderAll();
    const resp = await fetch(`${API_BASE}/api/set_props`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ props })
    });
    const data = await resp.json();
    if (data && data.state) {
      STATE = Object.assign({}, STATE, data.state);
      renderAll();
    }
    showToast(successMsg || "Настройка сохранена");
  } catch (err) {
    showToast("Ошибка отправки команды");
  }
}

async function apiAction(siid, aiid, inParams = [], successMsg = "Команда отправлена") {
  try {
    showToast("Отправка команды на пылесос...");
    const resp = await fetch(`${API_BASE}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siid, aiid, in: inParams })
    });
    const data = await resp.json();
    if (data && data.state) {
      STATE = Object.assign({}, STATE, data.state);
      renderAll();
    }
    showToast(successMsg);
    setTimeout(() => syncFromRobot("fast", false), 1800);
  } catch (err) {
    showToast("Ошибка выполнения действия");
  }
}

function togglePropBool(siid, piid, customLabel) {
  const key = `${siid}.${piid}`;
  const nextVal = !Boolean(STATE[key]);
  apiSetProps([{ siid, piid, value: nextVal }], `${customLabel || "Параметр"}: ${nextVal ? "Включено" : "Выключено"}`);
}

function renderAll() {
  const dark = isDarkTheme();
  const status = Number(STATE["2.2"] || 2);
  const bat = Number(STATE["3.1"] ?? 100);
  const chg = Number(STATE["3.2"] ?? 1);
  const sweepMop = Number(STATE["2.4"] || 3);
  const sweepScope = Number(STATE["2.5"] || 1);
  const lastCleanTs = Number(STATE["2.17"] || 1794738211);
  const stationWork = String(STATE["2.18"] || "");

  // Update theme-dependent icons
  const mapSideIcon = document.getElementById("mapSideIcon");
  if (mapSideIcon) mapSideIcon.src = `/assets/resources/images/home/sidebar/${dark ? "dark/" : ""}map@3x.png`;
  const customEmptyImg = document.getElementById("customEmptyImg");
  if (customEmptyImg) customEmptyImg.src = `/assets/resources/images/home/custom/${dark ? "dark/" : ""}empty@3x.png`;
  const schedHomeIcon = document.getElementById("schedHomeIcon");
  if (schedHomeIcon) schedHomeIcon.src = `/assets/resources/images/home/${dark ? "dark/" : ""}schedule@3x.png`;
  const sceneHomeIcon = document.getElementById("sceneHomeIcon");
  if (sceneHomeIcon) sceneHomeIcon.src = `/assets/resources/images/home/${dark ? "dark/" : ""}scene@3x.png`;

  const statusTxt = document.getElementById("mainStatusText");
  if (statusTxt) {
    statusTxt.textContent = (status === 2 && !stationWork) ? "Подключено" : (STATUS_MAP[status] || "Подключено");
  }

  // Telemetry Capsule
  const leftVal = document.getElementById("telemetryLeftVal");
  const leftLbl = document.getElementById("telemetryLeftLabel");
  if ([4, 5, 16, 17].includes(status)) {
    const areaM2 = (Number(STATE["2.6"] || 0) / 100).toFixed(1);
    const mins = Math.max(1, Math.round(Number(STATE["2.7"] || 60) / 60));
    leftVal.textContent = `${areaM2} м² • ${mins} мин`;
    leftLbl.textContent = "Текущая уборка";
  } else {
    leftVal.textContent = formatUnixDate(lastCleanTs);
    leftLbl.textContent = "Недавняя уборка";
  }

  const roundedBat = Math.max(10, Math.min(100, Math.round(bat / 10) * 10));
  const isCharging = chg === 1 || status === 2 || status === 9;
  const batImg = document.getElementById("batteryIconImg");
  if (batImg) {
    batImg.src = `/assets/resources/images/home/battery/${dark ? "dark/" : ""}${isCharging ? "charging_" : ""}${roundedBat}@3x.png`;
  }
  const batLbl = document.getElementById("batteryStatusLabel");
  if (bat >= 100 && isCharging) {
    batLbl.textContent = "Заряжен полностью";
  } else {
    batLbl.textContent = isCharging ? `Зарядка ${bat}%` : `Заряд ${bat}%`;
  }

  // Action Cards
  const stationTitle = document.getElementById("stationCardTitle");
  const stationSub = document.getElementById("stationCardSub");
  if (stationWork === "clean_dust") {
    stationTitle.textContent = "База";
    stationSub.textContent = "Сбор пыли...";
  } else if (stationWork === "clean_mop") {
    stationTitle.textContent = "База";
    stationSub.textContent = "Стирка салфеток...";
  } else if (stationWork === "dry") {
    stationTitle.textContent = "База";
    stationSub.textContent = "Сушка...";
  } else if (stationWork === "cut_hair") {
    stationTitle.textContent = "База";
    stationSub.textContent = "Срезание волос...";
  } else {
    stationTitle.textContent = "База";
    stationSub.textContent = "";
  }

  const cleanIcon = document.getElementById("cleanCardIcon");
  const cleanTitle = document.getElementById("cleanCardTitle");
  const cleanSub = document.getElementById("cleanCardSub");
  if ([4, 16, 17].includes(status)) {
    cleanIcon.src = "/assets/resources/images/home/action/pause@3x.png";
    cleanTitle.textContent = "Пауза";
    cleanSub.textContent = "Идёт уборка";
  } else if (status === 5) {
    cleanIcon.src = "/assets/resources/images/home/action/resume@3x.png";
    cleanTitle.textContent = "Продолжить";
    cleanSub.textContent = "На паузе";
  } else if ([6, 7, 19].includes(status)) {
    cleanIcon.src = "/assets/resources/images/home/action/stop_recharge@3x.png";
    cleanTitle.textContent = "Стоп возврата";
    cleanSub.textContent = "";
  } else {
    cleanIcon.src = "/assets/resources/images/home/action/start_clean@3x.png";
    cleanTitle.textContent = "Начать уборку";
    cleanSub.textContent = "";
  }

  // Split Selector Bar
  const scopeSub = document.getElementById("scopeSubtitle");
  if (scopeSub) {
    if (sweepScope === 3 && SELECTED_ROOMS.size > 0) {
      scopeSub.textContent = `Комнат: ${SELECTED_ROOMS.size}`;
    } else {
      scopeSub.textContent = SWEEP_SCOPE_NAMES[sweepScope] || "Вся квартира";
    }
  }
  const modeSub = document.getElementById("modeSubtitle");
  if (modeSub) {
    modeSub.textContent = SWEEP_MOP_SHORT[sweepMop] || "Сухая и влажная";
  }

  renderCustomPlansHome();

  // Schedules summary
  let schedules = [];
  try {
    schedules = JSON.parse(STATE["2.19"] || '{"time_labels":[]}').time_labels || [];
  } catch (e) {}
  const homeSchedSub = document.getElementById("homeScheduleSub");
  const setSchedVal = document.getElementById("setScheduleVal");
  if (schedules.length === 0) {
    if (homeSchedSub) homeSchedSub.textContent = "Расписание не установлено";
    if (setSchedVal) setSchedVal.textContent = "Не задано";
  } else {
    if (homeSchedSub) homeSchedSub.textContent = `Активных расписаний: ${schedules.length}`;
    if (setSchedVal) setSchedVal.textContent = `${schedules.length} активн.`;
  }

  // Settings switches & summaries
  const sw223 = document.getElementById("switchProp_2_23");
  if (sw223) sw223.className = STATE["2.23"] ? "mi-switch on" : "mi-switch";
  const sw255 = document.getElementById("switchProp_2_55");
  if (sw255) sw255.className = STATE["2.55"] ? "mi-switch on" : "mi-switch";
  const sw51 = document.getElementById("switchProp_5_1");
  if (sw51) sw51.className = STATE["5.1"] ? "mi-switch on" : "mi-switch";

  const dndInfo = decodeDndPeriod(STATE["11.2"] || 369100800);
  const setDndVal = document.getElementById("setDndVal");
  if (setDndVal) setDndVal.textContent = STATE["11.1"] ? dndInfo.text : "Выкл.";

  const setObstacleVal = document.getElementById("setObstacleVal");
  if (setObstacleVal) {
    setObstacleVal.textContent = Number(STATE["2.75"]) === 1 ? "Высокое покрытие" : "Минимум столкновений";
  }

  const carpetMethod = Number(STATE["2.73"] || 0);
  const setCarpetVal = document.getElementById("setCarpetVal");
  if (setCarpetVal) {
    setCarpetVal.textContent = carpetMethod === 0 ? "Адаптивно (подъём)" : (carpetMethod === 1 ? "Объезд ковров" : "Игнорировать");
  }

  const setDustCutVal = document.getElementById("setDustCutVal");
  if (setDustCutVal) {
    setDustCutVal.textContent = (STATE["2.32"] && STATE["2.63"]) ? "Пыль и волосы" : (STATE["2.32"] ? "Только пыль" : "Выкл.");
  }

  const setWashMopVal = document.getElementById("setWashMopVal");
  if (setWashMopVal) {
    setWashMopVal.textContent = STATE["2.41"] ? "Горячая вода" : (STATE["2.28"] ? "Вкл." : "Выкл.");
  }

  const dryMap = { 1: "2 часа", 2: "3 часа", 3: "4 часа" };
  const setDryMopVal = document.getElementById("setDryMopVal");
  if (setDryMopVal) {
    setDryMopVal.textContent = STATE["2.34"] ? (dryMap[STATE["2.31"]] || "2 часа") : "Выкл.";
  }

  const setDetergentVal = document.getElementById("setDetergentVal");
  if (setDetergentVal) {
    setDetergentVal.textContent = (STATE["2.36"] || STATE["2.59"]) ? "Автодозирование" : "Выкл.";
  }

  const setAiVal = document.getElementById("setAiVal");
  if (setAiVal) {
    setAiVal.textContent = STATE["2.45"] ? "Включено" : "Выкл.";
  }

  const setVoiceVal = document.getElementById("setVoiceVal");
  if (setVoiceVal) {
    const vLang = String(STATE["15.2"] || "en_US") === "en_US" ? "Англ." : "Кит.";
    setVoiceVal.textContent = `${vLang} • ${STATE["4.2"] ?? 100}%`;
  }

  if (ACTIVE_SUBPAGE) renderSubpageContent(ACTIVE_SUBPAGE);
  if (ACTIVE_SHEET) renderSheetContent(ACTIVE_SHEET);
}

function renderCustomPlansHome() {
  let plans = [];
  try {
    plans = JSON.parse(STATE["2.42"] || '{"user_labels":[]}').user_labels || [];
  } catch (e) {}

  const emptyEl = document.getElementById("customCleanEmpty");
  const listEl = document.getElementById("customPlansList");
  const topBtn = document.getElementById("btnAddCustomTop");

  if (!plans || plans.length === 0) {
    emptyEl.style.display = "flex";
    listEl.style.display = "none";
    topBtn.style.display = "none";
    return;
  }

  emptyEl.style.display = "none";
  listEl.style.display = "flex";
  topBtn.style.display = "inline-block";

  listEl.innerHTML = plans.map((p, idx) => `
    <div class="custom-plan-item">
      <div class="custom-plan-info">
        <div class="custom-plan-name">${p.name || `Сценарий #${idx + 1}`}</div>
        <div class="custom-plan-meta">${SWEEP_MOP_SHORT[p.mode || 3]} • ${SUCTION_NAMES[p.suction || 2]} • Проходов: ${p.times || 1}</div>
      </div>
      <div class="custom-plan-actions">
        <button class="btn-plan-run" onclick="runCustomPlan(${idx})">Старт</button>
        <button class="btn-plan-del" onclick="deleteCustomPlan(${idx})">✕</button>
      </div>
    </div>
  `).join("");
}

function handleMainCleanAction() {
  const status = Number(STATE["2.2"] || 2);
  if ([4, 16, 17].includes(status)) {
    apiAction(2, 7, [], "Уборка поставлена на паузу");
  } else if (status === 5) {
    apiAction(2, 8, [], "Уборка возобновлена");
  } else if ([6, 7, 19].includes(status)) {
    apiAction(2, 2, [], "Возврат на базу остановлен");
  } else {
    const mode = Number(STATE["2.4"] || 3);
    if (mode === 1) {
      apiAction(2, 4, [], "Запущена сухая уборка");
    } else if (mode === 2) {
      apiAction(2, 5, [], "Запущена влажная уборка");
    } else if (mode === 3) {
      apiAction(2, 6, [], "Запущена сухая и влажная уборка");
    } else {
      apiAction(2, 1, [], "Запущена уборка: сначала сухая, затем влажная");
    }
  }
}

/* =========================================================================
   Шторки (Bottom Sheets)
   ========================================================================= */

function openSheet(sheetName) {
  ACTIVE_SHEET = sheetName;
  renderSheetContent(sheetName);
  document.getElementById("sheetBackdrop").classList.add("open");
}

function closeSheet() {
  ACTIVE_SHEET = null;
  document.getElementById("sheetBackdrop").classList.remove("open");
}

function handleBackdropClick(e) {
  if (e.target.id === "sheetBackdrop") closeSheet();
}

function openStationSheet() { openSheet("station"); }
function openModeSheet() { openSheet("mode"); }
function openScopeSheet() { openSheet("scope"); }
function openCustomCreateSheet() { openSheet("custom_create"); }

function renderSheetContent(sheetName) {
  const box = document.getElementById("bottomSheetContent");
  if (!box) return;

  if (sheetName === "station") {
    const stWork = String(STATE["2.18"] || "");
    box.innerHTML = `
      <div class="sheet-header">
        <div class="sheet-title">Управление базой</div>
        <button class="sheet-close-btn" onclick="closeSheet()">✕</button>
      </div>
      <div class="station-grid">
        <button class="station-action-btn ${stWork === 'clean_dust' ? 'active' : ''}" onclick="apiAction(2, 18, [], 'Запущен сбор пыли в мешок базы')">
          <img src="/assets/resources/images/home/station/clean_dust@3x.png" alt="Сбор пыли" />
          <div>
            <div style="font-weight:600;font-size:13.5px;">Сбор пыли</div>
            <div style="font-size:11px;color:var(--text-secondary);">Очистка контейнера</div>
          </div>
        </button>

        <button class="station-action-btn ${stWork === 'clean_mop' ? 'active' : ''}" onclick="${stWork === 'clean_mop' ? "apiAction(2, 31, [], 'Стирка салфеток остановлена')" : "apiAction(2, 19, [], 'Запущена стирка салфеток')"}">
          <img src="/assets/resources/images/home/station/clean_mop@3x.png" alt="Стирка салфеток" />
          <div>
            <div style="font-weight:600;font-size:13.5px;">${stWork === 'clean_mop' ? 'Стоп стирки' : 'Стирка салфеток'}</div>
            <div style="font-size:11px;color:var(--text-secondary);">Промывка мопов</div>
          </div>
        </button>

        <button class="station-action-btn ${stWork === 'dry' ? 'active' : ''}" onclick="${stWork === 'dry' ? "apiAction(2, 32, [], 'Сушка салфеток остановлена')" : "apiAction(2, 20, [], 'Запущена сушка салфеток')"}">
          <img src="/assets/resources/images/home/station/dry@3x.png" alt="Сушка салфеток" />
          <div>
            <div style="font-weight:600;font-size:13.5px;">${stWork === 'dry' ? 'Стоп сушки' : 'Сушка салфеток'}</div>
            <div style="font-size:11px;color:var(--text-secondary);">Горячий воздух</div>
          </div>
        </button>

        <button class="station-action-btn ${stWork === 'cut_hair' ? 'active' : ''}" onclick="${stWork === 'cut_hair' ? "apiAction(2, 44, [], 'Срезание волос остановлено')" : "apiAction(2, 43, [], 'Запущено срезание волос с щётки')"}">
          <img src="/assets/resources/images/home/station/cut@3x.png" alt="Срезание волос" />
          <div>
            <div style="font-weight:600;font-size:13.5px;">${stWork === 'cut_hair' ? 'Стоп очистки' : 'Срезание волос'}</div>
            <div style="font-size:11px;color:var(--text-secondary);">Очистка турбощётки</div>
          </div>
        </button>
      </div>

      <button class="station-action-btn" style="width:100%;justify-content:center;background:var(--bg-pill-btn);" onclick="apiAction(3, 1, [], 'Команда возврата на базу отправлена'); closeSheet();">
        <img src="/assets/resources/images/home/action/return_to_base@3x.png" style="width:26px;height:26px;" alt="На базу" />
        <span style="font-weight:600;font-size:14px;color:var(--accent-blue-text);">Вернуть робот на базу</span>
      </button>
    `;
    return;
  }

  if (sheetName === "mode") {
    const curMode = Number(STATE["2.4"] || 3);
    const curSuction = Number(STATE["2.9"] || 4);
    const curWater = Number(STATE["2.10"] || 3);
    const curTimes = Number(STATE["2.8"] || 1);
    const curRoute = Number(STATE["2.74"] || 1);

    box.innerHTML = `
      <div class="sheet-header">
        <div class="sheet-title">Настройки уборки</div>
        <button class="sheet-close-btn" onclick="closeSheet()">✕</button>
      </div>

      <div>
        <div class="mode-group-label">
          <span>Режим уборки</span>
          <span style="color:var(--accent-blue-text);font-weight:500;">${SWEEP_MOP_SHORT[curMode]}</span>
        </div>
        <div class="mode-grid-4">
          <button class="mode-option-btn ${curMode === 1 ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:4,value:1}], 'Режим: Только сухая уборка')">
            <img src="/assets/resources/images/home/mode/sweep_${curMode === 1 ? 'p' : 'n'}@3x.png" alt="Сухая" />
            <span>Сухая</span>
          </button>
          <button class="mode-option-btn ${curMode === 3 ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:4,value:3}], 'Режим: Сухая и влажная уборка')">
            <img src="/assets/resources/images/home/mode/sweep_mop_${curMode === 3 ? 'p' : 'n'}@3x.png" alt="Сухая и влажная" />
            <span>Сухая и влажная</span>
          </button>
          <button class="mode-option-btn ${curMode === 2 ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:4,value:2}], 'Режим: Только влажная уборка')">
            <img src="/assets/resources/images/home/mode/mop_${curMode === 2 ? 'p' : 'n'}@3x.png" alt="Влажная" />
            <span>Влажная</span>
          </button>
          <button class="mode-option-btn ${curMode === 4 ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:4,value:4}], 'Режим: Сначала сухая, затем влажная')">
            <img src="/assets/resources/images/home/mode/first_sweep_then_mop_${curMode === 4 ? 'p' : 'n'}@3x.png" alt="Сначала сухая" />
            <span>Сначала сухая</span>
          </button>
        </div>
      </div>

      ${curMode !== 2 ? `
      <div>
        <div class="mode-group-label">
          <span>Мощность всасывания</span>
          <span style="color:var(--accent-blue-text);font-weight:500;">${SUCTION_NAMES[curSuction]}</span>
        </div>
        <div class="mode-grid-4">
          ${[
            [1, "Тихий"],
            [2, "Стандарт"],
            [3, "Интенсив."],
            [4, "Турбо"]
          ].map(([lvl, title]) => `
            <button class="mode-option-btn ${curSuction === lvl ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:9,value:${lvl}}], 'Всасывание: ${title}')">
              <img src="/assets/resources/images/home/mode/suction_level_${lvl}_${curSuction === lvl ? 'p' : 'n'}@3x.png" alt="${title}" />
              <span>${title}</span>
            </button>
          `).join("")}
        </div>
      </div>
      ` : ""}

      ${curMode !== 1 ? `
      <div>
        <div class="mode-group-label">
          <span>Подача воды на салфетки</span>
          <span style="color:var(--accent-blue-text);font-weight:500;">Уровень ${curWater}</span>
        </div>
        <div class="mode-grid-3">
          ${[
            [1, "Уровень 1"],
            [2, "Уровень 2"],
            [3, "Уровень 3"]
          ].map(([lvl, title]) => `
            <button class="mode-option-btn ${curWater === lvl ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:10,value:${lvl}}], 'Подача воды: ${title}')">
              <img src="/assets/resources/images/home/mode/water_level_${lvl}_${curWater === lvl ? 'p' : 'n'}@3x.png" alt="${title}" />
              <span>${title}</span>
            </button>
          `).join("")}
        </div>
      </div>
      ` : ""}

      <div>
        <div class="mode-group-label">
          <span>Количество проходов</span>
          <span style="color:var(--accent-blue-text);font-weight:500;">${curTimes} раз(а)</span>
        </div>
        <div class="mode-grid-2">
          <button class="mode-option-btn ${curTimes === 1 ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:8,value:1}], 'Проходов: 1 раз')">
            <img src="/assets/resources/images/home/mode/times_one_${curTimes === 1 ? 'p' : 'n'}@3x.png" alt="1 раз" />
            <span>1 проход</span>
          </button>
          <button class="mode-option-btn ${curTimes === 2 ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:8,value:2}], 'Проходов: 2 раза')">
            <img src="/assets/resources/images/home/mode/times_two_${curTimes === 2 ? 'p' : 'n'}@3x.png" alt="2 раза" />
            <span>2 прохода</span>
          </button>
        </div>
      </div>

      <div>
        <div class="mode-group-label">
          <span>Траектория движения</span>
        </div>
        <div class="mode-grid-3">
          ${[
            [1, "Быстрый"],
            [2, "Повседневный"],
            [3, "Тщательный"]
          ].map(([rVal, rTitle]) => `
            <button class="mode-option-btn ${curRoute === rVal ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:74,value:${rVal}}], 'Маршрут: ${rTitle}')">
              <span style="font-size:12px;padding:4px 0;">${rTitle}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
    return;
  }

  if (sheetName === "scope") {
    const curScope = Number(STATE["2.5"] || 1);
    box.innerHTML = `
      <div class="sheet-header">
        <div class="sheet-title">Выбор зоны уборки</div>
        <button class="sheet-close-btn" onclick="closeSheet()">✕</button>
      </div>
      <div>
        ${[
          [1, "Вся квартира", "Уборка всех комнат по карте квартиры"],
          [3, "По комнатам", "Нажмите на нужные комнаты прямо на карте (Спальня, Коридор, Ванная, Гостиная)"],
          [2, "Выбранная зона", "Локальная уборка выделенной области на карте"]
        ].map(([val, title, desc]) => `
          <div class="radio-card ${curScope === val ? 'selected' : ''}" onclick="apiSetProps([{siid:2,piid:5,value:${val}}], 'Зона уборки: ${title}'); closeSheet();">
            <div>
              <div style="font-size:14.5px;font-weight:600;">${title}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${desc}</div>
            </div>
            <div class="radio-dot"></div>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  if (sheetName === "custom_create") {
    box.innerHTML = `
      <div class="sheet-header">
        <div class="sheet-title">Новый сценарий индивидуальной уборки</div>
        <button class="sheet-close-btn" onclick="closeSheet()">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:5px;">Название сценария:</label>
          <input id="customPlanNameInput" type="text" value="Ежедневная уборка" style="width:100%;background:var(--bg-inner-card);border:1px solid var(--divider);border-radius:12px;padding:11px 14px;color:var(--text-primary);font-size:14px;" />
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:5px;">Режим:</label>
          <select id="customPlanModeSelect" style="width:100%;background:var(--bg-inner-card);border:1px solid var(--divider);border-radius:12px;padding:11px 14px;color:var(--text-primary);font-size:14px;">
            <option value="3" selected>Сухая и влажная уборка</option>
            <option value="1">Только сухая уборка</option>
            <option value="2">Только влажная уборка</option>
            <option value="4">Сначала сухая, затем влажная</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:5px;">Мощность всасывания:</label>
          <select id="customPlanSuctionSelect" style="width:100%;background:var(--bg-inner-card);border:1px solid var(--divider);border-radius:12px;padding:11px 14px;color:var(--text-primary);font-size:14px;">
            <option value="1">Тихий</option>
            <option value="2">Стандартный</option>
            <option value="3" selected>Интенсивный</option>
            <option value="4">Турбо</option>
          </select>
        </div>
        <button class="btn-create-pill" style="width:100%;padding:12px;background:var(--accent-blue);color:#fff;margin-top:4px;" onclick="saveNewCustomPlan()">Сохранить сценарий</button>
      </div>
    `;
    return;
  }
}

function saveNewCustomPlan() {
  const name = (document.getElementById("customPlanNameInput")?.value || "Мой сценарий").trim();
  const mode = Number(document.getElementById("customPlanModeSelect")?.value || 3);
  const suction = Number(document.getElementById("customPlanSuctionSelect")?.value || 3);
  let plans = [];
  try {
    plans = JSON.parse(STATE["2.42"] || '{"user_labels":[]}').user_labels || [];
  } catch (e) {}
  plans.push({ id: Date.now(), name, mode, suction, water: 2, times: 1 });
  STATE["2.42"] = JSON.stringify({ user_labels: plans });
  closeSheet();
  renderAll();
  showToast(`Сценарий «${name}» создан`);
}

function runCustomPlan(idx) {
  let plans = [];
  try {
    plans = JSON.parse(STATE["2.42"] || '{"user_labels":[]}').user_labels || [];
  } catch (e) {}
  const p = plans[idx];
  if (!p) return;
  apiSetProps([
    { siid: 2, piid: 4, value: Number(p.mode || 3) },
    { siid: 2, piid: 9, value: Number(p.suction || 3) }
  ], `Применён сценарий «${p.name}»`);
  setTimeout(() => handleMainCleanAction(), 500);
}

function deleteCustomPlan(idx) {
  let plans = [];
  try {
    plans = JSON.parse(STATE["2.42"] || '{"user_labels":[]}').user_labels || [];
  } catch (e) {}
  plans.splice(idx, 1);
  STATE["2.42"] = JSON.stringify({ user_labels: plans });
  renderAll();
  showToast("Сценарий удалён");
}

/* =========================================================================
   Часть 2: Настройки и все подстраницы (100% на русском языке)
   ========================================================================= */

function openSettings() {
  document.getElementById("settingsOverlay").classList.add("open");
}

function closeSettings() {
  document.getElementById("settingsOverlay").classList.remove("open");
}

function openSubpage(pageId) {
  ACTIVE_SUBPAGE = pageId;
  renderSubpageContent(pageId);
  document.getElementById("subpageOverlay").classList.add("open");
}

function closeSubpage() {
  ACTIVE_SUBPAGE = null;
  document.getElementById("subpageOverlay").classList.remove("open");
}

function findRobotAction() {
  apiAction(6, 1, [], "Робот подаёт звуковой сигнал");
}

function calibrateImuAction() {
  apiAction(16, 1, [], "Запущена калибровка датчиков IMU");
}

const SUBPAGE_TITLES = {
  history: "История уборок",
  dnd: "Режим «Не беспокоить»",
  schedule: "Уборка по расписанию",
  consumables: "Расходные материалы",
  dust_cuthair: "Сбор пыли и срезание волос",
  wash_mop: "Настройки стирки салфеток",
  dry_mop: "Настройки сушки салфеток",
  detergent: "Моющее средство",
  ai_detection: "Распознавание ИИ",
  obstacle_strategy: "Стратегия объезда препятствий",
  carpet_pref: "Настройки уборки ковров",
  voice_volume: "Голосовой пакет и громкость",
  remote_control: "Пульт дистанционного управления",
  water_check: "Автослив и залив воды",
  map_manage: "Управление картами и комнатами",
  scenes: "Умные сценарии",
  device_info: "Сведения об устройстве"
};

function renderSubpageContent(pageId) {
  const titleEl = document.getElementById("subpageTitle");
  const box = document.getElementById("subpageContent");
  if (!box) return;
  titleEl.textContent = SUBPAGE_TITLES[pageId] || "Настройки";

  if (pageId === "history") {
    let rec = { total_time: 70380, total_area: 1020910, total_count: 48, history_list: [] };
    try {
      rec = JSON.parse(STATE["10.3"] || "{}");
    } catch (e) {}
    const totalHours = (Number(rec.total_time || 0) / 3600).toFixed(1);
    const totalM2 = (Number(rec.total_area || 0) / 1000).toFixed(1);
    const totalCount = Number(rec.total_count || 0);
    const list = (rec.history_list || []).slice().reverse();

    box.innerHTML = `
      <div class="history-stats-grid">
        <div>
          <div class="history-stat-val">${totalHours} ч</div>
          <div class="history-stat-label">Общее время</div>
        </div>
        <div>
          <div class="history-stat-val">${totalM2} м²</div>
          <div class="history-stat-label">Общая площадь</div>
        </div>
        <div>
          <div class="history-stat-val">${totalCount}</div>
          <div class="history-stat-label">Всего уборок</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin:4px 4px 10px;">
        Последние 20 записей из памяти пылесоса:
      </div>
      ${list.map((item) => {
        const parts = String(item.label || "01560_22880_1").split("_");
        const mins = Math.max(1, Math.round(Number(parts[0] || 0) / 60));
        const area = (Number(parts[1] || 0) / 1000).toFixed(1);
        const sType = Number(parts[2] || 1);
        const sName = SWEEP_SCOPE_NAMES[sType] || "Вся квартира";
        return `
          <div class="history-row">
            <div>
              <div style="font-size:14px;font-weight:600;">${formatUnixDate(item.stime)} — ${sName}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">Площадь: ${area} м² • Время: ${mins} мин</div>
            </div>
            <span style="font-size:12px;color:var(--accent-green);font-weight:500;">Завершено</span>
          </div>
        `;
      }).join("")}
    `;
    return;
  }

  if (pageId === "dnd") {
    const enabled = Boolean(STATE["11.1"]);
    const dnd = decodeDndPeriod(STATE["11.2"] || 369100800);
    box.innerHTML = `
      <div class="subcard">
        <div class="settings-row" style="padding:4px 0;" onclick="togglePropBool(11, 1, 'Режим «Не беспокоить»')">
          <div class="settings-row-left">
            <div class="settings-row-title">Режим «Не беспокоить»</div>
            <div class="settings-row-desc">В указанный период робот отключает голосовые оповещения и подсветку, не запускает автосбор пыли и откладывает продолжение уборки</div>
          </div>
          <button class="mi-switch ${enabled ? 'on' : ''}"></button>
        </div>
      </div>

      <div class="subcard" style="display:flex;flex-direction:column;gap:14px;">
        <div style="font-size:13.5px;font-weight:600;">Интервал времени</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:14px;color:var(--text-secondary);">Время начала</span>
          <input type="time" id="dndStartInput" value="${dnd.startStr}" style="background:var(--bg-inner-card);border:1px solid var(--divider);color:var(--text-primary);padding:8px 12px;border-radius:10px;font-size:14px;" />
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:14px;color:var(--text-secondary);">Время окончания</span>
          <input type="time" id="dndEndInput" value="${dnd.endStr}" style="background:var(--bg-inner-card);border:1px solid var(--divider);color:var(--text-primary);padding:8px 12px;border-radius:10px;font-size:14px;" />
        </div>
        <button class="btn-create-pill" style="background:var(--accent-blue);color:#fff;width:100%;padding:12px;" onclick="saveDndTime()">Сохранить интервал</button>
      </div>
    `;
    return;
  }

  if (pageId === "schedule") {
    let schedules = [];
    try {
      schedules = JSON.parse(STATE["2.19"] || '{"time_labels":[]}').time_labels || [];
    } catch (e) {}

    box.innerHTML = `
      <div class="subcard" style="display:flex;flex-direction:column;gap:12px;">
        <div style="font-size:14px;font-weight:600;">Новое расписание уборки</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label style="font-size:11.5px;color:var(--text-secondary);display:block;margin-bottom:4px;">Время запуска:</label>
            <input type="time" id="newSchedTime" value="10:00" style="width:100%;background:var(--bg-inner-card);border:1px solid var(--divider);color:var(--text-primary);padding:9px;border-radius:10px;font-size:14px;" />
          </div>
          <div>
            <label style="font-size:11.5px;color:var(--text-secondary);display:block;margin-bottom:4px;">Повторение:</label>
            <select id="newSchedRepeat" style="width:100%;background:var(--bg-inner-card);border:1px solid var(--divider);color:var(--text-primary);padding:9px;border-radius:10px;font-size:13.5px;">
              <option value="Ежедневно">Ежедневно</option>
              <option value="По будням">По будням</option>
              <option value="По выходным">По выходным</option>
              <option value="Один раз">Один раз</option>
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:11.5px;color:var(--text-secondary);display:block;margin-bottom:4px;">Режим уборки:</label>
          <select id="newSchedMode" style="width:100%;background:var(--bg-inner-card);border:1px solid var(--divider);color:var(--text-primary);padding:9px;border-radius:10px;font-size:13.5px;">
            <option value="3">Сухая и влажная уборка • Вся квартира</option>
            <option value="1">Только сухая уборка • Вся квартира</option>
            <option value="2">Только влажная уборка • Вся квартира</option>
            <option value="4">Сначала сухая, затем влажная • Вся квартира</option>
          </select>
        </div>
        <button class="btn-create-pill" style="background:var(--accent-blue);color:#fff;width:100%;padding:11px;" onclick="addScheduleItem()">+ Добавить расписание</button>
      </div>

      <div style="font-size:12px;color:var(--text-secondary);margin:10px 4px;">
        Активные расписания (${schedules.length}):
      </div>
      ${schedules.length === 0 ? `
        <div class="subcard" style="text-align:center;padding:30px 16px;color:var(--text-secondary);">
          Расписаний пока нет
        </div>
      ` : schedules.map((item, i) => `
        <div class="subcard" style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:17px;font-weight:600;">${item.time || "10:00"} <span style="font-size:12px;font-weight:400;color:var(--text-secondary);">${item.repeat || "Ежедневно"}</span></div>
            <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${SWEEP_MOP_SHORT[item.mode || 3]} • Вся квартира</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="mi-switch ${item.enabled !== false ? 'on' : ''}" onclick="toggleScheduleItem(${i})"></button>
            <button class="btn-plan-del" onclick="deleteScheduleItem(${i})">✕</button>
          </div>
        </div>
      `).join("")}
    `;
    return;
  }

  if (pageId === "consumables") {
    const items = [
      {
        title: "Фильтр пылесборника",
        pct: Number(STATE["14.1"] ?? 88),
        hours: Number(STATE["14.2"] ?? 160),
        desc: "Высокоэффективный фильтр предотвращает выход мелкой пыли из контейнера.",
        siid: 14, aiid: 1
      },
      {
        title: "Основная щётка",
        pct: Number(STATE["12.1"] ?? 94),
        hours: Number(STATE["12.2"] ?? 340),
        desc: "Главная вращающаяся турбощётка для сбора мусора и волос с пола и ковров.",
        siid: 12, aiid: 1
      },
      {
        title: "Боковая щётка",
        pct: Number(STATE["13.1"] ?? 88),
        hours: Number(STATE["13.2"] ?? 160),
        desc: "Выметает пыль и крошки вдоль стен и из углов к основной щётке.",
        siid: 13, aiid: 1
      },
      {
        title: "Салфетки для влажной уборки",
        pct: Number(STATE["9.1"] ?? 88),
        hours: Number(STATE["9.2"] ?? 160),
        desc: "Многоразовые вращающиеся мопы для мытья пола.",
        siid: 9, aiid: 1
      },
      {
        title: "Одноразовый мешок для пыли в базе",
        pct: Number(STATE["19.1"] ?? 100),
        hours: Number(STATE["19.2"] ?? 60),
        desc: "Мешок-пылесборник в станции самообслуживания.",
        siid: 19, aiid: 1
      },
      {
        title: "Картридж моющего средства",
        pct: Number(STATE["18.1"] ?? 100),
        hours: Number(STATE["18.4"] ?? 200),
        desc: "Чистящее средство для автоматического дозирования базой.",
        siid: 18, aiid: 1
      }
    ];

    box.innerHTML = items.map((c) => {
      const barColor = c.pct > 30 ? "var(--accent-green)" : (c.pct > 10 ? "var(--accent-orange)" : "var(--accent-red)");
      return `
        <div class="consumable-item">
          <div class="consumable-top">
            <span class="consumable-title">${c.title}</span>
            <span class="consumable-pct" style="color:${barColor};">${c.pct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${c.pct}%;background:${barColor};"></div>
          </div>
          <div style="font-size:11.5px;color:var(--text-secondary);line-height:1.35;">${c.desc}</div>
          <div class="consumable-bottom">
            <span>Осталось примерно: <b>${c.hours} ч</b></span>
            <button class="btn-small-outline" onclick="apiAction(${c.siid}, ${c.aiid}, [], 'Ресурс расходника сброшен до 100%')">Сбросить ресурс</button>
          </div>
        </div>
      `;
    }).join("");
    return;
  }

  if (pageId === "dust_cuthair") {
    const autoDust = Boolean(STATE["2.32"]);
    const dustFreq = Number(STATE["2.33"] || 2);
    const autoCut = Boolean(STATE["2.63"]);
    const cutFreq = Number(STATE["2.64"] || 4);

    box.innerHTML = `
      <div class="subcard" style="text-align:center;padding:16px;">
        <img src="/assets/resources/images/home/station/cut_hair_inset@3x.png" style="max-width:180px;height:auto;border-radius:12px;" alt="Срезание волос" />
        <div style="font-size:11.5px;color:var(--text-secondary);margin-top:8px;">
          Во время работы лезвий в базе не просовывайте руки в нижний отсек станции и не снимайте робот с базы.
        </div>
      </div>

      <div class="subcard">
        <div class="settings-row" onclick="togglePropBool(2, 32, 'Автоматический сбор пыли')">
          <div class="settings-row-left">
            <div class="settings-row-title">Автоматический сбор пыли</div>
            <div class="settings-row-desc">Автоматически выгружать мусор из пылесборника робота в мешок базы после уборки</div>
          </div>
          <button class="mi-switch ${autoDust ? 'on' : ''}"></button>
        </div>

        ${autoDust ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--divider);">
          <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:8px;">Частота сбора пыли:</div>
          <div class="mode-grid-3">
            ${[
              [1, "Каждую уборку"],
              [2, "Каждые 2 уборки"],
              [3, "Каждые 3 уборки"]
            ].map(([val, label]) => `
              <button class="mode-option-btn ${dustFreq === val ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:33,value:${val}}], 'Частота сбора пыли: ${label}')">
                <span>${label}</span>
              </button>
            `).join("")}
          </div>
        </div>
        ` : ""}
      </div>

      <div class="subcard">
        <div class="settings-row" onclick="togglePropBool(2, 63, 'Автоматическое срезание волос')">
          <div class="settings-row-left">
            <div class="settings-row-title">Автоматическое срезание волос</div>
            <div class="settings-row-desc">Встроенные в базу лезвия автоматически срезают намотанные волосы и шерсть с основной щётки</div>
          </div>
          <button class="mi-switch ${autoCut ? 'on' : ''}"></button>
        </div>

        ${autoCut ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--divider);">
          <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:8px;">Частота срезания волос:</div>
          ${[
            [4, "Высокая частота (рекомендуется)", "В процессе и после завершения уборки"],
            [1, "Средняя частота", "После каждой уборки"],
            [2, "Низкая частота", "Каждые 2 уборки"],
            [3, "Сверхнизкая частота", "Каждые 3 уборки"]
          ].map(([val, t, d]) => `
            <div class="radio-card ${cutFreq === val ? 'selected' : ''}" onclick="apiSetProps([{siid:2,piid:64,value:${val}}], 'Частота срезания волос: ${t}')">
              <div style="padding-right:10px;">
                <div style="font-size:14px;font-weight:600;">${t}</div>
                <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${d}</div>
              </div>
              <div class="radio-dot"></div>
            </div>
          `).join("")}
        </div>
        ` : ""}
      </div>
    `;
    return;
  }

  if (pageId === "wash_mop") {
    const autoWash = Boolean(STATE["2.28"]);
    const hotWash = Boolean(STATE["2.41"]);
    const freqType = Number(STATE["2.29"] ?? 0);
    const waterOut = Number(STATE["2.30"] ?? 1);
    const areaFreq = Number(STATE["2.61"] ?? 2);

    box.innerHTML = `
      <div class="subcard">
        <div class="settings-row" onclick="togglePropBool(2, 28, 'Автоматическая промывка салфеток')">
          <div class="settings-row-left">
            <div class="settings-row-title">Автоматическая промывка салфеток</div>
            <div class="settings-row-desc">Автоматический возврат на станцию для стирки салфеток</div>
          </div>
          <button class="mi-switch ${autoWash ? 'on' : ''}"></button>
        </div>

        <div class="settings-row" style="border-top:1px solid var(--divider);" onclick="togglePropBool(2, 41, 'Стирка салфеток горячей водой')">
          <div class="settings-row-left">
            <div class="settings-row-title">Стирка салфеток горячей водой (60°C)</div>
            <div class="settings-row-desc">Подогрев воды в базе для эффективного удаления жира и грязи с салфеток</div>
          </div>
          <button class="mi-switch ${hotWash ? 'on' : ''}"></button>
        </div>
      </div>

      <div class="subcard">
        <div style="font-size:13.5px;font-weight:600;margin-bottom:10px;">Частота возврата на промывку</div>
        ${[
          [0, "По комнатам", "Промывать салфетки после уборки каждой комнаты"],
          [1, "По площади", "Промывать салфетки через каждые 5 / 8 / 10 м²"]
        ].map(([val, t, d]) => `
          <div class="radio-card ${freqType === val ? 'selected' : ''}" onclick="apiSetProps([{siid:2,piid:29,value:${val}}], 'Частота промывки: ${t}')">
            <div>
              <div style="font-size:14px;font-weight:600;">${t}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${d}</div>
            </div>
            <div class="radio-dot"></div>
          </div>
        `).join("")}

        <div style="font-size:12px;color:var(--text-secondary);margin:12px 0 8px;">Площадь между промывками:</div>
        <div class="mode-grid-3">
          ${[
            [0, "Каждые 5 м²"],
            [2, "Каждые 8 м²"],
            [1, "Каждые 10 м²"]
          ].map(([v, lbl]) => `
            <button class="mode-option-btn ${areaFreq === v ? 'active' : ''}" onclick="apiSetProps([{siid:2,piid:61,value:${v}}], 'Интервал промывки: ${lbl}')">
              <span>${lbl}</span>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="subcard">
        <div style="font-size:13.5px;font-weight:600;margin-bottom:10px;">Интенсивность расхода воды при стирке</div>
        ${[
          [2, "Экономия воды", "Минимальный расход воды для слабозагрязнённых полов"],
          [1, "Повседневная стирка", "Оптимальный расход воды для ежедневной уборки"],
          [0, "Глубокая стирка", "Увеличенный объём воды для тщательной промывки салфеток"]
        ].map(([val, t, d]) => `
          <div class="radio-card ${waterOut === val ? 'selected' : ''}" onclick="apiSetProps([{siid:2,piid:30,value:${val}}], 'Режим стирки: ${t}')">
            <div>
              <div style="font-size:14px;font-weight:600;">${t}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${d}</div>
            </div>
            <div class="radio-dot"></div>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  if (pageId === "dry_mop") {
    const autoDry = Boolean(STATE["2.34"]);
    const dryTime = Number(STATE["2.31"] || 1);
    box.innerHTML = `
      <div class="subcard">
        <div class="settings-row" onclick="togglePropBool(2, 34, 'Автоматическая сушка салфеток')">
          <div class="settings-row-left">
            <div class="settings-row-title">Автоматическая сушка салфеток</div>
            <div class="settings-row-desc">После окончания уборки и промывки база автоматически высушит салфетки горячим воздухом</div>
          </div>
          <button class="mi-switch ${autoDry ? 'on' : ''}"></button>
        </div>
      </div>

      <div class="subcard">
        <div style="font-size:13.5px;font-weight:600;margin-bottom:10px;">Длительность сушки</div>
        ${[
          [1, "2 часа (рекомендуется)", "Быстрая сушка для большинства помещений"],
          [2, "3 часа", "Для помещений со средней влажностью"],
          [3, "4 часа", "Максимальная просушка при высокой влажности воздуха"]
        ].map(([val, t, d]) => `
          <div class="radio-card ${dryTime === val ? 'selected' : ''}" onclick="apiSetProps([{siid:2,piid:31,value:${val}}], 'Время сушки: ${t}')">
            <div>
              <div style="font-size:14px;font-weight:600;">${t}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${d}</div>
            </div>
            <div class="radio-dot"></div>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  if (pageId === "detergent") {
    const useDet = Boolean(STATE["2.36"]);
    const selfDel = Boolean(STATE["2.59"]);
    const remindDet = Boolean(STATE["2.71"]);
    box.innerHTML = `
      <div class="subcard">
        <div class="settings-row" onclick="togglePropBool(2, 36, 'Использование моющего средства')">
          <div class="settings-row-left">
            <div class="settings-row-title">Использовать моющее средство</div>
            <div class="settings-row-desc">Автоматически добавлять чистящий раствор при промывке салфеток</div>
          </div>
          <button class="mi-switch ${useDet ? 'on' : ''}"></button>
        </div>

        <div class="settings-row" style="border-top:1px solid var(--divider);" onclick="togglePropBool(2, 59, 'Автодозирование моющего средства')">
          <div class="settings-row-left">
            <div class="settings-row-title">Автодозирование из картриджа</div>
            <div class="settings-row-desc">Автоматическая подача средства из установленного картриджа</div>
          </div>
          <button class="mi-switch ${selfDel ? 'on' : ''}"></button>
        </div>

        <div class="settings-row" style="border-top:1px solid var(--divider);" onclick="togglePropBool(2, 71, 'Уведомление о расходе средства')">
          <div class="settings-row-left">
            <div class="settings-row-title">Уведомление об окончании средства</div>
            <div class="settings-row-desc">Предупреждать, когда моющее средство заканчивается</div>
          </div>
          <button class="mi-switch ${remindDet ? 'on' : ''}"></button>
        </div>
      </div>
    `;
    return;
  }

  if (pageId === "ai_detection") {
    const aiRows = [
      [2, 45, "Включить ИИ-распознавание", "Распознавание объектов и загрязнений на полу"],
      [2, 47, "Распознавание препятствий", "Определение обуви, проводов, носков и отображение их значков на карте"],
      [2, 48, "Автоопределение типа комнат", "Автоматическое определение спальни, гостиной, коридора и ванной"],
      [2, 49, "Распознавание материала пола", "Определение плитки и ламината/паркета"],
      [2, 52, "Распознавание твёрдых загрязнений", "Автоматическое усиление очистки при обнаружении рассыпанного мусора"],
      [2, 69, "Умное ИИ-управление подачей воды", "Автоматическая регулировка влажности салфеток в зависимости от покрытия пола"],
      [2, 46, "Распознавание стойких пятен", "Повторное оттирание участков пола с пятнами"]
    ];

    box.innerHTML = `
      <div class="subcard">
        ${aiRows.map(([s, p, title, desc], idx) => `
          <div class="settings-row" style="${idx > 0 ? 'border-top:1px solid var(--divider);' : ''}" onclick="togglePropBool(${s}, ${p}, '${title}')">
            <div class="settings-row-left">
              <div class="settings-row-title">${title}</div>
              <div class="settings-row-desc">${desc}</div>
            </div>
            <button class="mi-switch ${STATE[`${s}.${p}`] ? 'on' : ''}"></button>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  if (pageId === "obstacle_strategy") {
    const curStrat = Number(STATE["2.75"] ?? 0);
    box.innerHTML = `
      <div class="subcard">
        <div style="font-size:13.5px;font-weight:600;margin-bottom:10px;">Режим объезда препятствий</div>
        ${[
          [0, "Минимум столкновений", "Робот аккуратно объезжает мебель и предметы, минимизируя касания"],
          [1, "Высокое покрытие площади", "Робот старается максимально плотно проходить вдоль предметов и заезжать в узкие места"]
        ].map(([val, t, d]) => `
          <div class="radio-card ${curStrat === val ? 'selected' : ''}" onclick="apiSetProps([{siid:2,piid:75,value:${val}}], 'Стратегия: ${t}')">
            <div style="padding-right:10px;">
              <div style="font-size:14px;font-weight:600;">${t}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:3px;line-height:1.35;">${d}</div>
            </div>
            <div class="radio-dot"></div>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  if (pageId === "carpet_pref") {
    const curMethod = Number(STATE["2.73"] ?? 0);
    box.innerHTML = `
      <div class="subcard">
        <div style="font-size:13.5px;font-weight:600;margin-bottom:10px;">Способ уборки ковров</div>
        ${[
          [0, "Адаптивный режим (подъём салфеток)", "При заезде на ковёр робот автоматически поднимает салфетки и выполняет только сухую уборку"],
          [1, "Объезд ковров", "Робот полностью объезжает ковровые покрытия"],
          [2, "Игнорировать ковры", "Продолжать текущую уборку без подъёма салфеток"]
        ].map(([val, t, d]) => `
          <div class="radio-card ${curMethod === val ? 'selected' : ''}" onclick="apiSetProps([{siid:2,piid:73,value:${val}}], 'Режим ковров: ${t}')">
            <div style="padding-right:10px;">
              <div style="font-size:14px;font-weight:600;">${t}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${d}</div>
            </div>
            <div class="radio-dot"></div>
          </div>
        `).join("")}
      </div>

      <div class="subcard">
        <div class="settings-row" onclick="togglePropBool(2, 77, 'Автораспознавание ковров')">
          <div class="settings-row-left">
            <div class="settings-row-title">Ультразвуковое распознавание ковров</div>
            <div class="settings-row-desc">Автоматическое определение ковров датчиком на днище робота</div>
          </div>
          <button class="mi-switch ${STATE['2.77'] ? 'on' : ''}"></button>
        </div>

        <div class="settings-row" style="border-top:1px solid var(--divider);" onclick="togglePropBool(2, 20, 'Увеличение мощности на ковре')">
          <div class="settings-row-left">
            <div class="settings-row-title">Увеличение мощности на коврах</div>
            <div class="settings-row-desc">Автоматическое включение максимального всасывания на ковре</div>
          </div>
          <button class="mi-switch ${STATE['2.20'] ? 'on' : ''}"></button>
        </div>

        <div class="settings-row" style="border-top:1px solid var(--divider);" onclick="togglePropBool(2, 76, 'Глубокая чистка ковров')">
          <div class="settings-row-left">
            <div class="settings-row-title">Глубокая чистка ковров в 2 прохода</div>
            <div class="settings-row-desc">Двойной перекрёстный проход по ковровым покрытиям</div>
          </div>
          <button class="mi-switch ${STATE['2.76'] ? 'on' : ''}"></button>
        </div>

        <div class="settings-row" style="border-top:1px solid var(--divider);" onclick="togglePropBool(2, 22, 'Отображение ковров на карте')">
          <div class="settings-row-left">
            <div class="settings-row-title">Отображать ковры на карте</div>
          </div>
          <button class="mi-switch ${STATE['2.22'] ? 'on' : ''}"></button>
        </div>
      </div>
    `;
    return;
  }

  if (pageId === "voice_volume") {
    const curVol = Number(STATE["4.2"] ?? 100);
    const curVoice = String(STATE["15.2"] || "en_US");
    box.innerHTML = `
      <div class="subcard">
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">Громкость динамика: <span id="volValDisplay" style="color:var(--accent-blue-text);">${curVol}%</span></div>
        <input type="range" min="0" max="100" step="5" value="${curVol}" style="width:100%;accent-color:var(--accent-blue);" oninput="document.getElementById('volValDisplay').textContent = this.value + '%'" onchange="apiSetProps([{siid:4,piid:2,value:Number(this.value)}], 'Громкость установлена: ' + this.value + '%')" />
        <button class="btn-small-outline" style="margin-top:12px;width:100%;padding:10px;" onclick="apiAction(2, 27, [], 'Воспроизведение тестового сигнала на роботе')">Прослушать громкость на роботе</button>
      </div>

      <div class="subcard">
        <div style="font-size:14px;font-weight:600;margin-bottom:8px;">Язык голосовой озвучки робота</div>
        ${[
          ["en_US", "Английский язык (English)", "Встроенная официальная английская озвучка"],
          ["zh_CN", "Китайский язык", "Оригинальная китайская озвучка"]
        ].map(([code, t, d]) => `
          <div class="radio-card ${curVoice === code ? 'selected' : ''}" onclick="switchRobotVoice('${code}')">
            <div>
              <div style="font-size:14px;font-weight:600;">${t}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">${d}</div>
            </div>
            <div class="radio-dot"></div>
          </div>
        `).join("")}
      </div>
    `;
    return;
  }

  if (pageId === "remote_control") {
    box.innerHTML = `
      <div class="subcard" style="text-align:center;">
        <div style="font-size:13px;color:var(--text-secondary);margin-bottom:10px;">
          Ручное управление движением робота M30 Pro
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px;">
          <button class="btn-small-outline" onclick="apiAction(2, 28, [], 'Включён режим пульта ДУ')">Включить режим ДУ</button>
          <button class="btn-small-outline" onclick="apiAction(2, 29, [], 'Выход из режима пульта ДУ')">Выйти из ДУ</button>
        </div>

        <div class="dpad-wrap">
          <div></div>
          <button class="dpad-btn" title="Вперёд" onclick="apiAction(2, 26, [{piid:1,value:1}], 'Движение вперёд')">▲</button>
          <div></div>
          <button class="dpad-btn" title="Влево" onclick="apiAction(2, 26, [{piid:1,value:3}], 'Поворот влево')">◀</button>
          <button class="dpad-btn" title="Стоп" onclick="apiAction(2, 26, [{piid:1,value:5}], 'Остановка')">■</button>
          <button class="dpad-btn" title="Вправо" onclick="apiAction(2, 26, [{piid:1,value:4}], 'Поворот вправо')">▶</button>
          <div></div>
          <button class="dpad-btn" title="Назад" onclick="apiAction(2, 26, [{piid:1,value:2}], 'Разворот / Назад')">▼</button>
          <div></div>
        </div>
      </div>
    `;
    return;
  }

  if (pageId === "water_check") {
    const installed = Boolean(STATE["2.62"]);
    box.innerHTML = `
      <div class="subcard">
        <div style="font-size:14.5px;font-weight:600;margin-bottom:6px;">
          Статус модуля водопровода: <span style="color:${installed ? 'var(--accent-green)' : 'var(--text-secondary)'};">${installed ? 'Установлен' : 'Используются баки для воды'}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.45;margin-bottom:14px;">
          Проверка системы автоматического набора чистой воды и слива грязной воды в канализацию (робот должен находиться на базе).
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn-create-pill" style="flex:1;background:var(--accent-blue);color:#fff;" onclick="apiAction(2, 45, [], 'Запущена самодиагностика водопровода')">Начать самодиагностику</button>
          <button class="btn-small-outline" onclick="apiAction(2, 46, [], 'Самодиагностика остановлена')">Остановить</button>
        </div>
      </div>
    `;
    return;
  }

  if (pageId === "map_manage") {
    box.innerHTML = `
      <div class="subcard">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div>
            <div style="font-size:15px;font-weight:600;">Карта 1 (Текущая карта квартиры)</div>
            <div style="font-size:11.5px;color:var(--text-secondary);margin-top:2px;">Комнаты: Спальня, Коридор, Ванная, Гостиная • ID: ${STATE["10.6"] || 1760460394}</div>
          </div>
          <span style="background:rgba(50,199,89,0.14);color:var(--accent-green);font-size:11.5px;padding:4px 10px;border-radius:12px;font-weight:600;">Активна</span>
        </div>
        <img src="/apartment_map_ru.png" style="width:100%;border-radius:12px;margin:8px 0;" alt="Карта квартиры" />
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn-small-outline" style="flex:1;padding:10px;" onclick="closeSubpage(); closeSettings();">Вернуться к карте</button>
          <button class="btn-small-outline" style="padding:10px;" onclick="apiAction(2, 17, [], 'Запущено быстрое построение новой карты')">Построить новую карту</button>
        </div>
      </div>
    `;
    return;
  }

  if (pageId === "scenes") {
    box.innerHTML = `
      <div class="subcard">
        <div style="font-size:14.5px;font-weight:600;margin-bottom:10px;">Готовые сценарии в одно нажатие</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="custom-plan-item">
            <div class="custom-plan-info">
              <div class="custom-plan-name">Полная турбо-уборка + горячая стирка</div>
              <div class="custom-plan-meta">Всасывание: Турбо • Подача воды: Уровень 3 • Горячая вода 60°C</div>
            </div>
            <button class="btn-plan-run" onclick="apiSetProps([{siid:2,piid:4,value:3},{siid:2,piid:9,value:4},{siid:2,piid:10,value:3},{siid:2,piid:41,value:true}], 'Применён сценарий Турбо-уборки'); setTimeout(()=>handleMainCleanAction(), 500);">Запуск</button>
          </div>

          <div class="custom-plan-item">
            <div class="custom-plan-info">
              <div class="custom-plan-name">Ночная тихая сухая уборка</div>
              <div class="custom-plan-meta">Только сухая • Режим: Тихий • Минимум столкновений</div>
            </div>
            <button class="btn-plan-run" onclick="apiSetProps([{siid:2,piid:4,value:1},{siid:2,piid:9,value:1},{siid:2,piid:75,value:0}], 'Применён сценарий Тихой уборки'); setTimeout(()=>handleMainCleanAction(), 500);">Запуск</button>
          </div>

          <div class="custom-plan-item">
            <div class="custom-plan-info">
              <div class="custom-plan-name">Полное обслуживание на базе</div>
              <div class="custom-plan-meta">Срезание волос с щётки + Промывка салфеток горячей водой</div>
            </div>
            <button class="btn-plan-run" onclick="apiAction(2, 43, [], 'Запущено обслуживание базы (срезание волос)')">Запуск</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (pageId === "device_info") {
    box.innerHTML = `
      <div class="subcard" style="display:flex;flex-direction:column;gap:11px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Устройство:</span><b>Mijia Robot Vacuum M30 Pro</b></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Модель MIoT:</span><code>xiaomi.vacuum.c107</code></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Версия прошивки:</span><b>4.3.9_0143</b></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">ID устройства (DID):</span><code>1144572847</code></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Аккаунт Xiaomi (UID):</span><code>4249155778</code></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Локальный IP пылесоса:</span><code>192.168.1.64</code></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary);">Локальный токен miio:</span><code style="font-size:11px;">757479724d4d6143326c6d4a6d55674b</code></div>
      </div>
      <button class="btn-create-pill" style="width:100%;padding:12px;background:var(--accent-blue);color:#fff;" onclick="syncFromRobot('full', true)">Полный опрос всех 72 параметров с робота</button>
    `;
    return;
  }
}

function saveDndTime() {
  const sVal = document.getElementById("dndStartInput")?.value || "22:00";
  const eVal = document.getElementById("dndEndInput")?.value || "08:00";
  const [sh, sm] = sVal.split(":").map(Number);
  const [eh, em] = eVal.split(":").map(Number);
  const encoded = encodeDndPeriod(sh, sm, eh, em);
  apiSetProps([
    { siid: 11, piid: 1, value: true },
    { siid: 11, piid: 2, value: encoded }
  ], `Интервал «Не беспокоить» сохранён: ${sVal}–${eVal}`);
}

function addScheduleItem() {
  const time = document.getElementById("newSchedTime")?.value || "10:00";
  const repeat = document.getElementById("newSchedRepeat")?.value || "Ежедневно";
  const mode = Number(document.getElementById("newSchedMode")?.value || 3);
  let schedules = [];
  try {
    schedules = JSON.parse(STATE["2.19"] || '{"time_labels":[]}').time_labels || [];
  } catch (e) {}
  schedules.push({ id: Date.now(), time, repeat, mode, enabled: true });
  STATE["2.19"] = JSON.stringify({ time_labels: schedules });
  renderAll();
  showToast(`Расписание на ${time} (${repeat}) добавлено`);
}

function toggleScheduleItem(idx) {
  let schedules = [];
  try {
    schedules = JSON.parse(STATE["2.19"] || '{"time_labels":[]}').time_labels || [];
  } catch (e) {}
  if (schedules[idx]) {
    schedules[idx].enabled = !schedules[idx].enabled;
    STATE["2.19"] = JSON.stringify({ time_labels: schedules });
    renderAll();
  }
}

function deleteScheduleItem(idx) {
  let schedules = [];
  try {
    schedules = JSON.parse(STATE["2.19"] || '{"time_labels":[]}').time_labels || [];
  } catch (e) {}
  schedules.splice(idx, 1);
  STATE["2.19"] = JSON.stringify({ time_labels: schedules });
  renderAll();
  showToast("Расписание удалено");
}

async function switchRobotVoice(langCode) {
  STATE["15.1"] = langCode;
  STATE["15.2"] = langCode;
  renderAll();
  try {
    await fetch(`${API_BASE}/api/spec_act`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siid: "15",
        aiid: "1",
        params: [langCode, "", '{"md5":"","size":0}']
      })
    });
    showToast(`Голосовой пакет робота переключён на ${langCode === 'en_US' ? 'Английский' : 'Китайский'}`);
  } catch (e) {
    showToast("Ошибка переключения голоса");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  syncFromRobot("none", false);
  setTimeout(() => syncFromRobot("fast", false), 500);
  setInterval(() => {
    if (document.visibilityState === "visible") {
      syncFromRobot("fast", false);
    }
  }, 45000);
});
