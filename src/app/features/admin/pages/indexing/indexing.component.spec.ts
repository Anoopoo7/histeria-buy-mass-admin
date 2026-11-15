import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TypesenseSyncHistoryRecord } from '../../../../core/models/search-sync.model';
import { SearchSyncService } from '../../../../core/services/search-sync.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdminIndexingPageComponent } from './indexing.component';

describe('AdminIndexingPageComponent', () => {
  let component: AdminIndexingPageComponent;
  let fixture: ComponentFixture<AdminIndexingPageComponent>;
  let mockSearchSyncService: jasmine.SpyObj<SearchSyncService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockRecords: TypesenseSyncHistoryRecord[] = [
    {
      id: 'job-1',
      collectionName: 'stores',
      mode: 'FULL',
      status: 'COMPLETED',
      totalRecords: 15,
      succeededCount: 15,
      failedCount: 0,
      durationMs: 420,
      errorSummary: null,
      triggeredBy: 'admin@buymass.in',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'job-2',
      collectionName: 'products',
      mode: 'DELTA',
      status: 'IN_PROGRESS',
      totalRecords: 50,
      succeededCount: 30,
      failedCount: 0,
      durationMs: 0,
      errorSummary: null,
      triggeredBy: 'admin@buymass.in',
      startedAt: new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    mockSearchSyncService = jasmine.createSpyObj('SearchSyncService', [
      'getSyncHistory',
      'triggerSync',
      'initCollections',
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['info', 'success', 'error']);

    mockSearchSyncService.getSyncHistory.and.returnValue(
      of({
        data: mockRecords,
        pagination: { total: 2, page: 1, limit: 15, totalPages: 1 },
      }),
    );
    mockSearchSyncService.triggerSync.and.returnValue(
      of({ jobId: 'job-new', status: 'IN_PROGRESS', message: 'Sync queued' }),
    );
    mockSearchSyncService.initCollections.and.returnValue(
      of({ message: 'Schemas initialized' }),
    );

    await TestBed.configureTestingModule({
      imports: [AdminIndexingPageComponent],
      providers: [
        provideRouter([]),
        { provide: SearchSyncService, useValue: mockSearchSyncService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminIndexingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create indexing page and load initial history', () => {
    expect(component).toBeTruthy();
    expect(mockSearchSyncService.getSyncHistory).toHaveBeenCalled();
    expect(component.historyRecords().length).toBe(2);
  });

  it('should compute activeJob when a record is IN_PROGRESS', () => {
    expect(component.activeJob()).toBeTruthy();
    expect(component.activeJob()?.id).toBe('job-2');
  });

  it('should switch tabs between all, stores, products, pools, history', () => {
    expect(component.activeTab()).toBe('all');
    component.setTab('stores');
    expect(component.activeTab()).toBe('stores');
    component.setTab('products');
    expect(component.activeTab()).toBe('products');
    component.setTab('pools');
    expect(component.activeTab()).toBe('pools');
    component.setTab('history');
    expect(component.activeTab()).toBe('history');
  });

  it('should open and close sync modal', () => {
    expect(component.isSyncModalOpen()).toBeFalse();
    component.openSyncModal('products', 'DELTA');
    expect(component.isSyncModalOpen()).toBeTrue();
    expect(component.syncFormCollection).toBe('products');
    expect(component.syncFormMode).toBe('DELTA');

    component.closeSyncModal();
    expect(component.isSyncModalOpen()).toBeFalse();
  });

  it('should trigger sync on submitSync', fakeAsync(() => {
    component.openSyncModal('stores', 'FULL');
    component.submitSync();
    tick();

    expect(mockSearchSyncService.triggerSync).toHaveBeenCalledWith({
      collection: 'stores',
      mode: 'FULL',
      since: undefined,
    });
    expect(component.isSyncModalOpen()).toBeFalse();
  }));

  it('should submit initialize collections', fakeAsync(() => {
    component.openInitModal();
    expect(component.isInitModalOpen()).toBeTrue();

    component.submitInitCollections();
    tick();

    expect(mockSearchSyncService.initCollections).toHaveBeenCalled();
    expect(component.isInitModalOpen()).toBeFalse();
  }));
});
