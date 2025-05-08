import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlockData } from 'src/app/type';
import { MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-animation-settings',
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatButton,
    MatInput,
  ],
  templateUrl: './animation-settings.component.html',
  styleUrl: './animation-settings.component.css',
})
export class AnimationSettingsComponent {
  private command = 'scale';
  protected blockDataList: BlockData[] = [];
  protected scaleInput: FormControl<number> = new FormControl(1, {
    nonNullable: true,
  });

  @ViewChild('commandTextArea')
  commandTextArea!: ElementRef<HTMLTextAreaElement>;

  constructor(private nbtDataService: NbtDataService) {
    this.nbtDataService.blockDataListObs
      .pipe(takeUntilDestroyed())
      .subscribe((newBlockDataList: BlockData[]) => {
        this.blockDataList = newBlockDataList;
      });
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
