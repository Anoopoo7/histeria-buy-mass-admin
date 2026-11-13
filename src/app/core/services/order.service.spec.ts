import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { ToastService } from './toast.service';
import { OrderRecord } from '../models/order.model';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const mockOrder: OrderRecord = {
    id: 'ord-123',
    orderNumber: 'BM-ORD-7F92',
    userId: 'user-456',
    storeId: 'store-1',
    merchantId: 'store-1',
    poolId: 'pool-1',
    participationId: 'part-1',
    items: [
      {
        productId: 'prod-1',
        productName: 'Palakkadan Matta Rice 5kg',
        quantity: 2,
        regularUnitPrice: 350,
        regularSubtotal: 700,
        discountedSubtotal: 560,
      },
    ],
    regularTotal: 700,
    discountPercentage: 20,
    discountAmount: 140,
    finalAmount: 560,
    currency: 'INR',
    status: 'CONFIRMED',
    placedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OrderService,
        { provide: ToastService, useValue: toastSpy },
      ],
    });

    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Merchant Orders', () => {
    it('should list merchant orders with query params', (done) => {
      service.listMerchantOrders({ page: 1, limit: 10, status: 'CONFIRMED' }).subscribe({
        next: (res) => {
          expect(res.data.length).toBe(1);
          expect(res.data[0].orderNumber).toBe('BM-ORD-7F92');
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/merchant/orders'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('status')).toBe('CONFIRMED');
      req.flush({
        data: [mockOrder],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('should list orders ready for pickup', (done) => {
      service.listReadyForPickupOrders({ page: 1, limit: 10 }).subscribe({
        next: (res) => {
          expect(res.data.length).toBe(1);
          done();
        },
      });

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/v1/merchant/orders/ready-for-pickup'),
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [{ ...mockOrder, status: 'READY_FOR_PICKUP' }],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('should get single order details', (done) => {
      service.getMerchantOrder('ord-123').subscribe({
        next: (res) => {
          expect(res.order.id).toBe('ord-123');
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/orders/ord-123'));
      expect(req.request.method).toBe('GET');
      req.flush({ order: mockOrder });
    });

    it('should mark order ready for pickup and notify customer', (done) => {
      service.markOrderReadyForPickup('ord-123').subscribe({
        next: (res) => {
          expect(res.order.status).toBe('READY_FOR_PICKUP');
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) =>
        r.url.endsWith('/api/v1/merchant/orders/ord-123/ready-for-pickup'),
      );
      expect(req.request.method).toBe('PATCH');
      req.flush({
        message: 'Marked ready',
        order: { ...mockOrder, status: 'READY_FOR_PICKUP' },
      });
    });

    it('should verify customer 6-digit pickup OTP and complete order', (done) => {
      service.verifyOrderPickup('ord-123', '992087').subscribe({
        next: (res) => {
          expect(res.order.status).toBe('COMPLETED');
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) =>
        r.url.endsWith('/api/v1/merchant/orders/ord-123/verify-pickup'),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ otp: '992087' });
      req.flush({
        message: 'Verified',
        order: { ...mockOrder, status: 'COMPLETED' },
      });
    });

    it('should update merchant order status with transition validation', (done) => {
      service.updateOrderStatus('ord-123', 'CONFIRMED').subscribe({
        next: (res) => {
          expect(res.order.status).toBe('CONFIRMED');
          expect(toastSpy.success).toHaveBeenCalled();
          done();
        },
      });

      const req = httpMock.expectOne((r) =>
        r.url.endsWith('/api/v1/merchant/orders/ord-123/status'),
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'CONFIRMED' });
      req.flush({
        message: 'Updated',
        order: mockOrder,
      });
    });
  });

  describe('Platform Admin Orders', () => {
    it('should list all platform orders across merchants', (done) => {
      service.listAdminOrders({ page: 1, limit: 20 }).subscribe({
        next: (res) => {
          expect(res.data.length).toBe(1);
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.includes('/api/v1/admin/orders'));
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [mockOrder],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
    });

    it('should inspect platform failures and notification outbox', (done) => {
      service.inspectFailures().subscribe({
        next: (res) => {
          expect(res.orderNotificationFailures).toBeDefined();
          done();
        },
      });

      const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/admin/orders/failures'));
      expect(req.request.method).toBe('GET');
      req.flush({
        poolFinalizationFailures: [],
        orderNotificationFailures: [],
        expiredOrLockedPickups: [],
        failedPickupNotifications: [],
      });
    });
  });
});
