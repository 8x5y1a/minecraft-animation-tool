import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlockCount } from 'src/app/type';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-block-display',
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatTableModule,
    MatSortModule,
    MatIcon,
    MatTooltipModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
  ],
  templateUrl: './block-display.component.html',
  styleUrl: './block-display.component.css',
  standalone: true,
})
export class BlockDisplayComponent implements AfterViewInit, OnDestroy {
  protected blockList: BlockCount[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  protected readonly displayedColumns: string[] = ['block', 'count', 'Remove'];
  protected readonly dataSource = new MatTableDataSource<BlockCount>([]);

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockList: BlockCount[]) => {
        this.blockList = newBlockList;
      });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.data = this.blockList;
  }

  ngOnDestroy(): void {
    this.dialogSub?.unsubscribe();
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild('dialogRemove') dialogRemove!: TemplateRef<any>;
  readonly dialog = inject(MatDialog);
  private dialogSub?: Subscription;
  protected dialogRemoveRow(row: BlockCount) {
    const dialogRef = this.dialog.open(this.dialogRemove, {
      width: '250px',
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      if (result && row) {
        const newData = this.dataSource.data.filter((data) => data !== row);
        this.dataSource.data = newData;
      }
    });
  }
}
