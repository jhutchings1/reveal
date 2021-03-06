/*!
 * Copyright 2020 Cognite AS
 */

import * as THREE from 'three';
import { PointCloudFactory } from './PointCloudFactory';
import { PointCloudMetadataRepository } from './PointCloudMetadataRepository';
import { PotreeGroupWrapper } from './PotreeGroupWrapper';
import { PotreeNodeWrapper } from './PotreeNodeWrapper';

export class PointCloudManager<TModelIdentifier> {
  private readonly _pointCloudMetadataRepository: PointCloudMetadataRepository<TModelIdentifier>;
  private readonly _pointCloudFactory: PointCloudFactory;

  private _pointCloudGroupWrapper?: PotreeGroupWrapper;

  constructor(
    cadModelMetadataRepository: PointCloudMetadataRepository<TModelIdentifier>,
    cadModelFactory: PointCloudFactory
  ) {
    this._pointCloudMetadataRepository = cadModelMetadataRepository;
    this._pointCloudFactory = cadModelFactory;
  }

  get needsRedraw(): boolean {
    return this._pointCloudGroupWrapper ? this._pointCloudGroupWrapper.needsRedraw : false;
  }

  updateCamera(_camera: THREE.PerspectiveCamera) {}

  async addModel(modelIdentifier: TModelIdentifier): Promise<[PotreeGroupWrapper, PotreeNodeWrapper]> {
    const metadata = await this._pointCloudMetadataRepository.loadData(modelIdentifier);
    const model = this._pointCloudFactory.createModel(metadata);
    if (!this._pointCloudGroupWrapper) {
      this._pointCloudGroupWrapper = new PotreeGroupWrapper();
    }
    this._pointCloudGroupWrapper.addPointCloud(model);
    return [this._pointCloudGroupWrapper, model];
  }
}
