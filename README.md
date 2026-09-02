# Oasis Moments

Cria uma Landing Page de alto impacto e ultra profissional para um Sítio de Locações para Festas, Finais de Semana, Day Use e Eventos, acompanhada de um Painel de Administração interno protegido por palavra-passe na rota (/admin).

---

### 🎨 DESIGN SYSTEM & PALETA DE CORES

- Primary / Brand Color: Laranja `#FE8330` (Acentos, botões CTA do WhatsApp, ícones ativos, badges).

- Primary Hover: Laranja Escuro `#E06B1B` (Para estados de hover nos botões e links).

- Background: Off-white/Creme `#FAF8F5` (Fundo sofisticado, limpo e aconchegante).

- Card Background: Branco `#FFFFFF` com sombras suaves (`shadow-sm` a `shadow-md`) e bordas arredondadas (`rounded-2xl`).

- Typography / Text: Grafite Escuro `#1E2229` para excelente contraste e leitura.

- Elementos Secundários: Vidro fosco (`glassmorphism` com `backdrop-blur-md`), gradientes suaves de `#FE8330` para `#FF9E59` em destaques.

---

### 🌐 ESTRUTURA DA LANDING PAGE PÚBLICA

1. HERO SECTION (BANNER PRINCIPAL):

   - Headline marcante: "O cenário perfeito para os teus melhores momentos: Festas, Finais de Semana e Day Use."

   - Subtítulo explicativo com detalhes da estrutura e localização.

   - Carrossel de fotos/vídeos de alta definição com transição suave (fade/zoom).

   - Badges flutuantes com ícones em `#FE8330` (Ex: "Piscina Aquecida", "Área Gourmet", "Estacionamento Amplo").

   - Botão CTA Principal em destaque flutuante: "Verificar Disponibilidade no WhatsApp" (Link direto para o WhatsApp com mensagem pré-preenchida).

2. VISÃO GERAL DA INFRAESTRUTURA (GRID INTERATIVO):

   - Grid responsivo de cards com efeito hover (`scale-105` + transição de sombra).

   - Cada card exibe foto, título e descrição dos espaços (Área de Festas, Campo de Futebol, Suítes, Churrasqueira, Piscina).

3. TABELAS / TABS DE MODALIDADES DE LOCAÇÃO:

   - Abas interativas alternáveis: [Finais de Semana] [Festas & Eventos] [Day Use] [Finais de Ano / Feriados].

   - Ao trocar de aba, exibe dinamicamente o que está incluído, capacidade máxima de pessoas e botão "Consultar Valores".

4. GALERIA IMERSIVA (LOOKBOOK):

   - Layout em formato Masonry ou Grid Elegante.

   - Ao clicar na imagem, abre Lightbox em ecrã inteiro para visualização detalhada.

5. FAQ (PERGUNTAS FREQUENTES):

   - Componente Accordion limpo e expansível para tirar dúvidas rápidas (horários, capacidade, regras de som, etc.).

6. DEPOIMENTOS & AVALIAÇÕES:

   - Cards com estrelas e relatos reais de clientes que alugaram o sítio.

7. RODAPÉ & BOTÃO FLUTUANTE DE CONVERSÃO:

   - Botão fixo no canto inferior direito do ecrã com ícone do WhatsApp, pulso suave e texto "Falar com a Administração".

---

### 🔐 ÁREA ADMINISTRATIVA (/admin) - PAINEL INTERNO

- Criar a rota protegida `/admin` com ecrã de Login (E-mail e Palavra-passe).

- Integrar com Supabase Auth para permitir o acesso apenas a utilizadores autenticados.

- Criar um Dashboard intuitivo que permita à administração editar todo o conteúdo do site em tempo real sem precisar de alterar código:

  1. Configurações Gerais: Alterar número do WhatsApp e mensagem padrão.

  2. Módulo Hero & Textos: Editar títulos, sub-títulos e frases do site.

  3. Módulo de Galeria: Adicionar novas URLs de fotos, ordenar ou apagar fotos existentes.

  4. Módulo de Estrutura: Editar itens da infraestrutura e modalidades de locação.

  5. Módulo FAQ e Depoimentos: Criar, editar ou remover perguntas e avaliações.

