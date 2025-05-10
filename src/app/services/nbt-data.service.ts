import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AnimationProperties, BlockCount, BlockData } from '../type';

@Injectable({ providedIn: 'root' })
export class NbtDataService {
  //Block list
  private blockListSubject = new BehaviorSubject<BlockCount[]>([]);
  readonly blockListObs: Observable<BlockCount[]> =
    this.blockListSubject.asObservable();
  setBlockList(newBlockList: BlockCount[]) {
    this.blockListSubject.next(newBlockList);
  }

  //Block Data List
  private blockDataListSubject = new BehaviorSubject<BlockData[]>([]);
  readonly blockDataListObs: Observable<BlockData[]> =
    this.blockDataListSubject.asObservable();
  setBlockDataList(newBlockDataList: BlockData[]) {
    this.blockDataListSubject.next(newBlockDataList);
  }

  //Properties list
  private propertiesListSubject = new BehaviorSubject<AnimationProperties[]>(
    []
  );
  readonly propertiesListObs: Observable<AnimationProperties[]> =
    this.propertiesListSubject.asObservable();
  setPropertiesList(newPropertiesList: AnimationProperties[]) {
    this.propertiesListSubject.next(newPropertiesList);
  }
}
