import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NBT, parse } from 'prismarine-nbt';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { BlockCount, BlockData, Coordinates } from 'src/app/types/type';
import { StepsComponent } from '../steps/steps.component';
import { PreferenceService } from 'src/app/services/preference.service';
@Component({
  selector: 'app-nbt-input',
  imports: [CommonModule, MatButtonModule, MatIconModule, StepsComponent],
  templateUrl: './nbt-input.component.html',
  styleUrl: './nbt-input.component.css',
  standalone: true,
})
export class NbtInputComponent {
  @ViewChild('fileInput', { static: false })
  protected fileInputRef!: ElementRef<HTMLInputElement>;
  protected nbtList: NBT[] = [];

  private maxAxis: Coordinates = {
    x: -200,
    y: -200,
    z: -200,
  };

  constructor(
    private nbtDataService: NbtDataService,
    protected preferenceService: PreferenceService
  ) {}

  protected async onFileInput(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    // Reading file and parsing file
    const bufferArray = await file.arrayBuffer();
    const buffer = Buffer.from(bufferArray);
    const nbtResult = await parse(buffer);

    if (!nbtResult.parsed) {
      return;
    }
    this.nbtList.push(nbtResult.parsed);

    const blockData = nbtResult.parsed.value['blocks'];
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

    const nbtPosData = blockData.value.value;
    const blockCountDict: Record<string, number> = {};
    const blockDataList: BlockData[] = [];

    nbtPosData.forEach((data: any) => {
      const block = blockNameList[data.state.value];
      const [x, y, z] = data.pos.value.value;

      blockDataList.push({
        block: block,
        property: this.transformProperty(
          palette.value[data.state.value].Properties
        ),
        position: { x: x, y: y, z: z },
      });
      blockCountDict[block] = (blockCountDict[block] ?? 0) + 1;

      this.maxAxis.x = Math.max(this.maxAxis.x, x);
      this.maxAxis.y = Math.max(this.maxAxis.y, y);
      this.maxAxis.z = Math.max(this.maxAxis.z, z);
    });

    this.nbtDataService.setMaxAxis(this.maxAxis);

    const blockCountList: BlockCount[] = Object.entries(blockCountDict).map(
      ([block, count]) => ({ block, count })
    );

    this.nbtDataService.setBlockList(blockCountList);
    this.nbtDataService.setBlockDataList(blockDataList);
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
}
