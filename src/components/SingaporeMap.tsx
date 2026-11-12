import React, { useState, useMemo } from 'react';
import { Carpark, VehicleCategory } from '../types/carpark';
import { getAvailabilityStatus } from '../services/carparkService';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Zap } from 'lucide-react';

interface SingaporeMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  vehicleType: VehicleCategory;
}

// Singapore bounding box
const MIN_LNG = 103.62;
const MAX_LNG = 104.03;
const MIN_LAT = 1.23;
const MAX_LAT = 1.48;

export const SingaporeMap: React.FC<SingaporeMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  vehicleType
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCarpark, setHoveredCarpark] = useState<Carpark | null>(null);

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 520;

  // Convert (lat, lng) to SVG (x, y)
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * (svgWidth - 100) + 50;
    // Latitude is inverted in SVG (higher lat is further North, i.e. lower y)
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (svgHeight - 80) + 40;
    return { x, y };
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.85, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getLotsForCategory = (cp: Carpark) => {
    if (vehicleType === 'motorcycles') return cp.motorcycleLots;
    if (vehicleType === 'heavy') return cp.heavyLots || { total: 0, available: 0 };
    return cp.carLots;
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner flex flex-col justify-between">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">Singapore Island Spatial Grid</span>
          <span className="text-[11px] text-slate-400">· {carparks.length} monitored nodes</span>
        </div>
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-3 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
        <button
          onClick={() => handleZoom(0.25)}
          title="Zoom In"
          aria-label="Zoom In"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.25)}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset Map View"
          aria-label="Reset Map View"
          className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-4 z-10 hidden sm:flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 shadow-md">
        <span className="font-medium text-slate-400">Availability:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Ample (&gt;30 lots)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Limited (5-30)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Nearly Full (&lt;5)</span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '50% 50%',
            transition: 'transform 0.15s ease-out'
          }}
        >
          <defs>
            <radialGradient id="waterGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#080e1a" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#1a2538" />
              <stop offset="100%" stopColor="#131e2e" />
            </linearGradient>
            <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Water Background */}
          <rect width={svgWidth} height={svgHeight} fill="url(#waterGlow)" />

          {/* Singapore Main Island Silhouette */}
          <g className="transition-opacity duration-300">
            {/* Mainland Singapore Path */}
            <path
              d="M 120 220 
                 C 150 170, 210 130, 280 110
                 C 330 95, 410 85, 480 95
                 C 540 100, 600 120, 680 140
                 C 740 155, 800 170, 830 190
                 C 860 215, 840 250, 800 270
                 C 760 290, 710 300, 650 310
                 C 590 320, 520 330, 460 345
                 C 400 355, 340 370, 290 370
                 C 230 370, 180 345, 140 320
                 C 100 290, 90 260, 120 220 Z"
              fill="url(#landGradient)"
              stroke="#334155"
              strokeWidth="1.5"
              className="drop-shadow-lg"
            />

            {/* Sentosa Island */}
            <path
              d="M 380 405 C 410 400, 440 408, 435 425 C 410 435, 375 425, 380 405 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            <text x="408" y="440" fill="#64748b" fontSize="9" textAnchor="middle" className="pointer-events-none select-none">
              Sentosa
            </text>

            {/* Jurong Island */}
            <path
              d="M 180 375 C 230 365, 250 395, 230 420 C 190 430, 165 400, 180 375 Z"
              fill="#162032"
              stroke="#334155"
              strokeWidth="1"
            />
            <text x="205" y="435" fill="#475569" fontSize="8" textAnchor="middle" className="pointer-events-none select-none">
              Jurong Island
            </text>

            {/* Pulau Ubin */}
            <path
              d="M 720 120 C 760 115, 780 130, 760 140 C 730 142, 710 130, 720 120 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            <text x="745" y="112" fill="#64748b" fontSize="8" textAnchor="middle" className="pointer-events-none select-none">
              Pulau Ubin
            </text>
          </g>

          {/* Schematic Expressways (PIE, AYE, CTE, ECP) */}
          <g stroke="#334155" strokeWidth="1.2" strokeDasharray="3,3" fill="none" opacity="0.65" className="pointer-events-none">
            {/* PIE (Pan Island Expressway): West to East */}
            <path d="M 170 300 Q 350 240, 520 220 T 780 210" />
            {/* AYE (Ayer Rajah Expressway): South West to CBD */}
            <path d="M 220 350 Q 320 350, 460 360" />
            {/* CTE (Central Expressway): North to South */}
            <path d="M 430 120 Q 450 230, 470 360" />
            {/* ECP (East Coast Parkway): CBD to Changi */}
            <path d="M 470 360 Q 640 330, 810 230" />
          </g>

          {/* Regional Labels */}
          <g className="pointer-events-none select-none" fill="#64748b" fontSize="10" fontWeight="600" opacity="0.75">
            <text x="210" y="270">WEST</text>
            <text x="440" y="140">NORTH</text>
            <text x="460" y="240">CENTRAL</text>
            <text x="600" y="180">NORTH-EAST</text>
            <text x="730" y="230">EAST</text>
            <text x="480" y="380" fill="#94a3b8" fontSize="11" fontWeight="700">CBD & MARINA</text>
            <text x="410" y="325" fill="#94a3b8" fontSize="10">ORCHARD</text>
          </g>

          {/* Carpark Location Pins */}
          {carparks.map((cp) => {
            const { x, y } = projectCoords(cp.coordinates.lat, cp.coordinates.lng);
            const lots = getLotsForCategory(cp);
            const statusInfo = getAvailabilityStatus(lots.available, lots.total);
            const isSelected = selectedCarpark?.id === cp.id;
            const isHovered = hoveredCarpark?.id === cp.id;

            return (
              <g
                key={cp.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectCarpark(cp)}
                onMouseEnter={() => setHoveredCarpark(cp)}
                onMouseLeave={() => setHoveredCarpark(null)}
                className="cursor-pointer transition-transform duration-150"
                style={{
                  transform: `translate(${x}px, ${y}px) scale(${isSelected ? 1.3 : isHovered ? 1.2 : 1})`,
                  transformOrigin: '0 0'
                }}
              >
                {/* Active Selection Pulsing Ring */}
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={statusInfo.ringColor}
                    strokeWidth="2"
                    opacity="0.8"
                    className="animate-ping"
                  />
                )}

                {/* Base Pin Shadow & Body */}
                <circle
                  r="14"
                  fill="#0f172a"
                  stroke={statusInfo.ringColor}
                  strokeWidth={isSelected ? '3' : '2'}
                  filter="url(#pinShadow)"
                />

                {/* Lot Count Inside Pin */}
                <text
                  y="4"
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                  className="pointer-events-none select-none"
                >
                  {lots.available > 999 ? '999+' : lots.available}
                </text>

                {/* Agency Marker / EV Indicator Tiny Pill */}
                {cp.evChargers && cp.evChargers.available > 0 && (
                  <circle
                    cx="11"
                    cy="-10"
                    r="4.5"
                    fill="#10b981"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Hover Card Tooltip */}
      {hoveredCarpark && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-2xl text-xs max-w-xs transition-opacity duration-150"
          style={{
            bottom: '16px',
            right: '16px'
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-white truncate">{hoveredCarpark.name}</span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0">{hoveredCarpark.carparkNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
            <span>{hoveredCarpark.agency}</span>
            <span aria-hidden="true">·</span>
            <span>{hoveredCarpark.structureType}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono">
              {hoveredCarpark.carLots.available} lots free
            </span>
          </div>
          <div className="text-[11px] text-slate-300 bg-slate-950/70 p-1.5 rounded border border-slate-800 font-mono">
            Peak: {hoveredCarpark.rates.weekdayPeak}
          </div>
          {hoveredCarpark.evChargers && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
              <Zap className="w-3 h-3" />
              <span>{hoveredCarpark.evChargers.available} / {hoveredCarpark.evChargers.total} EV chargers free ({hoveredCarpark.evChargers.operator})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
