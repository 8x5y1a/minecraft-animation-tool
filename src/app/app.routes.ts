import { Route } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { NbtInputComponent } from './components/nbt-input/nbt-input.component';
import { AnimationPreviewComponent } from './components/animation-preview/animation-preview.component';

export const appRoutes: Route[] = [
  { path: '', component: NbtInputComponent, pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'preview', component: AnimationPreviewComponent },
];
