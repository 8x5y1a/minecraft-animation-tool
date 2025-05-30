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
import { GenerateCommandHelperService } from 'src/app/services/generate-command-helper';

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
  private maxLoop = 0;

  constructor(
    private nbtDataService: NbtDataService,
    private zipService: ZipService,
    private commandHelper: GenerateCommandHelperService
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

  /**
   * Generates all commands for the current properties list.
   */
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
    const propertiesString = this.commandHelper.buildPropertiesString(
      property ?? {},
      isSet
    );
    const newX = this.commandHelper.transformCoordinates(
      x,
      properties.x.value,
      scaleValue
    );
    const newY = this.commandHelper.transformCoordinates(
      y,
      properties.y.value,
      scaleValue
    );
    const newZ = this.commandHelper.transformCoordinates(
      z,
      properties.z.value,
      scaleValue
    );

    if (properties.command.value !== 'destroy') {
      properties.coordinateList.push({ x: newX, y: newY, z: newZ });
    }
    let timing = isTiming ? this.getTiming(newX, newY, newZ, properties) : '';

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
   * Handles gradual scale/coordinate and final setblock/kill if needed.
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
    const coordinates = `${this.commandHelper.calculateScaleOffset(
      x,
      startScale
    )} ${y} ${this.commandHelper.calculateScaleOffset(z, startScale)}`;
    const transform = this.commandHelper.buildTransformation(
      [0, 0, 0],
      false,
      startScale,
      true
    );
    const coordinateTag = this.commandHelper.getCoordinateTag(x, y, z);
    const tags = `,Tags:["${coordinateTag}", "${properties.name}"]`;

    const commands: string[] = [
      `${timing} summon block_display ${coordinates} {block_state:{Name:"${block}"${propertiesString}}${transform}${tags}}`,
    ];

    if (
      properties.scaleOption.value === 'gradual' ||
      properties.coordinateOption.value === 'gradual'
    ) {
      const interpolation = this.commandHelper.getInterpolation(
        timing,
        isTiming,
        transform,
        properties,
        coordinateTag
      );
      commands.push(interpolation);

      if (
        properties.scaleOption.value === 'gradual' &&
        properties.gradualScaleEnd.value === 1 &&
        properties.shouldSetBlock.value
      ) {
        const setBlockProperties = this.commandHelper.buildPropertiesString(
          blockData.property ?? {},
          true
        );
        //TODO: Calculate latency based on the scale speed
        const latency = 3;
        if (this.maxIncrement < latency) {
          this.maxIncrement = latency;
        }

        commands.push(
          `${this.commandHelper.addLatency(
            timing,
            latency
          )} setblock ${x} ${y} ${z} ${block}${setBlockProperties}`,
          `${this.commandHelper.addLatency(
            timing,
            latency
          )} kill @e[tag=${coordinateTag}]`
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
    const coordinatesString = `${coordinatesToDel.x} ${coordinatesToDel.y} ${coordinatesToDel.z}`;
    const tags = this.commandHelper.getCoordinateTag(
      coordinatesToDel.x,
      coordinatesToDel.y,
      coordinatesToDel.z
    );

    if (animToDel.command.value === 'set') {
      return [`${timing} setblock ${coordinatesString} minecraft:air`];
    }

    // Faster delete if there is no timing
    if (!properties.timing.value) {
      return index === 0 ? [`kill @e[tag=${animToDel.name}]`] : [];
    }

    if (
      properties.gradualScaleStart.value !== 1 ||
      properties.gradualScaleEnd.value !== 1
    ) {
      const interpolation = this.commandHelper.getInterpolation(
        timing,
        true,
        this.commandHelper.buildTransformation(
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

      const lateTiming = this.commandHelper.addLatency(timing, 1);

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
        const killTiming = this.commandHelper.addLatency(timing, latency);
        const transform = this.commandHelper.buildTransformation(
          [0, 0, 0],
          true,
          properties.gradualScaleStart.value,
          true
        );
        const coordinatesDisplay = `${this.commandHelper.calculateScaleOffset(
          coordinatesToDel.x,
          properties.gradualScaleEnd.value
        )} ${coordinatesToDel.y} ${this.commandHelper.calculateScaleOffset(
          coordinatesToDel.z,
          properties.gradualScaleEnd.value
        )}`;
        const transformWithTranslation = this.commandHelper.addTranslation(
          transform,
          properties.gradualScaleEnd.value,
          properties.gradualScaleStart.value,
          properties
        );
        return [
          `${timing} setblock ${coordinatesString} minecraft:air`,
          `${timing} summon block_display ${coordinatesDisplay} {block_state:{Name:"${block}"${propertiesString}}${transformWithTranslation},Tags:["${tags}"]}`,
          interpolation,
          `${killTiming} kill @e[tag=${tags}]`,
        ];
      }

      return [interpolation, `${lateTiming} kill @e[tag=${tags}]`];
    }

    return [`${timing} kill @e[tag=${tags}]`];
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
      'scoreboard players add $Dataman count 0',
      '# Scoreboard Management End'
    );
    const randomMax = Math.max(this.maxAxis.x, this.maxAxis.y, this.maxAxis.z);

    const maxAxis =
      (properties.animationOrder.value !== 'random'
        ? this.maxAxis[properties.animationOrder.value]
        : randomMax) +
      properties.randomness.value +
      1;

    commands.push(
      '# Timing Management',
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

    this.maxLoop = maxAxis + this.maxIncrement;
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
    this.commandGeneratedList = [];
    this.zipService.addFile('pack.mcmeta', pack);
    this.zipService.addFile('data/tags/function/load.json', '{"values":[]}');
    //TODO: Make the destroy command run last (Order properties list by command type)

    this.propertiesList.forEach((properties) => {
      const commandString = this.buildCommands(properties);
      const commandList = commandString.split('\n');
      if (commandList.length > 50000) {
        const regex = /count matches (\d+)/;

        const timeManagementIndex = commandList.findIndex(
          (line) => line === '# Timing Management'
        );
        const timeManagement =
          timeManagementIndex >= 0
            ? commandList.slice(timeManagementIndex + 1)
            : [];

        const scoreBoardManagerIndex = commandList.findIndex(
          (line) => line === '# Scoreboard Management End'
        );
        const scoreBoardManager =
          scoreBoardManagerIndex >= 0
            ? commandList.slice(0, scoreBoardManagerIndex)
            : [];

        const mainCommand: string[] = [];
        for (let i = 0; i < this.maxLoop; i++) {
          const helperCommand: string[] = [];
          commandList.forEach((line, index) => {
            const match = line.match(regex);
            if (match && match[1] && parseInt(match[1]) === i) {
              helperCommand.push(line);
              delete commandList[index];
            }
          });

          if (helperCommand.length > 0) {
            this.zipService.addFile(
              `data/animation/function/${properties.name}_helper_${i}.mcfunction`,
              helperCommand.join('\n')
            );
            mainCommand.push(
              `execute if score $Dataman count matches ${i} run function animation:${properties.name}_helper_${i}`
            );
          }
        }
        mainCommand.unshift(...scoreBoardManager);
        mainCommand.push(...timeManagement);
        this.zipService.addFile(
          `data/animation/function/${properties.name}.mcfunction`,
          mainCommand.join('\n')
        );
      } else {
        this.zipService.addFile(
          `data/animation/function/${properties.name}.mcfunction`,
          commandString
        );
      }
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
}
