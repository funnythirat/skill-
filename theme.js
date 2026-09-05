// Dynamic Theme & Background Particles Engine
class ThemeManager {
  constructor() {
    this.currentTheme = 'default';
    this.canvas = document.getElementById('canvas-background');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationFrame = null;
    this.initCanvas();
  }

  setTheme(themeId) {
    this.currentTheme = themeId || 'default';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.resetParticles();
  }

  initCanvas() {
    if (!this.canvas) return;

    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.resetParticles();
    };

    window.addEventListener('resize', resize);
    resize();
    this.animate();
  }

  resetParticles() {
    if (!this.canvas) return;
    this.particles = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 14000);

    const colors = {
      default: ['#38bdf8', '#818cf8', '#ffffff'],
      academic: ['#38bdf8', '#fbbf24', '#e0f2fe'],
      survival: ['#22c55e', '#4ade80', '#eab308'],
      tech: ['#06b6d4', '#22d3ee', '#a855f7'],
      arts: ['#c084fc', '#f472b6', '#e879f9'],
      combat: ['#ef4444', '#f97316', '#fca5a5'],
      wealth: ['#10b981', '#eab308', '#34d399'],
      engineering: ['#f59e0b', '#fbbf24', '#f97316']
    };

    const palette = colors[this.currentTheme] || colors.default;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 2.2 + 0.8,
        color: palette[Math.floor(Math.random() * palette.length)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - (this.currentTheme === 'survival' || this.currentTheme === 'combat' ? 0.3 : 0), // float upwards like embers for survival/combat
        alpha: Math.random() * 0.6 + 0.2
      });
    }
  }

  animate() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }
}

window.themeManager = new ThemeManager();
