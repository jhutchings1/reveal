/*!
 * Copyright 2019 Cognite AS
 */

import { RevealSector3D, BoundingBox3D, Versioned3DFile } from '@cognite/sdk';

export type LocalSectorMetadataResponse = {
  readonly SectorId: number;
  readonly FileId: number;
  readonly ParentId: { Value: number } | null;
  readonly BoundingBox: {
    readonly Min: { X: number; Y: number; Z: number };
    readonly Max: { X: number; Y: number; Z: number };
  };
  readonly Depth: number;
  readonly Path: string;
  readonly Files: { [key: string]: number };
};

export async function loadLocalSectorMetadata(sectorsMetadataUrl: string): Promise<RevealSector3D[]> {
  const response = await fetch(sectorsMetadataUrl);
  if (!response.ok) {
    throw new Error(`Could not fetch ${sectorsMetadataUrl}, got ${response.status}`);
  }

  const content = await response.text();
  const sectors: LocalSectorMetadataResponse[] = [];
  for (const chunk of content.split('\n').filter(x => x.trim() !== '')) {
    const sector: LocalSectorMetadataResponse = JSON.parse(chunk);
    sectors.push(sector);
  }

  const sdkSectors = sectors.map(
    (s): RevealSector3D => {
      return {
        id: s.SectorId,
        parentId: s.ParentId ? s.ParentId.Value : -1,
        path: s.Path,
        depth: s.Depth,
        threedFiles: transformFiles(s),
        boundingBox: transformBbox(s)
      };
    }
  );
  return sdkSectors;
}

function transformBbox(sector: LocalSectorMetadataResponse): BoundingBox3D {
  const rMin = sector.BoundingBox.Min;
  const rMax = sector.BoundingBox.Max;
  return { min: [rMin.X, rMin.Y, rMin.Z], max: [rMax.X, rMax.Y, rMax.Z] };
}

function transformFiles(sector: LocalSectorMetadataResponse): Versioned3DFile[] {
  const files: Versioned3DFile[] = [];
  for (const [key, value] of Object.entries(sector.Files)) {
    const file = {
      version: parseInt(key, 10),
      fileId: value
    };
    files.push(file);
  }
  return files;
}
