import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { PaymentService } from '../../core/services/payment.service';
import { toast } from '../../shared/utils/toast';
import { PlanType } from '../../core/models';

@Component({
  selector: 'app-lemon-checkout',
  standalone: true,
  template: `
    <div class="lemon-checkout-wrapper">
      <button class="lemon-checkout-btn" [class.loading]="isLoading()" (click)="handleCheckout()" [disabled]="isLoading()">
        @if (isLoading()) {
          <span class="spinner"></span>
          <span>Abriendo checkout...</span>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{{ buttonText }}</span>
        }
      </button>
      <p class="lemon-checkout-note">Pago seguro via Lemon Squeezy</p>
    </div>
  `,
  styles: [`
    .lemon-checkout-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      min-height: 70px;
      justify-content: center;
    }
    .lemon-checkout-btn {
      width: 100%;
      padding: 12px 24px;
      background: linear-gradient(135deg, #FFC233 0%, #FF8A00 100%);
      color: #1a1a2e;
      border: none;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(255, 194, 51, 0.3);
    }
    .lemon-checkout-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(255, 194, 51, 0.5);
    }
    .lemon-checkout-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .lemon-checkout-btn.loading {
      background: linear-gradient(135deg, #e6b02e 0%, #e67a00 100%);
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid #1a1a2e;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .lemon-checkout-note {
      font-size: 0.75rem;
      color: var(--text-3, #94a3b8);
      text-align: center;
    }
  `]
})
export class LemonCheckoutComponent {
  @Input() planId: PlanType = 'pro';
  @Input() buttonText = 'Suscribirme';
  @Output() checkoutOpened = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  private paymentService = inject(PaymentService);
  isLoading = signal(false);

  async handleCheckout() {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    try {
      await this.paymentService.openCheckout(this.planId);
      this.checkoutOpened.emit();
    } catch (e: any) {
      this.error.emit(e.message || 'Error abriendo checkout');
      toast('Error al abrir checkout', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}