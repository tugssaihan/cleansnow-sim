import { useState, useEffect } from "react";
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
    label: "Stone Speed",
    icon: <Zap className="h-4 w-4" />,
    color: "text-slate-300",
  },
  stoneGatherSize: {
    label: "Stone Size",
    icon: <Package className="h-4 w-4" />,
    color: "text-gray-400",
  },
};

function fmt(n: number) {
  return n.toLocaleString();
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
}: {
  building: BuildingState;
  isNextToBuild: boolean;
  canBuild: boolean;
  onBuild: () => void;
  ice: number;
  wood: number;
  stone: number;
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
              <span className="text-slate-400">{mat.label.charAt(0)}</span>
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

function IslandSimulator() {
  const [money, setMoney] = useState(0);
  const [ice, setIce] = useState(0);
  const [wood, setWood] = useState(0);
  const [stone, setStone] = useState(0);
  const [currentMode, setCurrentMode] = useState<Mode>("Snow");
  const [snowLevel, setSnowLevel] = useState(1);
  const [levelsPassed, setLevelsPassed] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [upgrades, setUpgrades] = useState<UpgradeState>(DEFAULT_UPGRADES);
  const [buildings, setBuildings] =
    useState<BuildingState[]>(generateBuildings());
  const [cleanAmount, setCleanAmount] = useState<string>("");
  const [chartData, setChartData] = useState<
    Array<{ level: number; earned: number; spent: number }>
  >([]);
  const [currentSpeed, setCurrentSpeed] = useState(4);
  const [moveSpeedChartData, setMoveSpeedChartData] = useState<
    Array<{ level: number; speed: number; maxSpeed: number; minSpeed: number }>
  >([]);

  const island1Buildings = buildings.filter((b) => b.island === 1);
  const island2Buildings = buildings.filter((b) => b.island === 2);
  const island1Built = island1Buildings.filter((b) => b.isBuilt).length;
  const island2Built = island2Buildings.filter((b) => b.isBuilt).length;

  const canUseWood = island1Built >= 6;
  const canUseStone = island2Built >= 6;

  const nextBuilding = buildings.find((b) => !b.isBuilt);

  const levelTotalSnow = getMaterialsPerTick("Snow", snowLevel);
  const minRequiredSnow = Math.ceil(levelTotalSnow * 0.725);

  // Update chart data when levelsPassed changes and apply move speed penalty every 3 levels
  useEffect(() => {
    setChartData((prev) => [
      ...prev,
      { level: levelsPassed, earned: totalEarned, spent: totalSpent },
    ]);

    // Apply move speed penalty every 3 levels (at levels 3, 6, 9, 12, etc.)
    if (levelsPassed > 0 && levelsPassed % 3 === 0) {
      setCurrentSpeed((prev) => {
        const minSpeed = 6.5;
        const newSpeed = Math.max(minSpeed, (minSpeed + prev) / 2);
        setMoveSpeedChartData((chartPrev) => [
          ...chartPrev,
          { level: levelsPassed, speed: newSpeed, maxSpeed: 13, minSpeed: 6.5 },
        ]);
        return newSpeed;
      });
    } else if (levelsPassed > 0) {
      setMoveSpeedChartData((prev) => [
        ...prev,
        {
          level: levelsPassed,
          speed: currentSpeed,
          maxSpeed: 13,
          minSpeed: 6.5,
        },
      ]);
    }
  }, [levelsPassed]);

  // Update move speed chart data instantly when currentSpeed changes
  useEffect(() => {
    if (levelsPassed > 0) {
      setMoveSpeedChartData((prev) => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.speed !== currentSpeed) {
          return [
            ...prev.slice(0, -1),
            {
              level: lastEntry.level,
              speed: currentSpeed,
              maxSpeed: 13,
              minSpeed: 6.5,
            },
          ];
        }
        return prev;
      });
    }
  }, [currentSpeed, levelsPassed]);

  // Update economy chart data instantly when totalEarned or totalSpent changes
  useEffect(() => {
    if (levelsPassed > 0) {
      setChartData((prev) => {
        const lastEntry = prev[prev.length - 1];
        if (
          lastEntry &&
          (lastEntry.earned !== totalEarned || lastEntry.spent !== totalSpent)
        ) {
          return [
            ...prev.slice(0, -1),
            { level: lastEntry.level, earned: totalEarned, spent: totalSpent },
          ];
        }
        return prev;
      });
    }
  }, [totalEarned, totalSpent, levelsPassed]);

  function getLevelProgressBonus(level: number): number {
    // Levels 1-3: 33, Levels 4-6: 66, Levels 7-9: 99, etc
    return Math.ceil(level / 3) * 33;
  }

  function getUpgradeCost(key: UpgradeKey): number {
    const currentLevel = upgrades[key];
    const max = MAX_UPGRADE_LEVEL[key];
    if (max && currentLevel >= max) return 0; // Can't upgrade further

    // Snow upgrades: start at 10$, increment 70 for speed/size, 150 for capacity/moveSpeed
    if (key === "gatherSpeed" || key === "gatherSize") {
      return 10 + (currentLevel - 1) * 70;
    }
    if (key === "capacity") {
      return 10 + (currentLevel - 1) * 150;
    }
    if (key === "moveSpeed") {
      return 10 + (currentLevel - 1) * 150;
    }

    // Wood upgrades: start at 200$, increase by 100$ per upgrade
    if (key === "woodGatherSpeed" || key === "woodGatherSize") {
      return 200 + (currentLevel - 1) * 100;
    }

    // Stone upgrades: start at 400$, increase by 130$ per upgrade
    if (key === "stoneGatherSpeed" || key === "stoneGatherSize") {
      return 400 + (currentLevel - 1) * 130;
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
      setCurrentSpeed((prev) => Math.min(13, prev + 1));
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

    if (requiredIce > 0 && ice < requiredIce) return;
    if (requiredWood > 0 && wood < requiredWood) return;
    if (requiredStone > 0 && stone < requiredStone) return;

    // Subtract required materials
    if (requiredIce > 0) setIce((i) => i - requiredIce);
    if (requiredWood > 0) setWood((w) => w - requiredWood);
    if (requiredStone > 0) setStone((s) => s - requiredStone);

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
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
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
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={resetGame}
            className="flex items-center gap-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-2 text-sm font-bold transition-all duration-200 hover:bg-red-500/30 active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            Дахиж эхлэх
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
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
                {(["Snow", "Wood", "Stone"] as Mode[]).map((mode) => {
                  const isLocked =
                    (mode === "Wood" && !canUseWood) ||
                    (mode === "Stone" && !canUseStone);
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
                    }
                    return false;
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
                <span className="text-slate-500">Cash:</span>
                <span className="font-bold text-violet-400">${fmt(money)}</span>
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
                      (!req.stone || stone >= req.stone);
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
                      (!req.stone || stone >= req.stone);
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
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Graphs ── */}
          <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
            {/* Stats Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm flex-1 flex flex-col min-h-0">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Орлого зарлагын граф
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      label={{
                        value: "Level",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
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
                      name="Олсон мөнгө"
                      strokeWidth={2}
                      dot={{ fill: "#a78bfa", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="spent"
                      stroke="#f87171"
                      name="Зарцуулсан мөнгө"
                      strokeWidth={2}
                      dot={{ fill: "#f87171", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Move Speed Degradation Graph */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm flex-1 flex flex-col min-h-0">
              <h2 className="text-lg font-bold text-slate-100 mb-4">
                Машины хурд граф
              </h2>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moveSpeedChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="level"
                      stroke="#94a3b8"
                      label={{
                        value: "Level",
                        position: "insideBottomRight",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      domain={[6, 13]}
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
                      stroke="#06b6d4"
                      name="Current Speed"
                      strokeWidth={2}
                      dot={{ fill: "#06b6d4", r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minSpeed"
                      stroke="#f59e0b"
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
