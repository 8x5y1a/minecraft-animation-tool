import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { BlockDisplayComponent } from '../block-display/block-display.component';

@Component({
  selector: 'app-steps',
  imports: [
    CommonModule,
    MatButtonModule,
    MatStepperModule,
    BlockDisplayComponent,
  ],
  templateUrl: './steps.component.html',
  styleUrl: './steps.component.css',
})
export class StepsComponent {}
