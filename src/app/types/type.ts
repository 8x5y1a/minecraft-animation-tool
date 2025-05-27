import { FormControl } from '@angular/forms';

//TODO: Find better name for this
export interface BlockData {
  block: string;
  property: Record<string, string> | undefined;
  position: Coordinates;
}

export interface BlockCount {
  block: string;
  count: number;
  //icon: string; //TODO: could add the image of the block?
  //category: catergory; Could add a category for filtering?
}

type FC<T> = FormControl<T>;

export type AnimationProperties = Position &
  Scaling &
  Animation & {
    name: string;
    command: FC<'set' | 'display' | 'destroy'>;
    removeAnimation: FC<undefined | AnimationProperties>;
    nextAnimation: FC<undefined | AnimationProperties>;
  };

export type Position = {
  x: FC<number>;
  y: FC<number>;
  z: FC<number>;
  coordinateList: Coordinates[];
  coordinateOption: FC<'static' | 'gradual'>;
  endX: FC<number>;
  endY: FC<number>;
  endZ: FC<number>;
  facing: FC<'north' | 'south' | 'east' | 'west'>;
  facingEnd: FC<'north' | 'south' | 'east' | 'west'>;
};

export type Scaling = {
  scaleOption: FC<'static' | 'gradual'>;
  staticScale: FC<number>;
  gradualScaleStart: FC<number>;
  gradualScaleEnd: FC<number>;
  scaleSpeed: FC<number>;
};

export type Animation = {
  timing: FC<boolean>;
  speed: FC<number>;
  animationOrder: FC<'x' | 'y' | 'z' | 'random'>;
  isAscending: FC<boolean>;
  randomness: FC<number>;
};

export type Coordinates = {
  x: number;
  y: number;
  z: number;
};

export type Template = {
  name: string;
  gif: string;
  animationList: AnimationProperties[];
  tooltip?: string;
};

export type CommandGenerated = {
  name: string;
  command: string;
};
