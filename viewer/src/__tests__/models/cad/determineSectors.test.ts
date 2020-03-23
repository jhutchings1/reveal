/*!
 * Copyright 2020 Cognite AS
 */
import 'jest-extended';

import * as THREE from 'three';
import { vec3, mat4 } from 'gl-matrix';

import { SectorMetadata, SectorModelTransformation } from '../../../models/cad/types';
import { Box3 } from '../../../utils/Box3';
import { determineSectorsByProximity } from '../../../models/cad/determineSectors';
import { toThreeMatrix4, fromThreeMatrix, fromThreeVector3 } from '../../../views/threejs/utilities';
import { LevelOfDetail } from '../../../data/model/LevelOfDetail';
import { WantedSector } from '../../../data/model/WantedSector';
import { createSceneFromRoot } from '../../testUtils/createSceneFromRoot';

describe('determineSectors', () => {
  const identityTransform: SectorModelTransformation = {
    modelMatrix: mat4.identity(mat4.create()),
    inverseModelMatrix: mat4.identity(mat4.create())
  };

  test('frustum does not intersect root bounds', async () => {
    // Arrange
    const root: SectorMetadata = {
      id: 1,
      depth: 0,
      path: '0/',
      bounds: new Box3([vec3.fromValues(10, 10, 10), vec3.fromValues(11, 11, 11)]),
      children: [],
      indexFile: {
        peripheralFiles: [],
        estimatedDrawCallCount: 10,
        fileName: 'sector_1.i3d',
        downloadSize: 5433
      },
      facesFile: emptyFacesFile()
    };
    const scene = createSceneFromRoot(root);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, -2);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    // Act
    const sectors = await determineSectorsByProximity({
      sectorScene: scene,
      cameraFov: camera.fov,
      cameraPosition: fromThreeVector3(vec3.create(), camera.position, identityTransform),
      cameraModelMatrix: fromThreeMatrix(mat4.create(), camera.matrixWorld, identityTransform),
      projectionMatrix: fromThreeMatrix(mat4.create(), camera.projectionMatrix, identityTransform)
    });

    // Assert
    expect(sectors.length).toEqual(1);
    expect(sectors[0].levelOfDetail).toEqual(LevelOfDetail.Discarded);
  });

  test('partial intersect, returns correct sectors', async () => {
    // Arrange
    const root: SectorMetadata = {
      id: 1,
      depth: 1,
      path: '0/',
      bounds: new Box3([vec3.fromValues(0, 0, 0), vec3.fromValues(2, 1, 1)]),
      indexFile: {
        fileName: 'sector_1.i3d',
        peripheralFiles: [],
        estimatedDrawCallCount: 10,
        downloadSize: 1000
      },
      facesFile: {
        fileName: 'sector_1.f3d',
        quadSize: 0.5,
        coverageFactors: {
          xy: 0.5,
          xz: 0.5,
          yz: 0.5
        },
        downloadSize: 1000
      },
      children: [
        {
          id: 2,
          depth: 1,
          path: '0/0/',
          bounds: new Box3([vec3.fromValues(0, 0, 0), vec3.fromValues(1, 1, 1)]),
          children: [],
          indexFile: {
            fileName: 'sector_2.i3d',
            peripheralFiles: [],
            estimatedDrawCallCount: 10,
            downloadSize: 1000
          },
          facesFile: {
            fileName: 'sector_2.f3d',
            quadSize: 0.5,
            coverageFactors: {
              xy: 0.5,
              xz: 0.5,
              yz: 0.5
            },
            downloadSize: 1000
          }
        },
        {
          id: 3,
          depth: 1,
          path: '0/1/',
          bounds: new Box3([vec3.fromValues(1, 0, 0), vec3.fromValues(2, 1, 1)]),
          children: [],
          indexFile: {
            fileName: 'sector_3.i3d',
            peripheralFiles: [],
            estimatedDrawCallCount: 10,
            downloadSize: 1000
          },
          facesFile: {
            fileName: 'sector_3.f3d',
            quadSize: 0.5,
            coverageFactors: {
              xy: 0.5,
              xz: 0.5,
              yz: 0.5
            },
            downloadSize: 1000
          }
        }
      ]
    };
    const scene = createSceneFromRoot(root);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    // Act
    const sectors = await determineSectorsByProximity({
      sectorScene: scene,
      cameraFov: camera.fov,
      cameraPosition: fromThreeVector3(vec3.create(), camera.position, identityTransform),
      cameraModelMatrix: fromThreeMatrix(mat4.create(), camera.matrixWorld, identityTransform),
      projectionMatrix: fromThreeMatrix(mat4.create(), camera.projectionMatrix, identityTransform)
    });

    // Assert
    expect(
      sectors.filter((sector: WantedSector) => sector.id === 1 && sector.levelOfDetail === LevelOfDetail.Detailed)
        .length
    ).toEqual(1);
    expect(
      sectors.filter((sector: WantedSector) => sector.id === 2 && sector.levelOfDetail === LevelOfDetail.Detailed)
        .length
    ).toEqual(1);
    expect(
      sectors.filter((sector: WantedSector) => sector.id === 3 && sector.levelOfDetail === LevelOfDetail.Simple).length
    ).toEqual(1);
  });

  test('model with transformation, returns correctly', async () => {
    // Arrange
    const modelMatrix = mat4.fromRotation(mat4.create(), Math.PI, [0, 1, 0]);
    const inverseModelMatrix = mat4.invert(mat4.create(), modelMatrix)!;
    const transform = {
      modelMatrix,
      inverseModelMatrix
    };
    const root: SectorMetadata = {
      id: 1,
      path: '0/',
      depth: 0,
      bounds: new Box3([vec3.fromValues(1, 1, 1), vec3.fromValues(2, 2, 2)]),
      indexFile: {
        fileName: 'sector_1.i3d',
        peripheralFiles: [],
        estimatedDrawCallCount: 10,
        downloadSize: 1000
      },
      facesFile: emptyFacesFile(),
      children: []
    };
    const scene = createSceneFromRoot(root);
    const camera = new THREE.PerspectiveCamera();
    camera.position.copy(new THREE.Vector3(1.5, 1.5, -1).applyMatrix4(toThreeMatrix4(transform.modelMatrix)));
    camera.lookAt(new THREE.Vector3(1.5, 1.5, 1.5).applyMatrix4(toThreeMatrix4(transform.modelMatrix)));
    camera.updateMatrixWorld();

    // Act
    const sectors = await determineSectorsByProximity({
      sectorScene: scene,
      cameraFov: camera.fov,
      cameraPosition: fromThreeVector3(vec3.create(), camera.position, transform),
      cameraModelMatrix: fromThreeMatrix(mat4.create(), camera.matrixWorld, transform),
      projectionMatrix: fromThreeMatrix(mat4.create(), camera.projectionMatrix, transform)
    });

    // Assert
    expect(
      sectors.filter((sector: WantedSector) => sector.id === 1 && sector.levelOfDetail === LevelOfDetail.Detailed)
        .length
    ).toEqual(1);
  });
});

function emptyFacesFile() {
  return {
    quadSize: 0.5,
    fileName: null,
    coverageFactors: {
      xy: 0.5,
      xz: 0.5,
      yz: 0.5
    },
    downloadSize: 0
  };
}
