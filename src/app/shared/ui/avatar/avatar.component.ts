import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'bm-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="avatarClasses" [title]="name">
      @if (imageUrl) {
        <img [src]="imageUrl" [alt]="name" />
      } @else {
        <span>{{ initials }}</span>
      }
    </div>
  `,
  styles: [`
    div {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--bm-radius-full);
      background-color: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
      font-weight: var(--bm-font-weight-medium);
      user-select: none;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid var(--bm-color-primary-border);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bm-avatar-sm {
      width: 28px;
      height: 28px;
      font-size: 11px;
    }

    .bm-avatar-md {
      width: 36px;
      height: 36px;
      font-size: var(--bm-font-size-xs);
    }

    .bm-avatar-lg {
      width: 44px;
      height: 44px;
      font-size: var(--bm-font-size-sm);
    }
  `],
})
export class AvatarComponent {
  @Input() name = '';
  @Input() imageUrl?: string | null;
  @Input() size: AvatarSize = 'md';

  get initials(): string {
    if (!this.name || this.name.trim().length === 0) return 'BM';
    const parts = this.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get avatarClasses(): string {
    return `bm-avatar-${this.size}`;
  }
}
