import { useState } from "react";
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
  Trash2,
  Lock,
  RotateCcw,
} from "lucide-react";

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
      className={`relative rounded-xl border-2 transition-all duration-300 ${
        building.isBuilt
          ? "border-emerald-500/40 bg-emerald-500/5"
          : isNextToBuild
            ? "border-sky-500/60 bg-sky-500/10 shadow-lg shadow-sky-500/20"
            : "border-slate-700/40 bg-slate-900/30"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-block rounded-md bg-slate-700/60 px-2 py-0.5 text-xs font-bold text-slate-300">
            #{building.id}
          </span>
          {building.isBuilt && <div className="text-lg">✓</div>}
        </div>
        <p className="text-base font-black text-slate-100 mb-3">
          {building.floor} давхар байшин
        </p>
        <div className="space-y-1.5 mb-3 text-xs">
          {materialsDisplay.map((mat) => (
            <div key={mat.label} className="flex justify-between">
              <span className="text-slate-400">{mat.label}</span>
              <span className={`font-bold ${mat.color}`}>
                {fmt(mat.have)}/{fmt(mat.need)}
              </span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-slate-400">Reward</span>
            <span className="font-bold text-violet-400">
              ${fmt(building.moneyReward)}
            </span>
          </div>
        </div>

        {building.isBuilt ? (
          <button
            disabled
            className="w-full rounded-lg bg-emerald-500/20 py-2 text-xs font-bold text-emerald-300 cursor-default"
          >
            Built
          </button>
        ) : (
          <button
            type="button"
            onClick={onBuild}
            disabled={!canBuild}
            className={`w-full rounded-lg py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
              canBuild
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30"
                : "bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50"
            }`}
          >
            {canBuild ? "Build" : "Not Enough"}
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
  const [upgrades, setUpgrades] = useState<UpgradeState>(DEFAULT_UPGRADES);
  const [buildings, setBuildings] =
    useState<BuildingState[]>(generateBuildings());
  const [cleanAmount, setCleanAmount] = useState<string>("");

  const island1Buildings = buildings.filter((b) => b.island === 1);
  const island2Buildings = buildings.filter((b) => b.island === 2);
  const island1Built = island1Buildings.filter((b) => b.isBuilt).length;
  const island2Built = island2Buildings.filter((b) => b.isBuilt).length;

  const canUseWood = island1Built >= 6;
  const canUseStone = island2Built >= 6;

  const nextBuilding = buildings.find((b) => !b.isBuilt);

  const levelTotalSnow = getMaterialsPerTick("Snow", snowLevel);
  const minRequiredSnow = Math.ceil(levelTotalSnow * 0.725);

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
    setMoney((m) => m + moneyFromMaterial);
  }

  function clearLevelCustom() {
    const amount = parseInt(cleanAmount, 10);
    if (!amount || amount < minRequiredSnow || amount > levelTotalSnow) return;
    const moneyFromMaterial = amount * getSnowPriceMultiplier(snowLevel);

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
    setMoney((m) => m + moneyFromMaterial);
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
    setUpgrades(DEFAULT_UPGRADES);
    setBuildings(generateBuildings());
    setCleanAmount("");
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-screen-2xl flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-indigo-600">
              <Snowflake className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              CleanSnow Sim
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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Gathering Scene ── */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[calc(100vh-180px)] overflow-y-auto">
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
                <Trash2 className="h-4 w-4 inline mr-2" />
                Давах
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
              <div className="grid gap-2">
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
                        className="rounded-lg bg-slate-950/40 px-3 py-2.5 border border-slate-700/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={meta.color}>{meta.icon}</span>
                            <span className="text-xs font-semibold text-slate-300">
                              {meta.label}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-slate-100">
                            {level}
                            {max && (
                              <span className="text-xs text-slate-600 ml-0.5">
                                /{max}
                              </span>
                            )}
                          </span>
                        </div>
                        {!isMaxed && (
                          <button
                            type="button"
                            onClick={() => buyUpgrade(key)}
                            disabled={!canAfford}
                            className={`w-full rounded-md py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                              canAfford
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                : "bg-slate-800/50 text-slate-600 cursor-not-allowed opacity-50"
                            }`}
                          >
                            Upgrade ${fmt(cost)}
                          </button>
                        )}
                        {isMaxed && (
                          <div className="w-full rounded-md py-1.5 px-2 text-xs font-bold text-center bg-slate-800/30 text-slate-500">
                            Max Level
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm h-[calc(100vh-180px)] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-400" />
              Арал
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
                <div className="grid gap-2 grid-cols-2">
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
                  <h3 className="font-bold text-amber-400">Island 2</h3>
                  <span className="text-xs font-bold bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-lg">
                    {island2Built}/14
                  </span>
                </div>
                <div className="grid gap-2 grid-cols-2">
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
        </div>
      </div>
    </div>
  );
}

export default IslandSimulator;
