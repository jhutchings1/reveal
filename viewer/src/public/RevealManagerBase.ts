/*!
 * Copyright 2020 Cognite AS
 */

import * as THREE from 'three';

import { RenderManager } from './RenderManager';
import { SectorGeometry } from '@/datamodels/cad/sector/types';
import { SectorQuads } from '@/datamodels/cad/rendering/types';
import { SectorCuller } from '@/internal';
import { CadManager } from '@/datamodels/cad/CadManager';
import { MaterialManager } from '@/datamodels/cad/MaterialManager';
import { ModelNodeAppearance } from '@/datamodels/cad';
import { PointCloudManager } from '@/datamodels/pointcloud/PointCloudManager';

export interface RevealOptions {
  nodeAppearance?: ModelNodeAppearance;
  // internal options are experimental and may change in the future
  internal?: {
    parseCallback?: (parsed: { lod: string; data: SectorGeometry | SectorQuads }) => void;
    sectorCuller?: SectorCuller;
  };
}

export type OnDataUpdated = () => void;

export class RevealManagerBase<TModelIdentifier> implements RenderManager {
  // CAD
  protected readonly _cadManager: CadManager<TModelIdentifier>;
  protected readonly _materialManager: MaterialManager;

  // PointCloud
  protected readonly _pointCloudManager: PointCloudManager<TModelIdentifier>;

  private readonly _lastCamera = {
    position: new THREE.Vector3(NaN, NaN, NaN),
    quaternion: new THREE.Quaternion(NaN, NaN, NaN, NaN),
    zoom: NaN
  };

  constructor(
    cadManager: CadManager<TModelIdentifier>,
    materialManager: MaterialManager,
    pointCloudManager: PointCloudManager<TModelIdentifier>
  ) {
    this._cadManager = cadManager;
    this._materialManager = materialManager;
    this._pointCloudManager = pointCloudManager;
  }

  public resetRedraw(): void {
    this._cadManager.resetRedraw();
  }

  get needsRedraw(): boolean {
    return this._cadManager.needsRedraw || this._pointCloudManager.needsRedraw;
  }

  public update(camera: THREE.PerspectiveCamera) {
    const hasCameraChanged =
      this._lastCamera.zoom !== camera.zoom ||
      !this._lastCamera.position.equals(camera.position) ||
      !this._lastCamera.quaternion.equals(camera.quaternion);

    if (hasCameraChanged) {
      this._lastCamera.position.copy(camera.position);
      this._lastCamera.quaternion.copy(camera.quaternion);
      this._lastCamera.zoom = camera.zoom;

      this._cadManager.updateCamera(camera);
    }
  }

  public set clippingPlanes(clippingPlanes: THREE.Plane[]) {
    this._materialManager.clippingPlanes = clippingPlanes;
    this._cadManager.clippingPlanes = clippingPlanes;
  }

  public get clippingPlanes(): THREE.Plane[] {
    return this._materialManager.clippingPlanes;
  }

  public set clipIntersection(intersection: boolean) {
    this._materialManager.clipIntersection = intersection;
    this._cadManager.clipIntersection = intersection;
  }

  public get clipIntersection() {
    return this._materialManager.clipIntersection;
  }
}
