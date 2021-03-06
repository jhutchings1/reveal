/*!
 * Copyright 2020 Cognite AS
 */

import * as Comlink from 'comlink';
import { ParserWorker } from './parser.worker';
// IMPORTANT NOTE! The path to the ParserWorker needs to be the same in the new Worker constructor

type WorkDelegate<T> = (worker: ParserWorker) => Promise<T>;

interface PooledWorker {
  // The worker returned by Comlink.wrap is not strictly speaking a ParserWorker,
  // but it should expose the same functions
  worker: ParserWorker;
  activeJobCount: number;
  messageIdCounter: number;
}

export class WorkerPool {
  static get defaultPool(): WorkerPool {
    WorkerPool._defaultPool = WorkerPool._defaultPool || new WorkerPool();
    return WorkerPool._defaultPool;
  }

  private static _defaultPool: WorkerPool | undefined;

  private readonly workerList: PooledWorker[] = [];

  constructor() {
    const numberOfWorkers = this.determineNumberOfWorkers();

    for (let i = 0; i < numberOfWorkers; i++) {
      const newWorker = {
        // NOTE: As of Comlink 4.2.0 we need to go through unknown before ParserWorker
        // Please feel free to remove `as unknown` if possible.
        worker: (Comlink.wrap(
          new Worker('./parser.worker', { name: 'parser', type: 'module' })
        ) as unknown) as ParserWorker,
        activeJobCount: 0,
        messageIdCounter: 0
      };
      this.workerList.push(newWorker);
    }
  }

  async postWorkToAvailable<T>(work: WorkDelegate<T>): Promise<T> {
    let targetWorker = this.workerList[0];
    for (const worker of this.workerList) {
      if (worker.activeJobCount < targetWorker.activeJobCount) {
        targetWorker = worker;
      }
    }
    targetWorker.activeJobCount += 1;
    const result = await work(targetWorker.worker);
    targetWorker.activeJobCount -= 1;
    return result;
  }

  // TODO j-bjorne 16-04-2020: Send in constructor instead
  private determineNumberOfWorkers() {
    // Use between 2-4 workers, depending on hardware
    return Math.max(2, Math.min(4, window.navigator.hardwareConcurrency || 2));
  }
}
