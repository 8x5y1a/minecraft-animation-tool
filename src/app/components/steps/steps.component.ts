import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { BlockDisplayComponent } from '../block-display/block-display.component';
import { AnimationSettingsComponent } from '../animation-settings/animation-settings.component';

@Component({
  selector: 'app-steps',
  imports: [
    CommonModule,
    MatButtonModule,
    MatStepperModule,
    BlockDisplayComponent,
    AnimationSettingsComponent,
  ],
  templateUrl: './steps.component.html',
  styleUrl: './steps.component.css',
  standalone: true,
})
export class StepsComponent {}
