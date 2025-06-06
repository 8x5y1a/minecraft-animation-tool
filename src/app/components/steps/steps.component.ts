import {
  AfterViewInit,
  Component,
  ElementRef,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { BlockDisplayComponent } from '../block-display/block-display.component';
import { AnimationSettingsComponent } from '../animation-settings/animation-settings.component';
import { GenerateCommandComponent } from '../generate-command/generate-command.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { PreferenceService } from 'src/app/services/preference.service';

@Component({
  selector: 'app-steps',
  imports: [
    CommonModule,
    MatButtonModule,
    MatStepperModule,
    BlockDisplayComponent,
    AnimationSettingsComponent,
    GenerateCommandComponent,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  templateUrl: './steps.component.html',
  styleUrl: './steps.component.css',
  standalone: true,
})
export class StepsComponent implements AfterViewInit {
  protected step = signal(0);
  @ViewChild('blockList', { read: ElementRef })
  blockList?: ElementRef<HTMLElement>;

  constructor(protected preferenceService: PreferenceService) {}

  ngAfterViewInit() {
    this.blockList?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
    if (this.preferenceService.skipBlockList) {
      this.step.set(1);
    }
  }

  protected setStep(index: number) {
    this.step.set(index);
  }

  protected nextStep() {
    this.step.update((i) => i + 1);
  }

  protected prevStep() {
    this.step.update((i) => i - 1);
  }
}
