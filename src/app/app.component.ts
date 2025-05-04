import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbtInputComponent } from './components/nbt-input/nbt-input.component';
import { BlockDisplayComponent } from "./components/block-display/block-display.component";

@Component({
  imports: [RouterModule, NbtInputComponent, BlockDisplayComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'minecraft-animation-tool';
}
