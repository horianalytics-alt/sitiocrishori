import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Season = 'natal' | 'ano-novo' | 'pascoa' | 'none';

interface SeasonalEffectsProps {
  season: Season;
  isEnabled: boolean;
}

export const SeasonalEffects: React.FC<SeasonalEffectsProps> = ({ season, isEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isEnabled || season === 'none' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: any[] = [];
    const particleCount = season === 'natal' ? 100 : season === 'ano-novo' ? 50 : 30;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (season === 'natal' ? 4 : 3) + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = season === 'natal' ? Math.random() * 1 + 1 : Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.3;
        
        if (season === 'natal') {
          this.color = `rgba(255, 255, 255, ${this.opacity})`;
        } else if (season === 'ano-novo') {
          const goldColor = `rgba(255, 215, 0, ${this.opacity})`;
          const primaryColor = `rgba(254, 131, 48, ${this.opacity})`;
          this.color = Math.random() > 0.5 ? goldColor : primaryColor;
        } else {
          const colors = ['#FFD1DC', '#E0BBE4', '#957DAD', '#D291BC']; // Pastels
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          this.color = randomColor || '#FFD1DC';
        }
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (season === 'natal') {
          if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
          }
        } else {
          if (this.y > canvas.height) this.y = 0;
          if (this.y < 0) this.y = canvas.height;
          if (this.x > canvas.width) this.x = 0;
          if (this.x < 0) this.x = canvas.width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        if (season === 'ano-novo' && Math.random() > 0.98) {
            // Flash effect for fireworks
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [season, isEnabled]);

  return (
    <AnimatePresence>
      {isEnabled && season !== 'none' && (
        <motion.canvas
          ref={canvasRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 40,
            background: 'transparent'
          }}
        />
      )}
    </AnimatePresence>
  );
};
