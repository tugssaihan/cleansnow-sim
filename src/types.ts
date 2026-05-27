export type Mode = "Snow" | "Wood" | "Stone" | "Iron" | "Mud" | "Sand";

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
  iron?: number;
  mud?: number;
  sand?: number;
}

export interface BuildingState {
  id: number;
  island: 1 | 2 | 3 | 4 | 5;
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

  // Island 3 configs: [floor, count, blocks, reward]
  const island3Config: [number, number, number, number][] = [
    [1, 3, 128, 300],
    [2, 4, 272, 600],
    [3, 4, 416, 900],
    [4, 3, 560, 1200],
  ];

  // Island 4 configs: [floor, count, blocks, reward]
  const island4Config: [number, number, number, number][] = [
    [1, 3, 180, 400],
    [2, 4, 329, 800],
    [3, 4, 478, 1200],
    [4, 3, 627, 1600],
  ];

  // Island 5 configs: [floor, count, blocks, reward]
  const island5Config: [number, number, number, number][] = [
    [1, 3, 180, 500],
    [2, 4, 329, 1000],
    [3, 4, 478, 1500],
    [4, 3, 627, 2000],
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

  // Generate Island 3 buildings (ids 29-42)
  // 1-6: snow/wood/stone (thirds), 7-14: iron/wood/stone (iron replaces snow)
  const island3Start = id;
  for (const [floor, count, blocks, reward] of island3Config) {
    for (let i = 0; i < count; i++) {
      const buildingInIsland = id - island3Start + 1;
      const m = Math.floor(blocks / 3);
      const remainder = blocks - 2 * m;
      const requiredMaterials: MaterialRequirement =
        buildingInIsland <= 6
          ? { ice: m, wood: m, stone: remainder }
          : { iron: m, wood: m, stone: remainder };

      buildings.push({
        id,
        island: 3,
        floor: floor as 1 | 2 | 3 | 4,
        requiredMaterials,
        moneyReward: reward,
        isBuilt: false,
      });
      id++;
    }
  }

  // Generate Island 4 buildings (ids 43-56)
  // 1-6: wood/stone/iron (thirds), 7-14: mud/stone/iron (mud replaces wood)
  const island4Start = id;
  for (const [floor, count, blocks, reward] of island4Config) {
    for (let i = 0; i < count; i++) {
      const buildingInIsland = id - island4Start + 1;
      const m = Math.floor(blocks / 3);
      const remainder = blocks - 2 * m;
      const requiredMaterials: MaterialRequirement =
        buildingInIsland <= 6
          ? { wood: m, stone: m, iron: remainder }
          : { mud: m, stone: m, iron: remainder };

      buildings.push({
        id,
        island: 4,
        floor: floor as 1 | 2 | 3 | 4,
        requiredMaterials,
        moneyReward: reward,
        isBuilt: false,
      });
      id++;
    }
  }

  // Generate Island 5 buildings (ids 57-70)
  // 1-6: stone/iron/mud (thirds), 7-14: sand/iron/mud (sand replaces stone)
  const island5Start = id;
  for (const [floor, count, blocks, reward] of island5Config) {
    for (let i = 0; i < count; i++) {
      const buildingInIsland = id - island5Start + 1;
      const m = Math.floor(blocks / 3);
      const remainder = blocks - 2 * m;
      const requiredMaterials: MaterialRequirement =
        buildingInIsland <= 6
          ? { stone: m, iron: m, mud: remainder }
          : { sand: m, iron: m, mud: remainder };

      buildings.push({
        id,
        island: 5,
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
