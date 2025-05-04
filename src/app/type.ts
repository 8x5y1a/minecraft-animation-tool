export interface block {
  pos: number[];
  state: {
    type: string; // Could specify the strings (e.g 'int', 'string', ...)
    value: number; // This could be potentially different? Need to verify
  };
}

//TODO: Find better name for this
export interface data {
  block: string;
  property: unknown; //Make interface for this?
  count: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
}
