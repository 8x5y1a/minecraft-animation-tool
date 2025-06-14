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
  private themeService = inject(ThemeService);

  title = 'minecraft-animation-tool';
}
