import { Component, EventEmitter, Output } from '@angular/core';

import { Template } from 'src/app/types/type';
import { MatTooltip } from '@angular/material/tooltip';
import { PreferenceService } from 'src/app/services/preference.service';
import { TemplateService } from '../../../services/template.service';

@Component({
  selector: 'app-template-list',
  imports: [MatTooltip],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css',
})
export class TemplateListComponent {
  @Output() templateEmit: EventEmitter<Template> = new EventEmitter();
  protected templateList: Template[] = [];
  private readonly gitHubUrl: string =
    'https://github.com/8x5y1a/minecraft-animation-tool/issues';
  constructor(
    protected preferenceService: PreferenceService,
    private templateService: TemplateService
  ) {
    this.templateList = this.templateService.templateList;
  }

  protected addTemplate(template: Template) {
    this.templateEmit.emit(template);
  }

  protected openGitHub() {
    window.open(this.gitHubUrl, '_blank', 'noopener,noreferrer');
  }
}
