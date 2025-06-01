import { AnimationPropertiesModel } from 'src/app/types/AnimationPropertiesModel';
import { AnimationProperties, Template } from 'src/app/types/type';

const defaultAnimation = AnimationPropertiesModel.createDefault('animation_1');

export const templates: Template[] = [
  {
    name: 'Gradual Scaling With Real Blocks',
    thumbnail: 'template-images/template.jpg',
    video: 'template-images/scaleup.mp4',
    animationList: getAnimationScale(),
    tooltip:
      'Build structure by scaling display block gradually and then setting real interactable blocks. Includes destroy animation with descending scale.',
  },
];
function getAnimationScale(): AnimationProperties[] {
  const up = getAnimationDisplayScaleUp();
  const down = getAnimationDisplayScaleDown(up);
  return [up, down];
}

function getAnimationDisplayScaleUp(): AnimationProperties {
  defaultAnimation.command.setValue('display');
  defaultAnimation.scaleOption.setValue('gradual');
  defaultAnimation.gradualScaleStart.setValue(0);
  defaultAnimation.gradualScaleEnd.setValue(1);
  defaultAnimation.scaleSpeed.setValue(5);
  defaultAnimation.name = 'animation_scaleup';
  defaultAnimation.speed.setValue(4);

  const animationDisplayScaleUp: AnimationProperties = {
    ...defaultAnimation,
  };
  return animationDisplayScaleUp;
}

function getAnimationDisplayScaleDown(destroy: AnimationProperties) {
  const animationDisplayDown = AnimationPropertiesModel.createDestroy(destroy);
  animationDisplayDown.gradualScaleStart.setValue(1);
  animationDisplayDown.gradualScaleEnd.setValue(0);
  animationDisplayDown.speed.setValue(4);
  animationDisplayDown.scaleSpeed.setValue(5);
  animationDisplayDown.isAscending.setValue(false);
  return animationDisplayDown;
}
