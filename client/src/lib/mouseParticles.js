const COLORS = [
  "#7b2ff7", // --color-accent-1 purple
  "#ff6b9d", // --color-accent-2 pink
  "#ffd700", // --color-accent-3 gold
  "#c9b8ff", // --color-text-muted lavender
  "#b2ebf2", // --teal
  "#ffffff",  // white star
];

const SHAPES = ["✦", "★", "·", "✧", "•"];

export function initMouseParticles() {
  const MAX = 15;
  const THROTTLE_MS = 50;

  let particles = [];
  let lastTime = 0;

  const layer = document.createElement("div");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9998;overflow:hidden;";
  document.body.appendChild(layer);

  function createParticle(x, y) {
    if (particles.length >= MAX) {
      const oldest = particles.shift();
      oldest?.remove();
    }

    const el = document.createElement("span");
    el.className = "mouse-particle";

    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const size = 10 + Math.random() * 10; // 10–20px
    const tx = (Math.random() - 0.5) * 40;  // drift left/right
    const rot = (Math.random() - 0.5) * 180; // rotation deg

    el.textContent = shape;
    el.style.cssText = [
      `left:${x}px`,
      `top:${y}px`,
      `font-size:${size}px`,
      `color:${color}`,
      `text-shadow:0 0 6px ${color},0 0 12px ${color}88`,
      `--tx:${tx}px`,
      `--rot:${rot}deg`,
    ].join(";");

    layer.appendChild(el);
    particles.push(el);

    setTimeout(() => {
      el.remove();
      particles = particles.filter((p) => p !== el);
    }, 820);
  }

  function onMove(e) {
    const now = Date.now();
    if (now - lastTime < THROTTLE_MS) return;
    lastTime = now;
    createParticle(e.clientX, e.clientY);
  }

  document.addEventListener("mousemove", onMove);

  return function destroy() {
    document.removeEventListener("mousemove", onMove);
    layer.remove();
    particles = [];
  };
}
