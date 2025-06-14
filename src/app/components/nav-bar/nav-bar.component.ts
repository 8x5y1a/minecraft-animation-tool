import { Component, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { SettingPageComponent } from '../setting-page/setting-page.component';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, MatIcon],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
  standalone: true,
})
export class NavBarComponent {
  readonly dialog = inject(MatDialog);

  protected openSettings() {
    const dialogRef = this.dialog.open(SettingPageComponent, {
      width: '70%',
      height: '80%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
