import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private overlay = inject(OverlayContainer);

  private currentTheme: Theme;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | undefined;
    this.currentTheme = stored === 'light' ? 'light' : 'dark';
    this.apply(this.currentTheme);
  }

  get theme(): Theme {
    return this.currentTheme;
  }

  set theme(theme: Theme) {
    if (theme === this.currentTheme) {
      return;
    }
    this.currentTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    this.apply(theme);
  }

  toggle(): void {
    this.theme = this.currentTheme === 'light' ? 'dark' : 'light';
  }

  private apply(theme: Theme) {
    const htmlClasses = document.documentElement.classList;
    htmlClasses.toggle('light-theme', theme === 'light');
    htmlClasses.toggle('dark-theme', theme === 'dark');

    const overlayClasses = this.overlay.getContainerElement().classList;
    overlayClasses.toggle('light-theme', theme === 'light');
    overlayClasses.toggle('dark-theme', theme === 'dark');
  }
}
