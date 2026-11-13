import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Check, ChevronDown, LucideAngularModule, Search, X } from 'lucide-angular';

export interface SelectOption<T = any> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

@Component({
  selector: 'bm-select',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="bm-select-container"
      [class.bm-select-disabled]="disabled"
      [class.has-error]="!!error"
      [class.is-open]="isOpen()"
      [attr.id]="id ? id + '-container' : null"
    >
      @if (label) {
        <label [for]="id" class="bm-select-label" (click)="toggleDropdown()">
          {{ label }}
          @if (required) {
            <span class="bm-required-dot" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="bm-select-trigger-wrapper">
        <button
          #triggerBtn
          type="button"
          [id]="id"
          class="bm-select-trigger"
          [class.has-value]="selectedValue() !== null && selectedValue() !== undefined && selectedValue() !== ''"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-haspopup]="'listbox'"
          [attr.aria-label]="label || placeholder"
          [disabled]="disabled"
          (click)="toggleDropdown()"
          (keydown)="handleTriggerKeydown($event)"
        >
          <div class="bm-select-content-preview">
            <ng-content select="[bmLeading]"></ng-content>
            <span
              class="bm-select-value-text"
              [class.is-placeholder]="selectedValue() === null || selectedValue() === undefined || selectedValue() === ''"
            >
              {{ displayLabel() || placeholder }}
            </span>
          </div>

          <div class="bm-select-actions">
            @if (clearable && selectedValue() && !disabled) {
              <span
                role="button"
                tabindex="0"
                class="bm-select-clear-btn"
                (click)="clearSelection($event)"
                (keydown.enter)="clearSelection($event)"
                aria-label="Clear selection"
              >
                <lucide-icon [img]="XIcon" [size]="14"></lucide-icon>
              </span>
            }

            <span class="bm-select-chevron" [class.is-rotated]="isOpen()">
              <lucide-icon [img]="ChevronDownIcon" [size]="16"></lucide-icon>
            </span>
          </div>
        </button>

        <!-- Dropdown Menu Popover -->
        @if (isOpen()) {
          <div class="bm-select-popover" role="listbox" (click)="$event.stopPropagation()">
            @if (isSearchable()) {
              <div class="bm-select-search-box">
                <lucide-icon [img]="SearchIcon" [size]="14" class="bm-search-icon"></lucide-icon>
                <input
                  #searchInput
                  type="text"
                  class="bm-search-input"
                  [placeholder]="searchPlaceholder"
                  [value]="searchQuery()"
                  (input)="onSearchInput($event)"
                  (keydown)="handleSearchKeydown($event)"
                />
                @if (searchQuery()) {
                  <button
                    type="button"
                    class="bm-search-clear"
                    (click)="searchQuery.set('')"
                    aria-label="Clear filter"
                  >
                    <lucide-icon [img]="XIcon" [size]="12"></lucide-icon>
                  </button>
                }
              </div>
            }

            <div class="bm-select-options-list" tabindex="-1">
              @if (filteredOptions().length === 0) {
                <div class="bm-select-empty">
                  <span>{{ emptyMessage }}</span>
                </div>
              } @else {
                @for (opt of filteredOptions(); track opt.value; let i = $index) {
                  <div
                    class="bm-select-option"
                    [class.is-selected]="opt.value === selectedValue()"
                    [class.is-highlighted]="i === highlightedIndex()"
                    [class.is-disabled]="opt.disabled"
                    role="option"
                    [attr.aria-selected]="opt.value === selectedValue()"
                    (click)="selectOption(opt)"
                    (mouseenter)="highlightedIndex.set(i)"
                  >
                    <div class="bm-option-text-group">
                      <span class="bm-option-label">{{ opt.label }}</span>
                      @if (opt.description) {
                        <span class="bm-option-desc">{{ opt.description }}</span>
                      }
                    </div>

                    @if (opt.value === selectedValue()) {
                      <lucide-icon [img]="CheckIcon" [size]="16" class="bm-option-check"></lucide-icon>
                    }
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

      @if (error) {
        <p class="bm-select-error" role="alert">
          {{ error }}
        </p>
      } @else if (hint) {
        <p class="bm-select-hint">
          {{ hint }}
        </p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .bm-select-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;
      position: relative;
    }

    .bm-select-label {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      display: flex;
      align-items: center;
      gap: 3px;
      cursor: pointer;
      user-select: none;
    }

    .bm-required-dot {
      color: var(--bm-color-danger);
    }

    .bm-select-trigger-wrapper {
      position: relative;
      width: 100%;
    }

    .bm-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 38px;
      padding: 0 var(--bm-space-3);
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      font-family: inherit;
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      text-align: left;
      cursor: pointer;
      outline: none;
      transition: border-color var(--bm-transition-fast), box-shadow var(--bm-transition-fast), background-color var(--bm-transition-fast);

      &:hover:not(:disabled) {
        border-color: #CBD5E1;
      }

      &:focus,
      &:focus-visible {
        border-color: var(--bm-color-primary);
        box-shadow: 0 0 0 3px var(--bm-color-primary-focus);
      }

      &:disabled {
        background-color: var(--bm-color-surface-subtle);
        cursor: not-allowed;
        opacity: 0.65;
        border-color: var(--bm-color-border);
      }
    }

    .bm-select-container.is-open .bm-select-trigger {
      border-color: var(--bm-color-primary);
      box-shadow: 0 0 0 3px var(--bm-color-primary-focus);
    }

    .bm-select-container.has-error .bm-select-trigger {
      border-color: var(--bm-color-danger);

      &:focus,
      &:focus-visible {
        box-shadow: 0 0 0 3px var(--bm-color-danger-focus);
      }
    }

    .bm-select-content-preview {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    .bm-select-value-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);

      &.is-placeholder {
        color: var(--bm-color-text-muted);
      }
    }

    .bm-select-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: var(--bm-space-2);
      flex-shrink: 0;
    }

    .bm-select-clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: var(--bm-radius-full);
      color: var(--bm-color-text-muted);
      cursor: pointer;

      &:hover {
        background-color: var(--bm-color-surface-subtle);
        color: var(--bm-color-text-primary);
      }
    }

    .bm-select-chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--bm-color-text-secondary);
      transition: transform 150ms ease;

      &.is-rotated {
        transform: rotate(180deg);
        color: var(--bm-color-primary);
      }
    }

    // Dropdown Popover
    .bm-select-popover {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: popoverFadeIn 120ms ease-out;
    }

    @keyframes popoverFadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    // Search filter box
    .bm-select-search-box {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: 8px 10px;
      border-bottom: 1px solid var(--bm-color-border);
      background-color: var(--bm-color-surface);
    }

    .bm-search-icon {
      color: var(--bm-color-text-muted);
      flex-shrink: 0;
    }

    .bm-search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-primary);
      font-family: inherit;

      &::placeholder {
        color: var(--bm-color-text-muted);
      }
    }

    .bm-search-clear {
      background: none;
      border: none;
      color: var(--bm-color-text-muted);
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: var(--bm-color-text-primary);
      }
    }

    // Option List
    .bm-select-options-list {
      max-height: 240px;
      overflow-y: auto;
      padding: 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background-color: #CBD5E1;
        border-radius: 3px;
      }
    }

    .bm-select-empty {
      padding: var(--bm-space-4);
      text-align: center;
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-muted);
    }

    .bm-select-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-radius: var(--bm-radius-sm);
      cursor: pointer;
      user-select: none;
      transition: background-color var(--bm-transition-fast), color var(--bm-transition-fast);

      &:hover,
      &.is-highlighted {
        background-color: var(--bm-color-surface-subtle);
      }

      &.is-selected {
        background-color: var(--bm-color-primary-soft);
        color: var(--bm-color-primary);

        .bm-option-label {
          font-weight: var(--bm-font-weight-medium);
          color: var(--bm-color-primary);
        }
      }

      &.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    }

    .bm-option-text-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .bm-option-label {
      font-size: var(--bm-font-size-sm);
      color: var(--bm-color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bm-option-desc {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
    }

    .bm-option-check {
      color: var(--bm-color-primary);
      flex-shrink: 0;
      margin-left: var(--bm-space-2);
    }

    .bm-select-error {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-danger);
      margin: 0;
    }

    .bm-select-hint {
      font-size: var(--bm-font-size-xs);
      color: var(--bm-color-text-secondary);
      margin: 0;
    }
  `],
})
export class SelectComponent implements ControlValueAccessor, OnChanges {
  @Input() id: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = 'Select an option';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() clearable: boolean = false;
  @Input() searchable?: boolean;
  @Input() searchPlaceholder: string = 'Search options...';
  @Input() emptyMessage: string = 'No options found';
  @Input() error: string | null = null;
  @Input() hint: string | null = null;

  @Input() set options(value: Array<string | number | SelectOption>) {
    this.rawOptions.set(value || []);
  }

  @Input() set value(val: any) {
    this.writeValue(val);
  }

  @Output() readonly valueChange = new EventEmitter<any>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('triggerBtn') triggerBtn?: ElementRef<HTMLButtonElement>;

  readonly ChevronDownIcon = ChevronDown;
  readonly CheckIcon = Check;
  readonly SearchIcon = Search;
  readonly XIcon = X;

  readonly rawOptions = signal<Array<string | number | SelectOption>>([]);
  readonly selectedValue = signal<any>(null);
  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly highlightedIndex = signal<number>(-1);

  // Normalized options
  readonly normalizedOptions = computed<SelectOption[]>(() => {
    return this.rawOptions().map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { label: String(opt), value: opt };
      }
      return opt;
    });
  });

  // Determines if search is active (either explicitly set or if options count > 6)
  readonly isSearchable = computed<boolean>(() => {
    if (this.searchable !== undefined) return this.searchable;
    return this.normalizedOptions().length > 6;
  });

  // Filtered options based on search query
  readonly filteredOptions = computed<SelectOption[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const opts = this.normalizedOptions();
    if (!q) return opts;
    return opts.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  });

  // Display label for selected value
  readonly displayLabel = computed<string>(() => {
    const val = this.selectedValue();
    if (val === null || val === undefined || val === '') return '';
    const match = this.normalizedOptions().find((opt) => opt.value === val);
    return match ? match.label : String(val);
  });

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.selectedValue() !== null) {
      // Re-validate highlight
      this.updateHighlightedIndex();
    }
  }

  writeValue(value: any): void {
    this.selectedValue.set(value);
    this.updateHighlightedIndex();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled && this.isOpen()) {
      this.close();
    }
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.disabled) return;
    this.isOpen.set(true);
    this.searchQuery.set('');
    this.updateHighlightedIndex();

    // Auto-focus search input if searchable
    setTimeout(() => {
      if (this.isSearchable() && this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 50);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.highlightedIndex.set(-1);
    this.onTouched();
  }

  selectOption(opt: SelectOption): void {
    if (opt.disabled) return;
    this.selectedValue.set(opt.value);
    this.onChange(opt.value);
    this.valueChange.emit(opt.value);
    this.close();
    this.triggerBtn?.nativeElement.focus();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    this.selectedValue.set(null);
    this.onChange(null);
    this.valueChange.emit(null);
    this.onTouched();
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.highlightedIndex.set(0);
  }

  handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault();
        this.open();
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    const opts = this.filteredOptions();
    if (opts.length === 0) {
      if (event.key === 'Escape') {
        this.close();
        this.triggerBtn?.nativeElement.focus();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update((curr) => (curr + 1) % opts.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update((curr) => (curr <= 0 ? opts.length - 1 : curr - 1));
        break;
      case 'Enter':
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx >= 0 && idx < opts.length) {
          this.selectOption(opts[idx]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        this.triggerBtn?.nativeElement.focus();
        break;
    }
  }

  private updateHighlightedIndex(): void {
    const val = this.selectedValue();
    const opts = this.filteredOptions();
    const idx = opts.findIndex((o) => o.value === val);
    this.highlightedIndex.set(idx >= 0 ? idx : 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
