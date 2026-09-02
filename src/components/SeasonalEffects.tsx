import React, { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type Season = 'natal' | 'ano-novo' | 'pascoa' | 'halloween' | 'carnaval' | 'festa-junina' | 'none';

interface SeasonalEffectsProps {
  season: Season;
  isEnabled: boolean;
  isSoundEnabled?: boolean;
}

export interface SeasonalEffectsHandle {
  playSound?: (season: Season) => void;
}

export function getSeasonTypeFromName(nome?: string | null): Season {
  if (!nome) return "none";
  const n = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("natal")) return "natal";
  if (n.includes("ano novo") || n.includes("reveillon") || n.includes("virada")) return "ano-novo";
  if (n.includes("pascoa")) return "pascoa";
  if (n.includes("halloween") || n.includes("bruxa")) return "halloween";
  if (n.includes("carnaval")) return "carnaval";
  if (n.includes("junina") || n.includes("sao joao") || n.includes("arraia") || n.includes("julina")) return "festa-junina";
  return "none";
}

export const SeasonalEffects = forwardRef<SeasonalEffectsHandle, SeasonalEffectsProps>(({ season, isEnabled }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    playSound: () => {}
  }));

  const incomingYear = useMemo(() => {
    return new Date().getFullYear() + 1;
  }, []);

  useEffect(() => {
    if (!isEnabled || season === 'none' || !canvasRef.current) return;

    // Respeita prefers-reduced-motion: desliga completamente se o usuário preferir
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const isMobile = window.innerWidth < 768;
    // Limites de performance obrigatórios
    const maxElements = isMobile ? 30 : 60;

    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };

    window.addEventListener('resize', resize);
    resize();

    // ─────────────────────────────────────────────────────────────
    // ELEMENTOS VISUAIS PARA CADA TEMA
    // ─────────────────────────────────────────────────────────────

    type ElementType = 
      | 'snow' | 'gift' 
      | 'firework' | 'confetti' 
      | 'easter_egg' 
      | 'pumpkin' | 'bat' 
      | 'mask' | 'streamer' 
      | 'star';

    interface SeasonalParticle {
      type: ElementType;
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      angle: number;
      angleSpeed: number;
      opacity: number;
      color: string;
      secondaryColor?: string;
      life?: number;
      maxLife?: number;
      extra?: any;
    }

    let elements: SeasonalParticle[] = [];

    // Helper: Cores por tema
    const COLORS = {
      natal: ['#FFFFFF', '#E53E3E', '#22543D', '#ECC94B', '#FFF5F5'],
      anoNovo: ['#ECC94B', '#D69E2E', '#E2E8F0', '#CBD5E0', '#FE8330', '#FFFFFF'],
      pascoa: ['#F687B3', '#FAF089', '#D6BCFA', '#9AE6B4', '#FED7E2'],
      halloween: ['#ED8936', '#9F7AEA', '#44337A', '#1A202C', '#F6AD55'],
      carnaval: ['#E53E3E', '#3182CE', '#ECC94B', '#38A169', '#ED64A6', '#805AD5'],
      festaJunina: ['#E53E3E', '#ECC94B', '#3182CE', '#38A169', '#ED8936']
    };

    const spawnElement = (forceType?: ElementType): SeasonalParticle => {
      const w = canvas.width;
      const h = canvas.height;

      switch (season) {
        case 'natal': {
          const isGift = Math.random() < 0.25;
          return {
            type: isGift ? 'gift' : 'snow',
            x: Math.random() * w,
            y: Math.random() * -h,
            size: isGift ? 12 + Math.random() * 12 : 2 + Math.random() * 4,
            speedX: (Math.random() - 0.5) * 1.2,
            speedY: isGift ? 1 + Math.random() * 1.5 : 1.2 + Math.random() * 2.5,
            angle: Math.random() * Math.PI * 2,
            angleSpeed: (Math.random() - 0.5) * 0.03,
            opacity: 0.6 + Math.random() * 0.4,
            color: isGift ? (Math.random() > 0.5 ? '#E53E3E' : '#22543D') : '#FFFFFF',
            secondaryColor: '#ECC94B'
          };
        }

        case 'ano-novo': {
          const isFirework = Math.random() < 0.4;
          return {
            type: isFirework ? 'firework' : 'confetti',
            x: isFirework ? Math.random() * w : Math.random() * w,
            y: isFirework ? h * 0.2 + Math.random() * (h * 0.5) : Math.random() * -50,
            size: isFirework ? 1 + Math.random() * 3 : 6 + Math.random() * 6,
            speedX: isFirework ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 2,
            speedY: isFirework ? (Math.random() - 0.5) * 4 : 2 + Math.random() * 3,
            angle: Math.random() * Math.PI * 2,
            angleSpeed: (Math.random() - 0.5) * 0.08,
            opacity: 1,
            color: COLORS.anoNovo[Math.floor(Math.random() * COLORS.anoNovo.length)]!,
            life: 0,
            maxLife: isFirework ? 40 + Math.floor(Math.random() * 40) : 0
          };
        }

        case 'pascoa': {
          return {
            type: 'easter_egg',
            x: Math.random() * w,
            y: Math.random() * -h,
            size: 14 + Math.random() * 10,
            speedX: (Math.random() - 0.5) * 1.2,
            speedY: 1.5 + Math.random() * 2,
            angle: Math.random() * Math.PI * 2,
            angleSpeed: (Math.random() - 0.5) * 0.04,
            opacity: 0.85,
            color: COLORS.pascoa[Math.floor(Math.random() * COLORS.pascoa.length)]!,
            secondaryColor: COLORS.pascoa[Math.floor(Math.random() * COLORS.pascoa.length)]!,
            extra: { vy: 0, bounces: 0, ground: h - 35 - Math.random() * 20 }
          };
        }

        case 'halloween': {
          const isBat = Math.random() < 0.4;
          return {
            type: isBat ? 'bat' : 'pumpkin',
            x: isBat ? (Math.random() > 0.5 ? -20 : w + 20) : Math.random() * w,
            y: isBat ? Math.random() * (h * 0.7) : h + 30 + Math.random() * 100,
            size: isBat ? 16 + Math.random() * 8 : 18 + Math.random() * 12,
            speedX: isBat ? (Math.random() > 0.5 ? 2 : -2) : (Math.random() - 0.5) * 0.8,
            speedY: isBat ? (Math.random() - 0.5) * 1.5 : -(1 + Math.random() * 1.8),
            angle: 0,
            angleSpeed: (Math.random() - 0.5) * 0.02,
            opacity: 0.85,
            color: isBat ? '#1A202C' : '#ED8936',
            secondaryColor: '#44337A',
            extra: { wavePhase: Math.random() * Math.PI * 2 }
          };
        }

        case 'carnaval': {
          const r = Math.random();
          const type: ElementType = r < 0.25 ? 'mask' : r < 0.6 ? 'streamer' : 'confetti';
          return {
            type,
            x: Math.random() * w,
            y: Math.random() * -h * 0.5,
            size: type === 'mask' ? 22 + Math.random() * 8 : type === 'streamer' ? 20 + Math.random() * 15 : 6 + Math.random() * 5,
            speedX: (Math.random() - 0.5) * 2,
            speedY: type === 'mask' ? 1.2 + Math.random() * 1.5 : 2 + Math.random() * 3,
            angle: Math.random() * Math.PI * 2,
            angleSpeed: (Math.random() - 0.5) * 0.05,
            opacity: 0.9,
            color: COLORS.carnaval[Math.floor(Math.random() * COLORS.carnaval.length)]!,
            secondaryColor: COLORS.carnaval[Math.floor(Math.random() * COLORS.carnaval.length)]!,
            extra: { wavePhase: Math.random() * Math.PI * 2 }
          };
        }

        case 'festa-junina': {
          return {
            type: 'star',
            x: Math.random() * w,
            y: Math.random() * h,
            size: 2 + Math.random() * 4,
            speedX: 0,
            speedY: 0,
            angle: Math.random() * Math.PI,
            angleSpeed: 0.04 + Math.random() * 0.06,
            opacity: 0.2 + Math.random() * 0.8,
            color: '#ECC94B',
            extra: { twinkleSpeed: 0.03 + Math.random() * 0.05 }
          };
        }

        default:
          return {
            type: 'confetti',
            x: 0,
            y: 0,
            size: 2,
            speedX: 0,
            speedY: 0,
            angle: 0,
            angleSpeed: 0,
            opacity: 0,
            color: '#FFFFFF'
          };
      }
    };

    // Inicializa elementos
    elements = [];
    for (let i = 0; i < maxElements; i++) {
      const p = spawnElement();
      if (season !== 'halloween') {
        p.y = Math.random() * canvas.height;
      }
      elements.push(p);
    }

    // ─────────────────────────────────────────────────────────────
    // RENDERIZADORES EM CANVAS
    // ─────────────────────────────────────────────────────────────

    const drawSnow = (p: SeasonalParticle) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();
    };

    const drawGift = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;

      // Caixa
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

      // Fita dourada
      ctx.fillStyle = p.secondaryColor || '#ECC94B';
      const ribbonWidth = p.size * 0.25;
      ctx.fillRect(-ribbonWidth / 2, -p.size / 2, ribbonWidth, p.size);
      ctx.fillRect(-p.size / 2, -ribbonWidth / 2, p.size, ribbonWidth);

      // Lacinho topo
      ctx.beginPath();
      ctx.arc(0, -p.size / 2, ribbonWidth * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawFirework = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const lifeRatio = 1 - (p.life || 0) / (p.maxLife || 40);
      ctx.globalAlpha = Math.max(0, lifeRatio * p.opacity);

      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.arc(0, 0, p.size * (1 + (1 - lifeRatio)), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    };

    const drawConfetti = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
      ctx.restore();
    };

    const drawEasterEgg = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;

      // Formato oval do ovo
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.7, p.size, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // Padrão de listras simples no ovo
      ctx.strokeStyle = p.secondaryColor || '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI);
      ctx.stroke();

      ctx.restore();
    };

    const drawPumpkin = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;

      // Corpo da abóbora (3 círculos ovais sobrepostos)
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(-p.size * 0.3, 0, p.size * 0.45, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.ellipse(p.size * 0.3, 0, p.size * 0.45, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.ellipse(0, 0, p.size * 0.5, p.size * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cabinho verde
      ctx.fillStyle = '#2F855A';
      ctx.fillRect(-2, -p.size * 0.7, 4, p.size * 0.3);

      // Olhos triangulares e sorriso
      ctx.fillStyle = '#1A202C';
      ctx.beginPath();
      ctx.moveTo(-p.size * 0.25, -p.size * 0.1);
      ctx.lineTo(-p.size * 0.1, -p.size * 0.1);
      ctx.lineTo(-p.size * 0.17, -p.size * 0.3);
      ctx.closePath();

      ctx.moveTo(p.size * 0.1, -p.size * 0.1);
      ctx.lineTo(p.size * 0.25, -p.size * 0.1);
      ctx.lineTo(p.size * 0.17, -p.size * 0.3);
      ctx.closePath();

      // Sorriso
      ctx.arc(0, p.size * 0.1, p.size * 0.25, 0, Math.PI);
      ctx.fill();

      ctx.restore();
    };

    const drawBat = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      const wingSpan = p.size;
      const flap = Math.sin((p.extra?.wavePhase || 0) * 8) * (p.size * 0.3);

      ctx.beginPath();
      // Corpo central
      ctx.ellipse(0, 0, p.size * 0.2, p.size * 0.35, 0, 0, Math.PI * 2);
      // Asa esquerda
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-wingSpan * 0.5, -wingSpan * 0.5 + flap, -wingSpan, flap);
      ctx.quadraticCurveTo(-wingSpan * 0.5, 0, 0, p.size * 0.2);
      // Asa direita
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(wingSpan * 0.5, -wingSpan * 0.5 + flap, wingSpan, flap);
      ctx.quadraticCurveTo(wingSpan * 0.5, 0, 0, p.size * 0.2);
      ctx.fill();

      ctx.restore();
    };

    const drawMask = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.opacity;

      const w = p.size;
      const h = p.size * 0.5;

      // Máscara veneziana clássica (duas metades de cores diferentes)
      // Lado esquerdo
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.2);
      ctx.bezierCurveTo(-w * 0.5, -h * 0.8, -w, -h * 0.2, -w * 0.8, h * 0.4);
      ctx.bezierCurveTo(-w * 0.4, h * 0.8, -w * 0.1, h * 0.3, 0, h * 0.4);
      ctx.fill();

      // Lado direito
      ctx.fillStyle = p.secondaryColor || '#ECC94B';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.2);
      ctx.bezierCurveTo(w * 0.5, -h * 0.8, w, -h * 0.2, w * 0.8, h * 0.4);
      ctx.bezierCurveTo(w * 0.4, h * 0.8, w * 0.1, h * 0.3, 0, h * 0.4);
      ctx.fill();

      // Olhos vazados
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(-w * 0.4, 0, w * 0.18, h * 0.25, -0.2, 0, Math.PI * 2);
      ctx.ellipse(w * 0.4, 0, w * 0.18, h * 0.25, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawStreamer = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = p.opacity;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      ctx.beginPath();
      const wave = p.extra?.wavePhase || 0;
      ctx.moveTo(0, -p.size);
      for (let i = -p.size; i <= p.size; i += 6) {
        const xOffset = Math.sin(wave + i * 0.1) * 8;
        ctx.lineTo(xOffset, i);
      }
      ctx.stroke();

      ctx.restore();
    };

    const drawStar = (p: SeasonalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      const twinkle = Math.abs(Math.sin(p.angle));
      ctx.globalAlpha = p.opacity * twinkle;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Cruz de brilho
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-p.size * 2, 0);
      ctx.lineTo(p.size * 2, 0);
      ctx.moveTo(0, -p.size * 2);
      ctx.lineTo(0, p.size * 2);
      ctx.stroke();

      ctx.restore();
    };

    // ─────────────────────────────────────────────────────────────
    // LOOP PRINCIPAL DE ANIMAÇÃO (requestAnimationFrame)
    // ─────────────────────────────────────────────────────────────

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < elements.length; i++) {
        const p = elements[i];
        if (!p) continue;


        // Atualização de posição e estado
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.angleSpeed;

        if (p.extra?.wavePhase !== undefined) {
          p.extra.wavePhase += 0.05;
        }

        // Lógica específica por tipo
        switch (p.type) {
          case 'snow':
          case 'gift':
            drawSnow(p);
            if (p.type === 'gift') drawGift(p);
            if (p.y > canvas.height + 20) {
              elements[i] = spawnElement();
            }
            break;

          case 'firework':
            p.life = (p.life || 0) + 1;
            drawFirework(p);
            if ((p.life || 0) >= (p.maxLife || 40)) {
              elements[i] = spawnElement('firework');
            }
            break;

          case 'confetti':
            drawConfetti(p);
            if (p.y > canvas.height + 20) {
              elements[i] = spawnElement('confetti');
            }
            break;

          case 'easter_egg':
            // Efeito de quicar no chão suavemente
            if (p.extra && p.y >= p.extra.ground) {
              p.y = p.extra.ground;
              p.speedY = -Math.abs(p.speedY) * 0.7; // amortecimento
              p.extra.bounces = (p.extra.bounces || 0) + 1;
              if (p.extra.bounces > 4) {
                elements[i] = spawnElement();
              }
            } else {
              p.speedY += 0.06; // gravidade suave
            }
            drawEasterEgg(p);
            break;

          case 'pumpkin':
            drawPumpkin(p);
            if (p.y < -50) {
              elements[i] = spawnElement('pumpkin');
            }
            break;

          case 'bat':
            drawBat(p);
            p.y += Math.sin((p.extra?.wavePhase || 0) * 3) * 1.5;
            if (p.x < -40 || p.x > canvas.width + 40) {
              elements[i] = spawnElement('bat');
            }
            break;

          case 'mask':
            drawMask(p);
            if (p.y > canvas.height + 40) {
              elements[i] = spawnElement('mask');
            }
            break;

          case 'streamer':
            drawStreamer(p);
            if (p.y > canvas.height + 40) {
              elements[i] = spawnElement('streamer');
            }
            break;

          case 'star':
            drawStar(p);
            break;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [season, isEnabled]);

  return (
    <AnimatePresence>
      {isEnabled && season !== 'none' && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none">
          {/* Canvas de Alta Performance */}
          <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-40 bg-transparent"
          />

          {/* ───────────────────────────────────────────────────────────── */}
          {/* EFEITOS SVG / CSS ESPECÍFICOS POR TEMA */}
          {/* ───────────────────────────────────────────────────────────── */}

          {/* 🎄 NATAL: Meias penduradas nos cantos superiores */}
          {season === 'natal' && (
            <>
              {/* Canto Superior Esquerdo */}
              <div className="absolute top-0 left-2 sm:left-6 animate-[sway_3s_ease-in-out_infinite] origin-top">
                <svg width="48" height="64" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                  {/* Cordinha */}
                  <line x1="24" y1="0" x2="24" y2="8" stroke="#ECC94B" strokeWidth="2" strokeDasharray="2 2" />
                  {/* Borda branca da meia */}
                  <rect x="12" y="8" width="24" height="10" rx="4" fill="#FFFFFF" />
                  {/* Corpo da meia */}
                  <path d="M14 18H34V42C34 46 31 52 24 54L16 54C10 54 8 48 8 42C8 38 12 36 14 36V18Z" fill="#E53E3E" />
                  {/* Detalhe calcanhar e ponta */}
                  <path d="M8 42C8 48 10 54 16 54L22 54C16 52 14 46 14 42H8Z" fill="#FFFFFF" opacity="0.8" />
                </svg>
              </div>

              {/* Canto Superior Direito */}
              <div className="absolute top-0 right-2 sm:right-6 animate-[sway_3.5s_ease-in-out_infinite_reverse] origin-top">
                <svg width="48" height="64" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                  <line x1="24" y1="0" x2="24" y2="8" stroke="#ECC94B" strokeWidth="2" strokeDasharray="2 2" />
                  <rect x="12" y="8" width="24" height="10" rx="4" fill="#FFFFFF" />
                  <path d="M34 18H14V42C14 46 17 52 24 54L32 54C38 54 40 48 40 42C40 38 36 36 34 36V18Z" fill="#22543D" />
                  <path d="M40 42C40 48 38 54 32 54L26 54C32 52 34 46 34 42H40Z" fill="#ECC94B" opacity="0.9" />
                </svg>
              </div>
            </>
          )}

          {/* 🎆 ANO NOVO: Marca d'água translúcida do ano seguinte */}
          {season === 'ano-novo' && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-10">
              <span className="text-[20vw] font-black tracking-widest text-amber-300/10 md:text-amber-300/15 blur-[0.5px]">
                {incomingYear}
              </span>
            </div>
          )}

          {/* 🥚 PÁSCOA: Borboletas e Flores nas Laterais */}
          {season === 'pascoa' && (
            <>
              {/* Borboleta Lateral Esquerda */}
              <div className="absolute top-1/3 left-4 animate-[flutter_4s_ease-in-out_infinite]">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <ellipse cx="12" cy="14" rx="8" ry="6" fill="#F687B3" opacity="0.85" />
                  <ellipse cx="24" cy="14" rx="8" ry="6" fill="#D6BCFA" opacity="0.85" />
                  <ellipse cx="14" cy="22" rx="5" ry="4" fill="#FAF089" opacity="0.85" />
                  <ellipse cx="22" cy="22" rx="5" ry="4" fill="#9AE6B4" opacity="0.85" />
                  <line x1="18" y1="10" x2="18" y2="26" stroke="#4A5568" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Florzinha Lateral Direita */}
              <div className="absolute top-1/2 right-4 animate-[spin_12s_linear_infinite]">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="10" r="6" fill="#F687B3" opacity="0.8" />
                  <circle cx="20" cy="30" r="6" fill="#F687B3" opacity="0.8" />
                  <circle cx="10" cy="20" r="6" fill="#FAF089" opacity="0.8" />
                  <circle cx="30" cy="20" r="6" fill="#FAF089" opacity="0.8" />
                  <circle cx="20" cy="20" r="5" fill="#ED8936" />
                </svg>
              </div>
            </>
          )}

          {/* 🎃 HALLOWEEN: Teias de aranha nos cantos superiores */}
          {season === 'halloween' && (
            <>
              {/* Teia Top-Left */}
              <div className="absolute top-0 left-0 w-28 sm:w-40 opacity-40">
                <svg viewBox="0 0 100 100" fill="none" stroke="#A0AEC0" strokeWidth="1.5">
                  <path d="M0,0 L100,0 M0,0 L0,100 M0,0 L100,100 M0,0 L40,100 M0,0 L100,40" />
                  <path d="M20,0 Q20,20 0,20 M40,0 Q40,40 0,40 M60,0 Q60,60 0,60 M80,0 Q80,80 0,80" />
                </svg>
              </div>

              {/* Teia Top-Right */}
              <div className="absolute top-0 right-0 w-28 sm:w-40 opacity-40 -scale-x-100">
                <svg viewBox="0 0 100 100" fill="none" stroke="#A0AEC0" strokeWidth="1.5">
                  <path d="M0,0 L100,0 M0,0 L0,100 M0,0 L100,100 M0,0 L40,100 M0,0 L100,40" />
                  <path d="M20,0 Q20,20 0,20 M40,0 Q40,40 0,40 M60,0 Q60,60 0,60 M80,0 Q80,80 0,80" />
                </svg>
              </div>
            </>
          )}

          {/* 🎪 FESTA JUNINA: Bandeirinhas no topo e Fogueiras na base */}
          {season === 'festa-junina' && (
            <>
              {/* Varal de Bandeirinhas Coloridas no Topo (CSS puro + SVG) */}
              <div className="fixed top-0 left-0 w-full flex justify-between overflow-hidden z-30 pointer-events-none">
                <div className="w-full flex items-start justify-around border-t-2 border-amber-800/40 pt-0.5">
                  {['#E53E3E', '#ECC94B', '#3182CE', '#38A169', '#ED8936', '#E53E3E', '#3182CE', '#ECC94B', '#38A169', '#E53E3E', '#3182CE', '#ECC94B'].map((cor, i) => (
                    <div
                      key={i}
                      className="w-0 h-0 border-l-[12px] sm:border-l-[16px] border-l-transparent border-r-[12px] sm:border-r-[16px] border-r-transparent border-t-[20px] sm:border-t-[28px] animate-[sway_2.5s_ease-in-out_infinite]"
                      style={{
                        borderTopColor: cor,
                        animationDelay: `${i * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Fogueira Animada na Parte Inferior Esquerda */}
              <div className="fixed bottom-3 left-4 sm:left-8 z-30 pointer-events-none">
                <svg width="44" height="48" viewBox="0 0 44 48" fill="none" className="animate-[pulse_1.5s_ease-in-out_infinite]">
                  {/* Troncos */}
                  <rect x="6" y="38" width="32" height="6" rx="2" fill="#7B341E" transform="rotate(-10 22 41)" />
                  <rect x="6" y="38" width="32" height="6" rx="2" fill="#5C2513" transform="rotate(10 22 41)" />
                  {/* Chamas com flickering */}
                  <path d="M22 6C22 6 12 18 12 28C12 34 16 38 22 38C28 38 32 34 32 28C32 18 22 6 22 6Z" fill="#ED8936" className="animate-[flicker_0.8s_ease-in-out_infinite]" />
                  <path d="M22 14C22 14 16 22 16 28C16 32 18 35 22 35C26 35 28 32 28 28C28 22 22 14 22 14Z" fill="#ECC94B" className="animate-[flicker_0.5s_ease-in-out_infinite_reverse]" />
                </svg>
              </div>

              {/* Fogueira Animada na Parte Inferior Direita */}
              <div className="fixed bottom-3 right-4 sm:right-8 z-30 pointer-events-none">
                <svg width="44" height="48" viewBox="0 0 44 48" fill="none" className="animate-[pulse_1.5s_ease-in-out_infinite_0.3s]">
                  <rect x="6" y="38" width="32" height="6" rx="2" fill="#7B341E" transform="rotate(10 22 41)" />
                  <rect x="6" y="38" width="32" height="6" rx="2" fill="#5C2513" transform="rotate(-10 22 41)" />
                  <path d="M22 6C22 6 12 18 12 28C12 34 16 38 22 38C28 38 32 34 32 28C32 18 22 6 22 6Z" fill="#ED8936" className="animate-[flicker_0.7s_ease-in-out_infinite]" />
                  <path d="M22 14C22 14 16 22 16 28C16 32 18 35 22 35C26 35 28 32 28 28C28 22 22 14 22 14Z" fill="#ECC94B" className="animate-[flicker_0.6s_ease-in-out_infinite_reverse]" />
                </svg>
              </div>
            </>
          )}

        </div>
      )}
    </AnimatePresence>
  );
});