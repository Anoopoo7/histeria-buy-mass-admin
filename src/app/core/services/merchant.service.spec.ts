import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { ApiClientService } from './api-client.service';
import { MerchantService } from './merchant.service';
import { ToastService } from './toast.service';

describe('MerchantService', () => {
  let service: MerchantService;
  let apiClientSpy: jasmine.SpyObj<ApiClientService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj('ApiClientService', ['get', 'post', 'patch', 'delete']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['loadCurrentMerchantProfile']);
    authServiceSpy.loadCurrentMerchantProfile.and.returnValue(of(null));
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);

    TestBed.configureTestingModule({
      providers: [
        MerchantService,
        { provide: ApiClientService, useValue: apiClientSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(MerchantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get current user merchant', (done) => {
    const mockStore = {
      id: 'm-1',
      storeName: 'Kerala Spice Mart',
      status: 'DRAFT',
    } as any;

    apiClientSpy.get.and.returnValue(of({ merchant: mockStore }));

    service.getMyMerchant().subscribe({
      next: (res) => {
        expect(res).toEqual(mockStore);
        expect(apiClientSpy.get).toHaveBeenCalledWith('/api/v1/merchants/me');
        done();
      },
    });
  });

  it('should create store application', (done) => {
    const mockCreated = {
      id: 'm-2',
      storeName: 'Kochi Fresh Mart',
      status: 'DRAFT',
    } as any;

    apiClientSpy.post.and.returnValue(of({ message: 'Created', merchant: mockCreated }));

    service.createApplication({
      storeName: 'Kochi Fresh Mart',
      addressLine1: 'MG Road',
      city: 'Kochi',
      district: 'Ernakulam',
      postalCode: '682001',
    }).subscribe({
      next: (res) => {
        expect(res).toEqual(mockCreated);
        expect(toastSpy.success).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should submit application for review', (done) => {
    const mockSubmitted = {
      id: 'm-1',
      storeName: 'Kochi Fresh Mart',
      status: 'PENDING_REVIEW',
    } as any;

    apiClientSpy.post.and.returnValue(of({ message: 'Submitted', merchant: mockSubmitted }));

    service.submitApplication().subscribe({
      next: (res) => {
        expect(res.status).toBe('PENDING_REVIEW');
        expect(toastSpy.success).toHaveBeenCalled();
        done();
      },
    });
  });
});
