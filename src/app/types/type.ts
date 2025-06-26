import { FormControl } from '@angular/forms';

export interface BlockData {
  block: string;
  property: Record<string, string> | undefined;
  position: Coordinates;
  icon?: string;
}

export interface BlockCount {
  block: string;
  count: number;
  icon: string;
}

type FC<T> = FormControl<T>;

export type AnimationProperties = Position &
  Scaling &
  Animation & {
    id: number;
    name: string;
    command: FC<'set' | 'display' | 'destroy' | 'translate'>;
    referenceAnimation: FC<undefined | AnimationProperties>;
    nextAnimation: FC<undefined | AnimationProperties>;
    structureName: FC<string>;
    isTemplate: boolean;
    templateName?: string;
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
  shouldSetBlock: FC<boolean>;
};

export type Animation = {
  timing: FC<boolean>;
  speed: FC<number>;
  animationOrder: FC<'x' | 'y' | 'z' | 'random' | 'fromBlock'>;
  orderFromBlock: FC<string>;
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
  thumbnail: string;
  video: string;
  animationList: AnimationProperties[];
  tooltip?: string;
};

export type CommandGenerated = {
  name: string;
  command: string;
};

export type NBTStructure = {
  name: string;
  blockData: BlockData[];
  blockCount: BlockCount[];
  CoordinateAndBlock: string[];
  animationProperties: AnimationProperties[];
  maxAxis: Coordinates;
  structureSize: Coordinates;
};

export type ParsedStructure = {
  blockPostition: any;
  size: Coordinates;
  palette: any[];
  origin: Coordinates;
};

export type ParsedBlockPosition = {
  pos: [number, number, number];
  state: number;
};
