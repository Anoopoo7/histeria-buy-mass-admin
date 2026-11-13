import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CloudinaryService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CloudinaryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report whether Cloudinary is configured', () => {
    (service as any).config = { cloudName: 'demo-cloud', uploadPreset: 'buymass_preset', apiKey: '123' };
    expect(service.isConfigured()).toBe(true);

    (service as any).config = { cloudName: '', uploadPreset: '', apiKey: '' };
    expect(service.isConfigured()).toBe(false);
  });

  it('should upload an image when configured', (done) => {
    (service as any).config = { cloudName: 'test-cloud', uploadPreset: 'test-preset', apiKey: '' };
    const mockFile = new File(['image-content'], 'store-front.jpg', { type: 'image/jpeg' });

    service.uploadImage(mockFile).subscribe({
      next: (result) => {
        expect(result.url).toBe('https://res.cloudinary.com/test-cloud/image/upload/v1/test.jpg');
        expect(result.public_id).toBe('test_public_id');
        done();
      },
    });

    const req = httpMock.expectOne('https://api.cloudinary.com/v1_1/test-cloud/image/upload');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);

    req.flush({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test.jpg',
      public_id: 'test_public_id',
    });
  });

  it('should upload a document (PDF) when configured', (done) => {
    (service as any).config = { cloudName: 'test-cloud', uploadPreset: 'test-preset', apiKey: '' };
    const mockDoc = new File(['pdf-content'], 'gst-cert.pdf', { type: 'application/pdf' });

    service.uploadDocument(mockDoc).subscribe({
      next: (result) => {
        expect(result.url).toBe('https://res.cloudinary.com/test-cloud/raw/upload/v1/gst.pdf');
        done();
      },
    });

    const req = httpMock.expectOne('https://api.cloudinary.com/v1_1/test-cloud/auto/upload');
    expect(req.request.method).toBe('POST');

    req.flush({
      secure_url: 'https://res.cloudinary.com/test-cloud/raw/upload/v1/gst.pdf',
      public_id: 'gst_cert',
    });
  });

  it('should reject invalid file types for image upload', (done) => {
    (service as any).config = { cloudName: 'test-cloud', uploadPreset: 'test-preset', apiKey: '' };
    const invalidFile = new File(['bad'], 'script.exe', { type: 'application/x-msdownload' });

    service.uploadImage(invalidFile).subscribe({
      error: (err) => {
        expect(err.message).toContain('Invalid file type');
        done();
      },
    });
  });
});
