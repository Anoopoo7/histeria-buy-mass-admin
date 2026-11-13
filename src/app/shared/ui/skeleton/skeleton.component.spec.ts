import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default text variant', () => {
    expect(component).toBeTruthy();
    expect(component.variant).toBe('text');
    expect(component.computedHeight).toBe('16px');
    expect(component.computedWidth).toBe('100%');
    expect(component.items.length).toBe(1);
  });

  it('should support circular variant with defaults', () => {
    component.variant = 'circular';
    fixture.detectChanges();

    expect(component.computedHeight).toBe('40px');
    expect(component.computedWidth).toBe('40px');
    expect(component.computedBorderRadius).toBe('9999px');
  });

  it('should generate multiple items when count > 1', () => {
    component.count = 4;
    fixture.detectChanges();

    expect(component.items.length).toBe(4);
    const elements = fixture.nativeElement.querySelectorAll('.bm-skeleton-shimmer');
    expect(elements.length).toBe(4);
  });

  it('should render table-row variant with specified columns', () => {
    component.variant = 'table-row';
    component.count = 3;
    component.columns = 6;
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.bm-skeleton-table-row');
    expect(rows.length).toBe(3);
    const firstRowCols = rows[0].querySelectorAll('.bm-skeleton-col');
    expect(firstRowCols.length).toBe(6);
  });

  it('should render card variant', () => {
    component.variant = 'card';
    component.count = 2;
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.bm-skeleton-card');
    expect(cards.length).toBe(2);
  });
});
