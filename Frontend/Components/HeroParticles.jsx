import { useEffect, useRef } from "react";

/* Particle background for dark page headers.
   Ambient dots drift slowly with faint links between neighbours. With
   `shapes` set (the home hero) and a wide screen, a second group of dots
   forms full-background shapes in turn: a neural network with signals
   passing through (the AI Lab), then a shield that blocks incoming threats
   (the Cyber Lab).
   It pauses off screen, uses fewer dots on small screens and draws a single
   still frame when the visitor prefers reduced motion. */

const PHASE_MS = 15000;
const SHAPE_COUNT = 420;
const SHAPES_MIN_WIDTH = 1024;
const NODE_RADIUS = 7;

function line(a, b, steps) {
  const out = [];
  for (let i = 0; i <= steps; i += 1) out.push([a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps]);
  return out;
}

function resample(points, count) {
  return Array.from({ length: count }, (_, i) => points[Math.floor((i / count) * points.length)]);
}

/* Shape points are [u, v, dx, dy]: a position in a unit box stretched over
   the hero, plus a fixed pixel offset so node rings stay round at any size. */
function networkShape() {
  const layers = [4, 6, 5, 5, 6, 4];
  const nodes = layers.map((count, layer) =>
    Array.from({ length: count }, (_, i) => [layer / (layers.length - 1), 0.5 + (i - (count - 1) / 2) * (0.84 / Math.max(count - 1, 1))]),
  );
  const points = [];
  for (const layer of nodes) {
    for (const [u, v] of layer) {
      for (let k = 0; k < 14; k += 1) {
        const angle = (k / 14) * Math.PI * 2;
        points.push([u, v, Math.cos(angle) * NODE_RADIUS, Math.sin(angle) * NODE_RADIUS]);
      }
    }
  }
  return { points, nodes };
}

function shieldShape() {
  const outline = [];
  outline.push(...line([0.5, 0], [0.97, 0.1], 30), ...line([0.97, 0.1], [0.97, 0.55], 30));
  for (let i = 1; i <= 34; i += 1) {
    const t = (i / 34) * (Math.PI / 2);
    outline.push([0.5 + 0.47 * Math.cos(t), 0.55 + 0.45 * Math.sin(t)]);
  }
  for (let i = 1; i <= 34; i += 1) {
    const t = Math.PI / 2 + (i / 34) * (Math.PI / 2);
    outline.push([0.5 + 0.47 * Math.cos(t), 0.55 + 0.45 * Math.sin(t)]);
  }
  outline.push(...line([0.03, 0.55], [0.03, 0.1], 30), ...line([0.03, 0.1], [0.5, 0], 30));
  // A second, slightly larger outline gives the edge a glow.
  const halo = outline.map(([u, v]) => [0.5 + (u - 0.5) * 1.03, 0.5 + (v - 0.5) * 1.03]);
  return { points: [...outline, ...halo].map(([u, v]) => [u, v, 0, 0]) };
}

