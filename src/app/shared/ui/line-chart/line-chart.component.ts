import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';

export interface LineChartPoint {
  label: string;
  dateLabel: string;
  series1Value: number;
  series2Value?: number;
  revenue?: number;
}

@Component({
  selector: 'bm-line-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bm-line-chart-container">
      <div class="bm-chart-svg-wrap">
        <svg
          class="bm-chart-svg"
          viewBox="0 0 640 220"
          preserveAspectRatio="none"
          (mouseleave)="clearHover()"
        >
          <defs>
            <!-- Gradient for Series 1 (Primary - Orders) -->
            <linearGradient id="bm-chart-grad-series1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [attr.stop-color]="series1Color" stop-opacity="0.25" />
              <stop offset="100%" [attr.stop-color]="series1Color" stop-opacity="0.0" />
            </linearGradient>

            <!-- Gradient for Series 2 (Secondary - Pickups) -->
            <linearGradient id="bm-chart-grad-series2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [attr.stop-color]="series2Color" stop-opacity="0.18" />
              <stop offset="100%" [attr.stop-color]="series2Color" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Horizontal Grid Lines & Y-Axis Labels -->
          @for (grid of gridLines(); track grid.y) {
            <g class="bm-grid-group">
              <line
                [attr.x1]="paddingLeft"
                [attr.y1]="grid.y"
                [attr.x2]="width - paddingRight"
                [attr.y2]="grid.y"
                stroke="var(--bm-color-border, #E2E8F0)"
                stroke-dasharray="3 3"
                stroke-width="1"
              />
              <text
                [attr.x]="paddingLeft - 8"
                [attr.y]="grid.y + 4"
                text-anchor="end"
                class="bm-y-label"
              >
                {{ grid.label }}
              </text>
            </g>
          }

          <!-- Series 1 Area Fill -->
          @if (showArea && areaPathSeries1()) {
            <path
              [attr.d]="areaPathSeries1()"
              fill="url(#bm-chart-grad-series1)"
            />
          }

          <!-- Series 2 Area Fill -->
          @if (showArea && hasSeries2() && areaPathSeries2()) {
            <path
              [attr.d]="areaPathSeries2()"
              fill="url(#bm-chart-grad-series2)"
            />
          }

          <!-- Series 2 Line (Pickups) -->
          @if (hasSeries2() && linePathSeries2()) {
            <path
              [attr.d]="linePathSeries2()"
              fill="none"
              [attr.stroke]="series2Color"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          }

          <!-- Series 1 Line (Orders) -->
          @if (linePathSeries1()) {
            <path
              [attr.d]="linePathSeries1()"
              fill="none"
              [attr.stroke]="series1Color"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          }

          <!-- Active Hover Guideline -->
          @if (hoveredPoint()) {
            <line
              [attr.x1]="hoveredPoint()!.x"
              [attr.y1]="paddingTop"
              [attr.x2]="hoveredPoint()!.x"
              [attr.y2]="height - paddingBottom"
              stroke="var(--bm-color-text-muted, #94A3B8)"
              stroke-width="1.5"
              stroke-dasharray="4 4"
            />
          }

          <!-- Data Points (Circles) & Hover Triggers -->
          @for (pt of computedPoints(); track pt.label; let i = $index) {
            <!-- Series 2 Dot -->
            @if (hasSeries2()) {
              <circle
                [attr.cx]="pt.x"
                [attr.cy]="pt.y2"
                [attr.r]="hoveredIndex() === i ? 5.5 : 3.5"
                [attr.fill]="series2Color"
                stroke="#FFFFFF"
                stroke-width="2"
                class="bm-chart-dot"
              />
            }

            <!-- Series 1 Dot -->
            <circle
              [attr.cx]="pt.x"
              [attr.cy]="pt.y1"
              [attr.r]="hoveredIndex() === i ? 6 : 4"
              [attr.fill]="series1Color"
              stroke="#FFFFFF"
              stroke-width="2"
              class="bm-chart-dot"
            />

            <!-- Invisible Wide Hitbox for Hover -->
            <rect
              [attr.x]="pt.x - colWidth() / 2"
              [attr.y]="paddingTop"
              [attr.width]="colWidth()"
              [attr.height]="height - paddingTop - paddingBottom"
              fill="transparent"
              style="cursor: pointer;"
              (mouseenter)="setHover(i)"
            />

            <!-- X-Axis Label -->
            <text
              [attr.x]="pt.x"
              [attr.y]="height - paddingBottom + 18"
              text-anchor="middle"
              class="bm-x-label"
              [class.bm-x-label-active]="hoveredIndex() === i"
            >
              {{ pt.label }}
            </text>
          }
        </svg>

        <!-- Floating Tooltip Card -->
        @if (hoveredPoint()) {
          <div
            class="bm-chart-tooltip"
            [style.left.%]="(hoveredPoint()!.x / width) * 100"
            [style.top.px]="tooltipTop()"
          >
            <div class="bm-tooltip-date">{{ hoveredPoint()!.dateLabel }}</div>
            <div class="bm-tooltip-row">
              <span class="bm-tooltip-indicator" [style.background-color]="series1Color"></span>
              <span class="bm-tooltip-name">{{ series1Name }}:</span>
              <strong>{{ hoveredPoint()!.series1Value }}</strong>
            </div>
            @if (hasSeries2()) {
              <div class="bm-tooltip-row">
                <span class="bm-tooltip-indicator" [style.background-color]="series2Color"></span>
                <span class="bm-tooltip-name">{{ series2Name }}:</span>
                <strong>{{ hoveredPoint()!.series2Value }}</strong>
              </div>
            }
            @if (hoveredPoint()!.revenue && hoveredPoint()!.revenue! > 0) {
              <div class="bm-tooltip-revenue">
                Sales: <strong>₹{{ hoveredPoint()!.revenue | number }}</strong>
              </div>
            }
          </div>
        }
      </div>

      <!-- Chart Legend & Real Insights Row -->
      <div class="bm-chart-footer">
        <div class="bm-chart-legend">
          <div class="bm-legend-item">
            <span class="bm-legend-dot" [style.background-color]="series1Color"></span>
            <span>{{ series1Name }} ({{ totalSeries1() }})</span>
          </div>
          @if (hasSeries2()) {
            <div class="bm-legend-item">
              <span class="bm-legend-dot" [style.background-color]="series2Color"></span>
              <span>{{ series2Name }} ({{ totalSeries2() }})</span>
            </div>
          }
        </div>

        @if (totalRevenue() > 0) {
          <div class="bm-legend-revenue">
            Period Volume: <strong>₹{{ totalRevenue() | number }}</strong>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .bm-line-chart-container {
      display: flex;
      flex-direction: column;
      gap: var(--bm-space-3, 12px);
      width: 100%;
      position: relative;
    }

    .bm-chart-svg-wrap {
      position: relative;
      width: 100%;
      height: 220px;
    }

    .bm-chart-svg {
      width: 100%;
      height: 100%;
      display: block;
      overflow: visible;
    }

    .bm-y-label {
      font-size: 11px;
      fill: var(--bm-color-text-muted, #94A3B8);
      font-family: inherit;
    }

    .bm-x-label {
      font-size: 11px;
      fill: var(--bm-color-text-secondary, #64748B);
      font-family: inherit;
      transition: fill 150ms ease, font-weight 150ms ease;

      &.bm-x-label-active {
        fill: var(--bm-color-text-primary, #0F172A);
        font-weight: 600;
      }
    }

    .bm-chart-dot {
      transition: r 150ms ease;
    }

    // Floating Tooltip
    .bm-chart-tooltip {
      position: absolute;
      transform: translate(-50%, -105%);
      background: #0F172A;
      color: #FFFFFF;
      padding: 8px 12px;
      border-radius: var(--bm-radius-md, 8px);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
      font-size: 12px;
      pointer-events: none;
      z-index: 10;
      white-space: nowrap;
      display: flex;
      flex-direction: column;
      gap: 4px;
      animation: bm-tooltip-in 120ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes bm-tooltip-in {
      from {
        opacity: 0;
        transform: translate(-50%, -95%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -105%);
      }
    }

    .bm-tooltip-date {
      font-size: 11px;
      color: #94A3B8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding-bottom: 3px;
      margin-bottom: 2px;
    }

    .bm-tooltip-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bm-tooltip-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .bm-tooltip-name {
      color: #CBD5E1;
    }

    .bm-tooltip-revenue {
      font-size: 11px;
      color: #4ADE80;
      border-top: 1px dashed rgba(255, 255, 255, 0.15);
      padding-top: 3px;
      margin-top: 2px;
    }

    // Footer & Legend
    .bm-chart-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 6px;
      border-top: 1px solid var(--bm-color-border, #E2E8F0);
      font-size: var(--bm-font-size-xs, 12px);
    }

    .bm-chart-legend {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .bm-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--bm-color-text-secondary, #64748B);
    }

    .bm-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .bm-legend-revenue {
      color: var(--bm-color-text-secondary, #64748B);

      strong {
        color: var(--bm-color-primary, #176B50);
      }
    }
  `],
})
export class LineChartComponent implements OnChanges {
  @Input() data: LineChartPoint[] = [];
  @Input() series1Name = 'Orders Placed';
  @Input() series2Name = 'Customer Pickups';
  @Input() series1Color = '#176B50';
  @Input() series2Color = '#22C55E';
  @Input() showArea = true;

  readonly width = 640;
  readonly height = 220;
  readonly paddingLeft = 36;
  readonly paddingRight = 24;
  readonly paddingTop = 20;
  readonly paddingBottom = 32;

  readonly pointsSignal = signal<LineChartPoint[]>([]);
  readonly hoveredIndex = signal<number | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.pointsSignal.set(this.data || []);
    }
  }

  readonly hasSeries2 = computed(() => {
    return this.pointsSignal().some((p) => p.series2Value !== undefined);
  });

  readonly totalSeries1 = computed(() => {
    return this.pointsSignal().reduce((sum, p) => sum + (p.series1Value || 0), 0);
  });

  readonly totalSeries2 = computed(() => {
    return this.pointsSignal().reduce((sum, p) => sum + (p.series2Value || 0), 0);
  });

  readonly totalRevenue = computed(() => {
    return this.pointsSignal().reduce((sum, p) => sum + (p.revenue || 0), 0);
  });

  readonly maxVal = computed(() => {
    const pts = this.pointsSignal();
    if (pts.length === 0) return 5;
    let max = 0;
    for (const p of pts) {
      if (p.series1Value > max) max = p.series1Value;
      if (p.series2Value && p.series2Value > max) max = p.series2Value;
    }
    // Round up to clean integer step
    if (max <= 5) return 5;
    if (max <= 10) return 10;
    if (max <= 20) return 20;
    if (max <= 50) return 50;
    return Math.ceil(max / 10) * 10;
  });

  readonly gridLines = computed(() => {
    const max = this.maxVal();
    const plotHeight = this.height - this.paddingTop - this.paddingBottom;
    const steps = 4;
    const lines = [];

    for (let i = 0; i <= steps; i++) {
      const val = Math.round((max / steps) * i);
      const y = this.height - this.paddingBottom - (i / steps) * plotHeight;
      lines.push({
        y: Math.round(y),
        label: val.toString(),
      });
    }
    return lines;
  });

  readonly colWidth = computed(() => {
    const count = this.pointsSignal().length;
    if (count <= 1) return this.width - this.paddingLeft - this.paddingRight;
    const plotWidth = this.width - this.paddingLeft - this.paddingRight;
    return plotWidth / (count - 1);
  });

  readonly computedPoints = computed(() => {
    const pts = this.pointsSignal();
    const count = pts.length;
    const plotWidth = this.width - this.paddingLeft - this.paddingRight;
    const plotHeight = this.height - this.paddingTop - this.paddingBottom;
    const max = this.maxVal();

    return pts.map((pt, i) => {
      const x =
        count === 1
          ? this.paddingLeft + plotWidth / 2
          : this.paddingLeft + (i / (count - 1)) * plotWidth;

      const normY1 = max > 0 ? pt.series1Value / max : 0;
      const y1 = this.height - this.paddingBottom - normY1 * plotHeight;

      const normY2 = max > 0 ? (pt.series2Value || 0) / max : 0;
      const y2 = this.height - this.paddingBottom - normY2 * plotHeight;

      return {
        ...pt,
        x: Math.round(x * 10) / 10,
        y1: Math.round(y1 * 10) / 10,
        y2: Math.round(y2 * 10) / 10,
      };
    });
  });

  readonly linePathSeries1 = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0) return '';
    return this.buildSmoothPath(pts.map((p) => ({ x: p.x, y: p.y1 })));
  });

  readonly areaPathSeries1 = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0) return '';
    const line = this.linePathSeries1();
    const bottomY = this.height - this.paddingBottom;
    return `${line} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`;
  });

  readonly linePathSeries2 = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0 || !this.hasSeries2()) return '';
    return this.buildSmoothPath(pts.map((p) => ({ x: p.x, y: p.y2 })));
  });

  readonly areaPathSeries2 = computed(() => {
    const pts = this.computedPoints();
    if (pts.length === 0 || !this.hasSeries2()) return '';
    const line = this.linePathSeries2();
    const bottomY = this.height - this.paddingBottom;
    return `${line} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`;
  });

  readonly hoveredPoint = computed(() => {
    const idx = this.hoveredIndex();
    if (idx === null) return null;
    return this.computedPoints()[idx] || null;
  });

  readonly tooltipTop = computed(() => {
    const pt = this.hoveredPoint();
    if (!pt) return 40;
    return Math.max(10, Math.min(pt.y1, pt.y2) - 10);
  });

  setHover(index: number): void {
    this.hoveredIndex.set(index);
  }

  clearHover(): void {
    this.hoveredIndex.set(null);
  }

  /**
   * Generates a clean cubic Bézier spline through the given points.
   */
  private buildSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      // Tangent controls with smoothing tension (factor of 6)
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }
}
