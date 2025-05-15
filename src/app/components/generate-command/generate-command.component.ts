import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimationProperties, BlockData } from 'src/app/types/type';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ZipService } from 'src/app/services/zip.service';
import { pack } from 'src/app/types/datapack-format';

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

  constructor(
    private nbtDataService: NbtDataService,
    private zipService: ZipService
  ) {
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
    if (!isDisplay) {
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

  private transformCoordinates(
    blockCoordinate: number,
    coordinate: number,
    scale: number
  ): number {
    return parseFloat(((blockCoordinate + coordinate) * scale).toFixed(4));
  }

  /**
   * TODO: When timing is on, we need 2 mcfunction.
   * 1 That does execute:
   *       positioned x y z function ...
   * A second that does:
   *       call the builder function
   *
   * So maybe implement this when we start writing the files for the datapack
   * Could call this application Data pack generator.. but that might not be very accurate since it's only building animation
   */

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

    let maxAnimationWay = -1000;
    const commandGenerated: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }, index) => {
        const propertiesString = this.buildPropertiesString(
          property ?? {},
          isSet
        );
        x = this.transformCoordinates(x, properties.x.value, scaleValue);
        y = this.transformCoordinates(y, properties.y.value, scaleValue);
        z = this.transformCoordinates(z, properties.z.value, scaleValue);
        if (properties.command.value !== 'destroy') {
          properties.coordinateList.push({ x: x, y: y, z: z });
        }

        //TODO: Probably make a function for max animation way
        const relativeY = y - properties.y.value;
        if (relativeY > maxAnimationWay) {
          maxAnimationWay = relativeY;
        }

        const timing = isTiming
          ? `execute if score $Dataman count matches ${Math.abs(
              Math.round(relativeY)
            )} run`
          : '';
        const coordinates = isTiming ? `0 0 0` : `~${x} ~${y} ~${z}`;
        const transform = this.buildTransformation(
          [x, y, z],
          isTiming,
          scaleValue,
          isDisplay
        );

        switch (properties.command.value) {
          case 'set': {
            return `${timing} setblock ${x} ${y} ${z} ${block}${propertiesString} keep`;
          }
          case 'display': {
            const tags = `,Tags:["${x}-${y}-${z}"]`;

            return (
              `${timing} summon block_display ${coordinates} {` +
              `block_state:{Name:"${block}"${propertiesString}}` +
              `${transform}${tags}` +
              `}`
            );
          }
          case 'destroy': {
            const animToDel = this.propertiesList.filter(
              (anim) => anim.name === properties.removeAnimation.value?.name
            )[0];

            const coordinatesToDel = animToDel?.coordinateList[index];

            if (animToDel.command.value === 'set') {
              return `${timing} setblock ${coordinatesToDel.x} ${coordinatesToDel.y} ${coordinatesToDel.z} minecraft:air`;
            }

            return `${timing} kill @e[tag=${coordinatesToDel.x}-${coordinatesToDel.y}-${coordinatesToDel.z}]`;
          }
        }
      }
    );

    if (properties.timing.value) {
      commandGenerated.unshift(
        'scoreboard objectives add count trigger',
        'scoreboard players add $Dataman count 0'
      );
      commandGenerated.push(
        `execute if score $Dataman count matches ..${maxAnimationWay} run scoreboard players add $Dataman count 1`,
        `execute if score $Dataman count matches ..${maxAnimationWay} run schedule function animation:${properties.name} ${properties.speed.value}`,
        `execute if score $Dataman count matches ${
          maxAnimationWay + 1
        } run scoreboard players set $Dataman count 0`
      );
    }
    const commandResult = commandGenerated.join('\n');
    if (commandGenerated.length) {
      this.commandTextArea.nativeElement.value = commandResult;
    }
    return commandResult;
  }

  protected async generateFiles(): Promise<void> {
    this.zipService.addFile('pack.mcmeta', pack);
    this.zipService.addFile('data/tags/function/load.json', '{"values":[]}');
    //TODO: Make the destroy command run last
    this.propertiesList.forEach((properties) => {
      this.zipService.addFile(
        `data/animation/function/${properties.name}.mcfunction`,
        this.buildCommands(properties)
      );
    });

    await this.zipService.download('datapack.zip').catch((error) => {
      console.error(error);
    });
  }
}