---

### ✨ EFEITOS & MICRO-INTERAÇÕES

- Animações suaves de Scroll Reveal (elementos surgem com suave fade-up ao rolar a página).

- Transições de hover em todos os botões e cards interativos.

- Feedback visual imediato nos formulários e ações de gravação da área admin (Toasts de sucesso/erro).

- Interface 100% responsiva (focada em perfeita navegação por telemóvel e computador).

REFERÊNCIAS PARA SER SEGUIDA E APLICAR NO SITE DESCRITO ACIMA, MAS NÃO mude as cores do projeto: Mantenha a paleta HEX e variáveis de tema exatamente como estão organizadas hoje.

NÃO mude o layout nem o posicionamento: NENHUM botão, card, tabela, menu ou container deve mudar de lugar ou de tamanho estrutural.

NÃO altere textos, dados ou funcionalidades: Apenas adicione a camada de animação visual CSS/Tailwind nos elementos existentes.

REFERENCIA:

/*
 * =========================================================
 * ANIMATION & MICRO-INTERACTION REFERENCE
 * Extraído de: Shopify Design (03/08/2026)
 * Uso: copiar em qualquer projeto — agnóstico de cores/layout
 * =========================================================
 *
 * ÍNDICE
 * 1. Custom Properties (easing + timing)
 * 2. @keyframes
 * 3. Classes de Animação de Entrada
 * 4. Classes de Transição por Componente
 * 5. Hover / Active States
 * 6. Focus / Acessibilidade
 * 7. Sequência de Modal / Overlay
 * 8. Efeitos de Blur e Clip-Path
 * 9. Tailwind Config Extension
 * 10. Tailwind — Classes Utilitárias Prontas
 * =========================================================
 */


/* ─────────────────────────────────────────────────────────
 * 1. CUSTOM PROPERTIES — EASING & TIMING
 * Defina no :root para reutilizar em todo o projeto.
 * ───────────────────────────────────────────────────────── */

:root {
  /* --- Curvas de aceleração --- */

  /* Desaceleração suave: ideal para slides, menus saindo */
  --ease-out-quint:       cubic-bezier(.22, 1, .36, 1);

  /* Saída explosiva + pouso suave: ideal para cards entrando */
  --ease-out-expo:        cubic-bezier(.16, 1, .3, 1);

  /* Entrada e saída fortes: hero sections, transições de página */
  --ease-in-out-quint:    cubic-bezier(.83, 0, .17, 1);

  /* Leve overshoot (volta além do ponto): botões, tooltips */
  --ease-out-back:        cubic-bezier(.34, 1.56, .64, 1);

  /* Spring suave com overshoot: ícones, badges */
  --ease-spring:          cubic-bezier(.175, .885, .32, 1.275);

  /* Spring bouncy (física real): cards de produto, imagens empilhadas */
  --ease-spring-bouncy:   linear(
    0, .008, .032 2%, .13 4.4%, .26 6.6%, .681 13%,
    .891 17.1%, .968, 1.028, 1.073, 1.103 25.2%,
    1.114, 1.119, 1.12, 1.115 31.4%, 1.098 34.4%,
    1.042 41.6%, 1.017 45.4%, .998 49.5%, .988 53.9%,
    .986 60.4%, 1.001 80.9% 100%
  );

  /* Spring médio: listas, acordeões */
  --ease-spring-medium:   linear(
    0 0%, .006 1%, .022 2%, .048 3%, .08 4%, .119 5%,
    .162 6%, .209 7%, .257 8%, .308 9%, .358 10%,
    .409 11%, .459 12%, .508 13%, .556 14%, .602 15%,
    .645 16%, .687 17%, .726 18%, .762 19%, .796 20%,
    .827 21%, .856 22%, .882 23%, .905 24%, .927 25%,
    .946 26%, .963 27%, .977 28%, .990 29%, 1.001 30%,
    1.011 31%, 1.019 32%, 1.025 33%, 1.031 34%,
    1.035 35%, 1.038 36%, 1.040 37%, 1.042 38%,
    1.043 39%, 1.043 40%, 1.042 41%, 1.041 42%,
    1.040 43%, 1.039 44%, 1.037 45%, 1.035 46%,
    1.033 47%, 1.031 48%, 1.029 49%, 1.027 50%,
    1.001 80.9% 100%
  );

  /* --- Timing global de hover --- */
  --hover-speed:          0.65s;

  /* --- Durações de modal --- */
  --modal-content-open-duration:  0.612s;
  --modal-content-close-duration: 0.24s;
  --modal-content-delay:          0.1s;
  --modal-backdrop-close-duration: 0.32s;
  --modal-close-cursor-fade-duration: 0.2s;
  --modal-close-cursor-hide-duration: 0.3s;
}


