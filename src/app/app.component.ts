import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { ThemeService } from './services/theme.service';

@Component({
  imports: [RouterModule, NavBarComponent, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent {
  protected themeService = inject(ThemeService);
  protected title = 'minecraft-animation-tool';
}
