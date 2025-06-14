import { Component, ElementRef, signal, ViewChild } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NBT, parse } from 'prismarine-nbt';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import {
  BlockCount,
  BlockData,
  Coordinates,
  NBTStructure,
} from 'src/app/types/type';
import { StepsComponent } from '../steps/steps.component';
import { PreferenceService } from 'src/app/services/preference.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-nbt-input',
  imports: [
    MatButtonModule,
    MatIconModule,
    StepsComponent,
    MatTooltip,
    MatProgressSpinnerModule
],
  templateUrl: './nbt-input.component.html',
  styleUrl: './nbt-input.component.css',
  standalone: true,
})
export class NbtInputComponent {
  @ViewChild('fileInput', { static: false })
  protected fileInputRef!: ElementRef<HTMLInputElement>;
  protected nbtList: NBT[] = [];
  protected isLoading = signal(false);

  constructor(
    private nbtDataService: NbtDataService,
    protected preferenceService: PreferenceService
  ) {}

  protected async onFileInput(event: Event): Promise<void> {
    this.isLoading.set(true);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    // Reading file and parsing file
    const bufferArray = await file.arrayBuffer();
    const buffer = Buffer.from(bufferArray);
    const nbtResult = await parse(buffer).finally(() => {
      this.isLoading.set(false);
    });

    if (!nbtResult.parsed) {
      return;
    }
    this.nbtList.push(nbtResult.parsed);

    const blockData = nbtResult.parsed.value['blocks'];
    const structureSize: any = nbtResult.parsed.value['size']?.value;
    const palette: any = nbtResult.parsed.value['palette']?.value;
    const blockNameList: string[] = palette?.value.map(
      (id: any) => id.Name.value
    );

    // Verifying data is correctly parsed // Valid nbt for
    if (
      !blockData ||
      blockData.type !== 'list' ||
      !blockData.value.value.length
    ) {
      console.error('The data wasnt parsed correctly');
      return;
    }

    const maxAxis: Coordinates = {
      x: -200,
      y: -200,
      z: -200,
    };

    const nbtPosData = blockData.value.value;
    const blockCountDict: Record<string, number> = {};
    const blockDataList: BlockData[] = [];
    const coordinateAndBlock: string[] = [];

    nbtPosData.forEach((data: any) => {
      const block = blockNameList[data.state.value];
      const [x, y, z] = data.pos.value.value;

      if (this.preferenceService.autoRemoveAir && block === 'minecraft:air') {
        return;
      }

      coordinateAndBlock.push(
        `${x} ${y} ${z}: ${this.nbtDataService.formatMinecraftName(block)}`
      );
      blockDataList.push({
        block: block,
        property: this.transformProperty(
          palette.value[data.state.value].Properties
        ),
        position: { x: x, y: y, z: z },
      });
      blockCountDict[block] = (blockCountDict[block] ?? 0) + 1;

      maxAxis.x = Math.max(maxAxis.x, x);
      maxAxis.y = Math.max(maxAxis.y, y);
      maxAxis.z = Math.max(maxAxis.z, z);
    });

    const structureSizeCoor: Coordinates = {
      x: structureSize.value[0],
      y: structureSize.value[1],
      z: structureSize.value[2],
    };

    const blockCountList: BlockCount[] = Object.entries(blockCountDict).map(
      ([block, count]) => ({ block, count })
    );

    const cleanName = this.cleanFunctionName(file.name.replace(/\.nbt$/, ''));
    const structure: NBTStructure = {
      name: cleanName,
      blockData: blockDataList,
      blockCount: blockCountList,
      CoordinateAndBlock: coordinateAndBlock,
      animationProperties: [],
      maxAxis: maxAxis,
      structureSize: structureSizeCoor,
    };
    this.nbtDataService.addNBTStructure(structure);
  }

  private transformProperty(
    propertyNbt: any
  ): Record<string, string> | undefined {
    if (!propertyNbt) {
      return undefined;
    }
    const propertyTransformed: Record<string, string> = {};
    Object.keys(propertyNbt.value).forEach((key) => {
      propertyTransformed[key] = propertyNbt.value[key].value;
    });

    return propertyTransformed;
  }

  private cleanFunctionName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_');
  }
}
