import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NbtDataService {
  private blockListSubject = new BehaviorSubject<unknown[]>([]); //TODO: Add typing
  readonly blockListObs: Observable<unknown[]> =
    this.blockListSubject.asObservable();

  setBlockList(blockList: unknown[]) {
    this.blockListSubject.next(blockList);
  }
}
