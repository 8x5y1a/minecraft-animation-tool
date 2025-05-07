import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlockCount, BlockData } from 'src/app/type';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-block-display',
  imports: [CommonModule, MatListModule, MatButtonModule],
  templateUrl: './block-display.component.html',
  styleUrl: './block-display.component.css',
})
export class BlockDisplayComponent {
  protected blockList: BlockCount[] = [];
  protected blockDataList: BlockData[] = [];
  private command = 'setblock';
  protected hasCommand = false;

  @ViewChild('commandTextArea')
  commandTextArea!: ElementRef<HTMLTextAreaElement>;

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockList: BlockCount[]) => {
        this.blockList = newBlockList;
      });

    this.nbtDataService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockDataList: BlockData[]) => {
        this.blockDataList = newBlockDataList;
      });
  }

  //Curently only does setblock
  protected createCommands(): void {
    const commands: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }) => {
        const entries = Object.entries(property ?? {})
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');

        return `${this.command} ~${x} ~${y} ~${z} ${block}[${entries}] replace`;
      }
    );
    if (commands.length) {
      this.commandTextArea.nativeElement.value = commands.join('\n');
    }

    console.log(commands);
  }
}
