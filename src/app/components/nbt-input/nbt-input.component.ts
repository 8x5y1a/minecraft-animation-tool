import {
  Component,
  ElementRef,
  signal,
  ViewChild,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NBT, parse, simplify } from 'prismarine-nbt';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import {
  BlockCount,
  BlockData,
  Coordinates,
  NBTStructure,
  ParsedBlockPosition,
  ParsedStructure,
} from 'src/app/types/type';
import { StepsComponent } from '../steps/steps.component';
import { PreferenceService } from 'src/app/services/preference.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-nbt-input',
  imports: [
    MatButtonModule,
    MatIconModule,
    StepsComponent,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './nbt-input.component.html',
  styleUrl: './nbt-input.component.css',
  standalone: true,
})
export class NbtInputComponent {
  private nbtDataService = inject(NbtDataService);
  protected preferenceService = inject(PreferenceService);

  @ViewChild('fileInput', { static: false })
  protected fileInputRef!: ElementRef<HTMLInputElement>;
  protected nbtList: NBT[] = [];
  protected isLoading = signal(false);
  protected isFullGuideVideo: FormControl<boolean> = new FormControl(false, {
    nonNullable: true,
  });

  protected async onFileInput(event: Event): Promise<void> {
    this.isLoading.set(true);
    const files = (event.target as HTMLInputElement).files;
    if (!files) {
      console.error('The files are undefined');
      return;
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        this.readNBTData(file);
      }
    }
  }

  private transformProperty(
    propertyNbt: any
  ): Record<string, string> | undefined {
    if (!propertyNbt) {
      return undefined;
    }
    const propertyTransformed: Record<string, string> = {};
    Object.keys(propertyNbt).forEach((key) => {
      propertyTransformed[key] = propertyNbt[key];
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

  private async readNBTData(file: File) {
    // Reading file and parsing file
    const bufferArray = await file.arrayBuffer();
    const nbtResult = await parse(Buffer.from(bufferArray)).finally(() => {
      this.isLoading.set(false);
    });
    console.log(nbtResult);
    const simplifiedNbt = simplify(nbtResult.parsed);
    console.log(simplifiedNbt);
    if (!simplifiedNbt) {
      console.error('nbt failed to parse');
      return;
    }
    //TODO: here we can check if the nbt is already there (with equal(nbt1, nbt2))

    let parsedStructure: ParsedStructure | undefined = undefined;
    if (file.name.endsWith('.nbt')) {
      parsedStructure = {
        blockPostition: simplifiedNbt.blocks,
        size: {
          x: simplifiedNbt.size[0],
          y: simplifiedNbt.size[1],
          z: simplifiedNbt.size[2],
        },
        palette: simplifiedNbt.palette,
        origin: { x: 0, y: 0, z: 0 },
      };
    } else if (file.name.endsWith('.litematic')) {
      const structureName = simplifiedNbt.Metadata.Name;
      const blockPos = this.decodeLitematicStructure(
        simplifiedNbt.Regions[structureName],
        simplifiedNbt.Regions[structureName].BlockStatePalette
      );
      console.log(blockPos);
      parsedStructure = {
        blockPostition: blockPos,
        size: simplifiedNbt.Regions[structureName].Size,
        palette: simplifiedNbt.Regions[structureName].BlockStatePalette,
        origin: simplifiedNbt.Position ?? { x: 0, y: 0, z: 0 },
      };
    }
    if (!parsedStructure) {
      return;
    }

    const { blockPostition, size, palette, origin } = parsedStructure;
    const blockNameList: string[] = palette.map((block: any) => block.Name);
    console.log(blockPostition);

    const maxAxis: Coordinates = {
      x: -200,
      y: -200,
      z: -200,
    };

    const blockCountDict: Record<string, number> = {};
    const blockDataList: BlockData[] = [];
    const coordinateAndBlock: string[] = [];

    blockPostition.forEach((data: any) => {
      const block = blockNameList[data.state];
      const [x, y, z] = data.pos;

      if (this.preferenceService.autoRemoveAir && block === 'minecraft:air') {
        return;
      }
      coordinateAndBlock.push(
        `${x} ${y} ${z}: ${this.nbtDataService.formatMinecraftName(block)}`
      );
      if (!palette[data.state]) {
        console.warn(`Block state ${data.state} not found in palette`);
        return;
      }
      blockDataList.push({
        block: block,
        property: this.transformProperty(palette[data.state]?.Properties),
        position: { x: x, y: y, z: z },
        icon: `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.5/assets/minecraft/textures/block/${block.replace(
          'minecraft:',
          ''
        )}.png`,
      });
      blockCountDict[block] = (blockCountDict[block] ?? 0) + 1;

      maxAxis.x = Math.max(maxAxis.x, x);
      maxAxis.y = Math.max(maxAxis.y, y);
      maxAxis.z = Math.max(maxAxis.z, z);
    });

    const blockCountList: BlockCount[] = Object.entries(blockCountDict).map(
      ([block, count]) => ({
        block,
        count,
        icon: `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.5/assets/minecraft/textures/block/${block.replace(
          'minecraft:',
          ''
        )}.png`,
      })
    );

    const cleanName = this.cleanFunctionName(file.name.replace(/\.nbt$/, ''));
    const structure: NBTStructure = {
      name: cleanName,
      blockData: blockDataList,
      blockCount: blockCountList,
      CoordinateAndBlock: coordinateAndBlock,
      animationProperties: [],
      maxAxis: maxAxis,
      structureSize: size,
    };
    this.nbtDataService.addNBTStructure(structure);
    this.nbtList.push(nbtResult.parsed);
  }

  /* Helper Function used to decode litematic structures */
  private readPackedBitsArray(
    data: bigint[],
    bitsPerBlock: number,
    blockCount: number
  ): number[] {
    const result: number[] = new Array(blockCount);
    const mask = (1n << BigInt(bitsPerBlock)) - 1n;

    let bitIndex = 0;

    for (let i = 0; i < blockCount; i++) {
      const longIndex = Math.floor(bitIndex / 64);
      const bitOffset = bitIndex % 64;

      const current = data[longIndex];
      const next = data[longIndex + 1] ?? 0n;

      const combined = (next << 64n) | current;
      const value = Number((combined >> BigInt(bitOffset)) & mask);

      result[i] = value;
      bitIndex += bitsPerBlock;
    }

    return result;
  }

  /* Function used to decode litematic structures */
  private decodeLitematicStructure(
    region: any,
    palette: any
  ): ParsedBlockPosition[] {
    console.log(region.Size);
    const [sizeX, sizeY, sizeZ] = [region.Size.x, region.Size.y, region.Size.z];
    const [originX, originY, originZ] = [
      region.Position.x,
      region.Position.y,
      region.Position.z,
    ];
    const totalBlocks = sizeX * sizeY * sizeZ;

    const blockStatesRaw = region.BlockStates as bigint[];
    const bitsPerBlock = Math.max(2, Math.ceil(Math.log2(palette.length)));

    const stateArray = this.readPackedBitsArray(
      blockStatesRaw,
      bitsPerBlock,
      totalBlocks
    );

    const result: ParsedBlockPosition[] = new Array(totalBlocks);

    for (let i = 0; i < totalBlocks; i++) {
      const x = i % sizeX;
      const z = Math.floor(i / sizeX) % sizeZ;
      const y = Math.floor(i / (sizeX * sizeZ));

      result[i] = {
        pos: [originX + x, originY + y, originZ + z],
        state: stateArray[i],
      };
    }

    return result;
  }
}
