import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  name = '';
  email = '';
  password = '';
  loading = false;

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

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