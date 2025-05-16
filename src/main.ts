import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';


bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);


// Keep mat-input from adding a placeholder for errors / hints div under each inputs
bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: 'dynamic'
      }
    }
  ],
});