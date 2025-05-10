import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationProperties, BlockData } from 'src/app/type';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private propertiesList: AnimationProperties[] = [];

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockDataList: BlockData[]) => {
        this.blockDataList = newBlockDataList;
      });

    this.nbtDataService.propertiesListObs
      .pipe(takeUntilDestroyed())
      .subscribe((propertiesList: AnimationProperties[]) => {
        this.propertiesList = propertiesList;
      });
  }

  //TODO: Create a strong builder that will don't require switch case what's over
  protected createCommands() {
    const properties: AnimationProperties = this.propertiesList[0];
    if (!properties) {
      return;
    }

    console.log(properties);
    let commandGenerated = '';
    switch (properties.command.value) {
      case 'set': {
        commandGenerated = this.setBlock(properties);
        break;
      }
      case 'display': {
        commandGenerated = this.scaleCommand(properties);
        break;
      }
      default: {
        break;
      }
    }
    this.commandTextArea.nativeElement.value = commandGenerated;
  }

  private setBlock(properties: AnimationProperties): string {
    console.log(properties);
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

  private scaleCommand(properties: AnimationProperties): string {
    const commandGenerated: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }) => {
        const entries = Object.entries(property ?? {})
          .map(([k, v]) => `${k}:"${v}"`)
          .join(', ');

        let propertieString = '';
        if (entries) {
          propertieString = `,Properties:{${entries}}`;
        }

        let scale = '';
        if (properties.scale.value !== 1) {
          scale = `,transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[${properties.scale.value}f,${properties.scale.value}f,${properties.scale.value}f]}`;

          x = parseFloat((x * properties.scale.value).toFixed(4));
          y = parseFloat((y * properties.scale.value).toFixed(4));
          z = parseFloat((z * properties.scale.value).toFixed(4));
        }

        return (
          `summon block_display ~${x} ~${y} ~${z} {block_state:{Name:"${
            block + '"' + propertieString
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
