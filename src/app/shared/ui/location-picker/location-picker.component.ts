import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import {
  Compass,
  Crosshair,
  ExternalLink,
  Info,
  Key,
  Layers,
  LucideAngularModule,
  MapPin,
  RefreshCw,
} from 'lucide-angular';
import { GoogleMapsLoaderService, GoogleMapsStatus } from '../../../core/services/google-maps-loader.service';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export const KERALA_CITY_PRESETS: Array<{ name: string; lat: number; lng: number }> = [
  { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { name: 'Kozhikode', lat: 11.2588, lng: 75.7804 },
  { name: 'Trivandrum', lat: 8.5241, lng: 76.9366 },
  { name: 'Thrissur', lat: 10.5276, lng: 76.2144 },
  { name: 'Kannur', lat: 11.8745, lng: 75.3704 },
  { name: 'Kollam', lat: 8.8932, lng: 76.6141 },
  { name: 'Palakkad', lat: 10.7867, lng: 76.6548 },
  { name: 'Wayanad', lat: 11.6854, lng: 76.132 },
];

@Component({
  selector: 'bm-location-picker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bm-location-picker-card">
      <div class="bm-picker-header">
        <div class="bm-header-title-row">
          <lucide-icon [img]="MapPinIcon" [size]="18" class="text-primary"></lucide-icon>
          <span class="bm-picker-title">Store Physical Geo-Location</span>
          <span class="bm-coord-pill">
            Lat: {{ currentLat().toFixed(4) }} | Lng: {{ currentLng().toFixed(4) }}
          </span>
        </div>

        <div class="bm-header-actions">
          <button
            type="button"
            class="bm-icon-action-btn"
            (click)="detectCurrentLocation()"
            [disabled]="isDetectingGps()"
            title="Use current GPS device location"
          >
            <lucide-icon
              [img]="CrosshairIcon"
              [size]="14"
              [class.bm-spin]="isDetectingGps()"
            ></lucide-icon>
            <span>{{ isDetectingGps() ? 'Detecting...' : 'Detect GPS' }}</span>
          </button>

          <a
            [href]="googleMapsExternalUrl()"
            target="_blank"
            rel="noopener noreferrer"
            class="bm-icon-action-btn bm-ext-link"
            title="Preview in Google Maps"
          >
            <lucide-icon [img]="ExternalLinkIcon" [size]="14"></lucide-icon>
            <span>Open Map</span>
          </a>
        </div>
      </div>

      <!-- Quick Kerala City Presets -->
      <div class="bm-presets-bar">
        <span class="bm-presets-label">Kerala Presets:</span>
        <div class="bm-presets-scroll">
          @for (city of cityPresets; track city.name) {
            <button
              type="button"
              class="bm-preset-chip"
              [class.is-active]="isCloseTo(city.lat, city.lng)"
              (click)="selectPreset(city.lat, city.lng)"
            >
              {{ city.name }}
            </button>
          }
        </div>
      </div>

      <!-- Map Display Area -->
      <div class="bm-map-viewport-wrapper">
        <!-- Live Google Map Container -->
        <div
          #mapCanvas
          class="bm-google-map-canvas"
          [style.display]="mapsStatus() === 'loaded' ? 'block' : 'none'"
        ></div>

        <!-- Fallback / Setup Notice when Google Maps key is missing or loading -->
        @if (mapsStatus() !== 'loaded') {
          <div class="bm-map-fallback-view">
            <div class="bm-fallback-grid-bg">
              <div class="bm-radar-circle circle-1"></div>
              <div class="bm-radar-circle circle-2"></div>
              <div class="bm-radar-circle circle-3"></div>
              <div class="bm-crosshair-line horizontal"></div>
              <div class="bm-crosshair-line vertical"></div>

              <!-- Pinned Location Point -->
              <div class="bm-fallback-pin">
                <lucide-icon [img]="MapPinIcon" [size]="28" class="bm-pin-svg"></lucide-icon>
                <div class="bm-pin-pulse"></div>
              </div>
            </div>

            <!-- Informational Banner -->
            <div class="bm-fallback-overlay-box">
              <div class="bm-fallback-icon-wrap">
                <lucide-icon [img]="KeyIcon" [size]="18"></lucide-icon>
              </div>
              <div class="bm-fallback-text-wrap">
                <h4 class="bm-fallback-title">
                  {{ mapsStatus() === 'loading' ? 'Loading Google Maps SDK...' : 'Google Maps Integration' }}
                </h4>
                <p class="bm-fallback-desc">
                  @if (mapsStatus() === 'no_key') {
                    Google Maps API key can be set in <code>.env</code> as <code>GOOGLE_MAPS_API_KEY=your_key</code>.
                    You can still pick coordinates by clicking the preset cities above or using GPS detection.
                  } @else if (mapsStatus() === 'error') {
                    {{ mapsLoader.errorMessage() || 'Unable to authenticate with Google Maps. Verify key restrictions.' }}
                  } @else {
                    Initializing interactive map canvas...
                  }
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Interactive Map Instructions overlay -->
        @if (mapsStatus() === 'loaded' && !readonly) {
          <div class="bm-map-tip-pill">
            <lucide-icon [img]="InfoIcon" [size]="12"></lucide-icon>
            <span>Click map or drag pin to position store</span>
          </div>
        }
      </div>

      <!-- Location Guidance Footer -->
      <div class="bm-picker-footer">
        <span class="bm-guide-text">
          Accurate coordinates allow local shoppers in your panchayath / municipality to discover your group pools and route store pickups.
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .bm-location-picker-card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-lg);
      background-color: var(--bm-color-surface);
      overflow: hidden;
      box-shadow: var(--bm-shadow-xs);
    }

    .bm-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--bm-space-3);
      padding: var(--bm-space-3) var(--bm-space-4);
      border-bottom: 1px solid var(--bm-color-border);
      background-color: var(--bm-color-surface);
    }

    .bm-header-title-row {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      flex-wrap: wrap;
    }

    .bm-picker-title {
      font-size: var(--bm-font-size-sm);
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
    }

    .bm-coord-pill {
      font-family: var(--bm-font-mono);
      font-size: 11px;
      color: var(--bm-color-primary);
      background-color: var(--bm-color-primary-soft);
      padding: 2px 8px;
      border-radius: var(--bm-radius-full);
      font-weight: var(--bm-font-weight-medium);
    }

    .bm-header-actions {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
    }

    .bm-icon-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-primary);
      background-color: var(--bm-color-surface-subtle);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      cursor: pointer;
      text-decoration: none;
      transition: background-color var(--bm-transition-fast), border-color var(--bm-transition-fast);

      &:hover:not(:disabled) {
        background-color: #E2E8F0;
        border-color: #CBD5E1;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .bm-ext-link {
      color: var(--bm-color-primary);
    }

    // Presets bar
    .bm-presets-bar {
      display: flex;
      align-items: center;
      gap: var(--bm-space-2);
      padding: 6px var(--bm-space-4);
      background-color: var(--bm-color-surface-subtle);
      border-bottom: 1px solid var(--bm-color-border);
      overflow-x: auto;
    }

    .bm-presets-label {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      flex-shrink: 0;
    }

    .bm-presets-scroll {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .bm-preset-chip {
      background-color: var(--bm-color-surface);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-full);
      padding: 2px 8px;
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--bm-transition-fast);

      &:hover {
        background-color: var(--bm-color-primary-soft);
        color: var(--bm-color-primary);
        border-color: var(--bm-color-primary);
      }

      &.is-active {
        background-color: var(--bm-color-primary);
        color: #ffffff;
        border-color: var(--bm-color-primary);
      }
    }

    // Map viewport
    .bm-map-viewport-wrapper {
      position: relative;
      width: 100%;
      height: 320px;
      background-color: #F1F5F9;
      overflow: hidden;
    }

    .bm-google-map-canvas {
      width: 100%;
      height: 100%;
    }

    // Fallback View
    .bm-map-fallback-view {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
    }

    .bm-fallback-grid-bg {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
    }

    .bm-radar-circle {
      position: absolute;
      border: 1px dashed rgba(23, 107, 80, 0.25);
      border-radius: 50%;

      &.circle-1 { width: 120px; height: 120px; }
      &.circle-2 { width: 220px; height: 220px; }
      &.circle-3 { width: 320px; height: 320px; }
    }

    .bm-crosshair-line {
      position: absolute;
      background-color: rgba(23, 107, 80, 0.15);

      &.horizontal {
        width: 100%;
        height: 1px;
      }
      &.vertical {
        height: 100%;
        width: 1px;
      }
    }

    .bm-fallback-pin {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translateY(-14px);
    }

    .bm-pin-svg {
      color: var(--bm-color-primary);
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .bm-pin-pulse {
      position: absolute;
      bottom: 2px;
      width: 12px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--bm-color-primary);
      opacity: 0.4;
      animation: pinPulse 2s ease-out infinite;
    }

    @keyframes pinPulse {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(3.5); opacity: 0; }
    }

    .bm-fallback-overlay-box {
      position: relative;
      z-index: 10;
      max-width: 480px;
      margin: var(--bm-space-4);
      padding: var(--bm-space-4);
      background-color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-md);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      display: flex;
      gap: var(--bm-space-3);
    }

    .bm-fallback-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: var(--bm-radius-md);
      background-color: var(--bm-color-primary-soft);
      color: var(--bm-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .bm-fallback-text-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bm-fallback-title {
      font-size: var(--bm-font-size-xs);
      font-weight: var(--bm-font-weight-semibold);
      color: var(--bm-color-text-primary);
      margin: 0;
    }

    .bm-fallback-desc {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
      line-height: 1.5;
      margin: 0;

      code {
        font-family: var(--bm-font-mono);
        background-color: #F1F5F9;
        padding: 1px 4px;
        border-radius: 3px;
        color: var(--bm-color-primary);
      }
    }

    .bm-map-tip-pill {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background-color: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(4px);
      border: 1px solid var(--bm-color-border);
      border-radius: var(--bm-radius-full);
      box-shadow: var(--bm-shadow-xs);
      font-size: 11px;
      font-weight: var(--bm-font-weight-medium);
      color: var(--bm-color-text-secondary);
      pointer-events: none;
    }

    .bm-picker-footer {
      padding: 6px var(--bm-space-4);
      background-color: var(--bm-color-surface);
      border-top: 1px solid var(--bm-color-border);
    }

    .bm-guide-text {
      font-size: 11px;
      color: var(--bm-color-text-secondary);
    }

    .bm-spin {
      animation: spin 1s linear infinite;
    }
  `],
})
export class LocationPickerComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  readonly mapsLoader = inject(GoogleMapsLoaderService);

  @Input() latitude: number | null = 9.9312; // Default Kochi
  @Input() longitude: number | null = 76.2673;
  @Input() readonly: boolean = false;
  @Input() zoom: number = 13;

  @Output() coordinatesChange = new EventEmitter<GeoCoordinates>();

  @ViewChild('mapCanvas') mapCanvas?: ElementRef<HTMLDivElement>;

  readonly MapPinIcon = MapPin;
  readonly CrosshairIcon = Crosshair;
  readonly ExternalLinkIcon = ExternalLink;
  readonly KeyIcon = Key;
  readonly InfoIcon = Info;
  readonly LayersIcon = Layers;

  readonly cityPresets = KERALA_CITY_PRESETS;
  readonly currentLat = signal<number>(9.9312);
  readonly currentLng = signal<number>(76.2673);
  readonly isDetectingGps = signal<boolean>(false);

  private mapInstance: google.maps.Map | null = null;
  private markerInstance: google.maps.Marker | null = null;

  get mapsStatus(): typeof this.mapsLoader.status {
    return this.mapsLoader.status;
  }

  ngOnInit(): void {
    if (this.latitude !== null && this.latitude !== undefined && !isNaN(this.latitude)) {
      this.currentLat.set(Number(this.latitude));
    }
    if (this.longitude !== null && this.longitude !== undefined && !isNaN(this.longitude)) {
      this.currentLng.set(Number(this.longitude));
    }
  }

  ngAfterViewInit(): void {
    this.mapsLoader.load().then((loaded) => {
      if (loaded) {
        // Small delay to ensure container rendered
        setTimeout(() => this.initializeGoogleMap(), 100);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['latitude'] || changes['longitude']) {
      const newLat = this.latitude !== null && !isNaN(Number(this.latitude)) ? Number(this.latitude) : 9.9312;
      const newLng = this.longitude !== null && !isNaN(Number(this.longitude)) ? Number(this.longitude) : 76.2673;

      if (newLat !== this.currentLat() || newLng !== this.currentLng()) {
        this.currentLat.set(newLat);
        this.currentLng.set(newLng);
        this.updateMapPosition(newLat, newLng);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  private initializeGoogleMap(): void {
    if (!this.mapCanvas || !window.google?.maps) return;

    const center = { lat: this.currentLat(), lng: this.currentLng() };

    this.mapInstance = new google.maps.Map(this.mapCanvas.nativeElement, {
      center,
      zoom: this.zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    this.markerInstance = new google.maps.Marker({
      position: center,
      map: this.mapInstance,
      draggable: !this.readonly,
      title: 'Store Physical Location',
      animation: google.maps.Animation.DROP,
    });

    if (!this.readonly) {
      // Map click places the pin
      this.mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = Number(e.latLng.lat().toFixed(6));
          const lng = Number(e.latLng.lng().toFixed(6));
          this.applyCoordinates(lat, lng);
        }
      });

      // Dragging marker updates coordinates
      this.markerInstance.addListener('dragend', () => {
        const pos = this.markerInstance?.getPosition();
        if (pos) {
          const lat = Number(pos.lat().toFixed(6));
          const lng = Number(pos.lng().toFixed(6));
          this.applyCoordinates(lat, lng);
        }
      });
    }
  }

  private updateMapPosition(lat: number, lng: number): void {
    if (!this.mapInstance || !this.markerInstance || !window.google?.maps) return;

    const latLng = new google.maps.LatLng(lat, lng);
    this.markerInstance.setPosition(latLng);
    this.mapInstance.panTo(latLng);
  }

  private applyCoordinates(lat: number, lng: number): void {
    this.currentLat.set(lat);
    this.currentLng.set(lng);
    this.updateMapPosition(lat, lng);
    this.coordinatesChange.emit({ latitude: lat, longitude: lng });
  }

  selectPreset(lat: number, lng: number): void {
    this.applyCoordinates(lat, lng);
  }

  detectCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.isDetectingGps.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isDetectingGps.set(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        this.applyCoordinates(lat, lng);
      },
      () => {
        this.isDetectingGps.set(false);
        alert('Could not retrieve device location. Please enable location permissions or pick coordinates using the map.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  isCloseTo(lat: number, lng: number): boolean {
    return Math.abs(this.currentLat() - lat) < 0.01 && Math.abs(this.currentLng() - lng) < 0.01;
  }

  googleMapsExternalUrl(): string {
    return `https://www.google.com/maps?q=${this.currentLat()},${this.currentLng()}`;
  }

  private destroyMap(): void {
    if (this.markerInstance) {
      this.markerInstance.setMap(null);
      this.markerInstance = null;
    }
    this.mapInstance = null;
  }
}
