/**
 * 3D粒子游戏引擎
 * 8K级粒子效果渲染系统
 */

class Particle3D {
  constructor(x, y, z, options = {}) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.vz = options.vz || 0;
    this.size = options.size || 2;
    this.color = options.color || '#ffd700';
    this.alpha = options.alpha || 1;
    this.life = options.life || 100;
    this.maxLife = this.life;
    this.gravity = options.gravity || 0;
    this.friction = options.friction || 0.99;
    this.type = options.type || 'normal';
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vz *= this.friction;
    this.life--;
    this.rotation += this.rotationSpeed;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  isDead() {
    return this.life <= 0;
  }
}

/**
 * 3D粒子渲染引擎
 */
class ParticleEngine {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];
    this.camera = {
      x: 0,
      y: 0,
      z: -500,
      fov: 500,
      angle: 0
    };
    this.maxParticles = 2000;
    this.quality = 'high'; // low, medium, high, ultra
  }

  // 设置画质
  setQuality(level) {
    const configs = {
      low: { maxParticles: 500, scale: 0.5 },
      medium: { maxParticles: 1000, scale: 0.75 },
      high: { maxParticles: 2000, scale: 1 },
      ultra: { maxParticles: 4000, scale: 1.5 }
    };
    const config = configs[level] || configs.high;
    this.maxParticles = config.maxParticles;
  }

  // 3D投影到2D
  project(x, y, z) {
    const scale = this.camera.fov / (this.camera.fov + z - this.camera.z);
    return {
      x: (x - this.camera.x) * scale + this.canvas.width / 2,
      y: (y - this.camera.y) * scale + this.canvas.height / 2,
      scale: scale
    };
  }

  // 添加粒子
  addParticle(particle) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(particle);
    }
  }

  // 创建爆炸效果
  createExplosion(x, y, z, count = 100, options = {}) {
    const colors = options.colors || ['#ffd700', '#ff6b35', '#ff1744', '#ffeb3b'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      this.addParticle(new Particle3D(x, y, z, {
        vx: Math.cos(angle) * Math.cos(angle2) * speed,
        vy: Math.sin(angle) * speed,
        vz: Math.sin(angle2) * speed,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 30 + Math.random() * 50,
        gravity: 0.1,
        friction: 0.96
      }));
    }
  }

  // 创建剑气效果
  createSwordSlash(x, y, z, direction = 1) {
    const colors = ['#ffd700', '#ffffff', '#c9a96e'];
    for (let i = 0; i < 50; i++) {
      const t = i / 50;
      this.addParticle(new Particle3D(
        x + Math.cos(t * Math.PI * 2) * 100 * direction,
        y + (Math.random() - 0.5) * 50,
        z + Math.sin(t * Math.PI * 2) * 100,
        {
          vx: direction * (3 + Math.random() * 5),
          vy: -2 + Math.random() * 4,
          vz: (Math.random() - 0.5) * 3,
          size: 3 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 20 + Math.random() * 30,
          friction: 0.95
        }
      ));
    }
  }

  // 创建能量聚集效果
  createEnergyCharge(x, y, z, radius = 100) {
    const colors = ['#00ffff', '#0088ff', '#00ff88'];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius + Math.random() * 50;
      this.addParticle(new Particle3D(
        x + Math.cos(angle) * r,
        y + Math.sin(angle) * r,
        z + (Math.random() - 0.5) * 100,
        {
          vx: -Math.cos(angle) * 2,
          vy: -Math.sin(angle) * 2,
          vz: 0,
          size: 2 + Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 30 + Math.random() * 20,
          friction: 0.98
        }
      ));
    }
  }

  // 创建火焰效果
  createFire(x, y, z) {
    for (let i = 0; i < 5; i++) {
      this.addParticle(new Particle3D(
        x + (Math.random() - 0.5) * 20,
        y,
        z + (Math.random() - 0.5) * 20,
        {
          vx: (Math.random() - 0.5) * 2,
          vy: -3 - Math.random() * 3,
          vz: (Math.random() - 0.5) * 2,
          size: 3 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#ff6b35' : '#ffd700',
          life: 30 + Math.random() * 30,
          gravity: -0.1,
          friction: 0.98
        }
      ));
    }
  }

  // 创建光环效果
  createAura(x, y, z, color = '#ffd700') {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      this.addParticle(new Particle3D(
        x + Math.cos(angle) * 60,
        y,
        z + Math.sin(angle) * 60,
        {
          vx: 0,
          vy: -1,
          vz: 0,
          size: 4,
          color: color,
          life: 60,
          friction: 1,
          rotationSpeed: 0.05
        }
      ));
    }
  }

  // 更新所有粒子
  update() {
    this.particles = this.particles.filter(p => {
      p.update();
      return !p.isDead();
    });
    
    // 相机轻微晃动
    this.camera.angle += 0.002;
    this.camera.x = Math.sin(this.camera.angle) * 20;
    this.camera.y = Math.cos(this.camera.angle) * 10;
  }

  // 渲染
  render() {
    // 清空画布
    this.ctx.fillStyle = 'rgba(15, 15, 26, 0.2)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 按Z排序（远的先画）
    this.particles.sort((a, b) => b.z - a.z);

    // 渲染每个粒子
    this.particles.forEach(p => {
      const projected = this.project(p.x, p.y, p.z);
      
      if (projected.scale > 0) {
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        
        const size = p.size * projected.scale;
        
        // 发光效果
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = size * 2;
        
        this.ctx.beginPath();
        this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
      }
    });
  }

  // 获取粒子数量
  getParticleCount() {
    return this.particles.length;
  }
}

/**
 * 3D场景管理器
 */
class Scene3D {
  constructor() {
    this.characters = [];
    this.effects = [];
    this.camera = { x: 0, y: 0, z: -500 };
  }

  // 添加角色
  addCharacter(char) {
    this.characters.push({
      id: char.id,
      name: char.name,
      x: char.x || 0,
      y: char.y || 0,
      z: char.z || 0,
      hp: char.hp || 100,
      maxHp: char.maxHp || 100,
      attack: char.attack || 10,
      defense: char.defense || 5,
      model: char.model || 'default',
      animation: 'idle'
    });
  }

  // 角色攻击动画
  attack(attackerId, targetId, engine) {
    const attacker = this.characters.find(c => c.id === attackerId);
    const target = this.characters.find(c => c.id === targetId);
    
    if (attacker && target) {
      // 创建剑气特效
      engine.createSwordSlash(attacker.x, attacker.y, attacker.z, 
        target.x > attacker.x ? 1 : -1);
      
      // 延迟后创建命中爆炸
      setTimeout(() => {
        engine.createExplosion(target.x, target.y, target.z, 80);
      }, 200);
    }
  }

  // 技能特效
  castSkill(casterId, skillName, targets, engine) {
    const caster = this.characters.find(c => c.id === casterId);
    if (!caster) return;

    switch (skillName) {
      case 'sword_qi':
        // 剑气纵横
        engine.createSwordSlash(caster.x, caster.y, caster.z, 1);
        engine.createSwordSlash(caster.x, caster.y, caster.z, -1);
        break;
      case 'soul_blade':
        // 剑魂觉醒
        engine.createEnergyCharge(caster.x, caster.y, caster.z, 150);
        engine.createAura(caster.x, caster.y, caster.z, '#ffd700');
        break;
      case 'heal':
        // 治疗
        engine.createAura(caster.x, caster.y, caster.z, '#10b981');
        break;
    }
  }
}

module.exports = {
  Particle3D,
  ParticleEngine,
  Scene3D
};
