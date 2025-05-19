import { FormControl } from '@angular/forms';
import { AnimationProperties } from './type.js';

export class AnimationPropertiesModel implements AnimationProperties {
  name: string;
  command: FormControl<'set' | 'display' | 'destroy'>;
  removeAnimation: FormControl<undefined | AnimationProperties>;
  nextAnimation: FormControl<undefined | AnimationProperties>;

  // Position
  x: FormControl<number>;
  y: FormControl<number>;
  z: FormControl<number>;
  coordinateList: { x: number; y: number; z: number }[] = [];
  coordinateOption: FormControl<'static' | 'gradual'>;
  endX: FormControl<number>;
  endY: FormControl<number>;
  endZ: FormControl<number>;

  // Scaling
  scaleOption: FormControl<'static' | 'gradual'>;
  staticScale: FormControl<number>;
  gradualScaleStart: FormControl<number>;
  gradualScaleEnd: FormControl<number>;

  // Animation
  timing: FormControl<boolean>;
  speed: FormControl<number>;
  animationOrder: FormControl<'x' | 'y' | 'z' | 'random'>;
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
      animationOrder: 'x' | 'y' | 'z' | 'random';
      isAscending: boolean;
      randomness: number;
      scaleOption: 'static' | 'gradual';
      staticScale: number;
      gradualScaleStart: number;
      gradualScaleEnd: number;
      coordinateOption: 'static' | 'gradual';
      removeAnimation?: AnimationProperties;
      nextAnimation?: AnimationProperties;
    }
  ) {
    this.name = name;
    this.command = new FormControl(params.command, { nonNullable: true });
    this.timing = new FormControl(params.timing, { nonNullable: true });
    this.speed = new FormControl(params.speed, { nonNullable: true });

    this.x = new FormControl(params.x, { nonNullable: true });
    this.y = new FormControl(params.y, { nonNullable: true });
    this.z = new FormControl(params.z, { nonNullable: true });
    this.endX = new FormControl(params.endX, { nonNullable: true });
    this.endY = new FormControl(params.endY, { nonNullable: true });
    this.endZ = new FormControl(params.endZ, { nonNullable: true });

    this.removeAnimation = new FormControl(params.removeAnimation, {
      nonNullable: true,
    });

    this.animationOrder = new FormControl(params.animationOrder, {
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
  }

  static createDefault(index: number) {
    return new AnimationPropertiesModel(`animation_${index}`, {
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
      isAscending: true,
      randomness: 0,
      scaleOption: 'static',
      staticScale: 1,
      gradualScaleStart: 1,
      gradualScaleEnd: 1,
      coordinateOption: 'static',
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
      isAscending: from.isAscending.value,
      randomness: from.randomness.value,
      scaleOption: from.scaleOption.value,
      staticScale: from.staticScale.value,
      gradualScaleStart: from.gradualScaleStart.value,
      gradualScaleEnd: from.gradualScaleEnd.value,
      coordinateOption: from.coordinateOption.value,
    });
  }
}
