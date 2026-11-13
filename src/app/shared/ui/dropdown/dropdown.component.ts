import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, signal } from '@angular/core';

@Component({
  selector: 'bm-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bm-dropdown-container">
      <div
        class="bm-dropdown-trigger"
        (click)="toggle()"
        (keydown.enter)="toggle()"
        (keydown.space)="toggle()"
        tabindex="0"
        role="button"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'true'"
      >
        <ng-content select="[bmDropdownTrigger]"></ng-content>
      </div>

      @if (isOpen()) {
        <div
          class="bm-dropdown-menu"
          [class.align-right]="align === 'right'"
          [style.minWidth]="minWidth"
          role="menu"
          tabindex="-1"
        >
          <ng-content select="[bmDropdownContent]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .bm-dropdown-container {
      position: relative;
      display: inline-block;
    }

    .bm-dropdown-trigger {
      cursor: pointer;
      display: inline-flex;
      outline: none;
      border-radius: var(--bm-radius-md);

      &:focus-visible {
        box-shadow: 0 0 0 2px var(--bm-color-primary-focus);
      }
    }

    .bm-dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 220px;
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      padding: var(--bm-space-1) 0;
      z-index: 1050;
      animation: dropdownSlideFade 140ms cubic-bezier(0.16, 1, 0.3, 1);
      transform-origin: top left;

      &.align-right {
        left: auto;
        right: 0;
        transform-origin: top right;
      }
    }

    @keyframes dropdownSlideFade {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `],
})
export class DropdownComponent {
  @Input() align: 'left' | 'right' = 'right';
  @Input() minWidth: string = '220px';

  readonly isOpen = signal<boolean>(false);

  constructor(private elementRef: ElementRef) {}

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
