/*!
 * Copyright 2019 Cognite AS
 */

import { FetchCtmDelegate, FetchSectorDelegate, FetchSectorMetadataDelegate } from '../../sector/delegates';
import { SectorModel } from '../cognitesdk';
import { loadLocalSectorMetadata } from './loadLocalSectorMetadata';
import { DefaultSectorRotationMatrix } from '../cognitesdk/constructMatrixFromRotation';
import { loadLocalFileMap } from './loadLocalFileMap';
import { buildSectorMetadata } from '../cognitesdk/buildSectorMetadata';
import { getNewestVersionedFile } from '../../sector/utilities';

export function createLocalSectorModel(baseUrl: string): SectorModel {
  const loadMetadata = loadLocalSectorMetadata(baseUrl + '/uploaded_sectors.txt');
  const loadSectorIdToFileId = loadMetadata.then(metadata => {
    const sectorIdToFileId = new Map<number, number>();
    for (const sector of metadata) {
      const bestFile = getNewestVersionedFile(sector.threedFiles);
      sectorIdToFileId.set(sector.id, bestFile.fileId);
    }
    return sectorIdToFileId;
  });
  const loadFilemap = loadLocalFileMap(baseUrl + '/uploaded_files.txt');

  const fetchMetadata: FetchSectorMetadataDelegate = async () => {
    return [buildSectorMetadata(await loadMetadata), { modelMatrix: DefaultSectorRotationMatrix }];
  };
  const fetchSector: FetchSectorDelegate = async (sectorId: number) => {
    const sectorIdToFileId = await loadSectorIdToFileId;
    const fileId = sectorIdToFileId.get(sectorId);
    if (!fileId) {
      throw new Error(`${sectorId} is not a valid sector ID`);
    }
    return fetchFile(fileId);
  };
  const fetchFile: FetchCtmDelegate = async (fileId: number) => {
    const filemap = await loadFilemap;
    const filename = filemap.get(fileId);
    if (!filename) {
      throw new Error(`Could not find filename mapping for file ${fileId})`);
    }

    const url = baseUrl + '/' + filename;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Got error ${response.status} while fetching '${url}' (${response.statusText})`);
    }

    return response.arrayBuffer();
  };
  return [fetchMetadata, fetchSector, fetchFile];
}
