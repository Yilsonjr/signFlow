import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html'
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