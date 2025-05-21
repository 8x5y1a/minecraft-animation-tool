import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

export type SettingPage = 'theme' | 'preferences';

@Component({
  selector: 'app-setting-page',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    ReactiveFormsModule,
    MatIcon,
    MatTooltip,
  ],
  templateUrl: './setting-page.component.html',
  styleUrl: './setting-page.component.css',
})
export class SettingPageComponent {
  protected selectedSettingPage: FormControl<SettingPage> = new FormControl(
    'theme',
    { nonNullable: true }
  );
}
