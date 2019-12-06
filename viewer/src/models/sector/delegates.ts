/*!
 * Copyright 2019 Cognite AS
 */

import { Sector, SectorMetadata, LoadSectorRequest, SectorModelTransformation } from './types';

/**
 * Delegate that handles removal of a sector from a view (e.g. by removing it from the scene).
 */
export type DiscardSectorDelegate = (sectorId: number, request: LoadSectorRequest | undefined) => void;

/**
 * Delegate for retrieving the metadata about the sectors in a model.
 */
export type FetchSectorMetadataDelegate = () => Promise<[SectorMetadata, SectorModelTransformation]>;

/**
 * Delegate for fetching raw data for the sector given.
 */
export type FetchSectorDelegate = (sectorId: number) => Promise<Uint8Array>;

/**
 * Delegate for parsing data retrieved using a `FetchSectorDelegate`  to a `Sector`.
 */
export type ParseSectorDelegate<T> = (sectorId: number, buffer: Uint8Array) => Promise<T>;

/**
 * Delegate for 'consuming' a sector, e.g. by creating a 3D node for it.
 */
export type ConsumeSectorDelegate<T> = (sectorId: number, sector: T) => void;

/**
 * Delegate for fetching raw data for a CTM file.
 */
export type FetchCtmDelegate = (fileId: number) => Promise<Uint8Array>;