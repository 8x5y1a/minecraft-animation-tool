import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { parse } from 'prismarine-nbt';
import { NbtDataService } from 'src/app/services/nbt-data.service';

@Component({
  selector: 'app-nbt-input',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './nbt-input.component.html',
  styleUrl: './nbt-input.component.css',
})
export class NbtInputComponent {
  constructor(private nbtDataService: NbtDataService) {}

  @ViewChild('fileInput', { static: false })
  protected fileInputRef!: ElementRef<HTMLInputElement>;
  private filteredBlockList: any[] = []; //TODO: Add typing

  protected async onFileInput(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }

    // Reading file and parsing file
    const bufferArray = await file.arrayBuffer();
    const buffer = Buffer.from(bufferArray);
    const data = await parse(buffer);
    console.log(data);

    const blockData = data.parsed.value['blocks'];
    const palette: any = data.parsed.value['palette'];
    console.log(palette?.value.value);
    const blockNameList = palette?.value.value.map((id: any) => id.Name.value);
    console.log(blockNameList);
    this.nbtDataService.setBlockList(blockNameList);

    // Verifying data is correctly parsed // Valid nbt for
    if (
      !blockData ||
      blockData.type !== 'list' ||
      !blockData.value.value.length
    ) {
      console.error('The data wasnt parsed correctly');
      return;
    }

    const blockList = blockData.value.value;
    //Filter all air block
    this.filteredBlockList = blockList.filter((block: any) => {
      //TODO: Add type for block
      return block.state.value !== 0;
    });
    console.log(this.filteredBlockList);
  }
}
