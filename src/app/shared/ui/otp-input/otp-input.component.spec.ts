import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OtpInputComponent } from './otp-input.component';

describe('OtpInputComponent', () => {
  let component: OtpInputComponent;
  let fixture: ComponentFixture<OtpInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OtpInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render 6 digit input boxes', () => {
    const inputs = fixture.nativeElement.querySelectorAll('.bm-otp-box');
    expect(inputs.length).toBe(6);
  });

  it('should correctly populate digits when writeValue is called with a 6-digit string', () => {
    component.writeValue('992087');
    expect(component.digits()).toEqual(['9', '9', '2', '0', '8', '7']);
  });

  it('should emit otpComplete when all 6 digits are filled', () => {
    spyOn(component.otpComplete, 'emit');
    component.writeValue('992087');
    (component as any).notifyValueChange();
    expect(component.otpComplete.emit).toHaveBeenCalledWith('992087');
  });
});
