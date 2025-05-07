import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BlockCount, BlockData } from '../type';

@Injectable({ providedIn: 'root' })
export class NbtDataService {
  private blockListSubject = new BehaviorSubject<BlockCount[]>([]);
  readonly blockListObs: Observable<BlockCount[]> =
    this.blockListSubject.asObservable();

  setBlockList(newBlockList: BlockCount[]) {
    this.blockListSubject.next(newBlockList);
  }

  private blockDataListSubject = new BehaviorSubject<BlockData[]>([]);
  readonly blockDataListObs: Observable<BlockData[]> =
    this.blockDataListSubject.asObservable();

  setBlockDataList(newBlockDataList: BlockData[]) {
    this.blockDataListSubject.next(newBlockDataList);
  }
}
