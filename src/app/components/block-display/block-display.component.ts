import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-block-display',
  imports: [CommonModule, MatListModule],
  templateUrl: './block-display.component.html',
  styleUrl: './block-display.component.css',
})
export class BlockDisplayComponent {
  protected blockList: unknown[] = []; //TODO: Typing

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockList: unknown) => {
        this.blockList = newBlockList as unknown[];
      });
  }
}
