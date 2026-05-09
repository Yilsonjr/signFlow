import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { PaymentService } from '../../core/services/payment.service';
import { toast } from '../../shared/utils/toast';
import { PlanType } from '../../core/models';

@Component({
  selector: 'app-lemon-checkout',
  standalone: true,
  templateUrl: './lemon-checkout.component.html',
  styleUrls: ['./lemon-checkout.component.scss']
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