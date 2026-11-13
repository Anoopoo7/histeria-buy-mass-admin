import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PoolService } from './pool.service';
import { ToastService } from './toast.service';
import { CreatePoolRequest, PoolRecord, UpdatePoolRequest } from '../models/pool.model';

describe('PoolService', () => {
  let service: PoolService;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const mockPool: PoolRecord = {
    id: 'pool-1',
    storeId: 'store-1',
    ownerUserId: 'user-1',
    title: 'Wayanad Cardamom Group Pool',
    description: 'Bulk buying for fresh green cardamom',
    productIds: ['prod-1', 'prod-2'],
    startsAt: new Date(Date.now() + 3600000).toISOString(),
    durationMinutes: 120,
    endsAt: new Date(Date.now() + 7200000).toISOString(),
    status: 'DRAFT',
    minParticipants: 3,
    tiers: [
      { targetAmount: 2000, discountPercentage: 10 },
      { targetAmount: 5000, discountPercentage: 20 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PoolService,
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(PoolService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Merchant Pool Operations', () => {
    it('should list merchant pools with pagination and status filters', (done) => {
      service.listMerchantPools({ page: 1, limit: 10, status: 'ACTIVE' }).subscribe({
        next: (res) => {
          expect(res.data.length).toBe(1);
          expect(res.data[0].id).toBe('pool-1');
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/merchant/pools'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('status')).toBe('ACTIVE');
      req.flush({
        data: [mockPool],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('should get single pool details', (done) => {
      service.getMerchantPool('pool-1').subscribe({
        next: (res) => {
          expect(res.pool.id).toBe('pool-1');
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/pools/pool-1'));
      expect(req.request.method).toBe('GET');
      req.flush({ pool: mockPool });
    });

    it('should create pool in DRAFT status', (done) => {
      const createDto: CreatePoolRequest = {
        title: 'Wayanad Cardamom Group Pool',
        productIds: ['prod-1'],
        startsAt: new Date().toISOString(),
        durationMinutes: 60,
        tiers: [{ targetAmount: 2000, discountPercentage: 10 }],
      };

      service.createPool(createDto).subscribe({
        next: (res) => {
          expect(res.pool.status).toBe('DRAFT');
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/pools'));
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Created', pool: mockPool });
    });

    it('should update pool', (done) => {
      const updateDto: UpdatePoolRequest = {
        title: 'Updated Pool Title',
      };

      service.updatePool('pool-1', updateDto).subscribe({
        next: (res) => {
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/pools/pool-1'));
      expect(req.request.method).toBe('PATCH');
      req.flush({ message: 'Updated', pool: { ...mockPool, title: 'Updated Pool Title' } });
    });

    it('should submit pool for admin review', (done) => {
      service.submitPoolForReview('pool-1').subscribe({
        next: (res) => {
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/pools/pool-1/submit'));
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Submitted', pool: { ...mockPool, status: 'PENDING_REVIEW' } });
    });

    it('should cancel pool', (done) => {
      service.cancelPool('pool-1').subscribe({
        next: (res) => {
          expect(toastSpy.warning).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/pools/pool-1/cancel'));
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Cancelled', pool: { ...mockPool, status: 'CANCELLED' } });
    });

    it('should get participant summary without customer PII', (done) => {
      service.getParticipantSummary('pool-1').subscribe({
        next: (res) => {
          expect(res.totalParticipants).toBe(4);
          expect(res.combinedEligibleCartValue).toBe(3200);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/pools/pool-1/participants'));
      expect(req.request.method).toBe('GET');
      req.flush({
        totalParticipants: 4,
        combinedEligibleCartValue: 3200,
        productQuantities: [{ productId: 'prod-1', productName: 'Cardamom', quantity: 8 }],
        poolStatus: 'ACTIVE',
      });
    });
  });

  describe('Platform Admin Operations', () => {
    it('should list admin pools across all merchants', (done) => {
      service.listAdminPools({ page: 1, limit: 20 }).subscribe({
        next: (res) => {
          expect(res.data.length).toBe(1);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/admin/pools'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [mockPool],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });
    });

    it('should approve pool and schedule it', (done) => {
      service.approvePool('pool-1', { adminNotes: 'Verified products' }).subscribe({
        next: (res) => {
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/admin/pools/pool-1/approve'));
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Approved', pool: { ...mockPool, status: 'SCHEDULED' } });
    });

    it('should reject pool with feedback', (done) => {
      service.rejectPool('pool-1', { rejectionReason: 'Target amount is too high' }).subscribe({
        next: (res) => {
          expect(toastSpy.warning).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/admin/pools/pool-1/reject'));
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Rejected', pool: { ...mockPool, status: 'REJECTED' } });
    });

    it('should trigger lifecycle sync batch on-demand (auto-start)', (done) => {
      service.syncLifecycleBatch().subscribe({
        next: (res) => {
          expect(res.activated).toBe(2);
          expect(res.completed).toBe(1);
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/admin/pools/sync'));
      expect(req.request.method).toBe('POST');
      req.flush({
        message: 'Batch executed',
        activated: 2,
        completed: 1,
      });
    });
  });
});
