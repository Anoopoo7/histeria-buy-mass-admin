import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(type: ToastType, message: string, title?: string, durationMs = 5000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastMessage = { id, type, title, message, durationMs };

    this._toasts.update((current) => [...current, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(message: string, title?: string): void {
    this.show('success', message, title);
  }

  warning(message: string, title?: string): void {
    this.show('warning', message, title);
  }

  danger(message: string, title?: string): void {
    this.show('danger', message, title);
  }

  info(message: string, title?: string): void {
    this.show('info', message, title);
  }

  dismiss(id: string): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
