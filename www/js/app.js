import { supabase } from './supabase.js'

/**
 * app.js
 * -----------------------------------------------------------------------
 * Ponto de entrada: cria as instâncias e conecta timer <-> storage <-> ui.
 * -----------------------------------------------------------------------
 */

(function bootstrap() {
  document.addEventListener("DOMContentLoaded", async () => {
    StudyUI.cacheDom();
    StudyUI.drawTickMarks();

    const settings = StudyStorage.getSettings();
    const timer = new PomodoroTimer(settings);

    // ---- conecta o motor do timer à interface --------------------------

    timer.onTick = (remainingSeconds) => {
      StudyUI.renderTick(remainingSeconds, timer);
    };

    timer.onModeChange = ({ mode, cycleCount }) => {
      StudyUI.renderMode(mode, cycleCount, timer.settings);
    };

    timer.onStateChange = ({ running }) => {
      StudyUI.renderRunningState(running);
    };

    timer.onSessionComplete = (session) => {
      StudyStorage.addSession(session);
      StudyUI.renderQuickStats();

      if (session.completed) {
        if (timer.settings.soundEnabled) StudyUI.playChime();
        if (timer.settings.vibrationEnabled) StudyUI.vibrate();
      }
    };

    // estado inicial na tela
    StudyUI.renderMode(timer.mode, timer.cycleCount, timer.settings);
    StudyUI.renderTick(timer.remainingSeconds, timer);
    StudyUI.renderRunningState(false);
    StudyUI.renderQuickStats();
    StudyUI.renderSettings(settings);
    
    

    // ---- controles do timer --------------------------------------------

    StudyUI.el.btnToggle.addEventListener("click", () => timer.toggle());
    StudyUI.el.btnReset.addEventListener("click", () => timer.reset());
    StudyUI.el.btnSkip.addEventListener("click", () => timer.skip());

    // ---- navegação por abas --------------------------------------------

    StudyUI.el.tabButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const aba = btn.dataset.tab;

    StudyUI.switchTab(aba);

    if (aba === "history") {
      await carregarSessoesSupabase();
    }
  });
});

// BUSCAR DADOS DO SUPABASE

async function carregarSessoesSupabase() {
  const lista = document.getElementById('history-list');
  const vazio = document.getElementById('history-empty');

  if (!lista) return;

  try {
    const { data, error } = await supabase
      .from('sessoes_estudo')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao buscar sessões do Supabase:', error);
      return;
    }

    console.log('Sessões vindas do Supabase:', data);
    console.log('Quantidade de sessões:', data ? data.length : 0);

    lista.innerHTML = '';

    if (!data || data.length === 0) {
      if (vazio) {
        vazio.classList.remove('hidden');
        vazio.classList.add('flex');
      }
      lista.classList.add('hidden');
      return;
    }

    if (vazio) {
      vazio.classList.add('hidden');
      vazio.classList.remove('flex');
    }
    lista.classList.remove('hidden');

    let totalMinutos = 0;
    let totalSessoes = 0;

    data.forEach((sessao) => {
      totalMinutos += (sessao.duracao_minutos || 0);
      totalSessoes += 1;

      const item = document.createElement('div');
      item.className = 'card border border-board-lighter/50 mb-3';

      const tipo =
        sessao.tipo === 'focus'
          ? '🎯 Sessão de Foco'
          : sessao.tipo === 'short_break'
            ? '☕ Pausa Curta'
            : '🌙 Pausa Longa';

      const dataFormatada = sessao.finalizada_em
        ? new Date(sessao.finalizada_em).toLocaleString('pt-BR')
        : '';

      item.innerHTML = `
        <div class="flex items-center justify-between">
          <p class="font-semibold text-chalk">${tipo}</p>
          <span class="font-mono text-sm text-chalk-muted">${sessao.duracao_minutos} min</span>
        </div>
        <div class="flex items-center justify-between mt-1 text-xs text-chalk-dim">
          <span>${sessao.concluida ? '✅ Concluída' : '⏳ Não concluída'}</span>
          <span>${dataFormatada}</span>
        </div>
      `;

      lista.appendChild(item);
    });

    const elTotalMin = document.getElementById('hist-total-minutes');
    const elTotalSess = document.getElementById('hist-total-sessions');
    if (elTotalMin) elTotalMin.textContent = totalMinutos;
    if (elTotalSess) elTotalSess.textContent = totalSessoes;
  } catch (err) {
    console.error('Erro ao conectar ao Supabase:', err);
  }
}

// CHAMAR SUPABASE AO INICIAR
carregarSessoesSupabase();

    // ---- histórico --------------------------------------------------

    StudyUI.el.btnClearHistory.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Tem certeza que deseja apagar todo o histórico de sessões? Essa ação não pode ser desfeita."
      );
      if (confirmed) {
        StudyStorage.clearHistory();
        StudyUI.renderHistory();
        StudyUI.renderQuickStats();
      }
    });

    // ---- configurações --------------------------------------------------

    function persistSettingsFromForm() {
      const updated = StudyStorage.saveSettings({
        focusMinutes: clampInt(StudyUI.el.setFocus.value, 1, 180, 25),
        shortBreakMinutes: clampInt(StudyUI.el.setShort.value, 1, 60, 5),
        longBreakMinutes: clampInt(StudyUI.el.setLong.value, 1, 120, 15),
        cyclesUntilLongBreak: clampInt(StudyUI.el.setCycles.value, 1, 12, 4),
        soundEnabled: StudyUI.el.setSound.checked,
        vibrationEnabled: StudyUI.el.setVibration.checked,
      });
      timer.updateSettings(updated);
      StudyUI.renderMode(timer.mode, timer.cycleCount, timer.settings);
      StudyUI.flashSettingsSaved();
    }

    function clampInt(value, min, max, fallback) {
      const n = parseInt(value, 10);
      if (Number.isNaN(n)) return fallback;
      return Math.min(max, Math.max(min, n));
    }

    StudyUI.el.settingsForm.addEventListener("change", persistSettingsFromForm);

    // ---- Service worker (uso offline após o primeiro carregamento) ------

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").catch(() => {
          // silencioso: app funciona normalmente mesmo sem SW
        });
      });
    }
  });
})();
