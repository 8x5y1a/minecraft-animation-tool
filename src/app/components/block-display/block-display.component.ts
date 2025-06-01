import {
  AfterViewInit,
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
  protected readonly dataSource = new MatTableDataSource<BlockCount>([]);

  private shouldUpdate: WritableSignal<boolean> = signal(false);

  constructor(
    private nbtDataService: NbtDataService,
    protected preferenceService: PreferenceService
  ) {
    this.nbtDataService.nbtStructureObs
      .pipe(takeUntilDestroyed())
      .subscribe((structureList: NBTStructure[]) => {
        this.structureList = structureList;
        if (!this.structureCtrl.value) {
          this.structureCtrl.setValue(structureList[0]);
        }
      });

    effect(() => {
      if (this.blocListSelected()) {
        this.shouldUpdate.set(true);
      } else if (this.shouldUpdate()) {
        this.shouldUpdate.set(false);
        this.nbtDataService.overrideNBTStructure(this.structureList);
      }
    });
  }

  ngAfterViewInit() {
    this.changeDataSource();
    if (this.preferenceService.autoRemoveAir) {
      this.airBlockFiltered.set(true);
    }
  }

  ngOnDestroy(): void {
    this.dialogSub?.unsubscribe();
  }

  protected applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  protected formatMinecraftName(input: string): string {
    if (!input) {
      return '';
    }
    const key = input.includes(':') ? input.split(':').pop() : input;
    const spaced = key?.replace(/_/g, ' ');
    return spaced?.replace(/\b\w/g, (char) => char.toUpperCase()) ?? '';
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
        const newData = this.dataSource.data.filter((data) => data !== row);
        this.dataSource.data = newData;
        this.structureCtrl.value.blockCount = newData;
      }
    });
  }

  //TODO: rework this signal for multiple NBT
  protected airBlockFiltered = signal(false);
  protected filterAirBlock() {
    const newData = this.dataSource.data.filter(
      (data) => data.block !== 'minecraft:air'
    );
    this.dataSource.data = newData;
    this.structureCtrl.value.blockCount = newData;
    this.airBlockFiltered.set(true);
  }

  protected changeDataSource() {
    this.dataSource.sort = this.sort;
    this.dataSource.data = this.structureCtrl.value.blockCount;
  }
}
