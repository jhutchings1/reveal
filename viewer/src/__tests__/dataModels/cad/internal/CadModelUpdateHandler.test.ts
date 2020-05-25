/*!
 * Copyright 2020 Cognite AS
 */

import * as THREE from 'three';

import { SectorCuller } from '@/dataModels/cad/internal/sector/culling/SectorCuller';
import { CachedRepository } from '@/dataModels/cad/internal/sector/CachedRepository';
import { CadModelUpdateHandler } from '@/dataModels/cad/internal/CadModelUpdateHandler';
import { CadSectorProvider } from '@/dataModels/cad/internal/sector/CadSectorProvider';
import { CadSectorParser } from '@/dataModels/cad/internal/sector/CadSectorParser';
import { SimpleAndDetailedToSector3D } from '@/dataModels/cad/internal/sector/SimpleAndDetailedToSector3D';
import { MaterialManager } from '@/dataModels/cad/internal/MaterialManager';
import { CadNode } from '@/dataModels/cad/internal/CadNode';

import { createCadModelMetadata } from '../../../testUtils/createCadModelMetadata';
import { generateSectorTree } from '../../../testUtils/createSectorMetadata';

describe('CadModelUpdateHandler', () => {
  const modelSectorProvider: CadSectorProvider = {
    getCadSectorFile: jest.fn()
  };
  const materialManager = new MaterialManager();
  const modelDataParser = new CadSectorParser();
  const modelDataTransformer = new SimpleAndDetailedToSector3D(materialManager);
  const repository = new CachedRepository(modelSectorProvider, modelDataParser, modelDataTransformer);
  const mockCuller: SectorCuller = {
    determineSectors: jest.fn()
  };

  const cadModelMetadata = createCadModelMetadata(generateSectorTree(5));
  const cadModel = new CadNode(cadModelMetadata, materialManager);

  jest.useFakeTimers();

  test('updateCamera(), updateLoadingHints() and updateClipPlanes() triggers SectorCuller.determineSectors()', () => {
    const updateHandler = new CadModelUpdateHandler(repository, mockCuller);
    updateHandler.observable().subscribe();
    updateHandler.updateModels(cadModel);

    updateHandler.updateCamera(new THREE.PerspectiveCamera());
    jest.advanceTimersByTime(1000);
    expect(mockCuller.determineSectors).toBeCalledTimes(1);

    updateHandler.updateClipPlanes([new THREE.Plane()]);
    jest.advanceTimersByTime(1000);
    expect(mockCuller.determineSectors).toBeCalledTimes(2);

    updateHandler.updateLoadingHints({ maxQuadSize: 10 });
    jest.advanceTimersByTime(1000);
    expect(mockCuller.determineSectors).toBeCalledTimes(3);

  });
});
