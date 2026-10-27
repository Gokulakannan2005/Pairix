import React from 'react';

interface Props {
  dimensions?: Record<string, number> | null;
  size?: 'sm' | 'md' | 'lg';
  color?: string; // e.g. '#2563eb'
  showLabels?: boolean;
}

const AXIS_KEYS = [
  { key: 'Technical', label: 'Tech' },
  { key: 'AI & ML', label: 'AI/ML' },
  { key: 'Development', label: 'Dev' },
  { key: 'Design & UX', label: 'Design' },
  { key: 'Communication', label: 'Comm' },
  { key: 'Leadership & Exp', label: 'Lead' },
];

export const SkillRadarChart: React.FC<Props> = ({
  dimensions,
  size = 'md',
  color = '#2563eb',
  showLabels = true,
}) => {
  const dim = size === 'sm' ? 120 : size === 'lg' ? 240 : 170;
  const cx = dim / 2;
  const cy = dim / 2;
  const radius = size === 'sm' ? 42 : size === 'lg' ? 85 : 58;

  // Angles for regular hexagon (6 vertices, top at -pi/2)
  const numAxes = 6;
  const angleStep = (2 * Math.PI) / numAxes;

  const getCoordinates = (index: number, r: number) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Concentric hexagonal grid rings at 33%, 66%, 100%
  const gridLevels = [0.33, 0.66, 1.0];
  const gridPolygons = gridLevels.map(level => {
    const points = Array.from({ length: numAxes }).map((_, i) => {
      const { x, y } = getCoordinates(i, radius * level);
      return `${x},${y}`;
    }).join(' ');
    return points;
  });

  // Calculate data polygon points
  const dataPoints = AXIS_KEYS.map((axis, i) => {
    const rawVal = dimensions ? (dimensions[axis.key] ?? 0.5) : 0.5;
    const clamped = Math.max(0.12, Math.min(1.0, rawVal));
    const { x, y } = getCoordinates(i, radius * clamped);
    return { x, y, value: Math.round(rawVal * 100) };
  });

  const polygonString = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative inline-flex items-center justify-center select-none">
      <svg width={dim} height={dim} className="overflow-visible">
        {/* Background Grid Hexagons */}
        {gridPolygons.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill={idx === gridLevels.length - 1 ? '#f8fafc' : 'none'}
            stroke="#e2e8f0"
            strokeWidth={idx === gridLevels.length - 1 ? '1.5' : '1'}
            strokeDasharray={idx < gridLevels.length - 1 ? '3 3' : undefined}
          />
        ))}

        {/* 6 Axis Spoke Lines */}
        {Array.from({ length: numAxes }).map((_, i) => {
          const { x, y } = getCoordinates(i, radius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Skill Polygon */}
        <polygon
          points={polygonString}
          fill={color}
          fillOpacity={0.22}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Vertex Dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={size === 'sm' ? 2.5 : 3.5}
            fill="#ffffff"
            stroke={color}
            strokeWidth="2"
          />
        ))}

        {/* Axis Labels */}
        {showLabels && AXIS_KEYS.map((axis, i) => {
          const labelDist = radius + (size === 'sm' ? 12 : size === 'lg' ? 20 : 15);
          const { x, y } = getCoordinates(i, labelDist);
          const rawVal = dimensions ? (dimensions[axis.key] ?? 0.5) : 0.5;
          const score = Math.round(rawVal * 100);

          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (x < cx - 10) textAnchor = 'end';
          else if (x > cx + 10) textAnchor = 'start';

          const fontSize = size === 'sm' ? '8px' : size === 'lg' ? '11px' : '9.5px';

          return (
            <text
              key={axis.key}
              x={x}
              y={y + (size === 'sm' ? 2.5 : 3.5)}
              textAnchor={textAnchor}
              fontSize={fontSize}
              fontWeight="600"
              fill="#475569"
              className="font-mono tracking-tight"
            >
              {size === 'sm' ? axis.label : `${axis.label} ${score}`}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
