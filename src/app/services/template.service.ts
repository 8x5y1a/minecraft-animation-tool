import { Injectable } from '@angular/core';
import { AnimationPropertiesModel } from 'src/app/types/AnimationPropertiesModel';
import { AnimationProperties, Template } from 'src/app/types/type';

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  public get templateList(): Template[] {
    return [
      {
        name: 'Gradual Scaling With Real Blocks',
        thumbnail: 'template-images/template.jpg',
        video: 'template-images/scaleup.mp4',
        animationList: this.getAnimationScale(),
        tooltip:
          'Build structure by scaling display block gradually and then setting real interactable blocks. Includes destroy animation with descending scale.',
      },
    ];
  }

  public getAnimationScale(): AnimationProperties[] {
    const up = this.getAnimationDisplayScaleUp();
    const down = this.getAnimationDisplayScaleDown(up);
    return [up, down];
  }

  private getAnimationDisplayScaleUp(): AnimationProperties {
    const defaultAnimation =
      AnimationPropertiesModel.createDefault('animation_1');
    defaultAnimation.command.setValue('display');
    defaultAnimation.scaleOption.setValue('gradual');
    defaultAnimation.gradualScaleStart.setValue(0);
    defaultAnimation.gradualScaleEnd.setValue(1);
    defaultAnimation.scaleSpeed.setValue(5);
    defaultAnimation.name = 'animation_scaleup';
    defaultAnimation.templateName = 'animation_scaleup';
    defaultAnimation.speed.setValue(4);
    defaultAnimation.isTemplate = true;

    const animationDisplayScaleUp: AnimationProperties = {
      ...defaultAnimation,
    };
    return animationDisplayScaleUp;
  }

  private getAnimationDisplayScaleDown(destroy: AnimationProperties) {
    const animationDisplayDown =
      AnimationPropertiesModel.createDestroy(destroy);
    animationDisplayDown.gradualScaleStart.setValue(1);
    animationDisplayDown.gradualScaleEnd.setValue(0);
    animationDisplayDown.speed.setValue(4);
    animationDisplayDown.scaleSpeed.setValue(5);
    animationDisplayDown.isAscending.setValue(false);
    animationDisplayDown.templateName = 'destroy_animation_scaleup';
    animationDisplayDown.isTemplate = true;
    return animationDisplayDown;
  }
}
