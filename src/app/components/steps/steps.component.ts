import {
  AfterViewInit,
  Component,
  ElementRef,
  signal,
  ViewChild,
  OnDestroy,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { BlockDisplayComponent } from '../block-display/block-display.component';
import { AnimationSettingsComponent } from '../animation-settings/animation-settings.component';
import { GenerateCommandComponent } from '../generate-command/generate-command.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { PreferenceService } from 'src/app/services/preference.service';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatDivider } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
  selector: 'app-steps',
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
  imports: [
    MatButtonModule,
    MatStepperModule,
    BlockDisplayComponent,
    AnimationSettingsComponent,
    GenerateCommandComponent,
    MatExpansionModule,
    MatIconModule,
    MatFormFieldModule,
    MatDivider,
  ],
  templateUrl: './steps.component.html',
  styleUrl: './steps.component.scss',
  standalone: true,
})
export class StepsComponent implements AfterViewInit, OnDestroy {
  protected preferenceService = inject(PreferenceService);
  private focusMonitor = inject(FocusMonitor);
  @ViewChild('stepper', { read: ElementRef })
  private stepperElement?: ElementRef<HTMLElement>;
  @ViewChild('stepper')
  private stepperComponent?: MatStepper;

  protected step = signal(0);
  private stepSub?: Subscription;

  ngAfterViewInit() {
    this.stepperElement?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
    if (this.preferenceService.skipBlockList) {
      this.step.set(1);
      this.stepperComponent?.next();
    }

    this.stepSub = this.stepperComponent?.selectedIndexChange.subscribe(
      (index) => {
        this.step.set(index);
      }
    );

    this.handlingCss();
  }

  /* Adds gradiant background to the header of the stepper and removes all focused classes. */
  private handlingCss() {
    const headerContainer = this.stepperElement?.nativeElement.querySelector(
      '.mat-horizontal-stepper-header-container'
    );
    if (headerContainer) {
      headerContainer.classList.add('background-gradiant');
    }
    const headerElements = document.getElementsByClassName('mat-step-header');
    if (headerElements.length) {
      for (let index = 0; index < headerElements.length; index++) {
        this.focusMonitor.stopMonitoring(headerElements[index] as HTMLElement);
      }
    }
  }

  ngOnDestroy() {
    this.stepSub?.unsubscribe();
  }
}
