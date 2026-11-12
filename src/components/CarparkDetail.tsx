import React, { useState } from 'react';
import { Carpark, VehicleCategory } from '../types/carpark';
import { getAvailabilityStatus, calculateParkingFee } from '../services/carparkService';
import { 
  X, 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  Car, 
  Bookmark, 
  BookmarkCheck, 
  Bell, 
  BellRing,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info
} from 'lucide-react';

interface CarparkDetailProps {
  carpark: Carpark;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  isAlertSet: boolean;
  onToggleAlert: (id: string) => void;
  vehicleType: VehicleCategory;
}

export const CarparkDetail: React.FC<CarparkDetailProps> = ({
  carpark,
  onClose,
  isBookmarked,
  onToggleBookmark,
  isAlertSet,
  onToggleAlert,
  vehicleType
}) => {
  // Calculator state
  const [calcEntryTime, setCalcEntryTime] = useState<string>('12:30');
  const [calcDurationMins, setCalcDurationMins] = useState<number>(90); // 1.5 hrs
  const [calcIsSunday, setCalcIsSunday] = useState<boolean>(false);

  const statusInfo = getAvailabilityStatus(carpark.carLots.available, carpark.carLots.total);
  const occupancyPct = Math.round(((carpark.carLots.total - carpark.carLots.available) / carpark.carLots.total) * 100);

  const feeCalc = calculateParkingFee(carpark, calcEntryTime, calcDurationMins, calcIsSunday);

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenWaze = () => {
    const url = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentHour = new Date().getHours();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
      {/* Header Image or Gradient Banner */}
      <div className="relative h-44 w-full bg-slate-950 overflow-hidden shrink-0">
        {carpark.imageUrl ? (
          <img
            src={carpark.imageUrl}
            alt={carpark.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
            <Car className="w-16 h-16 text-slate-700/60" />
          </div>
        )}

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

        {/* Top Control Bar on image */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/70 text-[11px] font-mono text-slate-200">
            <span className="font-bold text-white">{carpark.carparkNumber}</span>
            <span>·</span>
            <span>{carpark.agency}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleAlert(carpark.id)}
              title={isAlertSet ? 'Lot Alert Enabled' : 'Enable Low Lot Alert'}
              aria-label={isAlertSet ? 'Lot Alert Enabled' : 'Enable Low Lot Alert'}
              className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
                isAlertSet 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isAlertSet ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onToggleBookmark(carpark.id)}
              title={isBookmarked ? 'Saved in My Lots' : 'Save Carpark'}
              aria-label={isBookmarked ? 'Saved in My Lots' : 'Save Carpark'}
              className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
                isBookmarked 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              aria-label="Close Carpark Details"
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title inside bottom of banner */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded font-medium border ${statusInfo.badgeBg} ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
            {carpark.isCentralArea && (
              <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-medium">
                Central Area (CBD)
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-snug truncate">
            {carpark.name}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{carpark.address}, Singapore {carpark.postalCode}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Real-Time Lots Breakdown Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Car Lots Card */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Car className="w-4 h-4 text-emerald-400" /> Car Lots
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {occupancyPct}% full
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {carpark.carLots.available}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {carpark.carLots.total}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>

          {/* Motorcycle Lots Card */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                Motorcycles
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {carpark.motorcycleLots.total > 0 ? Math.round(((carpark.motorcycleLots.total - carpark.motorcycleLots.available) / carpark.motorcycleLots.total) * 100) : 0}% full
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {carpark.motorcycleLots.available}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {carpark.motorcycleLots.total}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${carpark.motorcycleLots.total > 0 ? ((carpark.motorcycleLots.total - carpark.motorcycleLots.available) / carpark.motorcycleLots.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* EV Chargers Section (If available) */}
        {carpark.evChargers && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-200">
                  Electric Vehicle Fast Charging
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                {carpark.evChargers.available} / {carpark.evChargers.total} bays free
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
                {carpark.evChargers.powerKw} kW DC
              </span>
              <span className="bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/60">
                {carpark.evChargers.plugTypes.join(' & ')}
              </span>
              <span className="text-slate-400">
                Operator: <strong className="text-slate-200 font-medium">{carpark.evChargers.operator}</strong>
              </span>
            </div>
          </div>
        )}

        {/* 24-Hour Historical Occupancy Profile */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Typical 24-Hour Occupancy Profile
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              {carpark.trend === 'filling' ? (
                <span className="flex items-center gap-1 text-rose-400">
                  <TrendingUp className="w-3.5 h-3.5" /> Trend: Filling Up
                </span>
              ) : carpark.trend === 'emptying' ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingDown className="w-3.5 h-3.5" /> Trend: Emptying Out
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  <Minus className="w-3.5 h-3.5" /> Trend: Stable
                </span>
              )}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="flex items-end gap-1 h-20 pt-2 border-b border-slate-800">
            {carpark.hourlyOccupancyPct.map((pct, hour) => {
              const isCurrent = hour === currentHour;
              return (
                <div 
                  key={hour} 
                  className="flex-1 flex flex-col items-center group relative h-full justify-end"
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      isCurrent
                        ? 'bg-indigo-400 ring-2 ring-indigo-300 ring-offset-1 ring-offset-slate-950'
                        : pct > 85
                        ? 'bg-rose-500/80'
                        : pct > 65
                        ? 'bg-amber-500/70'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 hidden group-hover:flex z-20 bg-slate-900 border border-slate-700 text-[10px] text-white px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap font-mono">
                    {hour.toString().padStart(2, '0')}:00 · {pct}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1.5 px-0.5">
            <span>00:00</span>
            <span>06:00</span>
            <span className="text-indigo-400 font-semibold">12:00 (Lunch)</span>
            <span>18:00 (Peak)</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Parking Rate Calculator */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Parking Fee Estimator
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Grace Period: {carpark.rates.gracePeriodMins} mins
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Entry Time</label>
              <input
                type="time"
                value={calcEntryTime}
                onChange={(e) => setCalcEntryTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Duration</label>
              <select
                value={calcDurationMins}
                onChange={(e) => setCalcDurationMins(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value={8}>8 mins (Grace period)</option>
                <option value={30}>30 mins</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours (Work day)</option>
              </select>
            </div>
          </div>

          {/* Fee Output Card */}
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Estimated Parking Cost</span>
              <span className="text-[11px] text-slate-300 font-mono">{feeCalc.breakdown}</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                S${feeCalc.totalFee.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Official Rate Sheet */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
          <span className="font-semibold text-slate-200 block text-xs">
            Published Rates & Gantry Rules
          </span>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Weekday Peak</span>
              <span className="text-slate-200 text-right font-medium">{carpark.rates.weekdayPeak}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Weekday Off-Peak</span>
              <span className="text-slate-200 text-right">{carpark.rates.weekdayOffPeak}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Saturday</span>
              <span className="text-slate-200 text-right">{carpark.rates.saturday}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Sunday & Public Hol.</span>
              <span className="text-slate-200 text-right">{carpark.rates.sundayPh}</span>
            </div>
            {carpark.rates.nightParkingCap && (
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Night Parking Cap</span>
                <span className="text-emerald-400 text-right font-mono">{carpark.rates.nightParkingCap}</span>
              </div>
            )}
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Gantry System / Height</span>
              <span className="text-slate-300 text-right font-mono">
                {carpark.gantrySystem} · {carpark.heightLimitM}m
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Directions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleOpenGoogleMaps}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Google Maps</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </button>
          <button
            onClick={handleOpenWaze}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <span>Waze Navigation</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
