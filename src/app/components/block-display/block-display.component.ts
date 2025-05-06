import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlockCount } from 'src/app/type';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-block-display',
  imports: [CommonModule, MatListModule, MatButtonModule],
  templateUrl: './block-display.component.html',
  styleUrl: './block-display.component.css',
})
export class BlockDisplayComponent {
  protected blockList: BlockCount[] = [];

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockList: BlockCount[]) => {
        this.blockList = newBlockList;
      });
  }

  protected createCommands(): void {
    console.log('test')
    
  }
}
