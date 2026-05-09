import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/components/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  auth = inject(AuthService);

  async ngOnInit() {
    await this.auth.init();
  }
}