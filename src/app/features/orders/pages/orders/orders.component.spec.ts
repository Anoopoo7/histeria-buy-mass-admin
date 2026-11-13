import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { OrdersPageComponent } from './orders.component';
import { OrderService } from '../../../../core/services/order.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OrderRecord } from '../../../../core/models/order.model';

describe('OrdersPageComponent', () => {
  let component: OrdersPageComponent;
  let fixture: ComponentFixture<OrdersPageComponent>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let userRoleSignal = signal<'ADMIN' | 'MERCHANT' | null>('MERCHANT');
  let currentMerchantSignal = signal<any>({
    id: 'store-1',
    storeName: 'Silent vally',
    status: 'APPROVED',
  });

  const mockOrder: OrderRecord = {
    id: 'order-101',
    orderNumber: 'BM-202611-101',
    userId: 'user-1',
    storeId: 'store-1',
    merchantId: 'merch-1',
    poolId: 'pool-1',
    participationId: 'part-1',
    items: [
      {
        productId: 'prod-1',
        productName: 'Wayanad Green Cardamom 500g',
        quantity: 2,
        regularUnitPrice: 450,
        regularSubtotal: 900,
        discountedSubtotal: 800,
      },
    ],
    regularTotal: 900,
    discountPercentage: 11.1,
    discountAmount: 100,
    finalAmount: 800,
    currency: 'INR',
    status: 'READY_FOR_PICKUP',
    placedAt: '2026-11-13T09:00:00.000Z',
    readyForPickupAt: '2026-11-13T10:00:00.000Z',
    notificationStatus: 'SENT',
    createdAt: '2026-11-13T09:00:00.000Z',
    updatedAt: '2026-11-13T10:00:00.000Z',
  };

  beforeEach(async () => {
    userRoleSignal = signal<'ADMIN' | 'MERCHANT' | null>('MERCHANT');
    currentMerchantSignal = signal<any>({
      id: 'store-1',
      storeName: 'Silent vally',
      status: 'APPROVED',
    });

    orderServiceSpy = jasmine.createSpyObj('OrderService', [
      'listMerchantOrders',
      'listReadyForPickupOrders',
      'getMerchantOrder',
      'markOrderReadyForPickup',
      'verifyOrderPickup',
      'updateOrderStatus',
      'listAdminOrders',
      'getAdminOrder',
      'inspectFailures',
      'listPickupVerifications',
    ]);

    const authServiceMock = {
      userRole: userRoleSignal,
      currentMerchant: currentMerchantSignal,
      loadCurrentMerchantProfile: jasmine.createSpy('loadCurrentMerchantProfile').and.returnValue(of(null)),
    };

    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);

    orderServiceSpy.listMerchantOrders.and.returnValue(
      of({
        data: [mockOrder],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      }),
    );

    orderServiceSpy.listReadyForPickupOrders.and.returnValue(
      of({
        data: [mockOrder],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      }),
    );

    orderServiceSpy.listAdminOrders.and.returnValue(
      of({
        data: [mockOrder],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [OrdersPageComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ToastService, useValue: toastSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            url: of([{ path: 'orders' }]),
            snapshot: { url: [{ path: 'orders' }] },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load orders on initialization', () => {
    expect(component).toBeTruthy();
    expect(orderServiceSpy.listMerchantOrders).toHaveBeenCalled();
    expect(component.orders().length).toBe(1);
    expect(component.viewMode()).toBe('ALL_ORDERS');
  });

  it('should switch status filter correctly', () => {
    component.onSelectStatus('CONFIRMED');
    expect(component.selectedStatus()).toBe('CONFIRMED');
    expect(orderServiceSpy.listMerchantOrders).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'CONFIRMED' }),
    );
  });

  it('should switch to PICKUPS mode and call listReadyForPickupOrders', () => {
    component.setViewMode('PICKUPS');
    expect(component.viewMode()).toBe('PICKUPS');
    expect(orderServiceSpy.listReadyForPickupOrders).toHaveBeenCalled();
  });

  it('should switch to ADMIN mode if user has ADMIN role', () => {
    userRoleSignal.set('ADMIN');
    component.setViewMode('ADMIN');
    expect(component.viewMode()).toBe('ADMIN');
    expect(orderServiceSpy.listAdminOrders).toHaveBeenCalled();
  });

  it('should open and close order details modal', () => {
    component.openOrderDetails(mockOrder);
    expect(component.selectedOrderDetails()).toEqual(mockOrder);

    component.closeOrderDetails();
    expect(component.selectedOrderDetails()).toBeNull();
  });

  it('should mark order as CONFIRMED', () => {
    const placedOrder: OrderRecord = { ...mockOrder, status: 'PLACED' };
    orderServiceSpy.updateOrderStatus.and.returnValue(
      of({ message: 'Order confirmed', order: { ...placedOrder, status: 'CONFIRMED' } }),
    );

    component.onConfirmOrder(placedOrder);
    expect(orderServiceSpy.updateOrderStatus).toHaveBeenCalledWith('order-101', 'CONFIRMED');
  });

  it('should mark order as READY_FOR_PICKUP and reload', () => {
    const confirmedOrder: OrderRecord = { ...mockOrder, status: 'CONFIRMED' };
    orderServiceSpy.markOrderReadyForPickup.and.returnValue(
      of({
        message: 'Order marked ready for pickup',
        order: { ...confirmedOrder, status: 'READY_FOR_PICKUP' },
      }),
    );

    component.onMarkReadyForPickup(confirmedOrder);
    expect(orderServiceSpy.markOrderReadyForPickup).toHaveBeenCalledWith('order-101');
  });

  it('should open OTP verification modal and verify pickup successfully', () => {
    component.openVerifyOtpModal(mockOrder);
    expect(component.orderToVerify()).toEqual(mockOrder);
    expect(component.enteredOtp()).toBe('');

    component.onOtpChange('123456');
    expect(component.enteredOtp()).toBe('123456');

    orderServiceSpy.verifyOrderPickup.and.returnValue(
      of({
        message: 'Pickup verified',
        order: { ...mockOrder, status: 'COMPLETED', pickupVerifiedAt: new Date().toISOString() },
      }),
    );

    component.submitVerifyPickup();
    expect(orderServiceSpy.verifyOrderPickup).toHaveBeenCalledWith('order-101', '123456');
    expect(component.orderToVerify()).toBeNull();
  });

  it('should display error when invalid OTP is provided', () => {
    component.openVerifyOtpModal(mockOrder);
    component.onOtpInputCompleted('000000');

    orderServiceSpy.verifyOrderPickup.and.returnValue(
      throwError(() => ({
        message: 'Invalid or expired pickup OTP',
      })),
    );

    component.submitVerifyPickup();
    expect(component.verifyError()).toBe('Invalid or expired pickup OTP');
  });
});
