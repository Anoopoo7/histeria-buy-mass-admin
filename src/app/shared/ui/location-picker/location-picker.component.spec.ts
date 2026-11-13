import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationPickerComponent } from './location-picker.component';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';

describe('LocationPickerComponent', () => {
  let component: LocationPickerComponent;
  let fixture: ComponentFixture<LocationPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationPickerComponent],
      providers: [
        {
          provide: GoogleMapsLoaderService,
          useValue: {
            status: () => 'no_key',
            errorMessage: () => null,
            load: () => Promise.resolve(false),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize default Kerala coordinates', () => {
    expect(component).toBeTruthy();
    expect(component.currentLat()).toBe(9.9312);
    expect(component.currentLng()).toBe(76.2673);
  });

  it('should emit coordinatesChange when preset is selected', () => {
    spyOn(component.coordinatesChange, 'emit');
    // Select Kozhikode: 11.2588, 75.7804
    component.selectPreset(11.2588, 75.7804);

    expect(component.currentLat()).toBe(11.2588);
    expect(component.currentLng()).toBe(75.7804);
    expect(component.coordinatesChange.emit).toHaveBeenCalledWith({
      latitude: 11.2588,
      longitude: 75.7804,
    });
  });

  it('should generate valid external Google Maps URL', () => {
    component.selectPreset(10.5276, 76.2144);
    expect(component.googleMapsExternalUrl()).toBe('https://www.google.com/maps?q=10.5276,76.2144');
  });
});
