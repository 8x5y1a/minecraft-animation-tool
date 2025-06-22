import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NBTStructure } from '../types/type';
import { NBT } from 'prismarine-nbt';

@Injectable({ providedIn: 'root' })
export class NbtDataService {
  //NBT Structures
  private nbtStructureSubject = new BehaviorSubject<NBTStructure[]>([]);
  readonly nbtStructureObs: Observable<NBTStructure[]> =
    this.nbtStructureSubject.asObservable();
  public addNBTStructure(structure: NBTStructure) {
    const currentList = this.nbtStructureSubject.getValue();
    const updatedList = [...currentList, structure];
    this.nbtStructureSubject.next(updatedList);
  }
  public overrideNBTStructure(structureList: NBTStructure[]) {
    this.nbtStructureSubject.next(structureList);
  }

  public getFunctionName(
    structureName: string,
    command: string,
    structureList: NBTStructure[],
    templateName: string | undefined = undefined
  ): string {
    const usedNames = new Set<string>();
    for (const structure of structureList) {
      if (structure.name !== structureName) continue;

      for (const prop of structure.animationProperties) {
        if (
          prop.name.startsWith(structureName + '_' + command) ||
          (templateName &&
            prop.name.startsWith(templateName + '_' + structureName))
        ) {
          usedNames.add(prop.name);
        }
      }
    }

    let index = 1;
    let newName = templateName
      ? `${templateName}_${structureName}_${command}_${index}`
      : `${structureName}_${command}_${index}`;

    while (usedNames.has(newName)) {
      index++;
      newName = templateName
        ? `${templateName}_${structureName}_${command}_${index}`
        : `${structureName}_${command}_${index}`;
    }

    return newName;
  }

  public formatMinecraftName(input: string): string {
    if (!input) {
      return '';
    }
    const key = input.includes(':') ? input.split(':').pop() : input;
    const spaced = key?.replace(/_/g, ' ');
    return spaced?.replace(/\b\w/g, (char) => char.toUpperCase()) ?? '';
  }

  public nbtList: NBT[] = [];
}
