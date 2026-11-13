import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from './select.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SelectComponent],
  template: `
    <bm-select
      [formControl]="control"
      [options]="districts"
      label="District"
      placeholder="Choose district"
      [required]="true"
    ></bm-select>
  `,
})
class TestHostComponent {
  control = new FormControl('Ernakulam');
  districts = ['Alappuzha', 'Ernakulam', 'Idukki', 'Kozhikode', 'Wayanad'];
}

describe('SelectComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with form control value and display the selected label', () => {
    const textEl = fixture.nativeElement.querySelector('.bm-select-value-text');
    expect(textEl.textContent.trim()).toBe('Ernakulam');
  });

  it('should toggle dropdown open and closed on trigger click', () => {
    const triggerBtn = fixture.nativeElement.querySelector('.bm-select-trigger');
    expect(fixture.nativeElement.querySelector('.bm-select-popover')).toBeNull();

    triggerBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bm-select-popover')).not.toBeNull();

    triggerBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bm-select-popover')).toBeNull();
  });

  it('should update form control value when an option is clicked', () => {
    const triggerBtn = fixture.nativeElement.querySelector('.bm-select-trigger');
    triggerBtn.click();
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('.bm-select-option');
    expect(options.length).toBe(5);

    // Click 'Kozhikode' (index 3)
    options[3].click();
    fixture.detectChanges();

    expect(host.control.value).toBe('Kozhikode');
    const textEl = fixture.nativeElement.querySelector('.bm-select-value-text');
    expect(textEl.textContent.trim()).toBe('Kozhikode');
    // Dropdown should be closed after selection
    expect(fixture.nativeElement.querySelector('.bm-select-popover')).toBeNull();
  });
});
