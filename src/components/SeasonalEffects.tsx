import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Season = 'natal' | 'ano-novo' | 'pascoa' | 'none';

interface SeasonalEffectsProps {
  season: Season;
  isEnabled: boolean;
  isSoundEnabled: boolean;
}

// Seasonal Sound URLs (Using high-quality public assets)
const SOUNDS = {
  natal: 'https://cdn.pixabay.com/audio/2021/11/24/audio_98313621cc.mp3', // Christmas Bell Chime
  'ano-novo': 'https://cdn.pixabay.com/audio/2022/03/15/audio_8231c62f83.mp3', // Magic Sparkle/Brilliant
  pascoa: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c361e27a7c.mp3', // Soft Acoustic Chime
};

export const SeasonalEffects: React.FC<SeasonalEffectsProps> = ({ season, isEnabled, isSoundEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Initialize sounds
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.3;
      audioRefs.current[key] = audio;
    });
  }, []);

  // Set interaction flag
  useEffect(() => {
    const handleInteraction = () => setHasInteracted(true);
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const playSound = (targetSeason: Season) => {
    if (isEnabled && isSoundEnabled && hasInteracted && targetSeason !== 'none') {
      const sound = audioRefs.current[targetSeason];
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
      }
    }
  };

  useImperativeHandle(ref, () => ({
    playSound
  }));

  // Auto-play when season prop changes from outside (if needed)
  useEffect(() => {
    if (season !== 'none') {
      playSound(season);
    }
  }, [season]);

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
        this.x = Math.random() * (canvas?.width || 1000);
        this.y = Math.random() * (canvas?.height || 1000);
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
        if (!canvas) return;
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
      if (!ctx || !canvas) return;
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