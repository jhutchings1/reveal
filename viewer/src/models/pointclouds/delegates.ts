/*!
 * Copyright 2019 Cognite AS
 */
// @ts-ignore
import * as Potree from '@cognite/potree-core';

import { SectorModelTransformation } from '../sector/types';

export type FetchPointCloudDelegate = () => Promise<[Potree.PointCloudOctreeGeometry, SectorModelTransformation]>;