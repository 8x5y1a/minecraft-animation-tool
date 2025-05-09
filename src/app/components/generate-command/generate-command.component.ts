import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockData } from 'src/app/type';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-generate-command',
  imports: [CommonModule, MatButtonModule],
  templateUrl: './generate-command.component.html',
  styleUrl: './generate-command.component.css',
})
export class GenerateCommandComponent {
  @ViewChild('commandTextArea')
  private commandTextArea!: ElementRef<HTMLTextAreaElement>;
  protected blockDataList: BlockData[] = [];
  //TODO: Temporary input to make code work:
  private scaleInput = new FormControl(1, {nonNullable: true})

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockDataList: BlockData[]) => {
        this.blockDataList = newBlockDataList;
      });
    
   // this.nbtDataService.animationSettings.pipe(takeUntilDestroyed) //TODO:
  }

  //TODO: Create a strong builder that will don't require switch case what's over
  protected createCommands() {
    let command = 'set' //TODO: Temporary
    let commandGenerated = '';
    switch (command) {
      case 'set': {
        commandGenerated = this.setBlock();
        break;
      }
      case 'display': {
        commandGenerated = this.scaleCommand();
        break;
      }
      default: {
        break;
      }
    }
    this.commandTextArea.nativeElement.value = commandGenerated;
  }

  private setBlock(): string {
    const commandGenerated: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }) => {
        const entries = Object.entries(property ?? {})
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');

        return `setblock ~${x} ~${y} ~${z} ${block}[${entries}] replace`;
      }
    );
    if (commandGenerated.length) {
      this.commandTextArea.nativeElement.value = commandGenerated.join('\n');
    }

    console.log(commandGenerated);
    return commandGenerated.join('\n');
  }

  private scaleCommand(): string {
    const commandGenerated: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }) => {
        const entries = Object.entries(property ?? {})
          .map(([k, v]) => `${k}:"${v}"`)
          .join(', ');

        let properties = '';
        if (entries) {
          properties = `,Properties:{${entries}}`;
        }

        let scale = '';
        if (this.scaleInput.value !== 1) {
          scale = `,transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[${this.scaleInput.value}f,${this.scaleInput.value}f,${this.scaleInput.value}f]}`;

          x = parseFloat((x * this.scaleInput.value).toFixed(4));
          y = parseFloat((y * this.scaleInput.value).toFixed(4));
          z = parseFloat((z * this.scaleInput.value).toFixed(4));
        }

        return (
          `summon block_display ~${x} ~${y} ~${z} {block_state:{Name:"${
            block + '"' + properties
          }}` +
          scale +
          `}`
        );
      }
    );
    if (commandGenerated.length) {
      this.commandTextArea.nativeElement.value = commandGenerated.join('\n');
    }

    console.log(commandGenerated);
    return commandGenerated.join('\n');
  }
}
