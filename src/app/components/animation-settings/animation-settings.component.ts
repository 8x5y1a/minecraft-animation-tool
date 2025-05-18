import { Component, effect, input, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnimationProperties, BlockData } from 'src/app/types/type';
import { AnimationPropertiesModel } from 'src/app/types/AnimationPropertiesModel';
import { MatInput } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

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
    MatChipsModule,
    MatDivider,
    MatButtonToggleModule,
  ],
  templateUrl: './animation-settings.component.html',
  styleUrl: './animation-settings.component.css',
})
export class AnimationSettingsComponent implements OnDestroy {
  protected blockDataList: BlockData[] = [];
  protected animationPropertiesList: AnimationProperties[] = [];
  protected tabIndex = signal(0);
  public commandsSelected = input(false);
  private subscriptionList: Subscription[] = [];

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

  ngOnDestroy(): void {
    this.subscriptionList.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  protected addAnimation() {
    const index = this.animationPropertiesList.length + 1;
    const newAnimation = AnimationPropertiesModel.createDefault(index)
    const commandSub = newAnimation.command.valueChanges.subscribe(
      (commandSelected) => {
        if (!commandSelected) {
          newAnimation.command.setValue('set');
        }
      }
    );
    this.subscriptionList.push(commandSub);

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
    const newAnimation = AnimationPropertiesModel.createDestroy(properties);
    this.animationPropertiesList.push(newAnimation);
    this.tabIndex.set(this.animationPropertiesList.length - 1);
  }
}
