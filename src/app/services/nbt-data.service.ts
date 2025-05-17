import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  AnimationProperties,
  BlockCount,
  BlockData,
  Coordinates,
} from '../types/type';

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

  public filterBlocDataList(blockList: BlockCount[]) {
    const blockListSet = new Set(blockList.map((block) => block.block));
    const filtered = this.blockDataListSubject
      .getValue()
      .filter((blockData) => blockListSet.has(blockData.block));

    this.blockDataListSubject.next(filtered);
  }

  //Max Axis
  private maxAxisSubject = new BehaviorSubject<Coordinates>(
    {x: 0, y: 0, z:0}
  );
  readonly maxAxistObs: Observable<Coordinates> =
    this.maxAxisSubject.asObservable();
  setMaxAxis(newMaxAxis: Coordinates) {
    this.maxAxisSubject.next(newMaxAxis);
  }
}
