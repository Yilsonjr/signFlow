import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="row justify-content-center py-5">
        <div class="col-md-5">
          <div class="card border-0 shadow">
            <div class="card-body p-4">
              <h3 class="mb-1" style="font-family:'Playfair Display',serif">Crear cuenta</h3>
              <p class="text-muted small mb-4">Empieza gratis con 3 documentos al mes</p>
              <div class="mb-3">
                <label class="form-label">Nombre completo</label>
                <input type="text" class="form-control" [(ngModel)]="name" placeholder="Juan Pérez">
              </div>
              <div class="mb-3">
                <label class="form-label">Correo electrónico</label>
                <input type="email" class="form-control" [(ngModel)]="email" placeholder="tu@email.com">
              </div>
              <div class="mb-4">
                <label class="form-label">Contraseña</label>
                <input type="password" class="form-control" [(ngModel)]="password" placeholder="Mínimo 8 caracteres" (keydown.enter)="register()">
              </div>
              <button class="btn btn-dark w-100" (click)="register()" [disabled]="loading">
                @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
                Crear cuenta
              </button>
              <div class="text-center my-3 text-muted small">o</div>
              <button class="btn btn-outline-secondary w-100" routerLink="/login">Ya tengo cuenta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  name = '';
  email = '';
  password = '';
  loading = false;

  async register() {
    if (!this.name || !this.email || !this.password) return;
    if (this.password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    this.loading = true;
    await this.auth.register(this.name, this.email, this.password);
    this.loading = false;
  }
}
