# Foco — Cronômetro de Estudos (Pomodoro)

Cronômetro Pomodoro simples, mobile-first, sem backend nem banco de dados.
Todo o histórico de sessões fica salvo **no próprio celular**, usando
`localStorage` (armazenamento nativo do navegador).

## Estrutura do projeto

```
pomodoro/
├── index.html          → estrutura da página (as 3 telas: Timer / Histórico / Ajustes)
├── manifest.json        → permite "Adicionar à tela inicial" no Android
├── sw.js                → service worker: cacheia o app pra funcionar sem internet
├── icon.svg              → ícone do app
├── css/
│   └── tailwind.css     → Tailwind já compilado (não depende de internet/CDN)
├── src/
│   └── input.css        → fonte do Tailwind (só usado se você rebuildar o CSS)
├── js/
│   ├── storage.js        → "backend": única camada que fala com o localStorage
│   ├── timer.js           → lógica do Pomodoro (estados, contagem, ciclos)
│   ├── ui.js               → "frontend": desenha a tela e escuta cliques
│   └── app.js               → conecta timer + storage + ui
├── package.json
└── tailwind.config.js
```

A ideia da separação: `storage.js` e `timer.js` não tocam no DOM — são a
parte "de lógica/dados" do app. `ui.js` só desenha e escuta eventos. `app.js`
é quem liga um no outro. Assim fica fácil trocar qualquer camada (por
exemplo, trocar `localStorage` por outra forma de guardar dados no futuro)
sem mexer no resto.

## Como usar offline no Android

**Opção 1 — mais simples (sem instalar nada):**
1. Copie a pasta `pomodoro` inteira para o celular (Google Drive, cabo USB, etc).
2. Abra `index.html` com o Chrome direto do gerenciador de arquivos.
3. Pronto — como o CSS já está compilado localmente e o JS é todo próprio,
   não precisa de internet depois de aberto.

**Opção 2 — como um "app" (recomendado):**
1. Suba a pasta para o GitHub Pages, Vercel ou Netlify (grátis).
2. Abra o link no Chrome do Android.
3. Toque no menu (⋮) → **"Adicionar à tela inicial"**.
4. Isso instala o app com ícone próprio e, graças ao `sw.js`, ele guarda os
   arquivos em cache — depois do primeiro acesso, funciona offline mesmo
   fechando a internet do celular.

> Observação: o histórico fica salvo por navegador/aparelho. Se limpar os
> dados do site no Chrome ou usar outro navegador, o histórico não
> aparece — não é um banco de dados na nuvem, é só o armazenamento local.

## Rebuildar o CSS (opcional)

Só é necessário se você editar classes do Tailwind no HTML/JS e quiser
gerar o `css/tailwind.css` de novo:

```bash
npm install
npx tailwindcss -i ./src/input.css -o ./css/tailwind.css --minify
```

## Funcionalidades

- Timer de Foco / Pausa Curta / Pausa Longa, com duração configurável
- Avanço automático de ciclo (a cada N focos, entra pausa longa)
- Anel de progresso animado + contagem regressiva
- Som (beep) e vibração ao terminar uma etapa (configurável)
- Histórico de sessões agrupado por dia, com total de minutos focados
- Estatística do dia na própria tela do timer
- Tudo salvo localmente (`localStorage`) — nenhum servidor envolvido
