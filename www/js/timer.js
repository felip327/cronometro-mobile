/**
 * timer.js
 * -----------------------------------------------------------------------
 * Motor do cronômetro Pomodoro (a "lógica de negócio").
 * Não toca no DOM - só controla estado e dispara callbacks.
 * A camada de UI (ui.js) é quem escuta esses callbacks e desenha a tela.
 * -----------------------------------------------------------------------
 */

const MODES = {
  FOCUS: "focus",
  SHORT_BREAK: "short_break",
  LONG_BREAK: "long_break",
};

class PomodoroTimer {
  constructor(settings) {
    this.settings = settings;
    this.mode = MODES.FOCUS;
    this.cycleCount = 0; // quantos focos completos desde a última pausa longa
    this.remainingSeconds = this._durationFor(this.mode) * 60;
    this.running = false;
    this._intervalId = null;

    // callbacks configuráveis de fora
    this.onTick = () => {};
    this.onModeChange = () => {};
    this.onSessionComplete = () => {}; // sessão terminou naturalmente
    this.onStateChange = () => {}; // start/pause/reset genérico
  }

  updateSettings(newSettings) {
    this.settings = newSettings;
    if (!this.running) {
      this.remainingSeconds = this._durationFor(this.mode) * 60;
      this.onTick(this.remainingSeconds);
    }
  }

  _durationFor(mode) {
    switch (mode) {
      case MODES.FOCUS:
        return this.settings.focusMinutes;
      case MODES.SHORT_BREAK:
        return this.settings.shortBreakMinutes;
      case MODES.LONG_BREAK:
        return this.settings.longBreakMinutes;
      default:
        return this.settings.focusMinutes;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.onStateChange({ running: true });
    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this._intervalId);
    this.onStateChange({ running: false });
  }

  toggle() {
    this.running ? this.pause() : this.start();
  }

  reset() {
    this.pause();
    this.remainingSeconds = this._durationFor(this.mode) * 60;
    this.onTick(this.remainingSeconds);
    this.onStateChange({ running: false });
  }

  /** Pula para a próxima etapa sem contar como sessão completada. */
  skip() {
    this._finishSession(false);
  }

  _tick() {
    this.remainingSeconds -= 1;
    this.onTick(this.remainingSeconds);

    if (this.remainingSeconds <= 0) {
      this._finishSession(true);
    }
  }

  _finishSession(completed) {
    this.pause();

    this.onSessionComplete({
      type: this.mode,
      durationMinutes: this._durationFor(this.mode),
      completed,
    });

    this._advanceMode();
  }

  _advanceMode() {
    if (this.mode === MODES.FOCUS) {
      this.cycleCount += 1;
      const isLongBreakDue =
        this.cycleCount % this.settings.cyclesUntilLongBreak === 0;
      this.mode = isLongBreakDue ? MODES.LONG_BREAK : MODES.SHORT_BREAK;
    } else {
      this.mode = MODES.FOCUS;
    }

    this.remainingSeconds = this._durationFor(this.mode) * 60;
    this.onModeChange({ mode: this.mode, cycleCount: this.cycleCount });
    this.onTick(this.remainingSeconds);
  }

  get totalSeconds() {
    return this._durationFor(this.mode) * 60;
  }

  get progress() {
    // 0 -> começando, 1 -> terminando
    return 1 - this.remainingSeconds / this.totalSeconds;
  }
}
