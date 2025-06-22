import {
  Component,
  ElementRef,
  signal,
  ViewChild,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { equal, NBT, parse, simplify } from 'prismarine-nbt';
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
/**
 * NbtInputComponent handles the input, parsing, and processing of NBT and Litematic files,
 * providing methods to read, validate, and transform Minecraft structure data for use in the application.
 * It interacts with NbtDataService to store and manage parsed structures and supports user preferences.
 */
export class NbtInputComponent {
  protected nbtDataService = inject(NbtDataService);
  protected preferenceService = inject(PreferenceService);

  @ViewChild('fileInput', { static: false })
  protected fileInputRef!: ElementRef<HTMLInputElement>;
  protected isLoading = signal(false);
  protected isFullGuideVideo: FormControl<boolean> = new FormControl(false, {
    nonNullable: true,
  });

  protected async onFileInput(event: Event): Promise<void> {
    this.isLoading.set(true);
    const files = (event.target as HTMLInputElement).files;
    if (!files) {
      console.error('The files are undefined');
      this.isLoading.set(false);
      return;
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        await this.readNBTData(file);
      }
    }
  }

  /** Transform properties into readable and easily managable data  */
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

  /**
   * Reads and parses NBT data from a file, checking for duplicates and building a structure.
   * If the structure is valid and not a duplicate, it adds it to the NBT data service.
   * @param file The file containing NBT data.
   */
  private async readNBTData(file: File) {
    this.isLoading.set(true);
    let parsedNBT: NBT | undefined = undefined;
    try {
      const buffer = await file.arrayBuffer();
      parsedNBT = (await parse(Buffer.from(buffer))).parsed;
    } catch (error) {
      console.error('Failed to parse NBT file:', error);
      this.isLoading.set(false);
    }
    if (!parsedNBT) return;

    if (this.isDuplicate(parsedNBT)) {
      console.warn('NBT structure already exists');
      this.isLoading.set(false);
      return;
    }

    const structure = this.buildStructure(file, parsedNBT);
    if (!structure) return;

    this.nbtDataService.addNBTStructure(structure);
    this.nbtDataService.nbtList.push(parsedNBT);
    this.isLoading.set(false);
  }

  private isDuplicate(nbt: NBT): boolean {
    return this.nbtDataService.nbtList.some((existing) => equal(nbt, existing));
  }

  private buildStructure(file: File, parsedNBT: NBT): NBTStructure | undefined {
    const simplifiedNbt = simplify(parsedNBT);
    const parsed = this.parseStructureByType(file.name, simplifiedNbt);
    if (!parsed) return;

    const blockNameList = parsed.palette.map((block: any) => block.Name);
    const { blockDataList, blockCountDict, coordinateAndBlock, maxAxis } =
      this.processBlocks(parsed.blockPostition, blockNameList, parsed.palette);

    const blockCountList = this.buildBlockCountList(blockCountDict);
    const cleanName = this.cleanFunctionName(
      file.name.replace(/\.(nbt|litematic)$/, '')
    );

    return {
      name: cleanName,
      blockData: blockDataList,
      blockCount: blockCountList,
      CoordinateAndBlock: coordinateAndBlock,
      animationProperties: [],
      maxAxis: maxAxis,
      structureSize: parsed.size,
    };
  }

  private parseStructureByType(
    fileName: string,
    simplifiedNbt: any
  ): ParsedStructure | undefined {
    if (fileName.endsWith('.nbt')) {
      return {
        blockPostition: simplifiedNbt.blocks,
        size: {
          x: simplifiedNbt.size[0],
          y: simplifiedNbt.size[1],
          z: simplifiedNbt.size[2],
        },
        palette: simplifiedNbt.palette,
        origin: { x: 0, y: 0, z: 0 },
      };
    } else if (fileName.endsWith('.litematic')) {
      const name = simplifiedNbt.Metadata?.Name;
      if (!name || !simplifiedNbt.Regions?.[name]) return;
      return {
        blockPostition: this.decodeLitematicStructure(
          simplifiedNbt.Regions[name],
          simplifiedNbt.Regions[name].BlockStatePalette
        ),
        size: simplifiedNbt.Regions[name].Size,
        palette: simplifiedNbt.Regions[name].BlockStatePalette,
        origin: simplifiedNbt.Position ?? { x: 0, y: 0, z: 0 },
      };
    }
    return;
  }

  /**
   * Processes the blocks from the parsed structure, extracting block data,
   * counting occurrences, and determining the maximum axis values.
   */
  private processBlocks(
    positions: any[],
    blockNameList: string[],
    palette: any[]
  ) {
    const coordinateAndBlock: string[] = [];
    const blockDataList: BlockData[] = [];
    const blockCountDict: Record<string, number> = {};
    const maxAxis: Coordinates = { x: -Infinity, y: -Infinity, z: -Infinity };

    positions.forEach((data: any) => {
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
        block,
        property: this.transformProperty(palette[data.state]?.Properties),
        position: { x, y, z },
        icon: this.getIconUrl(block),
      });

      blockCountDict[block] = (blockCountDict[block] ?? 0) + 1;

      maxAxis.x = Math.max(maxAxis.x, x);
      maxAxis.y = Math.max(maxAxis.y, y);
      maxAxis.z = Math.max(maxAxis.z, z);
    });

    return { blockDataList, blockCountDict, coordinateAndBlock, maxAxis };
  }

  private buildBlockCountList(dict: Record<string, number>): BlockCount[] {
    return Object.entries(dict).map(([block, count]) => ({
      block,
      count,
      icon: this.getIconUrl(block),
    }));
  }

  private getIconUrl(block: string): string {
    return `https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21.5/assets/minecraft/textures/block/${block.replace(
      'minecraft:',
      ''
    )}.png`;
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
