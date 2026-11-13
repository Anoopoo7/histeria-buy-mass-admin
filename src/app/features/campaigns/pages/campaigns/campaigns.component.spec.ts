import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CampaignsPageComponent } from './campaigns.component';
import { PoolService } from '../../../../core/services/pool.service';
import { ProductService } from '../../../../core/services/product.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PoolRecord } from '../../../../core/models/pool.model';

describe('CampaignsPageComponent', () => {
  let component: CampaignsPageComponent;
  let fixture: ComponentFixture<CampaignsPageComponent>;
  let poolServiceSpy: jasmine.SpyObj<PoolService>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;

  const mockPool: PoolRecord = {
    id: 'pool-1',
    storeId: 'store-1',
    ownerUserId: 'user-1',
    title: 'Wayanad Cardamom Group Pool',
    description: 'Bulk group pool',
    productIds: ['prod-1'],
    startsAt: new Date(Date.now() + 3600000).toISOString(),
    durationMinutes: 120,
    endsAt: new Date(Date.now() + 7200000).toISOString(),
    status: 'ACTIVE',
    minParticipants: 3,
    tiers: [{ targetAmount: 2000, discountPercentage: 10 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    poolServiceSpy = jasmine.createSpyObj('PoolService', [
      'listMerchantPools',
      'listAdminPools',
      'getMerchantPool',
      'createPool',
      'updatePool',
      'submitPoolForReview',
      'cancelPool',
      'getParticipantSummary',
      'approvePool',
      'rejectPool',
      'pausePool',
      'adminCancelPool',
      'syncLifecycleBatch',
    ]);
    productServiceSpy = jasmine.createSpyObj('ProductService', ['listProducts']);
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'currentMerchant',
      'userRole',
      'loadCurrentMerchantProfile',
    ]);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'info', 'warning', 'danger']);

    authServiceSpy.currentMerchant.and.returnValue({
      id: 'store-1',
      storeName: 'Silent vally',
      status: 'APPROVED',
    } as any);
    authServiceSpy.userRole.and.returnValue('MERCHANT');
    authServiceSpy.loadCurrentMerchantProfile.and.returnValue(of(null));

    poolServiceSpy.listMerchantPools.and.returnValue(
      of({
        data: [mockPool],
        pagination: { page: 1, limit: 25, total: 1, totalPages: 1 },
      }),
    );
    productServiceSpy.listProducts.and.returnValue(
      of({
        data: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CampaignsPageComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: PoolService, useValue: poolServiceSpy },
        { provide: ProductService, useValue: productServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load pools on initialization', () => {
    expect(component).toBeTruthy();
    expect(poolServiceSpy.listMerchantPools).toHaveBeenCalled();
    expect(component.pools().length).toBe(1);
    expect(component.pools()[0].title).toBe('Wayanad Cardamom Group Pool');
  });

  it('should filter pools based on search query', () => {
    component.searchQuery.set('Cardamom');
    expect(component.filteredPools().length).toBe(1);

    component.searchQuery.set('Nonexistent');
    expect(component.filteredPools().length).toBe(0);
  });

  it('should open create modal with default values and 2 tiers', () => {
    component.openCreateModal();
    expect(component.showPoolModal()).toBeTrue();
    expect(component.isEditing()).toBeFalse();
    expect(component.tiersArray.length).toBe(2);
  });

  it('should open cancel modal and set poolToCancel', () => {
    component.openCancelModal(mockPool);
    expect(component.poolToCancel()).toEqual(mockPool);
  });
});
