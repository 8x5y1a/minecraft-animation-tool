import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ThemeService } from 'src/app/services/theme.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';

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
    MatSlideToggle,
  ],
  templateUrl: './setting-page.component.html',
  styleUrl: './setting-page.component.css',
})
export class SettingPageComponent {
  constructor(private themeService: ThemeService) {
    this.isDarkModeControl.setValue(this.themeService.theme === 'dark');
  }

  protected isDarkModeControl: FormControl<boolean> = new FormControl(true, {
    nonNullable: true,
  });
  protected selectedSettingPage: FormControl<SettingPage> = new FormControl(
    'theme',
    { nonNullable: true }
  );

  protected onThemeChange() {
    this.themeService.toggle();
  }
}
