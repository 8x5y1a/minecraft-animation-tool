import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  AnimationProperties,
  BlockCount,
  BlockData,
  Coordinates,
  NBTStructure,
} from '../types/type';

@Injectable({ providedIn: 'root' })
export class NbtDataService {
  //TODO: Cleanup all of these
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
  private maxAxisSubject = new BehaviorSubject<Coordinates>({
    x: 0,
    y: 0,
    z: 0,
  });
  readonly maxAxistObs: Observable<Coordinates> =
    this.maxAxisSubject.asObservable();
  setMaxAxis(newMaxAxis: Coordinates) {
    this.maxAxisSubject.next(newMaxAxis);
  }

  //Structure size
  private structureSizeSubject = new BehaviorSubject<Coordinates>({
    x: 0,
    y: 0,
    z: 0,
  });
  readonly structureSizeObs: Observable<Coordinates> =
    this.structureSizeSubject.asObservable();
  setStructureSize(structureSize: Coordinates) {
    this.structureSizeSubject.next(structureSize);
  }

  //NBT Structures
  private nbtStructureSubject = new BehaviorSubject<NBTStructure[]>([]);
  readonly nbtStructureObs: Observable<NBTStructure[]> =
    this.nbtStructureSubject.asObservable();
  addNBTStructure(structure: NBTStructure) {
    const currentList = this.nbtStructureSubject.getValue();
    const updatedList = [...currentList, structure];
    this.nbtStructureSubject.next(updatedList);
  }
  overrideNBTStructure(structureList: NBTStructure[]) {
    this.nbtStructureSubject.next(structureList);
  }

  public getFunctionName(
    baseName: string,
    command: string,
    structureList: NBTStructure[]
  ): string {
    const namePrefix = baseName.split('_')[0];

    const usedNames = new Set<string>();

    for (const structure of structureList) {
      if (structure.name !== namePrefix) continue;

      for (const prop of structure.animationProperties) {
        const propName = prop.name;
        if (propName.startsWith(namePrefix + '_' + command)) {
          usedNames.add(propName);
        }
      }
    }

    let index = 1;
    let candidateName = `${namePrefix}_${command}_${index}`;
    while (usedNames.has(candidateName)) {
      index++;
      candidateName = `${namePrefix}_${command}_${index}`;
    }

    return candidateName;
  }
}