export default function HeroParticles({ shapes: withShapes = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const network = networkShape();
    const shapes = [resample(network.points, SHAPE_COUNT), resample(shieldShape().points, SHAPE_COUNT)];

    let width = 0;
    let height = 0;
    let region = null;
    let ambient = [];
    let formed = [];
    let attacks = [];
    let bursts = [];
    let pulses = [];
    let phase = 0;
    let phaseStart = performance.now();
    let frame = 0;
    const pointer = { x: -9999, y: -9999 };

    const toScreen = ([u, v, dx = 0, dy = 0]) => [region.x + u * region.w + dx, region.y + v * region.h + dy];

    // Shapes fill the whole hero so the shield sits outside the text and the slider.
    const measureRegion = () => {
      if (!withShapes || width < SHAPES_MIN_WIDTH) return null;
      return { x: width * 0.015, y: height * 0.03, w: width * 0.97, h: height * 0.95 };
    };

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const ambientCount = Math.round(Math.min(Math.max((width * height) / 9000, 30), 120));
      ambient = Array.from({ length: ambientCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.1 + 0.5,
      }));

      region = measureRegion();
      formed = region
        ? shapes[phase].map((point, i) => {
            const [tx, ty] = toScreen(point);
            return { x: tx + (Math.random() - 0.5) * 240, y: ty + (Math.random() - 0.5) * 240, seed: Math.random() * 1000, gold: i % 8 === 0 };
          })
        : [];
      attacks = [];
      bursts = [];
      pulses = [];
    };

    const settle = () => {
      formed.forEach((p, i) => {
        [p.x, p.y] = toScreen(shapes[phase][i]);
      });
    };

    // True once a point (in canvas pixels) is inside the shield's outer glow line.
    const insideShield = (x, y) => {
      const u = 0.5 + ((x - region.x) / region.w - 0.5) / 1.03;
      const v = 0.5 + ((y - region.y) / region.h - 0.5) / 1.03;
      if (u < 0.03 || u > 0.97 || v > 1) return false;
      if (v < (0.1 * Math.abs(u - 0.5)) / 0.47) return false;
      if (v <= 0.55) return true;
      return ((u - 0.5) / 0.47) ** 2 + ((v - 0.55) / 0.45) ** 2 <= 1;
    };

    // Threats arrive from above or from either side and stop at the shield.
    const spawnAttack = () => {
      const side = Math.random();
      let startX;
      let startY;
      if (side < 0.5) {
        startX = width * (0.12 + Math.random() * 0.76);
        startY = -16;
      } else {
        startX = side < 0.75 ? -16 : width + 16;
        startY = region.y + region.h * (0.15 + Math.random() * 0.4);
      }
      const [tx, ty] = toScreen([0.5, 0.45 + Math.random() * 0.2]);
      const length = Math.hypot(tx - startX, ty - startY);
      attacks.push({ x: startX, y: startY, vx: ((tx - startX) / length) * 1.8, vy: ((ty - startY) / length) * 1.8 });
    };

    // A threat is drawn as a red warning triangle trailed by small data packets.
    const threat = (a) => {
      for (let k = 1; k <= 3; k += 1) {
        context.fillStyle = `rgba(239, 68, 68, ${0.45 - k * 0.12})`;
        const size = 4 - k * 0.6;
        context.fillRect(a.x - a.vx * k * 5 - size / 2, a.y - a.vy * k * 5 - size / 2, size, size);
      }
      const s = 7;
      context.beginPath();
      context.moveTo(a.x, a.y - s);
      context.lineTo(a.x + s * 0.95, a.y + s * 0.65);
      context.lineTo(a.x - s * 0.95, a.y + s * 0.65);
      context.closePath();
      context.fillStyle = "rgba(220, 38, 38, 0.95)";
      context.fill();
      context.strokeStyle = "rgba(254, 202, 202, 0.9)";
      context.lineWidth = 1;
      context.stroke();
      context.fillStyle = "#ffffff";
      context.fillRect(a.x - 0.75, a.y - 3, 1.5, 3.6);
      context.fillRect(a.x - 0.75, a.y + 1.6, 1.5, 1.5);
    };

    const dot = (x, y, r) => {
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
    };

    const draw = (now) => {
      context.clearRect(0, 0, width, height);

      for (const p of ambient) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      }
      context.lineWidth = 1;
      for (let i = 0; i < ambient.length; i += 1) {
        for (let j = i + 1; j < ambient.length; j += 1) {
          const dx = ambient[i].x - ambient[j].x;
          const dy = ambient[i].y - ambient[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 12100) {
            context.strokeStyle = `rgba(143, 209, 178, ${0.12 * (1 - Math.sqrt(d2) / 110)})`;
            context.beginPath();
            context.moveTo(ambient[i].x, ambient[i].y);
            context.lineTo(ambient[j].x, ambient[j].y);
            context.stroke();
          }
        }
      }
      context.fillStyle = "rgba(255, 255, 255, 0.3)";
      for (const p of ambient) dot(p.x, p.y, p.r);

      region = measureRegion();
      if (!region || formed.length === 0) return;

      // Shape dots ease towards their targets and move aside for the pointer.
      const targets = shapes[phase];
      formed.forEach((p, i) => {
        const [tx, ty] = toScreen(targets[i]);
        p.x += (tx - p.x) * 0.05 + (reduceMotion ? 0 : Math.sin(now * 0.0015 + p.seed) * 0.18);
        p.y += (ty - p.y) * 0.05 + (reduceMotion ? 0 : Math.cos(now * 0.0013 + p.seed) * 0.18);
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 80 && distance > 0.1) {
          const force = (1 - distance / 80) * 5;
          p.x += (dx / distance) * force;
          p.y += (dy / distance) * force;
        }
      });

      const age = now - phaseStart;
      const fadeIn = reduceMotion ? 1 : Math.min(age / 1500, 1);

      if (phase === 0) {
        const nodes = network.nodes.map((layer) => layer.map(toScreen));
        context.strokeStyle = `rgba(143, 209, 178, ${0.1 * fadeIn})`;
        for (let l = 0; l < nodes.length - 1; l += 1) {
          for (const a of nodes[l]) {
            for (const b of nodes[l + 1]) {
              context.beginPath();
              context.moveTo(a[0], a[1]);
              context.lineTo(b[0], b[1]);
              context.stroke();
            }
          }
        }
        if (!reduceMotion && age > 1200) {
          // Signals pass from layer to layer, one hop at a time.
          const hop = Math.floor(age / 900);
          const t = (age % 900) / 900;
          const l = hop % (nodes.length - 1);
          context.fillStyle = "rgba(226, 199, 126, 0.95)";
          nodes[l].forEach((a, ai) => {
            const b = nodes[l + 1][(ai + hop) % nodes[l + 1].length];
            dot(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 2.4);
          });
        }
      }

      for (const p of formed) {
        context.fillStyle = p.gold ? "rgba(226, 199, 126, 0.8)" : "rgba(255, 255, 255, 0.5)";
        dot(p.x, p.y, p.gold ? 1.9 : 1.4);
      }

      if (phase === 1 && !reduceMotion && age > 1500) {
        if (Math.random() < 0.025 && attacks.length < 4) spawnAttack();
        attacks = attacks.filter((a) => {
          a.x += a.vx;
          a.y += a.vy;
          if (insideShield(a.x, a.y)) {
            for (let k = 0; k < 14; k += 1) {
              const angle = Math.random() * Math.PI * 2;
              bursts.push({ x: a.x, y: a.y, vx: Math.cos(angle) * 1.3 - a.vx * 0.5, vy: Math.sin(angle) * 1.3 - a.vy * 0.5, life: 1 });
            }
            pulses.push({ x: a.x, y: a.y, r: 4, life: 1 });
            return false;
          }
          threat(a);
          return true;
        });
      }
      // A ring marks each blocked threat.
      pulses = pulses.filter((p) => {
        p.r += 1.4;
        p.life -= 0.035;
        if (p.life <= 0) return false;
        context.strokeStyle = `rgba(226, 199, 126, ${p.life * 0.8})`;
        context.lineWidth = 1.5;
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.stroke();
        return true;
      });
      bursts = bursts.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;
        b.life -= 0.03;
        if (b.life <= 0) return false;
        context.fillStyle = `rgba(226, 199, 126, ${b.life})`;
        dot(b.x, b.y, 1.3);
        return true;
      });
    };

    const loop = (now) => {
      if (now - phaseStart > PHASE_MS) {
        phase = (phase + 1) % shapes.length;
        phaseStart = now;
        attacks = [];
      }
      draw(now);
      frame = window.requestAnimationFrame(loop);
    };

    let visible = true;
    const start = () => {
      if (frame || reduceMotion || !visible || document.hidden) return;
      frame = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    const still = () => {
      region = measureRegion();
      if (region) settle();
      draw(performance.now());
    };

    setup();
    if (reduceMotion) still();
    else start();

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    let resizeTimer = 0;
    const resize = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setup();
        if (reduceMotion) still();
      }, 120);
    });
    resize.observe(canvas);

    const host = canvas.parentElement;
    const onPointerMove = (event) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    host?.addEventListener("pointermove", onPointerMove);
    host?.addEventListener("pointerleave", onPointerLeave);

    return () => {
      stop();
      observer.disconnect();
      resize.disconnect();
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      host?.removeEventListener("pointermove", onPointerMove);
      host?.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [withShapes]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
