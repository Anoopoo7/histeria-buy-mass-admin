import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { RouteLoaderComponent } from './route-loader.component';

describe('RouteLoaderComponent', () => {
  let component: RouteLoaderComponent;
  let fixture: ComponentFixture<RouteLoaderComponent>;
  let routerEvents$: Subject<any>;
  let mockRouter: any;

  beforeEach(async () => {
    routerEvents$ = new Subject<any>();
    mockRouter = {
      events: routerEvents$.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [RouteLoaderComponent],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(RouteLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and start hidden', () => {
    expect(component).toBeTruthy();
    expect(component.visible()).toBeFalse();
    expect(component.progress()).toBe(0);
  });

  it('should show loader on NavigationStart and increment progress', fakeAsync(() => {
    routerEvents$.next(new NavigationStart(1, '/orders'));
    fixture.detectChanges();

    expect(component.visible()).toBeTrue();
    expect(component.progress()).toBe(15);

    tick(400);
    expect(component.progress()).toBeGreaterThan(15);
    expect(component.progress()).toBeLessThanOrEqual(85);

    // Complete navigation to clean up
    routerEvents$.next(new NavigationEnd(1, '/orders', '/orders'));
    tick(500);
  }));

  it('should complete and hide on NavigationEnd', fakeAsync(() => {
    routerEvents$.next(new NavigationStart(1, '/orders'));
    fixture.detectChanges();
    tick(200);

    routerEvents$.next(new NavigationEnd(1, '/orders', '/orders'));
    fixture.detectChanges();

    expect(component.progress()).toBe(100);

    // After 200ms, begins fading
    tick(200);
    expect(component.isHiding()).toBeTrue();

    // After fade completes (250ms), hides
    tick(250);
    expect(component.visible()).toBeFalse();
    expect(component.progress()).toBe(0);
  }));

  it('should complete on NavigationError', fakeAsync(() => {
    routerEvents$.next(new NavigationStart(1, '/orders'));
    tick(100);
    routerEvents$.next(new NavigationError(1, '/orders', 'Failed to load'));
    tick(500);

    expect(component.visible()).toBeFalse();
  }));

  it('should complete on NavigationCancel', fakeAsync(() => {
    routerEvents$.next(new NavigationStart(1, '/orders'));
    tick(100);
    routerEvents$.next(new NavigationCancel(1, '/orders', 'Cancelled'));
    tick(500);

    expect(component.visible()).toBeFalse();
  }));
});
