import { useMemo } from 'react';

const generatePaths = (width, height, rows, cols) => {
  const horizontals = [];
  for (let i = 0; i < rows; i++) {
    const t = i / rows;
    const baseY = Math.pow(t, 0.55) * height * 0.6 + height * 0.25;
    const amp = 4 + t * 50;
    const freq = 0.0025 + t * 0.002;
    const phase = i * 0.55 + t * 0.2;
    let d = '';
    const steps = 140;
    for (let j = 0; j <= steps; j++) {
      const x = (j / steps) * width;
      const wave =
        Math.sin(x * freq + phase) * amp +
        Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.18 +
        Math.sin(x * freq * 0.5 + phase * 0.7) * amp * 0.08;
      const y = baseY + wave;
      d += j === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }
    horizontals.push(d);
  }

  const verticals = [];
  for (let j = 0; j < cols; j++) {
    const x = ((j + 0.5) / cols) * width;
    let d = '';
    for (let i = 0; i < rows; i++) {
      const t = i / rows;
      const baseY = Math.pow(t, 0.55) * height * 0.6 + height * 0.25;
      const amp = 4 + t * 50;
      const freq = 0.0025 + t * 0.002;
      const phase = i * 0.55 + t * 0.2;
      const wave =
        Math.sin(x * freq + phase) * amp +
        Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.18 +
        Math.sin(x * freq * 0.5 + phase * 0.7) * amp * 0.08;
      const y = baseY + wave;
      d += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
    }
    verticals.push(d);
  }

  return { horizontals, verticals };
};

const NeonWireframeBackground = ({ intensity = 'full' }) => {
  const opacityMap = { full: 1, soft: 0.45, subtle: 0.3 };
  const opacity = opacityMap[intensity] ?? 1;

  const { horizontals, verticals } = useMemo(
    () => generatePaths(1440, 600, 24, 8),
    []
  );

  return (
    <div
      className="neon-wireframe-bg"
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg
        className="neon-wireframe-svg"
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="wireframe-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.9" />
            <stop offset="18%" stopColor="#c026d3" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.75" />
            <stop offset="68%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#14f1d9" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#14f1d9" stopOpacity="0.5" />
          </linearGradient>
          <filter id="wireframe-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="wireframe-glow-subtle">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="fade-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#05080f" stopOpacity="1" />
            <stop offset="18%" stopColor="#05080f" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#05080f" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#05080f" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="1440" height="600" fill="url(#fade-top)" />

        {horizontals.map((d, i) => (
          <path
            key={`h${i}`}
            d={d}
            fill="none"
            stroke="url(#wireframe-grad)"
            strokeWidth={0.6 + (i / horizontals.length) * 1.2}
            filter="url(#wireframe-glow-subtle)"
            className={`neon-wave-line neon-wave-line-${i % 4}`}
            opacity={0.25 + (i / horizontals.length) * 0.55}
          />
        ))}
        {horizontals
          .filter((_, i) => i % 3 === 0)
          .map((d, idx) => (
            <path
              key={`hg${idx}`}
              d={d}
              fill="none"
              stroke="url(#wireframe-grad)"
              strokeWidth={1.2 + (idx * 3) / horizontals.length * 1.5}
              filter="url(#wireframe-glow)"
              className={`neon-wave-glow neon-wave-glow-${idx % 2}`}
              opacity={0.15 + (idx * 3) / horizontals.length * 0.25}
            />
          ))}
        {verticals.map((d, i) => (
          <path
            key={`v${i}`}
            d={d}
            fill="none"
            stroke="url(#wireframe-grad)"
            strokeWidth={0.4}
            filter="url(#wireframe-glow-subtle)"
            className="neon-wave-line"
            opacity={0.12}
          />
        ))}
      </svg>

      <div className="neon-wireframe-fog" />
    </div>
  );
};

export default NeonWireframeBackground;
