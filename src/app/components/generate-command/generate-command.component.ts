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

//Not exactly sure if I should still do this, to determine
//TODO: Fix with multiple files (run function positionned ~ ~ ~)
//Can call file: helper:animation? or animation:helper_animation_0
//Could add Comments in each mcfunction to also indicate why/what it does

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
      if (!properties) return;
      const commandString = this.buildCommands(properties);
      this.commandTextArea.nativeElement.value = commandString;
    });
  }

  /**
   * Main command builder for a given animation properties set.
   */
  private buildCommands(properties: AnimationProperties): string {
    const isSet = properties.command.value === 'set';
    const isTiming = properties.timing.value;
    const scaleValue =
      properties.scaleOption.value === 'static'
        ? properties.staticScale.value
        : properties.gradualScaleEnd.value;
    properties.coordinateList = [];

    const commandList: string[] = this.blockDataList.flatMap(
      (blockData, index) =>
        this.buildBlockCommands(
          blockData,
          properties,
          index,
          isSet,
          isTiming,
          scaleValue
        )
    );

    if (isTiming) {
      this.addTimingCommands(commandList, properties);
    }

    const commandResult = commandList.join('\n');
    if (commandList.length) {
      this.commandTextArea.nativeElement.value = commandResult;
    }
    return commandResult;
  }

  /**
   * Builds commands depending on the animation type.
   */
  private buildBlockCommands(
    blockData: BlockData,
    properties: AnimationProperties,
    index: number,
    isSet: boolean,
    isTiming: boolean,
    scaleValue: number
  ): string[] {
    const {
      block,
      position: { x, y, z },
      property,
    } = blockData;
    const propertiesString = this.buildPropertiesString(property ?? {}, isSet);
    const newX = this.transformCoordinates(x, properties.x.value, scaleValue);
    const newY = this.transformCoordinates(y, properties.y.value, scaleValue);
    const newZ = this.transformCoordinates(z, properties.z.value, scaleValue);

    if (properties.command.value !== 'destroy') {
      properties.coordinateList.push({ x: newX, y: newY, z: newZ });
    }

    const timing = isTiming ? this.getTiming(newX, newY, newZ, properties) : '';

    switch (properties.command.value) {
      case 'set':
        return [
          this.buildSetCommand(
            timing,
            newX,
            newY,
            newZ,
            block,
            propertiesString
          ),
        ];
      case 'display':
        return this.buildDisplayCommands(
          timing,
          newX,
          newY,
          newZ,
          block,
          properties,
          propertiesString,
          isTiming
        );
      case 'destroy':
        return this.buildDestroyCommands(properties, index, timing);
      default:
        return [];
    }
  }

  private buildSetCommand(
    timing: string,
    x: number,
    y: number,
    z: number,
    block: string,
    propertiesString: string
  ): string {
    return `${timing} setblock ${x} ${y} ${z} ${block}${propertiesString} keep`;
  }

  private buildDisplayCommands(
    timing: string,
    x: number,
    y: number,
    z: number,
    block: string,
    properties: AnimationProperties,
    propertiesString: string,
    isTiming: boolean
  ): string[] {
    const startScale = properties.gradualScaleStart.value;
    const coordinates = `${this.calculateScaleOffset(
      x,
      startScale
    )} ${y} ${this.calculateScaleOffset(z, startScale)}`;
    const transform = this.buildTransformation(
      [0, 0, 0],
      false,
      startScale,
      true
    );
    const coordinateTag = `${x}-${y}-${z}`;
    const tags = `,Tags:["${coordinateTag}", "${properties.name}"]`;

    const commands: string[] = [
      `${timing} summon block_display ${coordinates} {block_state:{Name:"${block}"${propertiesString}}${transform}${tags}}`,
    ];

    if (
      properties.scaleOption.value === 'gradual' ||
      properties.coordinateOption.value === 'gradual'
    ) {
      const timingWithLatency = isTiming
        ? this.getTiming(x, y, z, properties, 1)
        : '';
      const transformNoScale = transform.substring(
        0,
        transform.indexOf('translation')
      );
      const endScale = properties.gradualScaleEnd.value;
      const translation = this.calculateScaleOffset(0, startScale);
      const negative = startScale > 1 ? '' : '-';
      const newTransform =
        transformNoScale +
        `translation:[${negative}${translation}f,0f,${negative}${translation}f],scale:[${endScale}f,${endScale}f,${endScale}f]}`;
      const interpolation = `${timingWithLatency} execute as @e[tag=${coordinateTag}] run data merge entity @s {start_interpolation:-1,interpolation_duration:10${newTransform}}`;

      commands.push(interpolation);
    }

    return commands;
  }

  private buildDestroyCommands(
    properties: AnimationProperties,
    index: number,
    timing: string
  ): string[] {
    const animToDel = this.propertiesList.find(
      (anim) => anim.name === properties.removeAnimation.value?.name
    );
    const coordinatesToDel = animToDel?.coordinateList[index];

    if (!animToDel || !coordinatesToDel) return [];

    if (animToDel.command.value === 'set') {
      return [
        `${timing} setblock ${coordinatesToDel.x} ${coordinatesToDel.y} ${coordinatesToDel.z} minecraft:air`,
      ];
    }

    // Faster delete if there is no timing
    if (!properties.timing.value) {
      return index === 0 ? [`kill @e[tag=${animToDel.name}]`] : [];
    }

    return [
      `${timing} kill @e[tag=${coordinatesToDel.x}-${coordinatesToDel.y}-${coordinatesToDel.z}]`,
    ];
  }

  /**
   * Adds scoreboard and schedule commands for timing-based animations.
   */
  private addTimingCommands(
    commands: string[],
    properties: AnimationProperties
  ) {
    commands.unshift(
      'scoreboard objectives add count trigger',
      'scoreboard players add $Dataman count 0'
    );
    const randomMax = Math.max(this.maxAxis.x, this.maxAxis.y, this.maxAxis.z);

    let maxAxis =
      (properties.animationOrder.value !== 'random'
        ? this.maxAxis[properties.animationOrder.value]
        : randomMax) +
      properties.randomness.value +
      1;

    //TODO: remove hardcoded maxAxis
    maxAxis = 100;

    commands.push(
      `execute if score $Dataman count matches ..${maxAxis} run scoreboard players add $Dataman count 1`,
      `execute if score $Dataman count matches ..${maxAxis} run schedule function animation:${properties.name} ${properties.speed.value}`,
      `execute if score $Dataman count matches ${
        maxAxis + 1
      } run scoreboard players set $Dataman count 0`
    );
  }

  /**
   * Builds the block properties string for set/display commands.
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
   * Builds the transformation string for display commands.
   */
  private buildTransformation(
    coords: [number, number, number],
    isTiming: boolean,
    scaleValue: number,
    isDisplay = true
  ): string {
    if (!isDisplay) return '';
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
   * Transforms block coordinates based on scale and offset.
   */
  private transformCoordinates(
    blockCoordinate: number,
    coordinate: number,
    scale: number
  ): number {
    return parseFloat(
      (blockCoordinate * (scale === 0 ? 1 : scale) + coordinate).toFixed(4)
    );
  }

  /**
   * Calculates the offset for scale.
   */
  private calculateScaleOffset(x: number, scale: number): number {
    return Math.abs(x + 0.5 - scale / 2);
  }

  /**
   * Returns the timing command string for a given block.
   */
  private getTiming(
    x: number,
    y: number,
    z: number,
    properties: AnimationProperties,
    increment = 0
  ): string {
    const maxAxisList = [this.maxAxis.x, this.maxAxis.y, this.maxAxis.z];
    const randomMaxAxis = maxAxisList[Math.floor(Math.random() * 3)];
    const random = Math.floor(Math.random() * randomMaxAxis) + 1;

    const coords = { x, y, z, random };
    const axis = properties.animationOrder.value;
    const coordAxis = coords[axis];

    if (axis === 'random') {
      return `execute if score $Dataman count matches ${
        coordAxis + increment
      } run`;
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

    return `execute if score $Dataman count matches ${
      roundedCount + increment
    } run`;
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
