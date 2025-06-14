import { Component } from '@angular/core';

import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [MatButton, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
  standalone: true,
})
export class AboutComponent {
  protected readonly githubUrl =
    'https://github.com/8x5y1a/minecraft-animation-tool';
  protected readonly gneissChannelUrl = 'https://www.youtube.com/@gneissname';
  protected readonly sheetUrl =
    'https://docs.google.com/spreadsheets/d/15j8Jb_n9rYhQTGhOZa2U289ytoMmhe5HJ_BYetV7Zdg/edit?gid=167770427#gid=167770427';
  protected readonly videoUrl =
    'https://youtu.be/YbclYBh9n8I?si=avZBt6OKoWTqj2yF';

  protected openGithub(path = ''): void {
    window.open(this.githubUrl + path, '_blank');
  }
}
