/**
 * storage.js
 * -----------------------------------------------------------------------
 * Camada de persistência (o "backend" local do app).
 * Toda a leitura/escrita no localStorage fica isolada aqui.
 * Nenhum outro arquivo deve chamar `localStorage` diretamente.
 * -----------------------------------------------------------------------
 */

const StudyStorage = (() => {
  const KEYS = {
    SESSIONS: "pomodoro:sessions",
    SETTINGS: "pomodoro:settings",
  };

  const DEFAULT_SETTINGS = {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesUntilLongBreak: 4,
    soundEnabled: true,
    vibrationEnabled: true,
  };

  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      console.error(`Falha ao ler "${key}" do localStorage`, err);
      return fallback;
    }
  }

  function _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`Falha ao gravar "${key}" no localStorage`, err);
      return false;
    }
  }

  // ---- Settings -----------------------------------------------------

  function getSettings() {
    return { ...DEFAULT_SETTINGS, ..._read(KEYS.SETTINGS, {}) };
  }

  function saveSettings(partialSettings) {
    const merged = { ...getSettings(), ...partialSettings };
    _write(KEYS.SETTINGS, merged);
    return merged;
  }

  // ---- Sessions (histórico) ------------------------------------------

  function getSessions() {
    return _read(KEYS.SESSIONS, []);
  }

  /**
   * @param {Object} session
   * @param {"focus"|"short_break"|"long_break"} session.type
   * @param {number} session.durationMinutes  duração planejada
   * @param {boolean} session.completed        terminou naturalmente ou foi pulada
   */
  function addSession(session) {
    const sessions = getSessions();
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: session.type,
      durationMinutes: session.durationMinutes,
      completed: !!session.completed,
      finishedAt: new Date().toISOString(),
    };
    sessions.unshift(entry); // mais recente primeiro
    _write(KEYS.SESSIONS, sessions);
    return entry;
  }

  function clearHistory() {
    _write(KEYS.SESSIONS, []);
  }

  // ---- Estatísticas derivadas -----------------------------------------

  function getStats() {
    const sessions = getSessions();
    const focusSessions = sessions.filter(
      (s) => s.type === "focus" && s.completed
    );
    const totalFocusMinutes = focusSessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );

    const today = new Date().toDateString();
    const todayFocusMinutes = focusSessions
      .filter((s) => new Date(s.finishedAt).toDateString() === today)
      .reduce((sum, s) => sum + s.durationMinutes, 0);

    return {
      totalSessions: focusSessions.length,
      totalFocusMinutes,
      todayFocusMinutes,
    };
  }

  return {
    getSettings,
    saveSettings,
    getSessions,
    addSession,
    clearHistory,
    getStats,
  };
})();
