export type Mode = "Snow" | "Wood" | "Stone";

export interface UpgradeState {
  gatherSpeed: number;
  gatherSize: number;
  capacity: number;
  moveSpeed: number;
  woodGatherSpeed: number;
  woodGatherSize: number;
  stoneGatherSpeed: number;
  stoneGatherSize: number;
}

export interface MaterialRequirement {
  ice?: number;
  wood?: number;
  stone?: number;
}

export interface BuildingState {
  id: number;
  island: 1 | 2;
  floor: 1 | 2 | 3 | 4;
  requiredMaterials: MaterialRequirement;
  moneyReward: number;
  isBuilt: boolean;
}

export function generateBuildings(): BuildingState[] {
  const buildings: BuildingState[] = [];

  // Island 1 configs: [floor, count, blocks, reward]
  const island1Config: [number, number, number, number][] = [
    [1, 3, 107, 100],
    [2, 4, 212, 200],
    [3, 4, 317, 300],
    [4, 3, 423, 400],
  ];

  // Island 2 configs: [floor, count, blocks, reward]
  const island2Config: [number, number, number, number][] = [
    [1, 3, 180, 200],
    [2, 4, 329, 400],
    [3, 4, 478, 600],
    [4, 3, 627, 800],
  ];

  let id = 1;

  // Generate Island 1 buildings
  for (const [floor, count, blocks, reward] of island1Config) {
    for (let i = 0; i < count; i++) {
      // Island 1: 1-6 = ice only, 7-14 = ice + wood (50/50)
      const requiredMaterials: MaterialRequirement =
        id <= 6
          ? { ice: blocks }
          : { ice: Math.floor(blocks / 2), wood: Math.ceil(blocks / 2) };

      buildings.push({
        id,
        island: 1,
        floor: floor as 1 | 2 | 3 | 4,
        requiredMaterials,
        moneyReward: reward,
        isBuilt: false,
      });
      id++;
    }
  }

  // Generate Island 2 buildings
  for (const [floor, count, blocks, reward] of island2Config) {
    for (let i = 0; i < count; i++) {
      // Island 2: 1-6 = ice + wood (50/50), 7-14 = wood + stone (50/50)
      const buildingInIsland = id - 14; // 15-28 -> 1-14
      const requiredMaterials: MaterialRequirement =
        buildingInIsland <= 6
          ? { ice: Math.floor(blocks / 2), wood: Math.ceil(blocks / 2) }
          : { wood: Math.floor(blocks / 2), stone: Math.ceil(blocks / 2) };

      buildings.push({
        id,
        island: 2,
        floor: floor as 1 | 2 | 3 | 4,
        requiredMaterials,
        moneyReward: reward,
        isBuilt: false,
      });
      id++;
    }
  }

  return buildings;
}
