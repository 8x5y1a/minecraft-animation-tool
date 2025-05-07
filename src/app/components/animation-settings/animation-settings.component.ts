import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-animation-settings',
  imports: [CommonModule, MatTabsModule],
  templateUrl: './animation-settings.component.html',
  styleUrl: './animation-settings.component.css',
})
export class AnimationSettingsComponent {}
