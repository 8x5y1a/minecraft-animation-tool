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
