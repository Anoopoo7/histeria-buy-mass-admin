import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { AdminMerchantService } from './admin-merchant.service';
import { ToastService } from './toast.service';

describe('AdminMerchantService', () => {
  let service: AdminMerchantService;
  let apiClientSpy: jasmine.SpyObj<ApiClientService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj('ApiClientService', ['get', 'post']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);

    TestBed.configureTestingModule({
      providers: [
        AdminMerchantService,
        { provide: ApiClientService, useValue: apiClientSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(AdminMerchantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list applications with status filter', (done) => {
    const mockList = [{ id: 'app-1', storeName: 'Store 1', status: 'PENDING_REVIEW' }] as any;
    apiClientSpy.get.and.returnValue(of({ count: 1, applications: mockList }));

    service.listApplications('PENDING_REVIEW').subscribe({
      next: (apps) => {
        expect(apps).toEqual(mockList);
        expect(apiClientSpy.get).toHaveBeenCalledWith('/api/v1/admin/merchants/applications', {
          params: { status: 'PENDING_REVIEW' },
        });
        done();
      },
    });
  });

  it('should approve application', (done) => {
    const mockApproved = { id: 'app-1', status: 'APPROVED' } as any;
    apiClientSpy.post.and.returnValue(of({ message: 'Approved', application: mockApproved }));

    service.approveApplication('app-1').subscribe({
      next: (res) => {
        expect(res.status).toBe('APPROVED');
        expect(toastSpy.success).toHaveBeenCalled();
        done();
      },
    });
  });

  it('should reject application with reason', (done) => {
    const mockRejected = { id: 'app-1', status: 'REJECTED' } as any;
    apiClientSpy.post.and.returnValue(of({ message: 'Rejected', application: mockRejected }));

    service.rejectApplication('app-1', 'Invalid license').subscribe({
      next: (res) => {
        expect(res.status).toBe('REJECTED');
        expect(toastSpy.warning).toHaveBeenCalled();
        done();
      },
    });
  });
});
