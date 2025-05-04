import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbtInputComponent } from './nbt-input/nbt-input.component';

@Component({
  imports: [RouterModule, NbtInputComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'minecraft-animation-tool';
}
