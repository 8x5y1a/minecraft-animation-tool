import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NBTStructure } from '../types/type';

@Injectable({ providedIn: 'root' })
export class NbtDataService {
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
