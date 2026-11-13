import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, signal } from '@angular/core';

@Component({
  selector: 'bm-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bm-dropdown-container">
      <div class="bm-dropdown-trigger" (click)="toggle()">
        <ng-content select="[bmDropdownTrigger]"></ng-content>
      </div>

      @if (isOpen()) {
        <div class="bm-dropdown-menu" [class.align-right]="align === 'right'">
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
    }

    .bm-dropdown-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 200px;
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      box-shadow: var(--bm-shadow-md);
      padding: var(--bm-space-1) 0;
      z-index: 1000;
      animation: dropdownFadeIn 120ms ease-out;

      &.align-right {
        left: auto;
        right: 0;
      }
    }

    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
})
export class DropdownComponent {
  @Input() align: 'left' | 'right' = 'right';

  readonly isOpen = signal<boolean>(false);

  constructor(private elementRef: ElementRef) {}

  toggle(): void {
    this.isOpen.update((v) => !v);
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
