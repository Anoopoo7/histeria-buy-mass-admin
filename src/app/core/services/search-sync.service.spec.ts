import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { SearchSyncService } from './search-sync.service';
import { ToastService } from './toast.service';

describe('SearchSyncService', () => {
  let service: SearchSyncService;
  let mockApiClient: jasmine.SpyObj<ApiClientService>;
  let mockToast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    mockApiClient = jasmine.createSpyObj('ApiClientService', ['get', 'post']);
    mockToast = jasmine.createSpyObj('ToastService', ['info', 'success', 'error']);

    TestBed.configureTestingModule({
      providers: [
        SearchSyncService,
        { provide: ApiClientService, useValue: mockApiClient },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    service = TestBed.inject(SearchSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should trigger sync and show info toast', (done) => {
    const mockResponse = {
      jobId: 'job-123',
      status: 'IN_PROGRESS',
      message: 'Sync job initiated',
    };
    mockApiClient.post.and.returnValue(of(mockResponse));

    service.triggerSync({ collection: 'stores', mode: 'FULL' }).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/admin/search/sync', {
        collection: 'stores',
        mode: 'FULL',
      });
      expect(mockToast.info).toHaveBeenCalledWith('Sync job initiated');
      done();
    });
  });

  it('should get paginated sync history', (done) => {
    const mockHistory = {
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
    mockApiClient.get.and.returnValue(of(mockHistory));

    service.getSyncHistory({ page: 1, limit: 10, collection: 'products' }).subscribe((res) => {
      expect(res).toEqual(mockHistory);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/admin/search/sync/history', {
        params: { page: '1', limit: '10', collection: 'products' },
      });
      done();
    });
  });

  it('should initialize collections and show success toast', (done) => {
    const mockInit = { message: 'Initialized successfully' };
    mockApiClient.post.and.returnValue(of(mockInit));

    service.initCollections().subscribe((res) => {
      expect(res).toEqual(mockInit);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/v1/admin/search/collections/init',
        {},
      );
      expect(mockToast.success).toHaveBeenCalledWith('Initialized successfully');
      done();
    });
  });
});
