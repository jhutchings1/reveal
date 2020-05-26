/*!
 * Copyright 2020 Cognite AS
 */

import * as THREE from 'three';

export interface RenderManager {
  readonly needsRedraw: boolean;
  resetRedraw(): void;
  update(camera: THREE.PerspectiveCamera): void;
}
