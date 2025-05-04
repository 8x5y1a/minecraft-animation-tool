export interface block  {
    pos: number[],
    state: {
        type: string // Could specify the strings (e.g 'int', 'string', ...) 
        value: number // This could be potentially different? Need to verify
    }
}