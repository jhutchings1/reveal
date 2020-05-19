/*!
 * Copyright 2020 Cognite AS
 */

import { SectorNode } from './sector/SectorNode';
import { SectorMetadata } from './sector/types';

export function buildScene(sector: SectorMetadata, root: SectorNode, sectorNodeMap: Map<number, SectorNode>) {
  return buildSceneRecurse(sector, root, sectorNodeMap);
}

function buildSceneRecurse(sector: SectorMetadata, parent: SectorNode, sectorNodeMap: Map<number, SectorNode>) {
  const sectorGroup = new SectorNode(sector.id, sector.path);
  sectorGroup.name = `Sector ${sector.id}`;
  parent.add(sectorGroup);
  sectorNodeMap.set(sector.id, sectorGroup);
  for (const child of sector.children) {
    buildSceneRecurse(child, sectorGroup, sectorNodeMap);
  }
}