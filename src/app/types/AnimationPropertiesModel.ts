import { FormControl } from '@angular/forms';
import { AnimationProperties } from './type.js';

export class AnimationPropertiesModel implements AnimationProperties {
  private static nextId = 0;
  readonly id: number;

  name: string;
  command: FormControl<'set' | 'display' | 'destroy'>;
  removeAnimation: FormControl<undefined | AnimationProperties>;
  nextAnimation: FormControl<undefined | AnimationProperties>;
  structureName: FormControl<string>;
  isTemplate: boolean;
  templateName?: string | undefined;

  // Position
  x: FormControl<number>;
  y: FormControl<number>;
  z: FormControl<number>;
  coordinateList: { x: number; y: number; z: number }[] = [];
  coordinateOption: FormControl<'static' | 'gradual'>;
  endX: FormControl<number>;
  endY: FormControl<number>;
  endZ: FormControl<number>;
  facing: FormControl<'north' | 'south' | 'east' | 'west'>;
  facingEnd: FormControl<'north' | 'south' | 'east' | 'west'>;

  // Scaling
  scaleOption: FormControl<'static' | 'gradual'>;
  staticScale: FormControl<number>;
  gradualScaleStart: FormControl<number>;
  gradualScaleEnd: FormControl<number>;
  scaleSpeed: FormControl<number>;
  shouldSetBlock: FormControl<boolean>;

  // Animation
  timing: FormControl<boolean>;
  speed: FormControl<number>;
  animationOrder: FormControl<'x' | 'y' | 'z' | 'random' | 'fromBlock'>;
  orderFromBlock: FormControl<string>;
  isAscending: FormControl<boolean>;
  randomness: FormControl<number>;

  private constructor(
    name: string,
    params: {
      command: 'set' | 'display' | 'destroy';
      timing: boolean;
      speed: number;
      x: number;
      y: number;
      z: number;
      endX: number;
      endY: number;
      endZ: number;
      facing: 'north' | 'south' | 'east' | 'west';
      facingEnd: 'north' | 'south' | 'east' | 'west';
      animationOrder: 'x' | 'y' | 'z' | 'random' | 'fromBlock';
      orderFromBlock: string;
      isAscending: boolean;
      randomness: number;
      scaleOption: 'static' | 'gradual';
      staticScale: number;
      gradualScaleStart: number;
      gradualScaleEnd: number;
      coordinateOption: 'static' | 'gradual';
      removeAnimation?: AnimationProperties;
      nextAnimation?: AnimationProperties;
      scaleSpeed: number;
      shouldSetBlock: boolean;
      structureName: string;
      isTemplate: boolean;
    }
  ) {
    this.id = AnimationPropertiesModel.nextId++;
    this.name = name;
    this.command = new FormControl(params.command, { nonNullable: true });
    this.timing = new FormControl(params.timing, { nonNullable: true });
    this.speed = new FormControl(params.speed, { nonNullable: true });
    this.structureName = new FormControl(params.structureName, {
      nonNullable: true,
    });
    this.isTemplate = false;

    this.x = new FormControl(params.x, { nonNullable: true });
    this.y = new FormControl(params.y, { nonNullable: true });
    this.z = new FormControl(params.z, { nonNullable: true });
    this.endX = new FormControl(params.endX, { nonNullable: true });
    this.endY = new FormControl(params.endY, { nonNullable: true });
    this.endZ = new FormControl(params.endZ, { nonNullable: true });
    this.facing = new FormControl(params.facing, { nonNullable: true });
    this.facingEnd = new FormControl(params.facing, { nonNullable: true });

    this.removeAnimation = new FormControl(params.removeAnimation, {
      nonNullable: true,
    });

    this.animationOrder = new FormControl(params.animationOrder, {
      nonNullable: true,
    });
    this.orderFromBlock = new FormControl(params.orderFromBlock, {
      nonNullable: true,
    });
    this.isAscending = new FormControl(params.isAscending, {
      nonNullable: true,
    });
    this.randomness = new FormControl(params.randomness, { nonNullable: true });

    this.scaleOption = new FormControl(params.scaleOption, {
      nonNullable: true,
    });
    this.staticScale = new FormControl(params.staticScale, {
      nonNullable: true,
    });
    this.gradualScaleStart = new FormControl(params.gradualScaleStart, {
      nonNullable: true,
    });
    this.gradualScaleEnd = new FormControl(params.gradualScaleEnd, {
      nonNullable: true,
    });

    this.coordinateOption = new FormControl(params.coordinateOption, {
      nonNullable: true,
    });

    this.nextAnimation = new FormControl(params.nextAnimation, {
      nonNullable: true,
    });
    this.scaleSpeed = new FormControl(params.scaleSpeed, {
      nonNullable: true,
    });
    this.shouldSetBlock = new FormControl(params.shouldSetBlock, {
      nonNullable: true,
    });
  }

  static createDefault(name: string) {
    return new AnimationPropertiesModel(name, {
      command: 'set',
      timing: true,
      speed: 1,
      x: 0,
      y: 56,
      z: 0,
      endX: 0,
      endY: 0,
      endZ: 0,
      removeAnimation: undefined,
      animationOrder: 'y',
      orderFromBlock: '',
      isAscending: true,
      randomness: 0,
      scaleOption: 'static',
      staticScale: 1,
      gradualScaleStart: 1,
      gradualScaleEnd: 1,
      coordinateOption: 'static',
      scaleSpeed: 30,
      facing: 'north',
      facingEnd: 'north',
      shouldSetBlock: true,
      structureName: '',
      isTemplate: false,
    });
  }

  static createDestroy(from: AnimationProperties) {
    return new AnimationPropertiesModel(`destroy_${from.name}`, {
      command: 'destroy',
      timing: from.timing.value,
      speed: from.speed.value,
      x: from.x.value,
      y: from.y.value,
      z: from.z.value,
      endX: from.endX.value,
      endY: from.endY.value,
      endZ: from.endZ.value,
      removeAnimation: from,
      animationOrder: from.animationOrder.value,
      orderFromBlock: from.orderFromBlock.value,
      isAscending: from.isAscending.value,
      randomness: from.randomness.value,
      scaleOption: from.scaleOption.value,
      staticScale: from.staticScale.value,
      gradualScaleStart: from.gradualScaleStart.value,
      gradualScaleEnd: from.gradualScaleEnd.value,
      coordinateOption: from.coordinateOption.value,
      scaleSpeed: from.scaleSpeed.value,
      facing: from.facing.value,
      facingEnd: from.facing.value,
      shouldSetBlock: from.shouldSetBlock.value,
      structureName: from.structureName.value,
      isTemplate: from.isTemplate,
    });
  }
}
