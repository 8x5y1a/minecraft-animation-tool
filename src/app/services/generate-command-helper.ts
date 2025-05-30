import { Injectable } from '@angular/core';
import { AnimationProperties } from '../types/type';

@Injectable({ providedIn: 'root' })
export class GenerateCommandHelperService {
  /**
   * Builds the block properties string for set/display commands.
   */
  public buildPropertiesString(
    properties: Record<string, string>,
    isSet: boolean
  ): string {
    if (isSet) {
      const propertiesEntries = Object.entries(properties)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      return propertiesEntries ? `[${propertiesEntries}]` : '';
    }

    const propertiesEntries = Object.entries(properties)
      .map(([key, value]) => `${key}:"${value}"`)
      .join(', ');
    return propertiesEntries ? `,Properties:{${propertiesEntries}}` : '';
  }

  /**
   * Builds the transformation string for display commands.
   */
  public buildTransformation(
    coords: [number, number, number],
    isTiming: boolean,
    scaleValue: number,
    isDisplay = true
  ): string {
    if (!isDisplay) return '';
    const [x, y, z] = coords;
    const translation = isTiming ? `[${x}f,${y}f,${z}f]` : `[0f,0f,0f]`;
    return (
      `,transformation:{` +
      `left_rotation:[0f,0f,0f,1f],` +
      `right_rotation:[0f,0f,0f,1f],` +
      `translation:${translation},` +
      `scale:[${scaleValue}f,${scaleValue}f,${scaleValue}f]}`
    );
  }

  /**
   * Transforms block coordinates based on scale and offset.
   */
  public transformCoordinates(
    blockCoordinate: number,
    coordinate: number,
    scale: number
  ): number {
    return parseFloat(
      (blockCoordinate * (scale === 0 ? 1 : scale) + coordinate).toFixed(4)
    );
  }

  /**
   * Calculates the offset for scale.
   */
  public calculateScaleOffset(x: number, scale: number): number {
    if (x < 0) {
      return -1 * (x + 0.5 - scale / 2);
    }
    return x + 0.5 - scale / 2;
  }

  /**
   * Generates the interpolation command for gradual scale animations.
   * This command is used to smoothly transition the scale of the block display.
   * This will also be used for coordinate interpolation eventually.
   */
  public getInterpolation(
    timing: string,
    isTiming: boolean,
    transform: string,
    properties: AnimationProperties,
    coordinateTag: string,
    enableLatency = true
  ): string {
    let timingWithLatency = isTiming ? timing : '';
    if (enableLatency) {
      timingWithLatency = this.addLatency(timingWithLatency);
    }
    const newTransform = this.addTranslation(
      transform,
      properties.gradualScaleStart.value,
      properties.gradualScaleEnd.value,
      properties
    );
    return `${timingWithLatency} execute as @e[tag=${coordinateTag}] run data merge entity @s {start_interpolation:-1,interpolation_duration:${properties.scaleSpeed.value}${newTransform}}`;
  }

  /**
   * Adds translation and scale to the transformation string for interpolation.
   */
  public addTranslation(
    transform: string,
    start: number,
    end: number,
    properties: AnimationProperties
  ): string {
    const transformNoScale = transform.substring(
      0,
      transform.indexOf('translation')
    );
    const endScale = end;
    const offset = this.calculateScaleOffset(0, start);
    const translation = start > 1 ? offset : offset * -1;

    let x = 0;
    let y = 0;
    let z = 0;
    if (properties.coordinateOption.value === 'gradual') {
      x = properties.endX.value - properties.x.value;
      y = properties.endY.value - properties.y.value;
      z = properties.endZ.value - properties.z.value;
    }

    const newTransform =
      transformNoScale +
      `translation:[${translation + x}f,${y}f,${
        translation + z
      }f],scale:[${endScale}f,${endScale}f,${endScale}f]}`;
    return newTransform;
  }

  /**
   * Adds latency to the timing string.
   * This is used to ensure that the next command waits for the previous one to finish.
   */
  public addLatency(timing: string, increment = 1): string {
    return timing.replace(
      /matches (\d+)/,
      (_, num) => `matches ${parseInt(num) + increment}`
    );
  }

  /**
   * Generates a unique coordinate tag for a block.
   */
  public getCoordinateTag(x: number, y: number, z: number): string {
    return `${x}-${y}-${z}`;
  }
}
