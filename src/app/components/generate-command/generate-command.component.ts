import { Component, signal, ViewChild, inject } from '@angular/core';

import {
  AnimationProperties,
  BlockData,
  CommandGenerated,
  Coordinates,
  NBTStructure,
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-generate-command',
  imports: [
    MatButtonModule,
    MatTabsModule,
    ClipboardModule,
    MatIcon,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './generate-command.component.html',
  styleUrl: './generate-command.component.css',
  standalone: true,
})
export class GenerateCommandComponent {
  private nbtDataService = inject(NbtDataService);
  private zipService = inject(ZipService);
  private commandHelper = inject(GenerateCommandHelperService);

  private structureList: NBTStructure[] = [];
  protected commandGeneratedList: CommandGenerated[] = [];
  @ViewChild('tooltip') copyTooltip?: MatTooltip;
  protected isCopyConfirm = false;
  private maxIncrement = 0;
  private maxLoop = 0;
  protected isLoading = signal(false);

  constructor() {
    this.nbtDataService.nbtStructureObs
      .pipe(takeUntilDestroyed())
      .subscribe((structureList) => {
        this.structureList = structureList;
      });
  }

  /**
   * Generates all commands for the current properties list.
   */
  private createCommands() {
    this.structureList.forEach((structure) => {
      structure.animationProperties.forEach((properties) => {
        if (!properties) return;
        this.buildCommands(properties, structure);
      });
    });
  }

