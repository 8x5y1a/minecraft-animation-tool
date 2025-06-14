import { Component, inject } from '@angular/core';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ThemeService } from 'src/app/services/theme.service';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { PreferenceService } from 'src/app/services/preference.service';

export type SettingPage = 'theme' | 'preferences';

@Component({
  selector: 'app-setting-page',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    ReactiveFormsModule,
    MatIcon,
    MatSlideToggle
],
  templateUrl: './setting-page.component.html',
  styleUrl: './setting-page.component.css',
})
export class SettingPageComponent {
  private themeService = inject(ThemeService);
  protected preferenceService = inject(PreferenceService);

  constructor() {
    this.isDarkModeControl.setValue(this.themeService.theme === 'dark');
    this.isTooltipDisabledControl.setValue(
      this.preferenceService.isDisableTooltips
    );
    this.autoRemoveControl.setValue(this.preferenceService.autoRemoveAir);
    this.hideHowToControl.setValue(this.preferenceService.hideHowTo);
    this.skipBlockListControl.setValue(this.preferenceService.skipBlockList);
  }

  protected isDarkModeControl: FormControl<boolean> = new FormControl(true, {
    nonNullable: true,
  });
  protected selectedSettingPage: FormControl<SettingPage> = new FormControl(
    'theme',
    { nonNullable: true }
  );
  protected isTooltipDisabledControl: FormControl<boolean> = new FormControl(
    false,
    {
      nonNullable: true,
    }
  );
  protected autoRemoveControl: FormControl<boolean> = new FormControl(false, {
    nonNullable: true,
  });
  protected hideHowToControl: FormControl<boolean> = new FormControl(false, {
    nonNullable: true,
  });
  protected skipBlockListControl: FormControl<boolean> = new FormControl(
    false,
    {
      nonNullable: true,
    }
  );

  protected onThemeChange() {
    this.themeService.toggle();
  }
}
