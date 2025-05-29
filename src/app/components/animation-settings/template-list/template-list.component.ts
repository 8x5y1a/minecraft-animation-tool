import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
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
  private readonly gitHubUrl: string =
    'https://github.com/JeffGamache/minecraft-animation-tool/issues';
  constructor(protected preferenceService: PreferenceService) {}

  protected addTemplate(template: Template) {
    this.templateEmit.emit(template);
  }

  protected openGitHub() {
    window.open(this.gitHubUrl, '_blank', 'noopener,noreferrer');
  }

  protected playVideo() {
    const video = document.querySelector('video');
    if (video instanceof HTMLVideoElement) {
      video.width = document.querySelector('img')?.clientWidth || 0;
      video.height = document.querySelector('img')?.clientHeight || 0;
      video.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    }
  }

  protected pauseVideo() {
    const video = document.querySelector('video');
    if (video instanceof HTMLVideoElement) {
      video.pause();
      video.currentTime = 0;
    }
  }
}
