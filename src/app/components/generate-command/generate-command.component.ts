import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AnimationProperties,
  BlockData,
  Coordinates,
} from 'src/app/types/type';
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
  standalone: true,
})
export class GenerateCommandComponent {
  @ViewChild('commandTextArea')
  private commandTextArea!: ElementRef<HTMLTextAreaElement>;
  protected blockDataList: BlockData[] = [];
  private propertiesList: AnimationProperties[] = [];
  private maxAxis: Coordinates = { x: 0, y: 0, z: 0 };

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

    this.nbtDataService.maxAxistObs
      .pipe(takeUntilDestroyed())
      .subscribe((newMaxAxis) => {
        this.maxAxis = newMaxAxis;
      });
  }

  protected createCommands() {
    this.propertiesList.forEach((properties) => {
      if (!properties) {
        return;
      }

      const commandGenerated = this.buildCommands(properties);

      //Instead we can add a new textArea with the command as value (and have some kind of dropdown to choose which to display)
      this.commandTextArea.nativeElement.value = commandGenerated;
    });
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
    return parseFloat((blockCoordinate * scale + coordinate).toFixed(4));
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
    const scaleValue =
      properties.scaleOption.value === 'static'
        ? properties.staticScale.value
        : properties.gradualScaleEnd.value;
    properties.coordinateList = [];

    const commandGenerated: string[] = this.blockDataList.flatMap(
      ({ block, position: { x, y, z }, property }, index) => {
        const propertiesString = this.buildPropertiesString(
          property ?? {},
          isSet
        );
        const newX = this.transformCoordinates(
          x,
          properties.x.value,
          scaleValue
        );
        const newY = this.transformCoordinates(
          y,
          properties.y.value,
          scaleValue
        );
        const newZ = this.transformCoordinates(
          z,
          properties.z.value,
          scaleValue
        );
        if (properties.command.value !== 'destroy') {
          properties.coordinateList.push({ x: newX, y: newY, z: newZ });
        }

        const timing = isTiming
          ? this.getTiming(newX, newY, newZ, properties)
          : '';

        //TODO: Fix with multiple files (run function positionned ~ ~ ~)
        //Can call file: helper:animation? or animation:helper_animation_0
        //Could add Comments in each mcfunction to also indicate why/what it does
        const coordinates = isTiming ? `0 0 0` : `~${newX} ~${newY} ~${newZ}`;
        const transform = this.buildTransformation(
          [newX, newY, newZ],
          isTiming,
          scaleValue,
          isDisplay
        );

        switch (properties.command.value) {
          case 'set': {
            return [
              `${timing} setblock ${newX} ${newY} ${newZ} ${block}${propertiesString} keep`,
            ];
          }
          case 'display': {
            const tags = `,Tags:["${newX}-${newY}-${newZ}", "${properties.name}"]`;

            return [
              `${timing} summon block_display ${coordinates} {` +
                `block_state:{Name:"${block}"${propertiesString}}` +
                `${transform}${tags}` +
                `}`,
            ];
          }
          case 'destroy': {
            const animToDel = this.propertiesList.filter(
              (anim) => anim.name === properties.removeAnimation.value?.name
            )[0];
            const coordinatesToDel = animToDel?.coordinateList[index];

            if (animToDel.command.value === 'set') {
              return [
                `${timing} setblock ${coordinatesToDel.x} ${coordinatesToDel.y} ${coordinatesToDel.z} minecraft:air`,
              ];
            }

            //Faster delete if there is no timing
            if (!properties.timing.value) {
              return index === 0 ? [`kill @e[tag=${animToDel.name}]`] : [];
            }

            return [
              `${timing} kill @e[tag=${coordinatesToDel.x}-${coordinatesToDel.y}-${coordinatesToDel.z}]`,
            ];
          }
        }
      }
    );

    if (properties.timing.value) {
      commandGenerated.unshift(
        'scoreboard objectives add count trigger',
        'scoreboard players add $Dataman count 0'
      );
      const randomMax = Math.max(
        this.maxAxis.x,
        this.maxAxis.y,
        this.maxAxis.z
      );

      const maxAxis =
        (properties.animationOrder.value !== 'random'
          ? this.maxAxis[properties.animationOrder.value]
          : randomMax) + properties.randomness.value;

      commandGenerated.push(
        `execute if score $Dataman count matches ..${maxAxis} run scoreboard players add $Dataman count 1`,
        `execute if score $Dataman count matches ..${maxAxis} run schedule function animation:${properties.name} ${properties.speed.value}`,
        `execute if score $Dataman count matches ${
          maxAxis + 1
        } run scoreboard players set $Dataman count 0`
      );
    }
    console.log(commandGenerated);
    const commandResult = commandGenerated.join('\n');
    if (commandGenerated.length) {
      this.commandTextArea.nativeElement.value = commandResult;
    }
    return commandResult;
  }

  private getTiming(
    x: number,
    y: number,
    z: number,
    properties: AnimationProperties
  ): string {
    const maxAxisList = [this.maxAxis.x, this.maxAxis.y, this.maxAxis.z];
    const randomMaxAxis = maxAxisList[Math.floor(Math.random() * 3)];
    const random = Math.floor(Math.random() * randomMaxAxis) + 1;

    const coords = { x, y, z, random };
    const axis = properties.animationOrder.value;
    const coordAxis = coords[axis];

    if (axis === 'random') {
      return `execute if score $Dataman count matches ${coordAxis} run`;
    }

    let count =
      properties.command.value !== 'display'
        ? coordAxis - properties[axis].value
        : coordAxis;

    if (!properties.isAscending.value) {
      count = this.maxAxis[axis] - count;
    }

    let roundedCount = Math.abs(Math.round(count));

    const randomness = properties.randomness.value;
    if (randomness > 0) {
      const offset = Math.floor(Math.random() * randomness) + 1;
      roundedCount += offset;
    }

    return `execute if score $Dataman count matches ${roundedCount} run`;
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
