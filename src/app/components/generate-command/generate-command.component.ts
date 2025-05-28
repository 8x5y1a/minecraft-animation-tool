import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AnimationProperties,
  BlockData,
  CommandGenerated,
  Coordinates,
} from 'src/app/types/type';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ZipService } from 'src/app/services/zip.service';
import { pack } from 'src/app/types/datapack-format';
import { MatTabsModule } from '@angular/material/tabs';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';

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
  imports: [
    CommonModule,
    MatButtonModule,
    MatTabsModule,
    ClipboardModule,
    MatIcon,
    MatTooltipModule,
  ],
  templateUrl: './generate-command.component.html',
  styleUrl: './generate-command.component.css',
  standalone: true,
})
export class GenerateCommandComponent {
  protected blockDataList: BlockData[] = [];
  private propertiesList: AnimationProperties[] = [];
  private maxAxis: Coordinates = { x: 0, y: 0, z: 0 };
  protected commandGeneratedList: CommandGenerated[] = [];
  @ViewChild('tooltip') copyTooltip?: MatTooltip;
  protected isCopyConfirm = false;
  private maxIncrement = 0;

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
    this.commandGeneratedList = [];
    this.propertiesList.forEach((properties) => {
      if (!properties) return;
      this.buildCommands(properties);
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
      this.commandGeneratedList.push({
        name: properties.name,
        command: commandResult,
      });
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
    let timing = isTiming ? this.getTiming(newX, newY, newZ, properties) : '';

    switch (properties.command.value) {
      case 'set': {
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
      }
      case 'display': {
        timing = isTiming ? this.getTiming(x, y, z, properties) : '';
        return this.buildDisplayCommands(
          timing,
          newX,
          newY,
          newZ,
          block,
          properties,
          propertiesString,
          isTiming,
          blockData
        );
      }
      case 'destroy':
        return this.buildDestroyCommands(
          properties,
          index,
          timing,
          block,
          propertiesString
        );
      default:
        return [];
    }
  }

  /**
   * Builds the set command for placing a block at specified coordinates.
   * This command is used when the animation type is 'set'.
   */
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

  /**
   * Builds the commands for displaying a block with optional transformations.
   * This includes scaling and positioning based on the animation properties.
   */
  private buildDisplayCommands(
    timing: string,
    x: number,
    y: number,
    z: number,
    block: string,
    properties: AnimationProperties,
    propertiesString: string,
    isTiming: boolean,
    blockData: BlockData
  ): string[] {
    const startScale =
      properties.scaleOption.value === 'gradual'
        ? properties.gradualScaleStart.value
        : properties.staticScale.value;
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
      const interpolation = this.getInterlopation(
        timing,
        isTiming,
        transform,
        properties,
        coordinateTag
      );
      commands.push(interpolation);

      if (
        properties.gradualScaleEnd.value === 1 &&
        properties.shouldSetBlock.value
      ) {
        const setBlockProperties = this.buildPropertiesString(
          blockData.property ?? {},
          true
        );
        //TODO: Calculate latency based on the scale speed
        const latency = 3;
        if (this.maxIncrement < latency) {
          this.maxIncrement = latency;
        }

        commands.push(
          `${this.addLatency(
            timing,
            latency
          )} setblock ${x} ${y} ${z} ${block}${setBlockProperties}`,
          `${this.addLatency(timing, latency)} kill @e[tag=${coordinateTag}]`
        );
      }
    }

    return commands;
  }