/* ─────────────────────────────────────────────────────────
 * 2. @KEYFRAMES
 * ───────────────────────────────────────────────────────── */

/* Entrada de cards/fotos: escala + fade */
@keyframes photoGroupReveal {
  0%   { transform: scale(1.05); opacity: 0; }
  100% { transform: scale(1);    opacity: 1; }
}

/* Subida de hero section */
@keyframes hero-rise {
  to { transform: translateY(0); }
}

/* Entrada do header (top + opacity) */
@keyframes header-in {
  to { opacity: 1; top: 0; }
}

/* Wipe horizontal por clip-path (taglines, live bars) */
@keyframes live-bar-reveal {
  0%   { clip-path: inset(0 100% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}

/* Pulso de "ao vivo" (indicadores de status) */
@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Entrada de card com deslocamento + escala */
@keyframes card-slide-in {
  0%  {
    opacity: 0;
    transform: translate(var(--card-x, 0), var(--card-y, 120px)) scale(1.15);
  }
  5%  { opacity: 1; }
  100% {
    opacity: 1;
    transform: translate(0) scale(1);
  }
}

/* Versão dramática do card-slide-in (hero cards) */
@keyframes card-slide-in-hero {
  0%  {
    opacity: 0;
    transform: translate(var(--card-x, 0), var(--card-y, 500px)) scale(1.5);
  }
  5%  { opacity: 1; }
  100% {
    opacity: 1;
    transform: translate(0) scale(1);
  }
}

/* Fade simples de media */
@keyframes card-media-fade {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

/* Reveal de imagem por clip-path com border-radius */
@keyframes card-media-reveal {
  0%   { clip-path: inset(30% round 24px); }
  100% { clip-path: inset(0% round 16px); }
}

/* Label/tag fade-in com leve subida */
@keyframes label-fade-in {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: none; }
}

/* Nudge de seta/ícone direcional (chamada para ação) */
@keyframes arrow-nudge {
  0%   { transform: translate(0); }
  50%  { transform: translate(var(--nudge-x, 4px), var(--nudge-y, 0)); }
  100% { transform: translate(0); }
}

/* Marquee infinito horizontal */
@keyframes pill-marquee {
  0%   { transform: translateZ(0); }
  100% { transform: translate3d(-50%, 0, 0); }
}

/* Reveal de texto com scale step-based (word-by-word) */
@keyframes wr-text {
  0%   { opacity: 0; transform: scale(0.35); }
  30%  { opacity: 1; transform: scale(0.35); }
  55%  { opacity: 1; transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}

/* Drift horizontal pós-reveal (settling) */
@keyframes wr-drift {
  0%   { translate: calc(var(--wr-drift-dir, -1) * 0.08em) 0; }
  100% { translate: 0 0; }
}


/* ─────────────────────────────────────────────────────────
 * 3. CLASSES DE ANIMAÇÃO DE ENTRADA
 * Aplique na classe do elemento + adicione .revealed via JS
 * ao entrar no viewport (IntersectionObserver).
 * ───────────────────────────────────────────────────────── */

/* Foto / imagem: zoom-out + fade */
.anim-photo-reveal {
  animation: photoGroupReveal 0.8s var(--ease-out-expo) both;
}

/* Hero section sobe ao carregar */
.anim-hero-rise {
  transform: translateY(var(--hero-offset, 60px));
  animation: hero-rise 2.4s var(--ease-in-out-quint) 0.2s both;
}

/* Header desliza de cima */
.anim-header-in {
  opacity: 0;
  top: -20px;
  animation: header-in 0.8s var(--ease-out-expo) 2s both;
}

/* Card entra com slide + scale — variável para direção */
.anim-card-enter {
  --card-y: 120px;
  animation: card-slide-in 1.5s var(--ease-out-expo) var(--card-delay, 0ms) both;
  will-change: transform, opacity;
}

/* Variante dramática (acima da dobra) */
.anim-card-enter--hero {
  --card-y: 500px;
  animation: card-slide-in-hero 1.5s var(--ease-out-expo) var(--card-delay, 0ms) both;
}

/* Imagem interna do card */
.anim-media-reveal {
  animation:
    card-media-fade   0.4s var(--ease-out-expo) both,
    card-media-reveal 0.8s var(--ease-out-expo) both;
}

/* Label / badge / tag */
.anim-label-in {
  animation: label-fade-in 0.8s var(--ease-out-expo) both;
}

/* Wipe horizontal de texto/barra */
.anim-wipe-in {
  clip-path: inset(0 100% 0 0);
  animation: live-bar-reveal 1.6s var(--ease-out-expo) both;
}

/* Delay helpers (adicionar ao .anim-* via CSS var ou classe) */
.anim-delay-100 { --card-delay: 100ms; }
.anim-delay-200 { --card-delay: 200ms; }
.anim-delay-300 { --card-delay: 300ms; }
.anim-delay-400 { --card-delay: 400ms; }
.anim-delay-500 { --card-delay: 500ms; }

/* Marquee infinito */
.anim-marquee {
  animation: pill-marquee 48s linear infinite;
  will-change: transform;
}


/* ─────────────────────────────────────────────────────────
 * 4. CLASSES DE TRANSIÇÃO POR COMPONENTE
 * ───────────────────────────────────────────────────────── */

/* Botão pill (CTA principal) */
.transition-btn {
  transition:
    transform  0.8s var(--ease-out-quint),
    box-shadow 0.8s var(--ease-out-quint);
  will-change: transform;
}

/* Card interativo (produto, conteúdo) */
.transition-card {
  transition:
    transform  var(--hover-speed) var(--ease-spring-bouncy),
    box-shadow var(--hover-speed) var(--ease-spring-bouncy);
}

/* Imagem interna do card */
.transition-card-media {
  transition: transform 0.3s var(--ease-spring);
}

/* Imagens empilhadas (stack effect) */
.transition-card-stack-img {
  transition: transform 0.65s var(--ease-spring-bouncy);
}

/* Thumbnail menor (preview, avatar) */
.transition-thumb {
  transition:
    transform  0.3s var(--ease-spring),
    box-shadow 0.3s var(--ease-spring);
}

/* Logo com filtro animado (brand) */
.transition-logo {
  transition: filter 0.6s ease;
}

/* Elemento de texto de fundo (bg-text parallax) */
.transition-bg-text {
  transition: transform 1s var(--ease-spring-medium);
}

/* Dígito de relógio / contador */
.transition-digit {
  transition: transform 0.5s var(--ease-spring-bouncy);
}

/* Elemento com spring simples */
.transition-spring {
  transition: transform 0.5s var(--ease-spring-medium);
}


/* ─────────────────────────────────────────────────────────
 * 5. HOVER / ACTIVE STATES
 * Aplicar junto com as classes .transition-* acima.
 * Usar @media (hover: hover) para não disparar no touch.
 * ───────────────────────────────────────────────────────── */

/* ── Botão pill ── */
@media (hover: hover) and (pointer: fine) {
  .btn-pill-interactive:hover {
    transform: scale(1.015);
    box-shadow: 0 3px 32px rgba(0, 0, 0, 0.13);
  }

  .btn-pill-interactive:hover .btn-icon {
    animation: arrow-nudge 0.8s var(--ease-out-quint) both;
  }
}

.btn-pill-interactive:active {
  transform: scale(0.97);
  box-shadow: none;
}

/* ── Card interativo ── */
@media (hover: hover) and (pointer: fine) {
  .card-interactive:hover {
    transform: scale(1.015);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  }

  .card-interactive:hover .card-media {
    transform: scale(1.04);
  }

  /* Background text drift no hover */
  .card-interactive:hover .card-bg-text {
    transform: translate(-55%, -50%);
  }
  .card-bg-text {
    transform: translate(-45%, -50%); /* estado padrão */
  }
}

.card-interactive:active {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ── Imagens empilhadas (stack de 2) ── */
@media (hover: hover) and (pointer: fine) {
  .card-interactive:hover .stack-img:nth-child(1) {
    transform: translate(-10%, 3%) rotate(-7deg);
  }
  .card-interactive:hover .stack-img:nth-child(2) {
    transform: translate(10%, -3%) rotate(7deg);
  }
}

/* Estado padrão (empilhadas levemente rotacionadas) */
.stack-img:nth-child(1) { transform: translate(-14%, 4%) rotate(-7deg); }
.stack-img:nth-child(2) { transform: translate(0) rotate(0); }

/* ── Imagens empilhadas (stack de 3) ── */
.stack-3 .stack-img:nth-child(1) { transform: translate(-14%, 4%)  rotate(-7deg); }
.stack-3 .stack-img:nth-child(2) { transform: translate(0) rotate(0); }
.stack-3 .stack-img:nth-child(3) { transform: translate(12%, 12%)  rotate(8deg); }

@media (hover: hover) and (pointer: fine) {
  .card-interactive:hover .stack-3 .stack-img:nth-child(1) {
    transform: translate(-18%, 5%) rotate(-9.5deg);
  }
  .card-interactive:hover .stack-3 .stack-img:nth-child(2) {
    transform: translate(0) rotate(0);
  }
  .card-interactive:hover .stack-3 .stack-img:nth-child(3) {
    transform: translate(16%, 14%) rotate(11deg);
  }
}

/* ── Thumbnail / miniatura ── */
@media (hover: hover) and (pointer: fine) {
  .thumb-interactive:hover {
    transform: scale(1.03);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  }
}

/* ── Logo com desfoque no hover de outro elemento ── */
.parent:hover .logo-blur {
  filter: blur(2px) opacity(0.7);
}

/* ── Indicador "ao vivo" / pulsante ── */
.live-dot {
  animation: livePulse 2s ease-in-out infinite;
}

/* ── Track de vídeo (espessa no hover) ── */
.video-track {
  height: 2px;
  border-radius: 1px;
  transition: height 0.2s ease, border-radius 0.2s ease;
}
.video-track:hover {
  height: 4px;
  border-radius: 2px;
}


/* ─────────────────────────────────────────────────────────
 * 6. FOCUS / ACESSIBILIDADE
 * Padrão extraído: outline 2px sólido + offset.
 * Aplicar via :focus-visible (nunca :focus puro).
 * ───────────────────────────────────────────────────────── */

/* Focus padrão — aplicar em todo elemento interativo */
.focus-ring:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Variante com offset maior (botões maiores) */
.focus-ring-lg:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

/* Focus em elemento filho (botão wrapping um pill, ex) */
.focus-ring-child:focus-visible {
  outline: none; /* remove do pai */
}
.focus-ring-child:focus-visible .focus-ring-target {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}


/* ─────────────────────────────────────────────────────────
 * 7. MODAL / OVERLAY — SEQUÊNCIA COMPLETA
 *
 * Estrutura esperada:
 *   


 *     

...


 *   


 *
 * Estado fechado → class="modal-overlay"
 * Estado aberto  → class="modal-overlay modal-open"
 * ───────────────────────────────────────────────────────── */

/* Backdrop: fundo desfocado */
.modal-backdrop {
  opacity: 0;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  will-change: opacity;
  transition: opacity var(--modal-backdrop-close-duration) cubic-bezier(.4, 0, .2, 1);
}

.modal-open .modal-backdrop {
  opacity: 1;
  transition-duration: var(--modal-content-open-duration);
  transition-timing-function: var(--ease-out-quint);
  transition-delay: 0s;
}

/* Card do modal: scale + blur + opacity */
.modal-card {
  opacity: 0;
  filter: blur(3px);
  transform: scale(1.05);
  will-change: opacity, filter, transform;
  transition-property: opacity, filter, transform;
  transition-duration: var(--modal-content-close-duration);
  transition-timing-function: cubic-bezier(.4, 0, .2, 1);
}

.modal-open .modal-card {
  opacity: 1;
  filter: none;
  transform: scale(1);
  transition-duration: var(--modal-content-open-duration);
  transition-timing-function: var(--ease-out-expo);
  transition-delay: var(--modal-content-delay);
}

/* Cursor customizado do modal (fechar ao passar o mouse) */
.modal-cursor {
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
  transform: translate3d(
    var(--cursor-x, -48px),
    var(--cursor-y, -48px), 0
  ) translate(-50%, -50%);
  transition: opacity var(--modal-close-cursor-fade-duration) ease-out;
}

.modal-cursor-body {
  transform: scale(0);
  transition: transform var(--modal-close-cursor-hide-duration) var(--ease-out-quint);
}

.modal-open .modal-cursor { opacity: 1; }
.modal-open .modal-cursor-body { transform: scale(1); }

/* Desabilitar transições durante resize/SSR */
.no-transitions,
.no-transitions * {
  transition: none !important;
}


/* ─────────────────────────────────────────────────────────
 * 8. EFEITOS DE BLUR E CLIP-PATH
 * ───────────────────────────────────────────────────────── */

/* Reveal por clip-path (wipe horizontal — ex: texto aparecendo) */
.clip-wipe {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1.6s var(--ease-out-expo);
}
.clip-wipe.revealed {
  clip-path: inset(0 0 0 0);
}

/* Reveal de imagem com bordas arredondadas (zoom reveal) */
.clip-zoom-reveal {
  clip-path: inset(30% round 24px);
  transition: clip-path 0.8s var(--ease-out-expo);
}
.clip-zoom-reveal.revealed {
  clip-path: inset(0% round 16px);
}

/* Blur de entrada (elementos carregando) */
.blur-in {
  filter: blur(6px);
  opacity: 0;
  transition:
    filter  0.6s var(--ease-out-expo),
    opacity 0.4s var(--ease-out-expo);
}
.blur-in.revealed {
  filter: none;
  opacity: 1;
}

/* Drop shadow em SVG/ícone */
.icon-shadow {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
}


/* ─────────────────────────────────────────────────────────
 * 9. TAILWIND CONFIG EXTENSION
 * Adicionar em tailwind.config.ts → theme.extend
 * ───────────────────────────────────────────────────────── */

/*
theme: {
  extend: {
    transitionTimingFunction: {
      'out-quint':       'cubic-bezier(.22, 1, .36, 1)',
      'out-expo':        'cubic-bezier(.16, 1, .3, 1)',
      'in-out-quint':    'cubic-bezier(.83, 0, .17, 1)',
      'out-back':        'cubic-bezier(.34, 1.56, .64, 1)',
      'spring':          'cubic-bezier(.175, .885, .32, 1.275)',
    },
    transitionDuration: {
      '400':  '400ms',
      '600':  '600ms',
      '800':  '800ms',
      '1500': '1500ms',
      '2400': '2400ms',
    },
    transitionDelay: {
      '100': '100ms',
      '200': '200ms',
      '300': '300ms',
      '400': '400ms',
      '600': '600ms',
    },
    keyframes: {
      'photo-reveal': {
        '0%':   { transform: 'scale(1.05)', opacity: '0' },
        '100%': { transform: 'scale(1)',    opacity: '1' },
      },
      'hero-rise': {
        'to': { transform: 'translateY(0)' },
      },
      'card-enter': {
        '0%':  { opacity: '0', transform: 'translateY(120px) scale(1.15)' },
        '5%':  { opacity: '1' },
        '100%':{ opacity: '1', transform: 'translateY(0) scale(1)' },
      },
      'label-up': {
        '0%':   { opacity: '0', transform: 'translateY(8px)' },
        '100%': { opacity: '1', transform: 'none' },
      },
      'wipe-in': {
        '0%':   { clipPath: 'inset(0 100% 0 0)' },
        '100%': { clipPath: 'inset(0 0 0 0)' },
      },
      'live-pulse': {
        '0%, 100%': { opacity: '1' },
        '50%':      { opacity: '0.3' },
      },
      'arrow-nudge': {
        '0%':   { transform: 'translate(0)' },
        '50%':  { transform: 'translate(4px, 0)' },
        '100%': { transform: 'translate(0)' },
      },
      'marquee': {
        '0%':   { transform: 'translateZ(0)' },
        '100%': { transform: 'translate3d(-50%, 0, 0)' },
      },
      'blur-in': {
        '0%':   { filter: 'blur(6px)', opacity: '0' },
        '100%': { filter: 'blur(0)',   opacity: '1' },
      },
    },
    animation: {
      'photo-reveal': 'photo-reveal 0.8s cubic-bezier(.16,1,.3,1) both',
      'hero-rise':    'hero-rise 2.4s cubic-bezier(.83,0,.17,1) 0.2s both',
      'card-enter':   'card-enter 1.5s cubic-bezier(.16,1,.3,1) both',
      'label-up':     'label-up 0.8s cubic-bezier(.16,1,.3,1) both',
      'wipe-in':      'wipe-in 1.6s cubic-bezier(.16,1,.3,1) both',
      'live-pulse':   'live-pulse 2s ease-in-out infinite',
      'arrow-nudge':  'arrow-nudge 0.8s cubic-bezier(.22,1,.36,1) both',
      'marquee':      'marquee 48s linear infinite',
      'blur-in':      'blur-in 0.6s cubic-bezier(.16,1,.3,1) both',
    },
  },
},
*/


/* ─────────────────────────────────────────────────────────
 * 10. TAILWIND — CLASSES PRONTAS PARA COPIAR/COLAR
 * Onde não há classe nativa equivalente, usar [valor arbitrário]
 * ───────────────────────────────────────────────────────── */

/*
 ┌─────────────────────────────────────────────────────────────┐
 │ BOTÃO PILL (CTA principal)                                  │
 └─────────────────────────────────────────────────────────────┘

  

 ┌─────────────────────────────────────────────────────────────┐
 │ CARD INTERATIVO                                             │
 └─────────────────────────────────────────────────────────────┘

  



 ┌─────────────────────────────────────────────────────────────┐
 │ IMAGEM INTERNA DO CARD                                      │
 └─────────────────────────────────────────────────────────────┘

  

 ┌─────────────────────────────────────────────────────────────┐
 │ THUMBNAIL / MINIATURA                                       │
 └─────────────────────────────────────────────────────────────┘

  



 ┌─────────────────────────────────────────────────────────────┐
 │ LABEL / TAG (entrada ao entrar no viewport)                 │
 └─────────────────────────────────────────────────────────────┘

     ← requer keyframe no config

 ┌─────────────────────────────────────────────────────────────┐
 │ INDICADOR "AO VIVO" (pulsante)                              │
 └─────────────────────────────────────────────────────────────┘

  

 ┌─────────────────────────────────────────────────────────────┐
 │ MARQUEE INFINITO                                            │
 └─────────────────────────────────────────────────────────────┘

  


    


      [conteúdo duplicado 2×]
    



 ┌─────────────────────────────────────────────────────────────┐
 │ FOCO / ACESSIBILIDADE (padrão universal)                    │
 └─────────────────────────────────────────────────────────────┘

  focus-visible:outline-2
  focus-visible:outline-current
  focus-visible:outline-offset-2

 ┌─────────────────────────────────────────────────────────────┐
 │ MODAL BACKDROP (desfoque)                                   │
 └─────────────────────────────────────────────────────────────┘

  



 ┌─────────────────────────────────────────────────────────────┐
 │ MODAL CARD (entrada com scale + blur)                       │
 └─────────────────────────────────────────────────────────────┘

  



 ┌─────────────────────────────────────────────────────────────┐
 │ MEDIA REVEAL POR CLIP-PATH (imagem "abrindo")              │
 └─────────────────────────────────────────────────────────────┘

  



 ┌─────────────────────────────────────────────────────────────┐
 │ WIPE HORIZONTAL (texto/barra surgindo da esquerda)         │
 └─────────────────────────────────────────────────────────────┘

  



*/

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sitiocrishori.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e9ccd9b7-b2c4-4b3a-8fa2-3f039d61bf89).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
