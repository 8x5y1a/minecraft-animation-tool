import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BlockCount } from '../type';

@Injectable({ providedIn: 'root' })
export class NbtDataService {
  private blockListSubject = new BehaviorSubject<BlockCount[]>([]);
  readonly blockListObs: Observable<BlockCount[]> =
    this.blockListSubject.asObservable();

  setBlockList(blockList: BlockCount[]) {
    this.blockListSubject.next(blockList);
  }
}
