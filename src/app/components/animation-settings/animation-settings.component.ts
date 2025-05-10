import { Component, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnimationProperties, BlockData } from 'src/app/type';
import { MatInput } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';

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
      command: new FormControl('set', { nonNullable: true }),
      scale: new FormControl(1, { nonNullable: true }),
      translation: new FormControl(0, { nonNullable: true }),
      timing: new FormControl(true, { nonNullable: true }),
      tagList: new FormControl([], { nonNullable: true }),
      interlopation: new FormControl(0, { nonNullable: true }),
      speed: new FormControl(1, { nonNullable: true }),
    };
    this.animationPropertiesList.push(newAnimation);
    this.tabIndex.set(this.animationPropertiesList.length - 1);
  }

  //TODO: remove for tab change
  protected commandChange() {
    console.log();
  }

  //TODO: ON Mat-accordion change, update the properties (all inputs)

  protected removeAnimation(index: number) {
    this.animationPropertiesList.splice(index, 1);
  }

  protected formatSpeedSlider(value: number): string {
    return value + '';
  }
}
