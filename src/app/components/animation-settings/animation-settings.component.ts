import { Component, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnimationProperties, BlockData } from 'src/app/types/type';
import { MatInput } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-animation-settings',
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatInput,
    MatRadioModule,
    MatIcon,
    MatButton,
    MatTooltip,
    MatSlideToggleModule,
    MatSliderModule,
    MatCardModule,
    MatSelectModule,
  ],
  templateUrl: './animation-settings.component.html',
  styleUrl: './animation-settings.component.css',
})
export class AnimationSettingsComponent {
  protected blockDataList: BlockData[] = [];
  protected animationPropertiesList: AnimationProperties[] = [];
  protected tabIndex = signal(0);
  public commandsSelected = input(false);

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockDataList: BlockData[]) => {
        this.blockDataList = newBlockDataList;
      });

    this.addAnimation();

    effect(() => {
      if (this.commandsSelected()) {
        this.nbtDataService.setPropertiesList(this.animationPropertiesList);
      }
    });
  }

  protected addAnimation() {
    const newAnimation: AnimationProperties = {
      name: 'animation_' + (this.animationPropertiesList.length + 1),
      command: new FormControl('set', { nonNullable: true }),
      scale: new FormControl(1, { nonNullable: true }),
      translation: new FormControl(0, { nonNullable: true }),
      timing: new FormControl(true, { nonNullable: true }),
      interlopation: new FormControl(0, { nonNullable: true }),
      speed: new FormControl(1, { nonNullable: true }),
      x: new FormControl(0, { nonNullable: true }),
      y: new FormControl(56, { nonNullable: true }), //TODO: Reset to 0
      z: new FormControl(0, { nonNullable: true }),
      removeAnimation: new FormControl(undefined, { nonNullable: true }),
      coordinateList: [],
      animationOrder: new FormControl('y', { nonNullable: true }),
      isAscending: new FormControl(true, { nonNullable: true }),
      randomness: new FormControl(0, { nonNullable: true }),
    };
    this.animationPropertiesList.push(newAnimation);
    this.tabIndex.set(this.animationPropertiesList.length - 1);
  }

  protected removeAnimation(index: number) {
    this.animationPropertiesList.splice(index, 1);
  }

  protected formatSpeedSlider(value: number): string {
    return value + '';
  }

  protected addDestroyAnimation(properties: AnimationProperties) {
    const newAnimation: AnimationProperties = {
      name: 'destroy_' + properties.name,
      command: new FormControl('destroy', { nonNullable: true }),
      scale: new FormControl(properties.scale.value, { nonNullable: true }),
      translation: new FormControl(properties.translation.value, {
        nonNullable: true,
      }),
      timing: new FormControl(properties.timing.value, { nonNullable: true }),
      interlopation: new FormControl(properties.interlopation.value, {
        nonNullable: true,
      }),
      speed: new FormControl(properties.speed.value, { nonNullable: true }),
      x: new FormControl(properties.x.value, { nonNullable: true }),
      y: new FormControl(properties.y.value, { nonNullable: true }),
      z: new FormControl(properties.z.value, { nonNullable: true }),
      removeAnimation: new FormControl(properties, { nonNullable: true }),
      coordinateList: [],
      animationOrder: new FormControl(properties.animationOrder.value ?? 'y', {
        nonNullable: true,
      }),
      isAscending: new FormControl(properties.isAscending.value ?? true, {
        nonNullable: true,
      }),
      randomness: new FormControl(properties.randomness.value ?? 0, {
        nonNullable: true,
      }),
    };
    this.animationPropertiesList.push(newAnimation);
    this.tabIndex.set(this.animationPropertiesList.length - 1);
  }
}
