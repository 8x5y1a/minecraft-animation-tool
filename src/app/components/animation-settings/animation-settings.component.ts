import {
  ChangeDetectorRef,
  Component,
  effect,
  input,
  OnInit,
  signal,
  inject,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { NbtDataService } from 'src/app/services/nbt-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AnimationProperties,
  NBTStructure,
  Template,
} from 'src/app/types/type';
import { AnimationPropertiesModel } from 'src/app/types/AnimationPropertiesModel';
import { MatInput } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TemplateListComponent } from './template-list/template-list.component';
import { PreferenceService } from 'src/app/services/preference.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { take } from 'rxjs';

@Component({
  selector: 'app-animation-settings',
  imports: [
    CommonModule,
    MatTabsModule,
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatInput,
    MatRadioModule,
    MatIcon,
    MatButtonModule,
    MatTooltip,
    MatSlideToggleModule,
    MatSliderModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule,
    MatDivider,
    MatButtonToggleModule,
    TemplateListComponent,
    MatAutocompleteModule,
  ],
  templateUrl: './animation-settings.component.html',
  styleUrl: './animation-settings.component.css',
})
export class AnimationSettingsComponent implements OnInit {
  private nbtDataService = inject(NbtDataService);
  protected preferenceService = inject(PreferenceService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  protected structureList: NBTStructure[] = [];
  protected tabIndex = signal(0);
  public commandsSelected = input(false);
  protected isAddTemplate = false;
  protected isDefaultAnimation = true; // TODO:
  protected previousStructureSelected: Record<number, string | undefined> = {};

  constructor() {
    this.nbtDataService.nbtStructureObs
      .pipe(takeUntilDestroyed())
      .subscribe((structureList: NBTStructure[]) => {
        this.structureList = structureList;
      });

    effect(() => {
      if (this.commandsSelected()) {
        this.nbtDataService.overrideNBTStructure(this.structureList);

        //TODO: This could be changed to an Form Error in the Stepper with ErrorMessage=""
        this.allAnimationProperties.forEach((animation) => {
          if (
            animation.animationOrder.value !== 'fromBlock' ||
            animation.orderFromBlock.value
          ) {
            return;
          }

          const structure = this.findStructureFromName(
            animation.structureName.value
          ) as NBTStructure;
          if (!structure) {
            return;
          }

          animation.orderFromBlock.setValue(structure.CoordinateAndBlock[0]);
        });
      }
    });

    effect(() => {
      //if we set the tab to Add new Animation
      if (this.tabIndex() === this.allAnimationProperties.length) {
        this.isAddTemplate = false;
      }
    });
  }

  ngOnInit(): void {
    this.addAnimation();
    this.previousStructureSelected[
      this.structureList[0].animationProperties[0].id
    ] = this.structureList[0].name;
  }

  protected addAnimation(newAnimation?: AnimationProperties) {
    if (!newAnimation) {
      newAnimation = AnimationPropertiesModel.createDefault(
        this.nbtDataService.getFunctionName(
          this.structureList[0].name,
          '',
          this.structureList
        )
      );
      newAnimation.structureName.setValue(this.structureList[0].name);
    }
    this.structureList[0].animationProperties.push(newAnimation);

    //Work around for tabIndex not updating correctly
    this.tabIndex.set(this.allAnimationProperties.length);
    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.tabIndex.set(this.allAnimationProperties.length - 1);
    });

    this.previousStructureSelected[
      this.structureList[0].animationProperties[0].id
    ] = this.structureList[0].name;

