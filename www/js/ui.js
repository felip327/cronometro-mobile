/**
 * ui.js
 * -----------------------------------------------------------------------
 * Camada de interface (o "frontend"). Só mexe no DOM e escuta eventos
 * de usuário. Toda regra de negócio vem de PomodoroTimer (timer.js) e
 * todo dado persistido vem de StudyStorage (storage.js).
 * -----------------------------------------------------------------------
 */

const StudyUI = (() => {
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 120;

  const MODE_META = {
    focus: { label: "Sessão de Foco", color: "#E8583B", dotClass: "bg-tomato" },
    short_break: { label: "Pausa Curta", color: "#5FA8C9", dotClass: "bg-breeze" },
    long_break: { label: "Pausa Longa", color: "#E3B23C", dotClass: "bg-amber" },
  };

  // ---- referências DOM ------------------------------------------------
  const el = {};

  function cacheDom() {
    el.tickMarks = document.getElementById("tick-marks");
    el.progressRing = document.getElementById("progress-ring");
    el.timeDisplay = document.getElementById("time-display");
    el.sessionCount = document.getElementById("session-count");
    el.modeLabel = document.getElementById("mode-label");
    el.modeText = document.getElementById("mode-text");
    el.modeDot = document.getElementById("mode-dot");
    el.cycleIndicator = document.getElementById("cycle-indicator");
    el.btnToggle = document.getElementById("btn-toggle");
    el.btnReset = document.getElementById("btn-reset");
    el.btnSkip = document.getElementById("btn-skip");
    el.statToday = document.getElementById("stat-today");
    el.statSessions = document.getElementById("stat-sessions");

    el.historyList = document.getElementById("history-list");
    el.historyEmpty = document.getElementById("history-empty");
    el.histTotalMinutes = document.getElementById("hist-total-minutes");
    el.histTotalSessions = document.getElementById("hist-total-sessions");
    el.btnClearHistory = document.getElementById("btn-clear-history");

    el.settingsForm = document.getElementById("settings-form");
    el.setFocus = document.getElementById("set-focus");
    el.setShort = document.getElementById("set-short");
    el.setLong = document.getElementById("set-long");
    el.setCycles = document.getElementById("set-cycles");
    el.setSound = document.getElementById("set-sound");
    el.setVibration = document.getElementById("set-vibration");
    el.settingsSaved = document.getElementById("settings-saved");

    el.tabButtons = document.querySelectorAll("[data-tab]");
    el.screens = document.querySelectorAll("[data-screen]");
  }

  function drawTickMarks() {
    // 60 marcações ao redor do anel, como um mostrador de cronômetro
    const cx = 140, cy = 140, rOuter = 120, rInner1 = 108, rInner5 = 102;
    let svg = "";
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI;
      const isMajor = i % 5 === 0;
      const rInner = isMajor ? rInner5 : rInner1;
      const x1 = cx + rOuter * Math.cos(angle);
      const y1 = cy + rOuter * Math.sin(angle);
      const x2 = cx + rInner * Math.cos(angle);
      const y2 = cy + rInner * Math.sin(angle);
      svg += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" ${isMajor ? 'stroke-width="3"' : ''} />`;
    }
    el.tickMarks.innerHTML = svg;
  }

  function formatTime(totalSeconds) {
    const m = Math.max(0, Math.floor(totalSeconds / 60));
    const s = Math.max(0, totalSeconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  // ---- render: tela do timer ------------------------------------------

  function renderTick(remainingSeconds, timer) {
    el.timeDisplay.textContent = formatTime(remainingSeconds);
    const progress = 1 - remainingSeconds / timer.totalSeconds;
    const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
    el.progressRing.style.strokeDashoffset = String(offset);
    document.title = `${formatTime(remainingSeconds)} · Foco`;
  }

  function renderMode(mode, cycleCount, settings) {
    const meta = MODE_META[mode];
    el.modeText.textContent = meta.label;
    el.modeDot.className = `h-2 w-2 rounded-full ${meta.dotClass}`;
    el.progressRing.style.stroke = meta.color;
    el.sessionCount.textContent = `ciclo ${Math.floor(cycleCount / settings.cyclesUntilLongBreak) + 1} · foco ${
      (cycleCount % settings.cyclesUntilLongBreak) + (mode === "focus" ? 1 : 0)
    }/${settings.cyclesUntilLongBreak}`;
    renderCycleDots(cycleCount, settings);
  }

  function renderCycleDots(cycleCount, settings) {
    const posInCycle = cycleCount % settings.cyclesUntilLongBreak;
    let dots = "";
    for (let i = 0; i < settings.cyclesUntilLongBreak; i++) {
      const filled = i < posInCycle;
      dots += `<span class="h-1.5 w-1.5 rounded-full ${filled ? "bg-tomato" : "bg-board-lighter"}"></span>`;
    }
    el.cycleIndicator.innerHTML = dots;
  }

  function renderRunningState(running) {
    el.btnToggle.textContent = running ? "Pausar" : "Continuar";
  }

  function renderQuickStats() {
    const stats = StudyStorage.getStats();
    el.statToday.textContent = stats.todayFocusMinutes;
    el.statSessions.textContent = stats.totalSessions;
  }

  // ---- render: histórico ------------------------------------------------

  const TYPE_LABEL = {
    focus: "Foco",
    short_break: "Pausa curta",
    long_break: "Pausa longa",
  };

  function renderHistory() {
    const sessions = StudyStorage.getSessions();
    const stats = StudyStorage.getStats();
    el.histTotalMinutes.textContent = stats.totalFocusMinutes;
    el.histTotalSessions.textContent = stats.totalSessions;

    if (sessions.length === 0) {
      el.historyList.classList.add("hidden");
      el.historyEmpty.classList.remove("hidden");
      el.historyEmpty.classList.add("flex");
      return;
    }
    el.historyList.classList.remove("hidden");
    el.historyEmpty.classList.add("hidden");

    const groups = groupByDay(sessions);
    el.historyList.innerHTML = Object.entries(groups)
      .map(([day, items]) => renderDayGroup(day, items))
      .join("");
  }

  function groupByDay(sessions) {
    const groups = {};
    sessions.forEach((s) => {
      const day = new Date(s.finishedAt).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "short",
      });
      (groups[day] = groups[day] || []).push(s);
    });
    return groups;
  }

  function renderDayGroup(day, items) {
    const rows = items
      .map((s) => {
        const time = new Date(s.finishedAt).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const dotClass = MODE_META[s.type]?.dotClass || "bg-chalk-dim";
        const skippedTag = s.completed
          ? ""
          : `<span class="text-[10px] text-chalk-dim">(pulada)</span>`;
        return `
          <div class="flex items-center justify-between py-2.5 border-b border-board-lighter/50 last:border-0">
            <div class="flex items-center gap-3">
              <span class="h-2 w-2 rounded-full ${dotClass}"></span>
              <div>
                <p class="text-sm text-chalk">${TYPE_LABEL[s.type] || s.type} ${skippedTag}</p>
                <p class="text-xs text-chalk-dim">${time}</p>
              </div>
            </div>
            <span class="font-mono text-sm text-chalk-muted">${s.durationMinutes} min</span>
          </div>`;
      })
      .join("");

    return `
      <div class="card">
        <p class="mb-1 text-xs font-medium uppercase tracking-wide text-chalk-dim">${day}</p>
        ${rows}
      </div>`;
  }

  // ---- render: configurações ------------------------------------------

  function renderSettings(settings) {
    el.setFocus.value = settings.focusMinutes;
    el.setShort.value = settings.shortBreakMinutes;
    el.setLong.value = settings.longBreakMinutes;
    el.setCycles.value = settings.cyclesUntilLongBreak;
    el.setSound.checked = settings.soundEnabled;
    el.setVibration.checked = settings.vibrationEnabled;
  }

  function flashSettingsSaved() {
    el.settingsSaved.classList.remove("hidden");
    clearTimeout(flashSettingsSaved._t);
    flashSettingsSaved._t = setTimeout(() => {
      el.settingsSaved.classList.add("hidden");
    }, 1500);
  }

  // ---- navegação por abas ------------------------------------------------

  function switchTab(tabName) {
    el.screens.forEach((screen) => {
      const isTarget = screen.id === `screen-${tabName}`;
      screen.classList.toggle("hidden", !isTarget);
      screen.classList.toggle("flex", isTarget);
    });
    el.tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    if (tabName === "history") {
      // O histórico é carregado dinamicamente do Supabase pelo app.js
    }
  }

  // ---- feedback sonoro/tátil ------------------------------------------------

  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      [0, 0.18].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = i === 0 ? 880 : 1108.73;
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.2, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
      });
    } catch (err) {
      console.warn("Áudio indisponível", err);
    }
  }

  function vibrate() {
    if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
  }

  return {
    cacheDom,
    drawTickMarks,
    renderTick,
    renderMode,
    renderRunningState,
    renderQuickStats,
    renderHistory,
    renderSettings,
    flashSettingsSaved,
    switchTab,
    playChime,
    vibrate,
    el,
  };
})();
