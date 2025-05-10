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

  protected createCommands() {
    const properties: AnimationProperties = this.propertiesList[0];
    if (!properties) {
      return;
    }
    if (properties.command.value === 'destroy') {
      console.log('TODO:');
    }

    const commandGenerated = this.buildCommands(properties);

    this.commandTextArea.nativeElement.value = commandGenerated;
  }

  /**
   * Command generator helper function
   * The function transforms the properties data into readable properties
   * @param properties
   * @returns
   */
  private buildPropertiesString(
    properties: Record<string, string>,
    isSet: boolean
  ): string {
    if (isSet) {
      const propertiesEntries = Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      return propertiesEntries ? `[${propertiesEntries}]` : '';
    }

    const propertiesEntries = Object.entries(properties)
      .map(([key, value]) => `${key}:"${value}"`)
      .join(', ');
    return propertiesEntries ? `,Properties:{${propertiesEntries}}` : '';
  }

  /**
   * Command generator helper function
   * The function transforms the transformation data based on the case (timing / not timing)
   * @param properties
   * @returns
   */
  private buildTransformation(
    coords: [number, number, number],
    isTiming: boolean,
    scaleValue: number,
    isDisplay: boolean
  ): string {
    if (!isDisplay || scaleValue === 1) {
      return '';
    }
    const [x, y, z] = coords;
    const translation = isTiming ? `[${x}f,${y}f,${z}f]` : `[0f,0f,0f]`;
    return (
      `,transformation:{` +
      `left_rotation:[0f,0f,0f,1f],` +
      `right_rotation:[0f,0f,0f,1f],` +
      `translation:${translation},` +
      `scale:[${scaleValue}f,${scaleValue}f,${scaleValue}f]}`
    );
  }

  /**
   * Command builder that will transform the settings into the commands
   * @param properties
   * @returns
   */
  private buildCommands(properties: AnimationProperties): string {
    const isSet = properties.command.value === 'set';
    const isDisplay = properties.command.value === 'display';
    const isTiming = properties.timing.value;
    const scaleValue = properties.scale.value;

    const commandGenerated: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }) => {
        const propertiesString = this.buildPropertiesString(
          property ?? {},
          isSet
        );
        x = parseFloat((x * properties.scale.value).toFixed(4));
        y = parseFloat((y * properties.scale.value).toFixed(4));
        z = parseFloat((z * properties.scale.value).toFixed(4));

        const timing = isTiming
          ? `execute if score $Dataman count matches ${Math.round(y)} run`
          : '';
        const coordinates = isTiming ? `0 0 0` : `~${x} ~${y} ~${z}`;
        const transform = this.buildTransformation(
          [x, y, z],
          isTiming,
          scaleValue,
          isDisplay
        );

        if (isSet) {
          return `${timing} setblock ${x} ${y} ${z} ${block}${propertiesString} replace`;
        }

        return (
          `${timing} summon block_display ${coordinates} {` +
          `block_state:{Name:"${block}"${propertiesString}}` +
          `${transform}` +
          `}`
        );
      }
    );

    if (properties.timing.value) {
      const maxAnimationWay = 4; //TODO: Keep track of the max
      const dataPackName = 'jeff:test';
      commandGenerated.unshift(
        'scoreboard objectives add count trigger',
        'scoreboard players add $Dataman count 0'
      );
      commandGenerated.push(
        `execute if score $Dataman count matches ..${maxAnimationWay} run scoreboard players add $Dataman count 1`,
        `execute if score $Dataman count matches ..${maxAnimationWay} run schedule function ${dataPackName} ${properties.speed.value}`,
        `execute if score $Dataman count matches ${
          maxAnimationWay + 1
        } run scoreboard players set $Dataman count 0`
      );
    }
    const commandResult = commandGenerated.join('\n');
    if (commandGenerated.length) {
      this.commandTextArea.nativeElement.value = commandResult;
    }
    console.log(commandGenerated);
    return commandResult;
  }
}
