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
    const isDestroy: boolean = baseName.startsWith('destroy');
    const namePrefix = isDestroy
      ? baseName.split('_').slice(1).join('_')
      : baseName.split('_')[0];

    const usedNames = new Set<string>();

    for (const structure of structureList) {
      if (
        structure.name !== namePrefix &&
        structure.name !== baseName.split('_')[1]
      )
        continue;

      for (const prop of structure.animationProperties) {
        const propName = prop.name;
        if (
          propName.startsWith(namePrefix + '_' + command) ||
          prop.name.startsWith('destroy_' + namePrefix)
        ) {
          usedNames.add(propName);
        }
      }
    }

    let index = 1;
    let candidateName = isDestroy
      ? `${baseName}_${index}`
      : `${namePrefix}_${command}_${index}`;
    while (usedNames.has(candidateName)) {
      index++;
      candidateName = isDestroy
        ? `${baseName}_${index}`
        : `${namePrefix}_${command}_${index}`;
    }

    return candidateName;
  }
}
