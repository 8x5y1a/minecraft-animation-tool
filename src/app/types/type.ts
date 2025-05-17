import { FormControl } from '@angular/forms';

//TODO: Find better name for this
export interface BlockData {
  block: string;
  property: Record<string, string> | undefined;
  position: Coordinates
}

export interface BlockCount {
  block: string;
  count: number;
  //icon: string; //TODO: could add the image of the block?
  //category: catergory; Could add a category for filtering?
}

export interface AnimationProperties {
  name: string;
  command: FormControl<'set' | 'display' | 'destroy'>;
  scale: FormControl<number>;
  translation: FormControl<any>; //TODO: Figure out what the types will be for these properties
  timing: FormControl<boolean>;
  speed: FormControl<number>;
  //tagList: FormControl<string[]>; //Might not be needed afterall
  interlopation: FormControl<any>; //??
  x: FormControl<number>; //Could encapsulate x,y,z in a coordinates or position type (to call use in different types?)
  y: FormControl<number>;
  z: FormControl<number>;
  removeAnimation: FormControl<undefined | AnimationProperties>;
  coordinateList: { x: number; y: number; z: number }[];
  animationOrder: FormControl<'x' | 'y' | 'z' | 'random'>;
  isAscending: FormControl<boolean>;
  randomness: FormControl<number>;
}

export interface Coordinates {
  x: number;
  y: number;
  z: number;
}
