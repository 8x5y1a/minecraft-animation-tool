import { AnimationPropertiesModel } from 'src/app/types/AnimationPropertiesModel';
import { AnimationProperties, Template } from 'src/app/types/type';

const defaultAnimation = AnimationPropertiesModel.createDefault(0);

export const templates: Template[] = [
  {
    name: 'Scale Consctuction Animation',
    thumbnail: 'template-images/template.jpg',
    video: 'template-images/scaleup.mp4',
    animationList: getAnimationScale(),
    tooltip: 'A description for the template',
    previewMode: true,
  },
  {
    name: 'Template 2',
    thumbnail: 'template-images/template.jpg',
    video: 'template-images/scaleup.mp4',
    animationList: [],
    previewMode: true,
  },
  {
    name: 'Template 3',
    thumbnail: 'template-images/template.jpg',
    video: 'template-images/scaleup.mp4',
    animationList: [],
    previewMode: true,
  },
  {
    name: 'Template 4',
    thumbnail: 'template-images/template.jpg',
    video: 'template-images/scaleup.mp4',
    animationList: [],
    previewMode: true,
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
  //TODO: delete displayblock after
  return animationDisplayDown;
}
