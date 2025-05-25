import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Template } from 'src/app/types/type';
import { templates } from './templates';
import { MatTooltip } from '@angular/material/tooltip';
import { PreferenceService } from 'src/app/services/preference.service';

@Component({
  selector: 'app-template-list',
  imports: [CommonModule, MatTooltip],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css',
})
export class TemplateListComponent {
  @Output() templateEmit: EventEmitter<Template> = new EventEmitter();
  protected templateList: Template[] = templates;

  constructor(protected preferenceService: PreferenceService) {}

  protected addTemplate(template: Template) {
    this.templateEmit.emit(template);
  }
}
