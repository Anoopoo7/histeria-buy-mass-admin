import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  CORRELATION_ID_HEADER,
  CorrelationIdService,
} from '../services/correlation-id.service';
import { correlationIdInterceptor } from './correlation-id.interceptor';

describe('correlationIdInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let correlationService: CorrelationIdService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CorrelationIdService,
        provideHttpClient(withInterceptors([correlationIdInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    correlationService = TestBed.inject(CorrelationIdService);
    correlationService.clear();
  });

  afterEach(() => {
    httpMock.verify();
    correlationService.clear();
  });

  it('should attach x-correlation-id header to outgoing request with a generated UUID', () => {
    http.get('/api/v1/test').subscribe();

    const req = httpMock.expectOne('/api/v1/test');
    const headerVal = req.request.headers.get(CORRELATION_ID_HEADER);

    expect(headerVal).toBeTruthy();
    expect(headerVal).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(correlationService.getCorrelationId()).toBe(headerVal!);

    req.flush({ ok: true });
  });

  it('should use pre-saved correlation ID on subsequent requests', () => {
    correlationService.setCorrelationId('saved-correlation-id-abc');

    http.get('/api/v1/resource1').subscribe();
    const req1 = httpMock.expectOne('/api/v1/resource1');
    expect(req1.request.headers.get(CORRELATION_ID_HEADER)).toBe(
      'saved-correlation-id-abc',
    );
    req1.flush({ ok: true });

    http.get('/api/v1/resource2').subscribe();
    const req2 = httpMock.expectOne('/api/v1/resource2');
    expect(req2.request.headers.get(CORRELATION_ID_HEADER)).toBe(
      'saved-correlation-id-abc',
    );
    req2.flush({ ok: true });
  });

  it('should not overwrite manually provided x-correlation-id header', () => {
    correlationService.setCorrelationId('default-id');

    http
      .get('/api/v1/custom', {
        headers: new HttpHeaders({ 'x-correlation-id': 'explicit-override-id' }),
      })
      .subscribe();

    const req = httpMock.expectOne('/api/v1/custom');
    expect(req.request.headers.get('x-correlation-id')).toBe('explicit-override-id');
    req.flush({ ok: true });
  });

  it('should update saved correlation ID when server returns x-correlation-id in response', () => {
    http.get('/api/v1/sync').subscribe();

    const req = httpMock.expectOne('/api/v1/sync');
    const initialSentId = req.request.headers.get(CORRELATION_ID_HEADER);
    expect(initialSentId).toBeTruthy();

    const serverReturnedId = 'server-assigned-correlation-987';
    req.flush(
      { message: 'success' },
      {
        headers: new HttpHeaders({
          'x-correlation-id': serverReturnedId,
        }),
      },
    );

    expect(correlationService.getCorrelationId()).toBe(serverReturnedId);

    // Next request should automatically use the updated server correlation ID
    http.get('/api/v1/next-sync').subscribe();
    const nextReq = httpMock.expectOne('/api/v1/next-sync');
    expect(nextReq.request.headers.get(CORRELATION_ID_HEADER)).toBe(
      serverReturnedId,
    );
    nextReq.flush({ ok: true });
  });

  it('should update saved correlation ID when server returns x-correlation-id in error response', () => {
    http.get('/api/v1/fail').subscribe({
      next: () => fail('Should have failed'),
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/api/v1/fail');
    const serverErrorCorrelationId = 'error-correlation-id-500';

    req.flush(
      { error: 'Internal Error' },
      {
        status: 500,
        statusText: 'Server Error',
        headers: new HttpHeaders({
          'x-correlation-id': serverErrorCorrelationId,
        }),
      },
    );

    expect(correlationService.getCorrelationId()).toBe(serverErrorCorrelationId);
  });
});