    this.updateAnimationName(
      newAnimation.structureName.value,
      newAnimation.command.value,
      this.allAnimationProperties.length - 1,
      newAnimation.templateName
    );
  }

  protected removeAnimation(index: number, properties: AnimationProperties) {
    const structureName = this.structureList.find((structure) =>
      properties.name.includes(structure.name)
    )?.name;
    const structure = this.findStructureFromName(structureName ?? '') as
      | NBTStructure
      | undefined;

    if (!structure) {
      console.warn(
        'Structure not found for animation removal:',
        properties.name
      );
      return;
    }

    const idx = structure.animationProperties?.findIndex((prop) => {
      return prop.id === properties.id;
    });
    if (idx === -1) return;

    structure.animationProperties.splice(idx, 1);
    this.tabIndex.set(this.allAnimationProperties.length - 1);
  }

  protected formatSpeedSlider(value: number): string {
    return value + '';
  }

  protected addDestroyAnimation(properties: AnimationProperties) {
    const newAnimation = AnimationPropertiesModel.createDestroy(properties);
    const structure = this.findStructureFromName(
      properties.structureName.value
    ) as NBTStructure;

    structure?.animationProperties.push(newAnimation);
    this.tabIndex.set(this.allAnimationProperties.length - 1);

    this.updateAnimationName(
      newAnimation.structureName.value,
      properties.command.value,
      this.allAnimationProperties.length - 1,
      'destroy'
    );
  }

  protected addTemplate(template: Template) {
    template.animationList.forEach((animation) => {
      animation.structureName.setValue(this.structureList[0].name);
      animation.name += '_' + animation.structureName.value;
      this.addAnimation(animation);
    });
  }

  protected displayScaling(properties: AnimationProperties): boolean {
    return (
      properties.command.value === 'display' ||
      (properties.command.value === 'destroy' &&
        properties.removeAnimation.value?.command.value === 'display')
    );
  }

  protected hasDisplayAnimation(): boolean {
    return (
      this.allAnimationProperties.length > 1 &&
      this.allAnimationProperties.some(
        (prop) => prop.command.value === 'display'
      )
    );
  }

  protected updateAnimationName(
    structureName: string,
    command: string,
    index: number,
    templateName: string | undefined = undefined
  ) {
    const newName = this.nbtDataService.getFunctionName(
      structureName,
      command ?? 'set',
      this.structureList,
      templateName
    );
    this.allAnimationProperties[index].name = newName;
    //Necessary
    this.cdr.markForCheck();
  }

  get allAnimationProperties(): AnimationProperties[] {
    return this.structureList
      .flatMap((structure) => structure.animationProperties ?? [])
      .filter((prop): prop is AnimationProperties => !!prop)
      .sort((a, b) => a.id - b.id);
  }

  /**
   * When changing Structure for an animation, transfer the animation to the target Structure container.
   */
  protected transferAnimation(
    targetName: string,
    properties: AnimationProperties,
    index: number
  ) {
    if (this.structureList.length < 1) {
      this.updateAnimationName(
        targetName,
        properties.command.value,
        index,
        properties.isTemplate ? properties.templateName : undefined
      );
      return;
    }

    const previousName =
      this.previousStructureSelected[properties.id] ??
      this.structureList[0].name;

    const targetIndex = this.findStructureFromName(targetName, true) as number;
    const previousIndex = this.findStructureFromName(
      previousName,
      true
    ) as number;

    if (targetIndex === -1 || previousIndex === -1) return;
    const previousProp = this.structureList[previousIndex].animationProperties;
    const targetProp = this.structureList[targetIndex].animationProperties;

    const idx = previousProp.findIndex((prop) => {
      return prop.id === properties.id;
    });

    if (idx === -1) return;

    const [moved] = previousProp
      .splice(idx, 1)
      .filter((prop): prop is AnimationProperties => !!prop);

    targetProp.push(moved);
    this.structureList = [...this.structureList];

    this.updateAnimationName(
      targetName,
      properties.command.value,
      index,
      properties.isTemplate ? properties.templateName : undefined
    );
    this.previousStructureSelected[properties.id] = targetName;
  }

  /** Finds structure from the name. Can choose to return StructureNBT object or the index */
  private findStructureFromName(
    name: string,
    getIndex = false
  ): number | NBTStructure | undefined {
    if (getIndex) {
      const index = this.structureList.findIndex(
        (structure) => structure.name === name
      );
      return index;
    }
    return this.structureList.find((structure) => structure.name === name);
  }

  //TODO: Optimize this function
  protected getBlockList(properties: AnimationProperties): string[] {
    const structure = this.findStructureFromName(
      properties.structureName.value
    ) as NBTStructure | undefined;
    if (!structure) {
      return [];
    }

    const filtered = structure.CoordinateAndBlock.filter((option) =>
      option
        .toLocaleLowerCase()
        .includes(properties.orderFromBlock.value.toLocaleLowerCase())
    );

    return filtered;
  }
}
