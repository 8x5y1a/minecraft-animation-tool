import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlockCount, BlockData } from 'src/app/type';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';

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
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
  ],
  templateUrl: './block-display.component.html',
  styleUrl: './block-display.component.css',
  standalone: true,
})
export class BlockDisplayComponent implements AfterViewInit {
  protected blockList: BlockCount[] = [];
  protected blockDataList: BlockData[] = [];
  private command = 'scale';
  protected hasCommand = false;
  protected scaleInput: FormControl<number> = new FormControl(1, {
    nonNullable: true,
  });

  @ViewChild('commandTextArea')
  commandTextArea!: ElementRef<HTMLTextAreaElement>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['block', 'count'];
  dataSource = new MatTableDataSource<BlockCount>([]);

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockList: BlockCount[]) => {
        this.blockList = newBlockList;
      });

    this.nbtDataService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockDataList: BlockData[]) => {
        this.blockDataList = newBlockDataList;
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.data = this.blockList;
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  //TODO: Create a strong builder that will don't require switch case what's over
  protected createCommands(): void {
    let commands = '';
    switch (this.command) {
      case 'setblock': {
        commands = this.setBlock();
        break;
      }
      case 'scale': {
        commands = this.scaleCommand();
        break;
      }
      default: {
        break;
      }
    }
    this.commandTextArea.nativeElement.value = commands;
  }

  //Could move this to a service (Probably should)
  private setBlock(): string {
    const commands: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }) => {
        const entries = Object.entries(property ?? {})
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');

        return `${this.command} ~${x} ~${y} ~${z} ${block}[${entries}] replace`;
      }
    );
    if (commands.length) {
      this.commandTextArea.nativeElement.value = commands.join('\n');
    }

    console.log(commands);
    return commands.join('\n');
  }

  private scaleCommand(): string {
    const commands: string[] = this.blockDataList.map(
      ({ block, position: { x, y, z }, property }) => {
        const entries = Object.entries(property ?? {})
          .map(([k, v]) => `${k}:"${v}"`)
          .join(', ');

        let properties = '';
        if (entries) {
          properties = `,Properties:{${entries}}`;
        }

        let scale = '';
        if (this.scaleInput.value !== 1) {
          scale = `,transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[${this.scaleInput.value}f,${this.scaleInput.value}f,${this.scaleInput.value}f]}`;

          x = parseFloat((x * this.scaleInput.value).toFixed(4));
          y = parseFloat((y * this.scaleInput.value).toFixed(4));
          z = parseFloat((z * this.scaleInput.value).toFixed(4));
        }

        return (
          `summon block_display ~${x} ~${y} ~${z} {block_state:{Name:"${
            block + '"' + properties
          }}` +
          scale +
          `}`
        );
      }
    );
    if (commands.length) {
      this.commandTextArea.nativeElement.value = commands.join('\n');
    }

    console.log(commands);
    return commands.join('\n');
  }
}
