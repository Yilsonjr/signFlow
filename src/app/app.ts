import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NavbarComponent } from './shared/components/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer"></div>
    <div class="loading-overlay" id="loadingOverlay" style="display:none">
      <div class="text-center">
        <div class="spinner-border mb-3" style="width: 3rem; height: 3rem;"></div>
        <div class="loading-text" id="loadingText">Cargando...</div>
      </div>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [``]
})
export class App implements OnInit {
  auth = inject(AuthService);

  async ngOnInit() {
    await this.auth.init();
  }
}