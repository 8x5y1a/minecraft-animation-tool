import { FormControl } from '@angular/forms';

//TODO: Find better name for this
export interface BlockData {
  block: string;
  property: Record<string, string> | undefined;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface BlockCount {
  block: string;
  count: number;
  //icon: string; //TODO: could add the image of the block?
  //category: catergory; Could add a category for filtering?
}

export interface AnimationProperties {
  command: FormControl<'set' | 'display' | 'destroy'>;
  scale: FormControl<number>;
  translation: FormControl<any>; //TODO: Figure out what the types will be for these properties
  timing: FormControl<boolean>;
  speed: FormControl<number>;
  tagList: FormControl<string[]>;
  interlopation: FormControl<any>;
  x: FormControl<number>;
  y: FormControl<number>;
  z: FormControl<number>;
}
