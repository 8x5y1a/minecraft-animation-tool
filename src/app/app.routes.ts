import { Route } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { NbtInputComponent } from './components/nbt-input/nbt-input.component';
import { TemplateListComponent } from './components/animation-settings/template-list/template-list.component';

export const appRoutes: Route[] = [
  { path: '', component: NbtInputComponent, pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'templates', component: TemplateListComponent }, //TODO: Temporary to remove (For testing)
];
