import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private auth = inject(AuthService);
  email = '';
  password = '';
  loading = false;

  async login() {
    if (!this.email || !this.password) return;
    this.loading = true;
    await this.auth.login(this.email, this.password);
    this.loading = false;
  }
}