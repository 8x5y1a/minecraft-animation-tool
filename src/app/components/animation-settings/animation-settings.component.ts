import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlockData } from 'src/app/type';
import { MatInput } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

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
  ],
  templateUrl: './animation-settings.component.html',
  styleUrl: './animation-settings.component.css',
})
export class AnimationSettingsComponent {
  protected blockDataList: BlockData[] = [];
  protected scaleInput: FormControl<number> = new FormControl(1, {
    nonNullable: true,
  });
  protected commandSetDisplayToggle: FormControl<string> = new FormControl(
    'set',
    {
      nonNullable: true,
    }
  );

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockDataList: BlockData[]) => {
        this.blockDataList = newBlockDataList;
      });
  }

  //TODO: remove for tab change 
  protected commandChange() {
    console.log(this.commandSetDisplayToggle);
  }

  //TODO: ON tab change, update the properties (all inputs)
}