  /**
   * Builds the commands for destroying a block display.
   */
  private buildDestroyCommands(
    properties: AnimationProperties,
    index: number,
    timing: string,
    block: string,
    propertiesString: string
  ): string[] {
    const animToDel = this.propertiesList.find(
      (anim) => anim.name === properties.removeAnimation.value?.name
    );
    const coordinatesToDel = animToDel?.coordinateList[index];
    if (!animToDel || !coordinatesToDel) return [];
    const coodirnatesString = `${coordinatesToDel.x} ${coordinatesToDel.y} ${coordinatesToDel.z}`;

    if (animToDel.command.value === 'set') {
      return [`${timing} setblock ${coodirnatesString} minecraft:air`];
    }

    // Faster delete if there is no timing
    if (!properties.timing.value) {
      return index === 0 ? [`kill @e[tag=${animToDel.name}]`] : [];
    }

    const tags = `${coordinatesToDel.x}-${coordinatesToDel.y}-${coordinatesToDel.z}`;

    if (
      properties.gradualScaleStart.value !== 1 ||
      properties.gradualScaleEnd.value !== 1
    ) {
      const interlopation = this.getInterlopation(
        timing,
        true,
        this.buildTransformation(
          [0, 0, 0],
          false,
          properties.gradualScaleEnd.value,
          true
        ),
        properties,
        tags,
        properties.gradualScaleEnd.value === 0 &&
          properties.shouldSetBlock.value
      );

      const lateTiming = this.addLatency(timing, 1);

      if (
        properties.gradualScaleEnd.value === 0 &&
        properties.shouldSetBlock.value &&
        properties.gradualScaleStart.value === 1
      ) {
        //TODO: Calculate latency based on the scale speed
        const latency = 3;
        if (this.maxIncrement < latency) {
          this.maxIncrement = latency;
        }
        const killTiming = this.addLatency(timing, latency);
        const transform = this.buildTransformation(
          [0, 0, 0],
          true,
          properties.gradualScaleStart.value,
          true
        );
        const coordinatesDisplay = `${this.calculateScaleOffset(
          coordinatesToDel.x,
          properties.gradualScaleEnd.value
        )} ${coordinatesToDel.y} ${this.calculateScaleOffset(
          coordinatesToDel.z,
          properties.gradualScaleEnd.value
        )}`;
        const transformWithTranslation = this.addTranslation(
          transform,
          properties.gradualScaleEnd.value,
          properties.gradualScaleStart.value
        );
        return [
          `${timing} setblock ${coodirnatesString} minecraft:air`,
          `${timing} summon block_display ${coordinatesDisplay} {block_state:{Name:"${block}"${propertiesString}}${transformWithTranslation},Tags:["${tags}"]}`,
          interlopation,
          `${killTiming} kill @e[tag=${tags}]`,
        ];
      }

      return [
        interlopation,
        `${lateTiming} kill @e[tag=${coordinatesToDel.x}-${coordinatesToDel.y}-${coordinatesToDel.z}]`,
      ];
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

    const maxAxis =
      (properties.animationOrder.value !== 'random'
        ? this.maxAxis[properties.animationOrder.value]
        : randomMax) +
      properties.randomness.value +
      1;

    commands.push(
      `execute if score $Dataman count matches ..${
        maxAxis + this.maxIncrement - 1
      } run scoreboard players add $Dataman count 1`,
      `execute if score $Dataman count matches ..${
        maxAxis + this.maxIncrement - 1
      } run schedule function animation:${properties.name} ${
        properties.speed.value
      }`
    );
    if (properties.nextAnimation.value) {
      commands.push(
        `execute if score $Dataman count matches ${
          maxAxis + this.maxIncrement
        } run schedule function animation:${
          properties.nextAnimation.value.name
        } ${properties.nextAnimation.value.speed.value}`
      );
    }
    commands.push(
      `execute if score $Dataman count matches ${
        maxAxis + this.maxIncrement
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

  /**
   * Generates the files for the datapack and downloads them as a zip.
   */
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

  /**
   * Copies the generated commands to the clipboard and shows a confirmation tooltip.
   */
  protected copyAction() {
    this.isCopyConfirm = true;
    setTimeout(() => {
      this.copyTooltip?.show();
    }, 0);
    setTimeout(() => {
      this.isCopyConfirm = false;
      this.copyTooltip?.hide();
    }, 2000);
  }

  /**
   * Generates the interlopation command for gradual scale animations.
   * This command is used to smoothly transition the scale of the block display.
   * This will also be used for coordinate interpolation eventually.
   */
  private getInterlopation(
    timing: string,
    isTiming: boolean,
    transform: string,
    properties: AnimationProperties,
    coordinateTag: string,
    enableLatency = true
  ): string {
    let timingWithLatency = isTiming ? timing : '';
    if (enableLatency) {
      timingWithLatency = this.addLatency(timingWithLatency);
    }
    const newTransform = this.addTranslation(
      transform,
      properties.gradualScaleStart.value,
      properties.gradualScaleEnd.value
    );
    return `${timingWithLatency} execute as @e[tag=${coordinateTag}] run data merge entity @s {start_interpolation:-1,interpolation_duration:${properties.scaleSpeed.value}${newTransform}}`;
  }

  private addTranslation(
    transform: string,
    start: number,
    end: number
  ): string {
    const transformNoScale = transform.substring(
      0,
      transform.indexOf('translation')
    );
    const endScale = end;
    const translation = this.calculateScaleOffset(0, start);
    const negative = start > 1 ? '' : '-';
    const newTransform =
      transformNoScale +
      `translation:[${negative}${translation}f,0f,${negative}${translation}f],scale:[${endScale}f,${endScale}f,${endScale}f]}`;
    return newTransform;
  }

  /**
   * Adds latency to the timing string.
   * This is used to ensure that the next command waits for the previous one to finish.
   */
  private addLatency(timing: string, increment = 1): string {
    return timing.replace(
      /matches (\d+)/,
      (_, num) => `matches ${parseInt(num) + increment}`
    );
  }
}
