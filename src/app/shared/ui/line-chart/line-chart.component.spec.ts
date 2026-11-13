import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent, LineChartPoint } from './line-chart.component';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;

  const mockData: LineChartPoint[] = [
    { label: 'Mon', dateLabel: '10 Nov 2026', series1Value: 5, series2Value: 2, revenue: 2500 },
    { label: 'Tue', dateLabel: '11 Nov 2026', series1Value: 12, series2Value: 8, revenue: 5400 },
    { label: 'Wed', dateLabel: '12 Nov 2026', series1Value: 9, series2Value: 4, revenue: 4100 },
    { label: 'Today', dateLabel: '13 Nov 2026', series1Value: 15, series2Value: 10, revenue: 7800 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    component.data = mockData;
    component.ngOnChanges({
      data: new SimpleChange(null, mockData, true),
    });
    fixture.detectChanges();
  });

  it('should create line chart component', () => {
    expect(component).toBeTruthy();
  });

  it('should compute total counts and revenue correctly', () => {
    expect(component.totalSeries1()).toBe(41); // 5 + 12 + 9 + 15
    expect(component.totalSeries2()).toBe(24); // 2 + 8 + 4 + 10
    expect(component.totalRevenue()).toBe(19800); // 2500 + 5400 + 4100 + 7800
  });

  it('should generate valid cubic bezier paths for series 1 and series 2', () => {
    const path1 = component.linePathSeries1();
    expect(path1).toContain('M');
    expect(path1).toContain('C');

    const path2 = component.linePathSeries2();
    expect(path2).toContain('M');
    expect(path2).toContain('C');
  });

  it('should generate area paths when showArea is true', () => {
    const area1 = component.areaPathSeries1();
    expect(area1).toContain('Z');
  });

  it('should display tooltip when a point is hovered and clear on mouseleave', () => {
    component.setHover(1);
    fixture.detectChanges();

    expect(component.hoveredIndex()).toBe(1);
    expect(component.hoveredPoint()?.dateLabel).toBe('11 Nov 2026');

    component.clearHover();
    fixture.detectChanges();

    expect(component.hoveredIndex()).toBeNull();
    expect(component.hoveredPoint()).toBeNull();
  });
});
