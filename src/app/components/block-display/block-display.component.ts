import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  TemplateRef,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlockCount, NBTStructure } from 'src/app/types/type';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { PreferenceService } from 'src/app/services/preference.service';
import { MatOption, MatSelect } from '@angular/material/select';

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
    MatSelect,
    MatOption,
  ],
  templateUrl: './block-display.component.html',
  styleUrl: './block-display.component.css',
  standalone: true,
})
export class BlockDisplayComponent implements AfterViewInit, OnDestroy {
  public blocListSelected = input(false);
  protected structureList: NBTStructure[] = [];
  protected structureCtrl: FormControl<NBTStructure> = new FormControl(
    this.structureList[0],
    { nonNullable: true }
  );

  @ViewChild(MatSort) sort!: MatSort;
  protected readonly displayedColumns: string[] = ['block', 'count', 'Remove'];

  protected airBlockFiltered = signal(false);
  private shouldUpdate: WritableSignal<boolean> = signal(false);

  protected dataSourceList: MatTableDataSource<BlockCount>[] = [];
  protected dataSourceIndex = 0;

  constructor(
    protected nbtDataService: NbtDataService,
    protected preferenceService: PreferenceService,
    private cdr: ChangeDetectorRef
  ) {
    this.nbtDataService.nbtStructureObs
      .pipe(takeUntilDestroyed())
      .subscribe((structureList: NBTStructure[]) => {
        this.structureList = structureList;
        this.structureCtrl.setValue(structureList[0]);

        this.dataSourceList.length = 0;
        this.structureList.forEach((structure) => {
          const newDataSource = new MatTableDataSource<BlockCount>(
            structure.blockCount
          );
          newDataSource.data = structure.blockCount;
          this.dataSourceList.push(newDataSource);
        });
      });

    effect(() => {
      if (this.blocListSelected()) {
        this.shouldUpdate.set(true);
      } else if (this.shouldUpdate()) {
        this.shouldUpdate.set(false);

        this.structureList.forEach((structure, index) => {
          structure.blockCount = this.dataSourceList[index].data;
          const blockSet = new Set(
            this.dataSourceList[index].data.map((block) => block.block)
          );
          structure.blockData = structure.blockData.filter((block) =>
            blockSet.has(block.block)
          );
        });

        this.nbtDataService.overrideNBTStructure(this.structureList);
      }
    });
  }

  ngAfterViewInit() {
    this.changeDataSource(this.structureList[0].name);
    if (this.preferenceService.autoRemoveAir) {
      this.airBlockFiltered.set(true);
    }
  }

  ngOnDestroy(): void {
    this.dialogSub?.unsubscribe();
  }

  protected applyFilter(filterValue: string) {
    this.dataSourceList[this.dataSourceIndex].filter = filterValue
      .trim()
      .toLowerCase();
  }

  @ViewChild('dialogRemove') dialogRemove!: TemplateRef<any>;
  readonly dialog = inject(MatDialog);
  private dialogSub?: Subscription;
  protected dialogRemoveRow(row: BlockCount) {
    const dialogRef = this.dialog.open(this.dialogRemove, {
      width: '250px',
      data: row.block,
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      if (result && row) {
        const newData = this.dataSourceList[this.dataSourceIndex].data.filter(
          (data) => data !== row
        );
        this.dataSourceList[this.dataSourceIndex].data = newData;
      }
    });
  }

  protected filterAirBlock() {
    const dataSource = this.dataSourceList[this.dataSourceIndex];
    const newData = dataSource.data.filter(
      (data) => data.block !== 'minecraft:air'
    );
    dataSource.data = newData;
    this.airBlockFiltered.set(true);
  }

  protected changeDataSource(name: string) {
    this.dataSourceIndex = this.structureList.findIndex(
      (structure) => structure.name === name
    );

    const dataSource = this.dataSourceList[this.dataSourceIndex];
    dataSource.sort = this.sort;

    if (dataSource.data.some((block) => block.block === 'minecraft:air')) {
      this.airBlockFiltered = signal(false);
    }
    this.cdr.detectChanges();
  }
}
