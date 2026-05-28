import { useState, useEffect, useRef } from "react";
import type { BuildingState, Mode, UpgradeState } from "./types";
import { generateBuildings } from "./types";
import {
  Activity,
  Building2,
  Package,
  Snowflake,
  Truck,
  Wallet,
  Zap,
  Lock,
  RotateCcw,
  Settings,
  X,
  Download,
  Upload,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type UpgradeKey = keyof UpgradeState;

const DEFAULT_UPGRADES: UpgradeState = {
  gatherSpeed: 1,
  gatherSize: 1,
  capacity: 1,
  moveSpeed: 1,
  woodGatherSpeed: 1,
  woodGatherSize: 1,
  stoneGatherSpeed: 1,
  stoneGatherSize: 1,
  ironGatherSpeed: 1,
  ironGatherSize: 1,
  mudGatherSpeed: 1,
  mudGatherSize: 1,
  sandGatherSpeed: 1,
  sandGatherSize: 1,
};

const MAX_UPGRADE_LEVEL: Record<UpgradeKey, number | null> = {
  gatherSpeed: null,
  gatherSize: 10,
  capacity: 10,
  moveSpeed: 10,
  woodGatherSpeed: null,
  woodGatherSize: 10,
  stoneGatherSpeed: null,
  stoneGatherSize: 10,
  ironGatherSpeed: null,
  ironGatherSize: 10,
  mudGatherSpeed: null,
  mudGatherSize: 10,
  sandGatherSpeed: null,
  sandGatherSize: 10,
};

const UPGRADE_META: Record<
  UpgradeKey,
  { label: string; icon: React.ReactNode; color: string }
> = {
  gatherSpeed: {
    label: "Snow Speed",
    icon: <Zap className="h-4 w-4" />,
    color: "text-yellow-400",
  },
  gatherSize: {
    label: "Snow Size",
    icon: <Package className="h-4 w-4" />,
    color: "text-orange-400",
  },
  capacity: {
    label: "Capacity",
    icon: <Activity className="h-4 w-4" />,
    color: "text-blue-400",
  },
  moveSpeed: {
    label: "Move Speed",
    icon: <Truck className="h-4 w-4" />,
    color: "text-cyan-400",
  },
  woodGatherSpeed: {
    label: "Wood Speed",
    icon: <Zap className="h-4 w-4" />,
    color: "text-green-400",
  },
  woodGatherSize: {
    label: "Wood Size",
    icon: <Package className="h-4 w-4" />,
    color: "text-lime-400",
  },
  stoneGatherSpeed: {
    label: "Stone хурд",
    icon: <Zap className="h-4 w-4" />,
    color: "text-slate-300",
  },
  stoneGatherSize: {
    label: "Stone Хэмжээ",
    icon: <Package className="h-4 w-4" />,
    color: "text-gray-400",
  },
  ironGatherSpeed: {
    label: "Iron Speed",
    icon: <Zap className="h-4 w-4" />,
    color: "text-orange-400",
  },
  ironGatherSize: {
    label: "Iron Size",
    icon: <Package className="h-4 w-4" />,
    color: "text-orange-300",
  },
  mudGatherSpeed: {
    label: "Mud Speed",
    icon: <Zap className="h-4 w-4" />,
    color: "text-yellow-700",
  },
  mudGatherSize: {
    label: "Mud Size",
    icon: <Package className="h-4 w-4" />,
    color: "text-yellow-600",
  },
  sandGatherSpeed: {
    label: "Sand Speed",
    icon: <Zap className="h-4 w-4" />,
    color: "text-yellow-400",
  },
  sandGatherSize: {
    label: "Sand Size",
    icon: <Package className="h-4 w-4" />,
    color: "text-yellow-300",
  },
};

function fmt(n: number) {
  return n.toLocaleString();
}

// Limit chart data to prevent performance issues with huge arrays
const MAX_CHART_POINTS = 100;
function limitChartData<T extends { level: number }>(data: T[]): T[] {
  if (data.length > MAX_CHART_POINTS) {
    return data.slice(data.length - MAX_CHART_POINTS);
  }
  return data;
}

function getSnowYield(level: number): number {
  // Levels 1-3: 160, Levels 4-6: 200, Levels 7-9: 230, Levels 10-12: 250, 13+: 260
  if (level <= 3) return 160;
  if (level <= 6) return 200;
  if (level <= 9) return 230;
  if (level <= 12) return 250;
  return 260;
}

function getMaterialsPerTick(mode: Mode, snowLevel: number): number {
  switch (mode) {
    case "Snow":
      return getSnowYield(snowLevel);
    case "Wood":
      return 198;
    case "Stone":
      return 437;
    case "Iron":
      return 250;
    case "Mud":
      return 250;
    case "Sand":
      return 250;
    default:
      return 0;
  }
}

function getSnowPriceMultiplier(snowLevel: number): number {
  return Math.floor((snowLevel - 1) / 3) + 1;
}

function BuildingCard({
  building,
  isNextToBuild,
  canBuild,
  onBuild,
  ice,
  wood,
  stone,
  iron,
  mud,
  sand,
}: {
  building: BuildingState;
  isNextToBuild: boolean;
  canBuild: boolean;
  onBuild: () => void;
  ice: number;
  wood: number;
  stone: number;
  iron: number;
  mud: number;
  sand: number;
}) {
  const materialsDisplay: {
    label: string;
    have: number;
    need: number;
    color: string;
  }[] = [];

  if (building.requiredMaterials.ice) {
    materialsDisplay.push({
      label: "Ice",
      have: ice,
      need: building.requiredMaterials.ice,
      color:
        ice >= building.requiredMaterials.ice
          ? "text-emerald-400"
          : "text-red-400",
    });
  }
  if (building.requiredMaterials.wood) {
    materialsDisplay.push({
      label: "Wood",
      have: wood,
      need: building.requiredMaterials.wood,
      color:
        wood >= building.requiredMaterials.wood
          ? "text-emerald-400"
          : "text-red-400",
    });
  }
  if (building.requiredMaterials.stone) {
    materialsDisplay.push({
      label: "Stone",
      have: stone,
      need: building.requiredMaterials.stone,
      color:
        stone >= building.requiredMaterials.stone
          ? "text-emerald-400"
          : "text-red-400",
    });
  }
  if (building.requiredMaterials.iron) {
    materialsDisplay.push({
      label: "Iron",
      have: iron,
      need: building.requiredMaterials.iron,
      color:
        iron >= building.requiredMaterials.iron
          ? "text-emerald-400"
          : "text-red-400",
    });
  }
  if (building.requiredMaterials.mud) {
    materialsDisplay.push({
      label: "Mud",
      have: mud,
      need: building.requiredMaterials.mud,
      color:
        mud >= building.requiredMaterials.mud
          ? "text-emerald-400"
          : "text-red-400",
    });
  }
  if (building.requiredMaterials.sand) {
    materialsDisplay.push({
      label: "Sand",
      have: sand,
      need: building.requiredMaterials.sand,
      color:
        sand >= building.requiredMaterials.sand
          ? "text-emerald-400"
          : "text-red-400",
    });
  }

  return (
    <div
      className={`relative rounded-lg border-2 transition-all duration-300 ${
        building.isBuilt
          ? "border-emerald-500/40 bg-emerald-500/5"
          : isNextToBuild
            ? "border-sky-500/60 bg-sky-500/10 shadow-lg shadow-sky-500/20"
            : "border-slate-700/40 bg-slate-900/30"
      }`}
    >
      <div className="p-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="inline-block rounded-md bg-slate-700/60 px-1.5 py-0.5 text-xs font-bold text-slate-300">
            #{building.id}
          </span>
          {building.isBuilt && <div className="text-sm">✓</div>}
        </div>
        <p className="text-xs font-bold text-slate-100 mb-2">
          Давхар {building.floor}
        </p>
        <div className="space-y-0.5 mb-2 text-xs">
          {materialsDisplay.map((mat) => (
            <div key={mat.label} className="flex justify-between text-xs">
              <span className="text-slate-400">{mat.label}</span>
              <span className={`font-bold ${mat.color}`}>
                {fmt(mat.have)}/{fmt(mat.need)}
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-slate-400">$</span>
            <span className="font-bold text-violet-400">
              {fmt(building.moneyReward)}
            </span>
          </div>
        </div>

        {building.isBuilt ? (
          <button
            disabled
            className="w-full rounded-md bg-emerald-500/20 py-1 text-xs font-bold text-emerald-300 cursor-default"
          >
            ✓
          </button>
        ) : (
          <button
            type="button"
            onClick={onBuild}
            disabled={!canBuild}
            className={`w-full rounded-md py-1 text-xs font-bold transition-all duration-200 active:scale-95 ${
              canBuild
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
                : "bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50"
            }`}
          >
            {canBuild ? "Build" : "No"}
          </button>
        )}
      </div>
    </div>
  );
}

interface GameSettings {
  snowSpeedBaseCost: number;
  snowSpeedIncrement: number;
  snowSizeBaseCost: number;
  snowSizeIncrement: number;
  capacityBaseCost: number;
  capacityIncrement: number;
  moveSpeedBaseCost: number;
  moveSpeedIncrement: number;
  woodSpeedBaseCost: number;
  woodSpeedIncrement: number;
  woodSizeBaseCost: number;
  woodSizeIncrement: number;
  stoneSpeedBaseCost: number;
  stoneSpeedIncrement: number;
  stoneSizeBaseCost: number;
  stoneSizeIncrement: number;
  ironSpeedBaseCost: number;
  ironSizeBaseCost: number;
  mudSpeedBaseCost: number;
  mudSizeBaseCost: number;
  sandSpeedBaseCost: number;
  sandSizeBaseCost: number;
  maxSpeed: number;
  minSpeed: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  snowSpeedBaseCost: 10,
  snowSpeedIncrement: 70,
  snowSizeBaseCost: 10,
  snowSizeIncrement: 70,
  capacityBaseCost: 10,
  capacityIncrement: 150,
  moveSpeedBaseCost: 10,
  moveSpeedIncrement: 150,
  woodSpeedBaseCost: 200,
  woodSpeedIncrement: 100,
  woodSizeBaseCost: 200,
  woodSizeIncrement: 100,
  stoneSpeedBaseCost: 400,
  stoneSpeedIncrement: 130,
  stoneSizeBaseCost: 400,
  stoneSizeIncrement: 130,
  ironSpeedBaseCost: 800,
  ironSizeBaseCost: 800,
  mudSpeedBaseCost: 1500,
  mudSizeBaseCost: 1500,
  sandSpeedBaseCost: 2000,
  sandSizeBaseCost: 2000,
  maxSpeed: 13,
  minSpeed: 6.5,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleInputChange = (key: keyof GameSettings, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setLocalSettings((prev) => ({
      ...prev,
      [key]: numValue,
    }));
  };

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SETTINGS);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl max-h-[90vh] overflow-y-auto w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-sky-400" />
            Game Settings
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Snow Upgrades */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <h3 className="text-lg font-bold text-sky-300 mb-3">
              Snow Upgrades
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.snowSpeedBaseCost}
                  onChange={(e) =>
                    handleInputChange("snowSpeedBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Increment
                </label>
                <input
                  type="number"
                  value={localSettings.snowSpeedIncrement}
                  onChange={(e) =>
                    handleInputChange("snowSpeedIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.snowSizeBaseCost}
                  onChange={(e) =>
                    handleInputChange("snowSizeBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Increment
                </label>
                <input
                  type="number"
                  value={localSettings.snowSizeIncrement}
                  onChange={(e) =>
                    handleInputChange("snowSizeIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Move Speed */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <h3 className="text-lg font-bold text-cyan-300 mb-3">
              Capacity & Move Speed
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Capacity Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.capacityBaseCost}
                  onChange={(e) =>
                    handleInputChange("capacityBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Capacity Increment
                </label>
                <input
                  type="number"
                  value={localSettings.capacityIncrement}
                  onChange={(e) =>
                    handleInputChange("capacityIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Move Speed Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.moveSpeedBaseCost}
                  onChange={(e) =>
                    handleInputChange("moveSpeedBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Move Speed Increment
                </label>
                <input
                  type="number"
                  value={localSettings.moveSpeedIncrement}
                  onChange={(e) =>
                    handleInputChange("moveSpeedIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Wood Upgrades */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <h3 className="text-lg font-bold text-amber-300 mb-3">
              Wood Upgrades
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.woodSpeedBaseCost}
                  onChange={(e) =>
                    handleInputChange("woodSpeedBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Increment
                </label>
                <input
                  type="number"
                  value={localSettings.woodSpeedIncrement}
                  onChange={(e) =>
                    handleInputChange("woodSpeedIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.woodSizeBaseCost}
                  onChange={(e) =>
                    handleInputChange("woodSizeBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Increment
                </label>
                <input
                  type="number"
                  value={localSettings.woodSizeIncrement}
                  onChange={(e) =>
                    handleInputChange("woodSizeIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Stone Upgrades */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <h3 className="text-lg font-bold text-slate-300 mb-3">
              Stone Upgrades
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.stoneSpeedBaseCost}
                  onChange={(e) =>
                    handleInputChange("stoneSpeedBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Increment
                </label>
                <input
                  type="number"
                  value={localSettings.stoneSpeedIncrement}
                  onChange={(e) =>
                    handleInputChange("stoneSpeedIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.stoneSizeBaseCost}
                  onChange={(e) =>
                    handleInputChange("stoneSizeBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Increment
                </label>
                <input
                  type="number"
                  value={localSettings.stoneSizeIncrement}
                  onChange={(e) =>
                    handleInputChange("stoneSizeIncrement", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Iron Upgrades */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <h3 className="text-lg font-bold text-orange-400 mb-3">
              Iron Upgrades
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.ironSpeedBaseCost}
                  onChange={(e) =>
                    handleInputChange("ironSpeedBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.ironSizeBaseCost}
                  onChange={(e) =>
                    handleInputChange("ironSizeBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Mud Upgrades */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <h3 className="text-lg font-bold text-yellow-700 mb-3">
              Mud Upgrades
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.mudSpeedBaseCost}
                  onChange={(e) =>
                    handleInputChange("mudSpeedBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.mudSizeBaseCost}
                  onChange={(e) =>
                    handleInputChange("mudSizeBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Sand Upgrades */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">
              Sand Upgrades
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Speed Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.sandSpeedBaseCost}
                  onChange={(e) =>
                    handleInputChange("sandSpeedBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Size Base Cost
                </label>
                <input
                  type="number"
                  value={localSettings.sandSizeBaseCost}
                  onChange={(e) =>
                    handleInputChange("sandSizeBaseCost", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg bg-slate-700/40 text-slate-300 border border-slate-600/50 px-4 py-2 font-bold transition-all duration-200 hover:bg-slate-700/60 active:scale-95"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-700/40 text-slate-300 border border-slate-600/50 px-4 py-2 font-bold transition-all duration-200 hover:bg-slate-700/60 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-4 py-2 font-bold transition-all duration-200 hover:bg-emerald-500/30 active:scale-95"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IslandSimulator() {
  // Ref for debouncing localStorage saves
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to load from localStorage - used in useState initializers
  const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
      const savedState = localStorage.getItem("cleansnowGameState");
      if (savedState) {
        const state = JSON.parse(savedState);

        // Migration: Fix iron size upgrade bug and apply new size limits
        if (key === "upgrades" && state.upgrades) {
          // Fix iron size stuck at 12 or above the limit
          if (state.upgrades.ironGatherSize > 10) {
            state.upgrades.ironGatherSize = 1;
          }
          // Apply 10 limit to mud and sand sizes
          if (state.upgrades.mudGatherSize > 10) {
            state.upgrades.mudGatherSize = 10;
          }
          if (state.upgrades.sandGatherSize > 10) {
            state.upgrades.sandGatherSize = 10;
          }
        }

        return state[key] ?? defaultValue;
      }
    } catch (error) {
      console.error("Failed to load game state:", error);
    }
    return defaultValue;
  };

  const [money, setMoney] = useState(() => getInitialState("money", 0));
  const [gameSettings, setGameSettings] =
    useState<GameSettings>(DEFAULT_SETTINGS);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [ice, setIce] = useState(() => getInitialState("ice", 0));
  const [wood, setWood] = useState(() => getInitialState("wood", 0));
  const [stone, setStone] = useState(() => getInitialState("stone", 0));
  const [iron, setIron] = useState(() => getInitialState("iron", 0));
  const [mud, setMud] = useState(() => getInitialState("mud", 0));
  const [sand, setSand] = useState(() => getInitialState("sand", 0));
  const [currentMode, setCurrentMode] = useState<Mode>(() =>
    getInitialState("currentMode", "Snow"),
  );
  const [snowLevel, setSnowLevel] = useState(() =>
    getInitialState("snowLevel", 1),
  );
  const [levelsPassed, setLevelsPassed] = useState(() =>
    getInitialState("levelsPassed", 0),
  );
  const [totalSpent, setTotalSpent] = useState(() =>
    getInitialState("totalSpent", 0),
  );
  const [totalEarned, setTotalEarned] = useState(() =>
    getInitialState("totalEarned", 0),
  );
  const [upgrades, setUpgrades] = useState<UpgradeState>(() =>
    getInitialState("upgrades", DEFAULT_UPGRADES),
  );
  const [buildings, setBuildings] = useState<BuildingState[]>(() =>
    getInitialState("buildings", generateBuildings()),
  );
  const [cleanAmount, setCleanAmount] = useState<string>("");
  const [chartData, setChartData] = useState<
    Array<{ level: number; earned: number; spent: number }>
  >(() => getInitialState("chartData", []));
  const [currentSpeed, setCurrentSpeed] = useState(() =>
    getInitialState("currentSpeed", 4),
  );
  const [moveSpeedChartData, setMoveSpeedChartData] = useState<
    Array<{ level: number; speed: number; maxSpeed: number; minSpeed: number }>
  >(() => getInitialState("moveSpeedChartData", []));
  const [currentGatheringSpeed, setCurrentGatheringSpeed] = useState(() =>
    getInitialState("currentGatheringSpeed", 7.5),
  );
  const [gatheringSpeedChartData, setGatheringSpeedChartData] = useState<
    Array<{ level: number; speed: number; maxSpeed: number; minSpeed: number }>
  >(() => getInitialState("gatheringSpeedChartData", []));
  const [currentWoodGatheringSpeed, setCurrentWoodGatheringSpeed] = useState(
    () => getInitialState("currentWoodGatheringSpeed", 5),
  );
  const [woodGatheringSpeedChartData, setWoodGatheringSpeedChartData] =
    useState<
      Array<{
        level: number;
        speed: number;
        maxSpeed: number;
        minSpeed: number;
      }>
    >(() => getInitialState("woodGatheringSpeedChartData", []));
  const [currentStoneGatheringSpeed1, setCurrentStoneGatheringSpeed1] =
    useState(() => getInitialState("currentStoneGatheringSpeed1", 0.2));
  const [currentStoneGatheringSpeed2, setCurrentStoneGatheringSpeed2] =
    useState(() => getInitialState("currentStoneGatheringSpeed2", 0.29));
  const [stoneGatheringSpeedChartData, setStoneGatheringSpeedChartData] =
    useState<
      Array<{
        level: number;
        speed1: number;
        speed2: number;
        min1: number;
        max1: number;
        min2: number;
        max2: number;
      }>
    >(() => getInitialState("stoneGatheringSpeedChartData", []));
  const [currentIronGatheringSpeed, setCurrentIronGatheringSpeed] = useState(
    () => getInitialState("currentIronGatheringSpeed", 12.5),
  );
  const [ironGatheringSpeedChartData, setIronGatheringSpeedChartData] =
    useState<
      Array<{
        level: number;
        speed: number;
        maxSpeed: number;
        minSpeed: number;
      }>
    >(() => getInitialState("ironGatheringSpeedChartData", []));
  const [currentMudGatheringSpeed, setCurrentMudGatheringSpeed] = useState(() =>
    getInitialState("currentMudGatheringSpeed", 10.2),
  );
  const [mudGatheringSpeedChartData, setMudGatheringSpeedChartData] = useState<
    Array<{ level: number; speed: number; maxSpeed: number; minSpeed: number }>
  >(() => getInitialState("mudGatheringSpeedChartData", []));
  const [currentSandGatheringSpeed, setCurrentSandGatheringSpeed] = useState(
    () => getInitialState("currentSandGatheringSpeed", 10.2),
  );
  const [sandGatheringSpeedChartData, setSandGatheringSpeedChartData] =
    useState<
      Array<{
        level: number;
        speed: number;
        maxSpeed: number;
        minSpeed: number;
      }>
    >(() => getInitialState("sandGatheringSpeedChartData", []));

  const island1Buildings = buildings.filter((b) => b.island === 1);
  const island2Buildings = buildings.filter((b) => b.island === 2);
  const island3Buildings = buildings.filter((b) => b.island === 3);
  const island4Buildings = buildings.filter((b) => b.island === 4);
  const island5Buildings = buildings.filter((b) => b.island === 5);
  const island1Built = island1Buildings.filter((b) => b.isBuilt).length;
  const island2Built = island2Buildings.filter((b) => b.isBuilt).length;
  const island3Built = island3Buildings.filter((b) => b.isBuilt).length;
  const island4Built = island4Buildings.filter((b) => b.isBuilt).length;
  const island5Built = island5Buildings.filter((b) => b.isBuilt).length;

  const canUseWood = island1Built >= 6;
  const canUseStone = island2Built >= 6;
  const canUseIron = island3Built >= 6;
  const canUseMud = island4Built >= 6;
  const canUseSand = island5Built >= 6;

  const nextBuilding = buildings.find((b) => !b.isBuilt);

  const levelTotalSnow = getMaterialsPerTick(currentMode, snowLevel);
  const minRequiredSnow = Math.ceil(levelTotalSnow * 0.725);

  // Initialize Snow gathering speed chart with level 0 starting value (always available)
  useEffect(() => {
    if (gatheringSpeedChartData.length === 0) {
      setGatheringSpeedChartData([
        {
          level: 0,
          speed: 7.5,
          maxSpeed: 13,
          minSpeed: 6.5,
        },
      ]);
    }
  }, []);

  // Initialize Wood gathering speed chart when Wood mode unlocks
  useEffect(() => {
    if (canUseWood && woodGatheringSpeedChartData.length === 0) {
      setWoodGatheringSpeedChartData([
        {
          level: levelsPassed,
          speed: 5,
          maxSpeed: 20,
          minSpeed: 5,
        },
      ]);
    }
  }, [canUseWood]);

  // Initialize Stone gathering speed chart when Stone mode unlocks
  useEffect(() => {
    if (canUseStone && stoneGatheringSpeedChartData.length === 0) {
      setStoneGatheringSpeedChartData([
        {
          level: 0,
          speed1: 0.2,
          speed2: 0.29,
          min1: 0.05,
          max1: 0.2,
          min2: 0.29,
          max2: 1,
        },
      ]);
    }
  }, [canUseStone]);

  // Initialize Iron gathering speed chart when Iron mode unlocks
  useEffect(() => {
    if (canUseIron && ironGatheringSpeedChartData.length === 0) {
      setIronGatheringSpeedChartData([
        {
          level: levelsPassed,
          speed: 12.5,
          maxSpeed: 13,
          minSpeed: 6.5,
        },
      ]);
    }
  }, [canUseIron]);

  // Update chart data when levelsPassed changes and apply move speed penalty every 3 levels
  useEffect(() => {
    setChartData((prev) => {
      const lastEntry = prev[prev.length - 1];
      const newEntry = {
        level: levelsPassed,
        earned: totalEarned,
        spent: totalSpent,
      };

      if (lastEntry && lastEntry.level === levelsPassed) {
        return limitChartData([...prev.slice(0, -1), newEntry]);
      }
      return limitChartData([...prev, newEntry]);
    });

    // Apply move speed penalty every 3 levels (at levels 3, 6, 9, 12, etc.)
    if (levelsPassed > 0 && levelsPassed % 3 === 0) {
      setCurrentSpeed((prev) => {
        const { minSpeed } = gameSettings;
        const SPEED_DEGRADATION_RATE = 0.5;
        const newSpeed = Math.max(
          minSpeed,
          minSpeed + (prev - minSpeed) * (1 - SPEED_DEGRADATION_RATE),
        );
        setMoveSpeedChartData((chartPrev) =>
          limitChartData([
            ...chartPrev,
            {
              level: levelsPassed,
              speed: newSpeed,
              maxSpeed: gameSettings.maxSpeed,
              minSpeed: gameSettings.minSpeed,
            },
          ]),
        );
        return newSpeed;
      });
    } else if (levelsPassed > 0) {
      // Just add move speed chart entry (gathering speeds handled by their own effects)
      setMoveSpeedChartData((prev) =>
        limitChartData([
          ...prev,
          {
            level: levelsPassed,
            speed: currentSpeed,
            maxSpeed: gameSettings.maxSpeed,
            minSpeed: gameSettings.minSpeed,
          },
        ]),
      );
    }
  }, [
    levelsPassed,
    gameSettings,
    currentGatheringSpeed,
    currentWoodGatheringSpeed,
    currentStoneGatheringSpeed1,
    currentStoneGatheringSpeed2,
  ]);

  // Update move speed chart data instantly when currentSpeed changes
  useEffect(() => {
    if (levelsPassed > 0) {
      setMoveSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.speed !== currentSpeed) {
          return limitChartData([
            ...prev.slice(0, -1),
            {
              level: lastEntry.level,
              speed: currentSpeed,
              maxSpeed: gameSettings.maxSpeed,
              minSpeed: gameSettings.minSpeed,
            },
          ]);
        }
        return prev;
      });
    }
  }, [currentSpeed, levelsPassed, gameSettings]);

  // Update gathering speed chart data for all levels with Snow speed
  useEffect(() => {
    // Only show Snow speed data while Stone mode is not unlocked
    if (levelsPassed > 0 && !canUseStone) {
      setGatheringSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];

        // Apply decrease formula every 3 levels
        let displaySpeed = currentGatheringSpeed;
        if (levelsPassed % 3 === 0) {
          displaySpeed = (6.5 + currentGatheringSpeed) / 2;
        }

        // If we have an entry for this level, update it; otherwise add new one
        if (lastEntry && lastEntry.level === levelsPassed) {
          return limitChartData([
            ...prev.slice(0, -1),
            {
              level: levelsPassed,
              speed: displaySpeed,
              maxSpeed: 13,
              minSpeed: 6.5,
            },
          ]);
        }

        return limitChartData([
          ...prev,
          {
            level: levelsPassed,
            speed: displaySpeed,
            maxSpeed: 13,
            minSpeed: 6.5,
          },
        ]);
      });
    }
  }, [currentGatheringSpeed, levelsPassed, canUseStone]);

  // Update wood gathering speed chart data for all levels with Wood speed
  useEffect(() => {
    // Only show Wood speed data after Wood mode is unlocked
    if (levelsPassed > 0 && canUseWood) {
      setWoodGatheringSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];

        // Apply decrease formula every 3 levels
        let displaySpeed = currentWoodGatheringSpeed;
        if (levelsPassed % 3 === 0) {
          displaySpeed = (5 + currentWoodGatheringSpeed) / 2;
        }

        // If we have an entry for this level, update it; otherwise add new one
        if (lastEntry && lastEntry.level === levelsPassed) {
          return limitChartData([
            ...prev.slice(0, -1),
            {
              level: levelsPassed,
              speed: displaySpeed,
              maxSpeed: 20,
              minSpeed: 5,
            },
          ]);
        }

        return limitChartData([
          ...prev,
          {
            level: levelsPassed,
            speed: displaySpeed,
            maxSpeed: 20,
            minSpeed: 5,
          },
        ]);
      });
    }
  }, [currentWoodGatheringSpeed, levelsPassed, canUseWood]);

  // Update stone gathering speed chart data for all levels with Stone speed
  useEffect(() => {
    // Only show Stone speed data after Stone mode is unlocked
    if (levelsPassed > 0 && canUseStone) {
      setStoneGatheringSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];

        let displaySpeed1 = currentStoneGatheringSpeed1;
        let displaySpeed2 = currentStoneGatheringSpeed2;

        // Apply decrease formula every 3 levels
        if (levelsPassed % 3 === 0) {
          displaySpeed1 = (0.05 + currentStoneGatheringSpeed1) / 2;
          displaySpeed2 = (0.29 + currentStoneGatheringSpeed2) / 2;
        }

        // If we have an entry for this level, update it; otherwise add new one
        if (lastEntry && lastEntry.level === levelsPassed) {
          return limitChartData([
            ...prev.slice(0, -1),
            {
              level: levelsPassed,
              speed1: displaySpeed1,
              speed2: displaySpeed2,
              min1: 0.05,
              max1: 0.2,
              min2: 0.29,
              max2: 1,
            },
          ]);
        }

        return limitChartData([
          ...prev,
          {
            level: levelsPassed,
            speed1: displaySpeed1,
            speed2: displaySpeed2,
            min1: 0.05,
            max1: 0.2,
            min2: 0.29,
            max2: 1,
          },
        ]);
      });
    }
  }, [
    currentStoneGatheringSpeed1,
    currentStoneGatheringSpeed2,
    levelsPassed,
    currentMode,
    canUseStone,
  ]);

  // Update iron gathering speed chart data for all levels with Iron speed
  useEffect(() => {
    // Only show Iron speed data after Iron mode is unlocked
    if (levelsPassed > 0 && canUseIron) {
      setIronGatheringSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];

        // Apply decrease formula every 3 levels
        let displaySpeed = currentIronGatheringSpeed;
        if (levelsPassed % 3 === 0) {
          displaySpeed = (5 + currentIronGatheringSpeed) / 2;
        }

        // If we have an entry for this level, update it; otherwise add new one
        if (lastEntry && lastEntry.level === levelsPassed) {
          return limitChartData([
            ...prev.slice(0, -1),
            {
              level: levelsPassed,
              speed: displaySpeed,
              maxSpeed: 13,
              minSpeed: 5,
            },
          ]);
        }

        return limitChartData([
          ...prev,
          {
            level: levelsPassed,
            speed: displaySpeed,
            maxSpeed: 13,
            minSpeed: 5,
          },
        ]);
      });
    }
  }, [currentIronGatheringSpeed, levelsPassed, canUseIron]);

  // Initialize Mud gathering speed chart when Mud mode unlocks
  useEffect(() => {
    if (canUseMud && mudGatheringSpeedChartData.length === 0) {
      setMudGatheringSpeedChartData([
        {
          level: levelsPassed,
          speed: 10.2,
          maxSpeed: 13,
          minSpeed: 6.5,
        },
      ]);
    }
  }, [canUseMud]);

  // Update mud gathering speed chart data for all levels with Mud speed
  useEffect(() => {
    if (levelsPassed > 0 && canUseMud) {
      setMudGatheringSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];
        let displaySpeed = currentMudGatheringSpeed;
        if (levelsPassed % 3 === 0) {
          displaySpeed = (6.5 + currentMudGatheringSpeed) / 2;
        }
        if (lastEntry && lastEntry.level === levelsPassed) {
          return limitChartData([
            ...prev.slice(0, -1),
            {
              level: levelsPassed,
              speed: displaySpeed,
              maxSpeed: 13,
              minSpeed: 6.5,
            },
          ]);
        }
        return limitChartData([
          ...prev,
          {
            level: levelsPassed,
            speed: displaySpeed,
            maxSpeed: 13,
            minSpeed: 6.5,
          },
        ]);
      });
    }
  }, [currentMudGatheringSpeed, levelsPassed, canUseMud]);

  // Initialize Sand gathering speed chart when Sand mode unlocks
  useEffect(() => {
    if (canUseSand && sandGatheringSpeedChartData.length === 0) {
      setSandGatheringSpeedChartData([
        {
          level: levelsPassed,
          speed: 10.2,
          maxSpeed: 13,
          minSpeed: 6.5,
        },
      ]);
    }
  }, [canUseSand]);

  // Update sand gathering speed chart data for all levels with Sand speed
  useEffect(() => {
    if (levelsPassed > 0 && canUseSand) {
      setSandGatheringSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];
        let displaySpeed = currentSandGatheringSpeed;
        if (levelsPassed % 3 === 0) {
          displaySpeed = (6.5 + currentSandGatheringSpeed) / 2;
        }
        if (lastEntry && lastEntry.level === levelsPassed) {
          return limitChartData([
            ...prev.slice(0, -1),
            {
              level: levelsPassed,
              speed: displaySpeed,
              maxSpeed: 13,
              minSpeed: 6.5,
            },
          ]);
        }
        return limitChartData([
          ...prev,
          {
            level: levelsPassed,
            speed: displaySpeed,
            maxSpeed: 13,
            minSpeed: 6.5,
          },
        ]);
      });
    }
  }, [currentSandGatheringSpeed, levelsPassed, canUseSand]);

  // Update economy chart data instantly when totalEarned or totalSpent changes
  useEffect(() => {
    if (levelsPassed > 0) {
      setChartData((prev) => {
        const lastEntry = prev[prev.length - 1];
        if (
          lastEntry &&
          (lastEntry.earned !== totalEarned || lastEntry.spent !== totalSpent)
        ) {
          return limitChartData([
            ...prev.slice(0, -1),
            { level: lastEntry.level, earned: totalEarned, spent: totalSpent },
          ]);
        }
        return prev;
      });
    }
  }, [totalEarned, totalSpent, levelsPassed]);

  // Save game state to localStorage with debouncing - only saves after state changes stop for 500ms
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      const gameState = {
        money,
        ice,
        wood,
        stone,
        iron,
        mud,
        sand,
        currentMode,
        snowLevel,
        levelsPassed,
        totalSpent,
        totalEarned,
        upgrades,
        buildings,
        chartData,
        currentSpeed,
        moveSpeedChartData,
        currentGatheringSpeed,
        gatheringSpeedChartData,
        currentWoodGatheringSpeed,
        woodGatheringSpeedChartData,
        currentStoneGatheringSpeed1,
        currentStoneGatheringSpeed2,
        stoneGatheringSpeedChartData,
        currentIronGatheringSpeed,
        ironGatheringSpeedChartData,
        currentMudGatheringSpeed,
        mudGatheringSpeedChartData,
        currentSandGatheringSpeed,
        sandGatheringSpeedChartData,
      };
      localStorage.setItem("cleansnowGameState", JSON.stringify(gameState));
    }, 500);

    // Cleanup: clear timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    money,
    ice,
    wood,
    stone,
    iron,
    mud,
    sand,
    currentMode,
    snowLevel,
    levelsPassed,
    totalSpent,
    totalEarned,
    upgrades,
    buildings,
    chartData,
    currentSpeed,
    moveSpeedChartData,
    currentGatheringSpeed,
    gatheringSpeedChartData,
    currentWoodGatheringSpeed,
    woodGatheringSpeedChartData,
    currentStoneGatheringSpeed1,
    currentStoneGatheringSpeed2,
    stoneGatheringSpeedChartData,
    currentIronGatheringSpeed,
    ironGatheringSpeedChartData,
    currentMudGatheringSpeed,
    mudGatheringSpeedChartData,
    currentSandGatheringSpeed,
    sandGatheringSpeedChartData,
  ]);

  function getLevelProgressBonus(level: number): number {
    // Levels 1-3: 33, Levels 4-6: 66, Levels 7-9: 99, etc
    return Math.ceil(level / 3) * 33;
  }

  function getUpgradeCost(key: UpgradeKey): number {
    const currentLevel = upgrades[key];
    const max = MAX_UPGRADE_LEVEL[key];
    if (max && currentLevel >= max) return 0; // Can't upgrade further

    // Snow upgrades
    if (key === "gatherSpeed") {
      return (
        gameSettings.snowSpeedBaseCost +
        (currentLevel - 1) * gameSettings.snowSpeedIncrement
      );
    }
    if (key === "gatherSize") {
      return (
        gameSettings.snowSizeBaseCost +
        (currentLevel - 1) * gameSettings.snowSizeIncrement
      );
    }
    if (key === "capacity") {
      return (
        gameSettings.capacityBaseCost +
        (currentLevel - 1) * gameSettings.capacityIncrement
      );
    }
    if (key === "moveSpeed") {
      return (
        gameSettings.moveSpeedBaseCost +
        (currentLevel - 1) * gameSettings.moveSpeedIncrement
      );
    }

    // Wood upgrades
    if (key === "woodGatherSpeed") {
      return (
        gameSettings.woodSpeedBaseCost +
        (currentLevel - 1) * gameSettings.woodSpeedIncrement
      );
    }
    if (key === "woodGatherSize") {
      return (
        gameSettings.woodSizeBaseCost +
        (currentLevel - 1) * gameSettings.woodSizeIncrement
      );
    }

    // Stone upgrades
    if (key === "stoneGatherSpeed") {
      return (
        gameSettings.stoneSpeedBaseCost +
        (currentLevel - 1) * gameSettings.stoneSpeedIncrement
      );
    }
    if (key === "stoneGatherSize") {
      return (
        gameSettings.stoneSizeBaseCost +
        (currentLevel - 1) * gameSettings.stoneSizeIncrement
      );
    }

    // Iron upgrades: dynamic formula - current_cost + 150 + 40 * upgrade_count
    if (key === "ironGatherSpeed" || key === "ironGatherSize") {
      if (currentLevel === 1) return gameSettings.ironSpeedBaseCost;
      let cost = gameSettings.ironSpeedBaseCost;
      for (let i = 1; i < currentLevel; i++) {
        cost = cost + 150 + 40 * i;
      }
      return cost;
    }

    // Mud upgrades: dynamic formula - current_cost + 200 + 60 * upgrade_count
    if (key === "mudGatherSpeed" || key === "mudGatherSize") {
      if (currentLevel === 1) return gameSettings.mudSpeedBaseCost;
      let cost = gameSettings.mudSpeedBaseCost;
      for (let i = 1; i < currentLevel; i++) {
        cost = cost + 200 + 60 * i;
      }
      return cost;
    }

    // Sand upgrades: dynamic formula - current_cost + 250 + 80 * upgrade_count
    if (key === "sandGatherSpeed" || key === "sandGatherSize") {
      if (currentLevel === 1) return gameSettings.sandSpeedBaseCost;
      let cost = gameSettings.sandSpeedBaseCost;
      for (let i = 1; i < currentLevel; i++) {
        cost = cost + 250 + 80 * i;
      }
      return cost;
    }

    return 0;
  }

  function buyUpgrade(key: UpgradeKey) {
    const cost = getUpgradeCost(key);
    if (cost === 0 || money < cost) return;
    setMoney((m) => m - cost);
    setTotalSpent((s) => s + cost);
    setUpgrades((prev) => ({
      ...prev,
      [key]: prev[key] + 1,
    }));

    // Increase move speed when moveSpeed upgrade is purchased
    if (key === "moveSpeed") {
      setCurrentSpeed((prev) => Math.min(gameSettings.maxSpeed, prev + 1));
    }

    // Increase gathering speed when gatherSpeed upgrade is purchased
    if (key === "gatherSpeed") {
      setCurrentGatheringSpeed((prev) => Math.min(13, prev + 1));
    }

    // Increase wood gathering speed when woodGatherSpeed upgrade is purchased
    if (key === "woodGatherSpeed") {
      setCurrentWoodGatheringSpeed((prev) => Math.min(20, prev + 0.5));
    }

    // Stone gathering speeds
    if (key === "stoneGatherSpeed") {
      setCurrentStoneGatheringSpeed1((prev) => Math.max(0.05, prev - 0.004));
      setCurrentStoneGatheringSpeed2((prev) => Math.min(1, prev + 0.04));
    }

    // Increase iron gathering speed when ironGatherSpeed upgrade is purchased
    if (key === "ironGatherSpeed") {
      setCurrentIronGatheringSpeed((prev) => Math.min(13, prev + 1));
    }

    // Increase mud gathering speed when mudGatherSpeed upgrade is purchased
    if (key === "mudGatherSpeed") {
      setCurrentMudGatheringSpeed((prev) => Math.min(13, prev + 1));
    }

    // Increase sand gathering speed when sandGatherSpeed upgrade is purchased
    if (key === "sandGatherSpeed") {
      setCurrentSandGatheringSpeed((prev) => Math.min(13, prev + 1));
    }
  }

  function buildBuilding(buildingId: number) {
    const index = buildings.findIndex((b) => b.id === buildingId);
    if (index === -1) return;
    const building = buildings[index];

    // Check if building is already built
    if (building.isBuilt) return;

    // Check if we have enough of each required material
    const req = building.requiredMaterials;
    const requiredIce = req.ice ?? 0;
    const requiredWood = req.wood ?? 0;
    const requiredStone = req.stone ?? 0;
    const requiredIron = req.iron ?? 0;
    const requiredMud = req.mud ?? 0;
    const requiredSand = req.sand ?? 0;

    if (requiredIce > 0 && ice < requiredIce) return;
    if (requiredWood > 0 && wood < requiredWood) return;
    if (requiredStone > 0 && stone < requiredStone) return;
    if (requiredIron > 0 && iron < requiredIron) return;
    if (requiredMud > 0 && mud < requiredMud) return;
    if (requiredSand > 0 && sand < requiredSand) return;

    // Subtract required materials
    if (requiredIce > 0) setIce((i) => i - requiredIce);
    if (requiredWood > 0) setWood((w) => w - requiredWood);
    if (requiredStone > 0) setStone((s) => s - requiredStone);
    if (requiredIron > 0) setIron((i) => i - requiredIron);
    if (requiredMud > 0) setMud((m) => m - requiredMud);
    if (requiredSand > 0) setSand((s) => s - requiredSand);

    // Mark building as built
    setBuildings((prev) => {
      const updated = [...prev];
      updated[index] = { ...building, isBuilt: true };
      return updated;
    });
    setMoney((m) => m + building.moneyReward);
  }

  function clearLevelPerfect() {
    const earnedAmount = levelTotalSnow;
    const moneyFromMaterial = earnedAmount * getSnowPriceMultiplier(snowLevel);
    const levelProgressBonus = getLevelProgressBonus(snowLevel);
    const totalMoney = moneyFromMaterial + levelProgressBonus;

    // Add to correct material type
    if (currentMode === "Snow") {
      setIce((i) => i + earnedAmount);
    } else if (currentMode === "Wood") {
      setWood((w) => w + earnedAmount);
    } else if (currentMode === "Stone") {
      setStone((s) => s + earnedAmount);
    } else if (currentMode === "Iron") {
      setIron((i) => i + earnedAmount);
    } else if (currentMode === "Mud") {
      setMud((m) => m + earnedAmount);
    } else if (currentMode === "Sand") {
      setSand((s) => s + earnedAmount);
    }

    setLevelsPassed((l) => l + 1);
    setSnowLevel((sl) => sl + 1);
    setMoney((m) => m + totalMoney);
    setTotalEarned((te) => te + totalMoney);
  }

  function clearLevelCustom() {
    const amount = parseInt(cleanAmount, 10);
    if (!amount || amount < minRequiredSnow || amount > levelTotalSnow) return;
    const moneyFromMaterial = amount * getSnowPriceMultiplier(snowLevel);
    const levelProgressBonus = getLevelProgressBonus(snowLevel);
    const totalMoney = moneyFromMaterial + levelProgressBonus;

    // Add to correct material type
    if (currentMode === "Snow") {
      setIce((i) => i + amount);
    } else if (currentMode === "Wood") {
      setWood((w) => w + amount);
    } else if (currentMode === "Stone") {
      setStone((s) => s + amount);
    } else if (currentMode === "Iron") {
      setIron((i) => i + amount);
    } else if (currentMode === "Mud") {
      setMud((m) => m + amount);
    } else if (currentMode === "Sand") {
      setSand((s) => s + amount);
    }

    setLevelsPassed((l) => l + 1);
    setSnowLevel((sl) => sl + 1);
    setMoney((m) => m + totalMoney);
    setTotalEarned((te) => te + totalMoney);
    setCleanAmount("");
  }

  function resetGame() {
    setMoney(0);
    setIce(0);
    setWood(0);
    setStone(0);
    setIron(0);
    setMud(0);
    setSand(0);
    setCurrentMode("Snow");
    setSnowLevel(1);
    setLevelsPassed(0);
    setTotalSpent(0);
    setTotalEarned(0);
    setUpgrades(DEFAULT_UPGRADES);
    setBuildings(generateBuildings());
    setCleanAmount("");
    setChartData([]);
    setCurrentSpeed(4);
    setMoveSpeedChartData([]);
    setCurrentGatheringSpeed(7.5);
    setGatheringSpeedChartData([]);
    setCurrentWoodGatheringSpeed(5);
    setWoodGatheringSpeedChartData([]);
    setCurrentStoneGatheringSpeed1(0.2);
    setCurrentStoneGatheringSpeed2(0.29);
    setStoneGatheringSpeedChartData([]);
    setCurrentIronGatheringSpeed(12.5);
    setIronGatheringSpeedChartData([]);
    setCurrentMudGatheringSpeed(10.2);
    setMudGatheringSpeedChartData([]);
    setCurrentSandGatheringSpeed(10.2);
    setSandGatheringSpeedChartData([]);
  }

  function saveGame() {
    const gameState = {
      money,
      ice,
      wood,
      stone,
      iron,
      mud,
      sand,
      currentMode,
      snowLevel,
      levelsPassed,
      totalSpent,
      totalEarned,
      upgrades,
      buildings,
      chartData,
      currentSpeed,
      moveSpeedChartData,
      currentGatheringSpeed,
      gatheringSpeedChartData,
      currentWoodGatheringSpeed,
      woodGatheringSpeedChartData,
      currentStoneGatheringSpeed1,
      currentStoneGatheringSpeed2,
      stoneGatheringSpeedChartData,
      gameSettings,
    };

    const dataStr = JSON.stringify(gameState, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cleansnow-save-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function loadGame(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const gameState = JSON.parse(e.target?.result as string);
        setMoney(gameState.money ?? 0);
        setIce(gameState.ice ?? 0);
        setWood(gameState.wood ?? 0);
        setStone(gameState.stone ?? 0);
        setIron(gameState.iron ?? 0);
        setMud(gameState.mud ?? 0);
        setSand(gameState.sand ?? 0);
        setCurrentMode(gameState.currentMode ?? "Snow");
        setSnowLevel(gameState.snowLevel ?? 1);
        setLevelsPassed(gameState.levelsPassed ?? 0);
        setTotalSpent(gameState.totalSpent ?? 0);
        setTotalEarned(gameState.totalEarned ?? 0);
        setUpgrades(gameState.upgrades ?? DEFAULT_UPGRADES);
        setBuildings(gameState.buildings ?? generateBuildings());
        setChartData(gameState.chartData ?? []);
        setCurrentSpeed(gameState.currentSpeed ?? 4);
        setMoveSpeedChartData(gameState.moveSpeedChartData ?? []);
        setCurrentGatheringSpeed(gameState.currentGatheringSpeed ?? 7.5);
        setGatheringSpeedChartData(gameState.gatheringSpeedChartData ?? []);
        setCurrentWoodGatheringSpeed(gameState.currentWoodGatheringSpeed ?? 5);
        setWoodGatheringSpeedChartData(
          gameState.woodGatheringSpeedChartData ?? [],
        );
        setCurrentStoneGatheringSpeed1(
          gameState.currentStoneGatheringSpeed1 ?? 0.2,
        );
        setCurrentStoneGatheringSpeed2(
          gameState.currentStoneGatheringSpeed2 ?? 0.29,
        );
        setStoneGatheringSpeedChartData(
          gameState.stoneGatheringSpeedChartData ?? [],
        );
        setCurrentIronGatheringSpeed(
          gameState.currentIronGatheringSpeed ?? 12.5,
        );
        setIronGatheringSpeedChartData(
          gameState.ironGatheringSpeedChartData ?? [],
        );
        setCurrentMudGatheringSpeed(gameState.currentMudGatheringSpeed ?? 10.2);
        setMudGatheringSpeedChartData(
          gameState.mudGatheringSpeedChartData ?? [],
        );
        setCurrentSandGatheringSpeed(
          gameState.currentSandGatheringSpeed ?? 10.2,
        );
        setSandGatheringSpeedChartData(
          gameState.sandGatheringSpeedChartData ?? [],
        );
        if (gameState.gameSettings) {
          setGameSettings(gameState.gameSettings);
        }
        alert("Game loaded successfully!");
      } catch (error) {
        console.error("Failed to load game:", error);
        alert("Failed to load game file. Make sure it's a valid save file.");
      }
    };
    reader.readAsText(file);
  }

  function handleSettingsChange(newSettings: GameSettings) {
    setGameSettings(newSettings);
    // Reset the game when settings change
    setMoney(0);
    setIce(0);
    setWood(0);
    setStone(0);
    setIron(0);
    setMud(0);
    setSand(0);
    setCurrentMode("Snow");
    setSnowLevel(1);
    setLevelsPassed(0);
    setTotalSpent(0);
    setTotalEarned(0);
    setUpgrades(DEFAULT_UPGRADES);
    setBuildings(generateBuildings());
    setCleanAmount("");
    setChartData([]);
    setCurrentSpeed(4);
    setMoveSpeedChartData([]);
    setCurrentGatheringSpeed(7.5);
    setGatheringSpeedChartData([]);
    setCurrentWoodGatheringSpeed(5);
    setWoodGatheringSpeedChartData([]);
    setCurrentStoneGatheringSpeed1(0.2);
    setCurrentStoneGatheringSpeed2(0.29);
    setStoneGatheringSpeedChartData([]);
    setCurrentIronGatheringSpeed(12.5);
    setIronGatheringSpeedChartData([]);
    setCurrentMudGatheringSpeed(10.2);
    setMudGatheringSpeedChartData([]);
    setCurrentSandGatheringSpeed(10.2);
    setSandGatheringSpeedChartData([]);
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={gameSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Header */}
      <div className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">
              Clean Snow Simulator
            </span>
          </div>

          <div className="flex items-center gap-6 flex-1 justify-center text-sm">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <Activity className="h-4 w-4 text-yellow-400" />
              <span className="text-slate-400">Level:</span>
              <span className="font-bold text-yellow-300">{levelsPassed}</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-violet-400" />
                <span className="text-slate-400">Мөнгө:</span>
                <span className="font-bold text-violet-300">${fmt(money)}</span>
              </div>
              <span className="text-xs text-slate-500">
                Зарцуулсан: ${fmt(totalSpent)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-cyan-400" />
                <span className="text-slate-400">Trucks:</span>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Snowflake className="h-3 w-3 text-blue-400" />
                  <span className="font-bold text-blue-300">
                    {Math.floor(ice / 187)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 font-bold">W</span>
                  <span className="font-bold text-amber-300">
                    {Math.floor(wood / 187)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-300 font-bold">S</span>
                  <span className="font-bold text-slate-300">
                    {Math.floor(stone / 187)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-orange-400 font-bold">Fe</span>
                  <span className="font-bold text-orange-300">
                    {Math.floor(iron / 187)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-700 font-bold">M</span>
                  <span className="font-bold text-yellow-600">
                    {Math.floor(mud / 187)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 font-bold">Sd</span>
                  <span className="font-bold text-yellow-300">
                    {Math.floor(sand / 187)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-sky-500/30 active:scale-95"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="flex items-center gap-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-red-500/30 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Дахиж эхлэх
          </button>
          <button
            type="button"
            onClick={saveGame}
            className="flex items-center gap-2 rounded-lg bg-green-500/20 text-green-300 border border-green-500/40 px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-green-500/30 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Save Game
          </button>
          <label className="flex items-center gap-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-blue-500/30 active:scale-95 cursor-pointer">
            <Upload className="h-4 w-4" />
            Load Game
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadGame(file);
                e.target.value = "";
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 py-6">
        <div className="space-y-6">
          {/* Top Row: Gathering + Building */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Gathering Scene ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[calc(100vh-100px)] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-sky-400" />
                Материал цуглуулах
              </h2>

              {/* Mode Selector */}
              <div className="mb-6 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Материал
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    ["Snow", "Wood", "Stone", "Iron", "Mud", "Sand"] as Mode[]
                  ).map((mode) => {
                    const isLocked =
                      (mode === "Wood" && !canUseWood) ||
                      (mode === "Stone" && !canUseStone) ||
                      (mode === "Iron" && !canUseIron) ||
                      (mode === "Mud" && !canUseMud) ||
                      (mode === "Sand" && !canUseSand);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => !isLocked && setCurrentMode(mode)}
                        disabled={isLocked}
                        className={`relative rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
                          isLocked
                            ? "bg-slate-800/30 text-slate-600 cursor-not-allowed opacity-50"
                            : currentMode === mode
                              ? "bg-sky-500/30 border border-sky-500/60 text-sky-200"
                              : "bg-slate-800/30 border border-slate-700/50 text-slate-400 hover:bg-slate-800/50"
                        }`}
                      >
                        {mode}
                        {isLocked && (
                          <Lock className="absolute h-3 w-3 top-1 right-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {currentMode === "Wood" && !canUseWood && (
                  <p className="text-xs text-amber-400">
                    Build Island 1's first 6 buildings to unlock Wood
                  </p>
                )}
                {currentMode === "Stone" && !canUseStone && (
                  <p className="text-xs text-amber-400">
                    Build Island 2's first 6 buildings to unlock Stone
                  </p>
                )}
                {currentMode === "Iron" && !canUseIron && (
                  <p className="text-xs text-amber-400">
                    Build Island 3's first 6 buildings to unlock Iron
                  </p>
                )}
                {currentMode === "Mud" && !canUseMud && (
                  <p className="text-xs text-amber-400">
                    Build Island 4's first 6 buildings to unlock Mud
                  </p>
                )}
                {currentMode === "Sand" && !canUseSand && (
                  <p className="text-xs text-amber-400">
                    Build Island 5's first 6 buildings to unlock Sand
                  </p>
                )}
              </div>

              {/* Clear level buttons */}
              <div className="mb-6 space-y-3 p-4 rounded-xl border border-slate-700 bg-slate-800/30">
                <div className="text-xs">
                  <p className="text-slate-500 mb-1">
                    Level total:{" "}
                    <span className="font-bold text-slate-300">
                      {fmt(levelTotalSnow)}
                    </span>{" "}
                    {currentMode}
                  </p>
                  <p className="text-slate-500">
                    Min to pass (72.5%):{" "}
                    <span className="font-bold text-slate-300">
                      {fmt(minRequiredSnow)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearLevelPerfect}
                  className="w-full rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-emerald-500/30 active:scale-95"
                >
                  Complete Level
                </button>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={cleanAmount}
                    onChange={(e) => setCleanAmount(e.target.value)}
                    placeholder={`Min: ${fmt(minRequiredSnow)}`}
                    min={minRequiredSnow}
                    max={levelTotalSnow}
                    className="flex-1 rounded-lg border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button
                    type="button"
                    onClick={clearLevelCustom}
                    disabled={
                      !cleanAmount ||
                      parseInt(cleanAmount, 10) < minRequiredSnow ||
                      parseInt(cleanAmount, 10) > levelTotalSnow
                    }
                    className="rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 px-4 py-2 text-sm font-bold transition-all duration-200 hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    Clean
                  </button>
                </div>
              </div>

              {/* Upgrades */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Upgrades
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(upgrades) as UpgradeKey[])
                    .filter((key) => {
                      // Show mode-specific upgrades
                      if (currentMode === "Snow") {
                        return [
                          "gatherSpeed",
                          "gatherSize",
                          "capacity",
                          "moveSpeed",
                        ].includes(key);
                      } else if (currentMode === "Wood") {
                        return [
                          "woodGatherSpeed",
                          "woodGatherSize",
                          "capacity",
                          "moveSpeed",
                        ].includes(key);
                      } else if (currentMode === "Stone") {
                        return [
                          "stoneGatherSpeed",
                          "stoneGatherSize",
                          "capacity",
                          "moveSpeed",
                        ].includes(key);
                      } else if (currentMode === "Iron") {
                        return [
                          "ironGatherSpeed",
                          "ironGatherSize",
                          "capacity",
                          "moveSpeed",
                        ].includes(key);
                      } else if (currentMode === "Mud") {
                        return [
                          "mudGatherSpeed",
                          "mudGatherSize",
                          "capacity",
                          "moveSpeed",
                        ].includes(key);
                      } else if (currentMode === "Sand") {
                        return [
                          "sandGatherSpeed",
                          "sandGatherSize",
                          "capacity",
                          "moveSpeed",
                        ].includes(key);
                      }
                      return false;
                    })
                    .sort((a, b) => {
                      // Keep order for Snow mode
                      if (currentMode === "Snow") {
                        const snowOrder = [
                          "gatherSpeed",
                          "gatherSize",
                          "capacity",
                          "moveSpeed",
                        ];
                        return snowOrder.indexOf(a) - snowOrder.indexOf(b);
                      }
                      // For Wood, put mode-specific upgrades first, then capacity & moveSpeed
                      if (currentMode === "Wood") {
                        const order: Record<string, number> = {
                          woodGatherSpeed: 0,
                          woodGatherSize: 1,
                          capacity: 2,
                          moveSpeed: 3,
                        };
                        return (order[a] ?? 4) - (order[b] ?? 4);
                      }
                      // For Stone, put mode-specific upgrades first, then capacity & moveSpeed
                      if (currentMode === "Stone") {
                        const order: Record<string, number> = {
                          stoneGatherSpeed: 0,
                          stoneGatherSize: 1,
                          capacity: 2,
                          moveSpeed: 3,
                        };
                        return (order[a] ?? 4) - (order[b] ?? 4);
                      }
                      // For Iron, put mode-specific upgrades first, then capacity & moveSpeed
                      if (currentMode === "Iron") {
                        const order: Record<string, number> = {
                          ironGatherSpeed: 0,
                          ironGatherSize: 1,
                          capacity: 2,
                          moveSpeed: 3,
                        };
                        return (order[a] ?? 4) - (order[b] ?? 4);
                      }
                      // For Mud, put mode-specific upgrades first, then capacity & moveSpeed
                      if (currentMode === "Mud") {
                        const order: Record<string, number> = {
                          mudGatherSpeed: 0,
                          mudGatherSize: 1,
                          capacity: 2,
                          moveSpeed: 3,
                        };
                        return (order[a] ?? 4) - (order[b] ?? 4);
                      }
                      // For Sand, put mode-specific upgrades first, then capacity & moveSpeed
                      if (currentMode === "Sand") {
                        const order: Record<string, number> = {
                          sandGatherSpeed: 0,
                          sandGatherSize: 1,
                          capacity: 2,
                          moveSpeed: 3,
                        };
                        return (order[a] ?? 4) - (order[b] ?? 4);
                      }
                      return 0;
                    })
                    .map((key) => {
                      const level = upgrades[key];
                      const meta = UPGRADE_META[key];
                      const max = MAX_UPGRADE_LEVEL[key];
                      const cost = getUpgradeCost(key);
                      const canAfford = money >= cost && cost > 0;
                      const isMaxed = max && level >= max;
                      return (
                        <div
                          key={key}
                          className="rounded-lg bg-slate-950/40 px-2 py-2 border border-slate-700/40 space-y-1.5"
                        >
                          <div className="flex items-center gap-1">
                            <span className={`text-sm ${meta.color}`}>
                              {meta.icon}
                            </span>
                            <span className="text-xs font-semibold text-slate-300 truncate">
                              {meta.label}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-100 px-0.5">
                            {level}
                            {max && (
                              <span className="text-xs text-slate-600 ml-0.5">
                                /{max}
                              </span>
                            )}
                          </div>
                          {!isMaxed && (
                            <button
                              type="button"
                              onClick={() => buyUpgrade(key)}
                              disabled={!canAfford}
                              className={`w-full rounded-md py-1 text-xs font-bold transition-all duration-200 active:scale-95 ${
                                canAfford
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                  : "bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50"
                              }`}
                            >
                              ${fmt(cost)}
                            </button>
                          )}
                          {isMaxed && (
                            <div className="w-full rounded-md py-1 px-2 text-xs font-bold text-center bg-slate-800/30 text-slate-500">
                              Max
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 space-y-2 p-4 rounded-xl border border-slate-700 bg-slate-800/20">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ice:</span>
                  <span className="font-bold text-sky-400">{fmt(ice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Wood:</span>
                  <span className="font-bold text-amber-400">{fmt(wood)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Stone:</span>
                  <span className="font-bold text-gray-400">{fmt(stone)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Iron:</span>
                  <span className="font-bold text-orange-400">{fmt(iron)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Mud:</span>
                  <span className="font-bold text-yellow-700">{fmt(mud)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Sand:</span>
                  <span className="font-bold text-yellow-400">{fmt(sand)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cash:</span>
                  <span className="font-bold text-violet-400">
                    ${fmt(money)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Island Scene ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[calc(100vh-100px)] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                Барилга барих
              </h2>

              <div className="space-y-6">
                {/* Island 1 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sky-400">Арал 1</h3>
                    <span className="text-xs font-bold bg-sky-500/15 text-sky-300 px-2.5 py-1 rounded-lg">
                      {island1Built}/14
                    </span>
                  </div>
                  <div className="grid gap-2 grid-cols-4">
                    {island1Buildings.map((building) => {
                      const req = building.requiredMaterials;
                      const hasEnoughMaterials =
                        (!req.ice || ice >= req.ice) &&
                        (!req.wood || wood >= req.wood) &&
                        (!req.stone || stone >= req.stone) &&
                        (!req.iron || iron >= req.iron) &&
                        (!req.mud || mud >= req.mud) &&
                        (!req.sand || sand >= req.sand);
                      return (
                        <BuildingCard
                          key={building.id}
                          building={building}
                          isNextToBuild={building === nextBuilding}
                          canBuild={
                            !building.isBuilt &&
                            hasEnoughMaterials &&
                            building === nextBuilding
                          }
                          onBuild={() => buildBuilding(building.id)}
                          ice={ice}
                          wood={wood}
                          stone={stone}
                          iron={iron}
                          mud={mud}
                          sand={sand}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Island 2 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-amber-400">Арал 2</h3>
                    <span className="text-xs font-bold bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-lg">
                      {island2Built}/14
                    </span>
                  </div>
                  <div className="grid gap-2 grid-cols-4">
                    {island2Buildings.map((building) => {
                      const req = building.requiredMaterials;
                      const hasEnoughMaterials =
                        (!req.ice || ice >= req.ice) &&
                        (!req.wood || wood >= req.wood) &&
                        (!req.stone || stone >= req.stone) &&
                        (!req.iron || iron >= req.iron) &&
                        (!req.mud || mud >= req.mud) &&
                        (!req.sand || sand >= req.sand);
                      return (
                        <BuildingCard
                          key={building.id}
                          building={building}
                          isNextToBuild={building === nextBuilding}
                          canBuild={
                            !building.isBuilt &&
                            hasEnoughMaterials &&
                            building === nextBuilding
                          }
                          onBuild={() => buildBuilding(building.id)}
                          ice={ice}
                          wood={wood}
                          stone={stone}
                          iron={iron}
                          mud={mud}
                          sand={sand}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Island 3 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-emerald-400">Арал 3</h3>
                    <span className="text-xs font-bold bg-emerald-500/15 text-emerald-300 px-2.5 py-1 rounded-lg">
                      {island3Built}/14
                    </span>
                  </div>
                  <div className="grid gap-2 grid-cols-4">
                    {island3Buildings.map((building) => {
                      const req = building.requiredMaterials;
                      const hasEnoughMaterials =
                        (!req.ice || ice >= req.ice) &&
                        (!req.wood || wood >= req.wood) &&
                        (!req.stone || stone >= req.stone) &&
                        (!req.iron || iron >= req.iron) &&
                        (!req.mud || mud >= req.mud) &&
                        (!req.sand || sand >= req.sand);
                      return (
                        <BuildingCard
                          key={building.id}
                          building={building}
                          isNextToBuild={building === nextBuilding}
                          canBuild={
                            !building.isBuilt &&
                            hasEnoughMaterials &&
                            building === nextBuilding
                          }
                          onBuild={() => buildBuilding(building.id)}
                          ice={ice}
                          wood={wood}
                          stone={stone}
                          iron={iron}
                          mud={mud}
                          sand={sand}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Island 4 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-violet-400">Арал 4</h3>
                    <span className="text-xs font-bold bg-violet-500/15 text-violet-300 px-2.5 py-1 rounded-lg">
                      {island4Built}/14
                    </span>
                  </div>
                  <div className="grid gap-2 grid-cols-4">
                    {island4Buildings.map((building) => {
                      const req = building.requiredMaterials;
                      const hasEnoughMaterials =
                        (!req.ice || ice >= req.ice) &&
                        (!req.wood || wood >= req.wood) &&
                        (!req.stone || stone >= req.stone) &&
                        (!req.iron || iron >= req.iron) &&
                        (!req.mud || mud >= req.mud) &&
                        (!req.sand || sand >= req.sand);
                      return (
                        <BuildingCard
                          key={building.id}
                          building={building}
                          isNextToBuild={building === nextBuilding}
                          canBuild={
                            !building.isBuilt &&
                            hasEnoughMaterials &&
                            building === nextBuilding
                          }
                          onBuild={() => buildBuilding(building.id)}
                          ice={ice}
                          wood={wood}
                          stone={stone}
                          iron={iron}
                          mud={mud}
                          sand={sand}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Island 5 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-rose-400">Арал 5</h3>
                    <span className="text-xs font-bold bg-rose-500/15 text-rose-300 px-2.5 py-1 rounded-lg">
                      {island5Built}/14
                    </span>
                  </div>
                  <div className="grid gap-2 grid-cols-4">
                    {island5Buildings.map((building) => {
                      const req = building.requiredMaterials;
                      const hasEnoughMaterials =
                        (!req.ice || ice >= req.ice) &&
                        (!req.wood || wood >= req.wood) &&
                        (!req.stone || stone >= req.stone) &&
                        (!req.iron || iron >= req.iron) &&
                        (!req.mud || mud >= req.mud) &&
                        (!req.sand || sand >= req.sand);
                      return (
                        <BuildingCard
                          key={building.id}
                          building={building}
                          isNextToBuild={building === nextBuilding}
                          canBuild={
                            !building.isBuilt &&
                            hasEnoughMaterials &&
                            building === nextBuilding
                          }
                          onBuild={() => buildBuilding(building.id)}
                          ice={ice}
                          wood={wood}
                          stone={stone}
                          iron={iron}
                          mud={mud}
                          sand={sand}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Graphs Grid ── */}
          <div className="grid gap-6 grid-cols-1">
            {/* ── Earning Graph ── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Орлого зарлагын граф
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      label={{
                        value: "$ Amount",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value) =>
                        typeof value === "number" ? `$${fmt(value)}` : value
                      }
                      labelFormatter={(label) => `Level ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="earned"
                      stroke="#a78bfa"
                      name="Орлого"
                      strokeWidth={2}
                      dot={{ fill: "#a78bfa", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spent"
                      stroke="#f87171"
                      name="Зарлага"
                      strokeWidth={2}
                      dot={{ fill: "#f87171", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Gathering Speed Graphs ── */}

            {/* Snow Gathering Speed Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Snow цуглуулах хурд
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={gatheringSpeedChartData}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[0, 15]}
                      label={{
                        value: "Speed",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(2) : value
                      }
                      labelFormatter={(label) => `Level ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="maxSpeed"
                      stroke="#ef4444"
                      name="Max Speed (13)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="#3b82f6"
                      name="Current Speed"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minSpeed"
                      stroke="#facc15"
                      name="Min Speed (6.5)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Wood Gathering Speed Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Wood цуглуулах хурд
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={woodGatheringSpeedChartData}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[0, 25]}
                      label={{
                        value: "Speed",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(2) : value
                      }
                      labelFormatter={(label) => `Level ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="maxSpeed"
                      stroke="#ef4444"
                      name="Max Speed (20)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="#3b82f6"
                      name="Current Speed"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minSpeed"
                      stroke="#facc15"
                      name="Min Speed (5)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stone Gathering Speed Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Stone цуглуулах хурд
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stoneGatheringSpeedChartData}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[0, 1.2]}
                      label={{
                        value: "Speed",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(3) : value
                      }
                      labelFormatter={(label) => `Level ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="max1"
                      stroke="#ef4444"
                      name="Max1 (0.2)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed1"
                      stroke="#06b6d4"
                      name="Stone доошлох хурд"
                      strokeWidth={2}
                      dot={{ fill: "#06b6d4", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="min1"
                      stroke="#facc15"
                      name="Min1 (0.05)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="max2"
                      stroke="#8b5cf6"
                      name="Max2 (1)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed2"
                      stroke="#10b981"
                      name="Stone ухах хурд"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="min2"
                      stroke="#f97316"
                      name="Min2 (0.29)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Iron Gathering Speed Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Iron цуглуулах хурд
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={ironGatheringSpeedChartData}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[0, 15]}
                      label={{
                        value: "Speed",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(2) : value
                      }
                      labelFormatter={(label) => `Level ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="maxSpeed"
                      stroke="#ef4444"
                      name="Max Speed (13)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="#24fb41"
                      name="Current Speed"
                      strokeWidth={2}
                      dot={{ fill: "#f97316", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minSpeed"
                      stroke="#facc15"
                      name="Min Speed (6.5)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mud Gathering Speed Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Mud цуглуулах хурд
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mudGatheringSpeedChartData}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[0, 15]}
                      label={{
                        value: "Speed",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(2) : value
                      }
                      labelFormatter={(label) => `Level ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="maxSpeed"
                      stroke="#ef4444"
                      name="Max Speed (13)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="#24fb41"
                      name="Current Speed"
                      strokeWidth={2}
                      dot={{ fill: "#eab308", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minSpeed"
                      stroke="#facc15"
                      name="Min Speed (6.5)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sand Gathering Speed Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[650px] flex flex-col">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Sand цуглуулах хурд
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sandGatheringSpeedChartData}
                    margin={{ bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 11 }}
                      height={50}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[0, 15]}
                      label={{
                        value: "Speed",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                      formatter={(value) =>
                        typeof value === "number" ? value.toFixed(2) : value
                      }
                      labelFormatter={(label) => `Level ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Line
                      type="monotone"
                      dataKey="maxSpeed"
                      stroke="#ef4444"
                      name="Max Speed (13)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="#24fb41"
                      name="Current Speed"
                      strokeWidth={2}
                      dot={{ fill: "#fbbf24", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minSpeed"
                      stroke="#facc15"
                      name="Min Speed (6.5)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IslandSimulator;