  /**
   * Main command builder for a given animation properties set.
   */
  private buildCommands(
    properties: AnimationProperties,
    structure: NBTStructure
  ): string {
    const isSet = properties.command.value === 'set';
    const isTiming = properties.timing.value;
    const scaleValue =
      properties.scaleOption.value === 'static'
        ? properties.staticScale.value
        : properties.gradualScaleEnd.value;
    properties.coordinateList = [];

    const commandList: string[] = structure.blockData.flatMap(
      (blockData, index) =>
        this.buildBlockCommands(
          blockData,
          properties,
          index,
          isSet,
          isTiming,
          scaleValue,
          structure
        )
    );

    if (isTiming) {
      this.addTimingCommands(commandList, properties, structure.maxAxis);
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
    scaleValue: number,
    structure: NBTStructure
  ): string[] {
    const {
      block,
      position: { x, y, z },
      property,
    } = blockData;
    const propertiesString = this.commandHelper.buildPropertiesString(
      property ?? {},
      isSet,
      properties.facing.value
    );
    const [newX, newY, newZ] = [x, y, z].map((coord, i) =>
      this.commandHelper.transformCoordinates(
        coord,
        [properties.x.value, properties.y.value, properties.z.value][i],
        scaleValue
      )
    );

    const rotatedCoordinates = this.commandHelper.rotateBlockPos(
      newX,
      newY,
      newZ,
      properties.facing.value,
      structure.structureSize
    );

    if (properties.command.value !== 'destroy') {
      properties.coordinateList.push(rotatedCoordinates);
    }
    let timing = isTiming
      ? this.getTiming(
          rotatedCoordinates.x,
          rotatedCoordinates.y,
          rotatedCoordinates.z,
          properties,
          structure.maxAxis
        )
      : '';

    switch (properties.command.value) {
      case 'set':
        return [
          this.buildSetCommand(
            timing,
            rotatedCoordinates.x,
            rotatedCoordinates.y,
            rotatedCoordinates.z,
            block,
            propertiesString
          ),
        ];
      case 'display':
        timing = isTiming
          ? this.getTiming(x, y, z, properties, structure.maxAxis)
          : '';
        return this.buildDisplayCommands(
          timing,
          rotatedCoordinates.x,
          rotatedCoordinates.y,
          rotatedCoordinates.z,
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
          propertiesString,
          structure
        );
      case 'translate':
        return this.buildTranslateCommands(
          timing,
          rotatedCoordinates.x,
          rotatedCoordinates.y,
          rotatedCoordinates.z,
          block,
          properties,
          propertiesString,
          isTiming,
          blockData
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
          true,
          properties.facing.value
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
    propertiesString: string,
    structure: NBTStructure
  ): string[] {
    const animToDel = structure.animationProperties.find(
      (anim) => anim.name === properties.referenceAnimation.value?.name
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

  private buildTranslateCommands(
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
    // Options:
    //  [From Set block] => Display From Order to new destination DONE
    //  [From Display] => Display From Order to new destination DONE
    //  [From another Translate] => Display from Order to a new destination DONE
    //  [Set Block at the end]
    //  [Change scale] NOT SURE
    //  [others]?
    //FACING DOESNT WORK
    // Translate from translate doesnt have datamerge (or doesnt work)
    // Maybe get rid of the offset when datamerging OR maybe just fix the offset.

    const reference = properties.referenceAnimation.value;
    if (!reference) {
      return [];
    }

    const commandList: string[] = [];
    let index = 0;

    const startScale =
      properties.scaleOption.value === 'gradual'
        ? properties.gradualScaleEnd.value
        : properties.staticScale.value;
    const coordinateTag = this.commandHelper.getCoordinateTag(x, y, z);
    const xTranslateValue = properties.x.value - properties.endX.value;
    const yTranslateValue = properties.y.value - properties.endY.value;
    const zTranslateValue = properties.z.value - properties.endZ.value;
    const transform = this.commandHelper.buildTransformation(
      [xTranslateValue, yTranslateValue, zTranslateValue],
      true,
      startScale
    );
    if (
      reference.command.value === 'set' ||
      (reference.command.value === 'translate' &&
        reference.shouldSetBlock.value)
    ) {
      index = 1;
      const translatedX = x + reference.endX.value;
      const translatedY = y + reference.endY.value;
      const translatedZ = z + reference.endZ.value;

      const transformTranslated = this.commandHelper.buildTransformation(
        [translatedX, translatedY, translatedZ],
        false,
        reference.gradualScaleEnd.value
      );

      commandList.push(
        `${timing} setblock ${translatedX} ${translatedY} ${translatedZ} minecraft:air`
      );
      commandList.push(
        `${timing} summon block_display ${translatedX} ${translatedY} ${translatedZ} {block_state:{Name:"${block}"${propertiesString}}${transformTranslated},Tags:["${coordinateTag}"]}`
      );
    }

    commandList.push(
      `${this.commandHelper.addLatency(
        timing,
        index
      )} execute as @e[tag=${coordinateTag}] run data merge entity @s {start_interpolation:-1,interpolation_duration:${
        properties.translationSpeed.value
      }${transform}}`
    );

    if (properties.shouldSetBlock.value) {
      const setBlockProperties = this.commandHelper.buildPropertiesString(
        blockData.property ?? {},
        true,
        properties.facing.value
      );
      //TODO: Calculate latency based on the translation speed
      const latency = 15;
      if (this.maxIncrement < latency) {
        this.maxIncrement = latency;
      }

      commandList.push(
        `${this.commandHelper.addLatency(timing, latency)} setblock ${
          x + xTranslateValue
        } ${y + yTranslateValue} ${
          z + zTranslateValue
        } ${block}${setBlockProperties}`,
        `${this.commandHelper.addLatency(
          timing,
          latency
        )} kill @e[tag=${coordinateTag}]`
      );
    }

    return commandList;
  }

  /**
   * Adds scoreboard and schedule commands for timing-based animations.
   */
  private addTimingCommands(
    commands: string[],
    properties: AnimationProperties,
    maxAxis: Coordinates
  ) {
    commands.unshift(
      'scoreboard objectives add count trigger',
      'scoreboard players add $Dataman count 0',
      '# Scoreboard Management End'
    );
    const randomMax = Math.max(maxAxis.x, maxAxis.y, maxAxis.z);

    const animationOrder = properties.animationOrder.value;

    let finalMaxAxis;
    switch (animationOrder) {
      case 'random':
        finalMaxAxis = randomMax;
        break;
      case 'fromBlock':
        finalMaxAxis = randomMax;
        break;
      default:
        finalMaxAxis = maxAxis[animationOrder];
        break;
    }
    finalMaxAxis += properties.randomness.value + 2;

    commands.push(
      '# Timing Management',
      `execute if score $Dataman count matches ..${
        finalMaxAxis + this.maxIncrement - 1
      } run scoreboard players add $Dataman count 1`,
      `execute if score $Dataman count matches ..${
        finalMaxAxis + this.maxIncrement - 1
      } run schedule function animation:${properties.name} ${
        properties.speed.value
      }`
    );
    if (properties.nextAnimation.value) {
      commands.push(
        `execute if score $Dataman count matches ${
          finalMaxAxis + this.maxIncrement
        } run schedule function animation:${
          properties.nextAnimation.value.name
        } ${properties.nextAnimation.value.speed.value}`
      );
    }
    commands.push(
      `execute if score $Dataman count matches ${
        finalMaxAxis + this.maxIncrement
      } run scoreboard players set $Dataman count 0`
    );

    this.maxLoop = finalMaxAxis + this.maxIncrement;
  }

  /**
   * Returns the timing command string for a given block.
   */
  private getTiming(
    x: number,
    y: number,
    z: number,
    properties: AnimationProperties,
    maxAxis: Coordinates,
    increment = 0
  ): string {
    const maxAxisList = [maxAxis.x, maxAxis.y, maxAxis.z];
    const randomMaxAxis = maxAxisList[Math.floor(Math.random() * 3)];
    const random = Math.floor(Math.random() * randomMaxAxis) + 1;
    const scale = properties.gradualScaleStart.value;

    const coords = { x, y, z, random };
    const axis = properties.animationOrder.value;
    if (axis === 'fromBlock') {
      const [refX, refY, refZ] = properties.orderFromBlock.value
        .split(':')[0]
        .split(' ');

      let dx = x - (parseFloat(refX) + properties.x.value) * scale;
      let dy = y - (parseFloat(refY) + properties.y.value) * scale;
      let dz = z - (parseFloat(refZ) + properties.z.value) * scale;
      if (properties.command.value === 'display') {
        dx = x - parseFloat(refX) * scale;
        dy = y - parseFloat(refY) * scale;
        dz = z - parseFloat(refZ) * scale;
      }
      const distance = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
      return `execute if score $Dataman count matches ${distance} run`;
    }
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
      count = maxAxis[axis] - count;
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
  private async generateFiles(): Promise<void> {
    this.zipService.addFile('pack.mcmeta', pack);
    this.zipService.addFile('data/tags/function/load.json', '{"values":[]}');
    this.structureList.forEach((structure) => {
      structure.animationProperties
        .sort((propA, propB) => {
          if (
            propA.command.value === 'destroy' &&
            propB.command.value !== 'destroy'
          )
            return 1;
          if (
            propA.command.value !== 'destroy' &&
            propB.command.value === 'destroy'
          )
            return -1;
          return 0;
        })
        .forEach((properties) => {
          const commandString = this.buildCommands(properties, structure);
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
    });

    await this.zipService
      .download('datapack.zip')
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.isLoading.set(false);
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

  private animationCount = 0;
  protected creationHandle(create: 'datapack' | 'command') {
    this.isLoading.set(true);
    this.commandGeneratedList = [];
    this.animationCount = 0;
    this.structureList.forEach((structure) => {
      this.animationCount += structure.animationProperties.length;
    });

    if (create === 'command') {
      this.createCommands();
      setTimeout(() => this.isLoading.set(false));
      return;
    }

    this.generateFiles();
  }
}
