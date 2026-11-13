import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateProductRequest, ProductRecord } from '../models/product.model';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  const mockProduct: ProductRecord = {
    id: 'prod-123',
    storeId: 'store-1',
    ownerUserId: 'owner-1',
    name: 'Kerala Matta Rice 5kg',
    description: 'Premium Palakkadan Matta Rice',
    category: 'Grocery & Staples',
    brand: 'Nirapara',
    sku: 'MATTA-5KG',
    price: 320,
    unit: 'pack',
    status: 'DRAFT',
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list products with query params', (done) => {
    service.listProducts({ page: 1, limit: 10, status: 'ACTIVE' }).subscribe({
      next: (res) => {
        expect(res.data.length).toBe(1);
        expect(res.pagination.total).toBe(1);
        done();
      },
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/v1/merchant/products'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('ACTIVE');

    req.flush({
      data: [mockProduct],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('should create product', (done) => {
    const dto: CreateProductRequest = {
      name: 'Kerala Matta Rice 5kg',
      description: 'Premium Palakkadan Matta Rice',
      category: 'Grocery & Staples',
      price: 320,
      unit: 'pack',
    };

    service.createProduct(dto).subscribe({
      next: (created) => {
        expect(created.name).toBe(dto.name);
        expect(created.id).toBe('prod-123');
        done();
      },
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/products'));
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Product created successfully', product: mockProduct });
  });

  it('should update product', (done) => {
    service.updateProduct('prod-123', { price: 340 }).subscribe({
      next: (updated) => {
        expect(updated.price).toBe(340);
        done();
      },
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/products/prod-123'));
    expect(req.request.method).toBe('PATCH');
    req.flush({
      message: 'Product updated successfully',
      product: { ...mockProduct, price: 340 },
    });
  });

  it('should archive product', (done) => {
    service.archiveProduct('prod-123').subscribe({
      next: (archived) => {
        expect(archived.status).toBe('ARCHIVED');
        done();
      },
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/products/prod-123'));
    expect(req.request.method).toBe('DELETE');
    req.flush({
      message: 'Product archived successfully',
      product: { ...mockProduct, status: 'ARCHIVED' },
    });
  });

  it('should upload images', (done) => {
    service
      .uploadImages('prod-123', [{ url: 'https://res.cloudinary.com/demo/image/upload/1.jpg' }])
      .subscribe({
        next: (res) => {
          expect(res.images.length).toBe(1);
          done();
        },
      });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/merchant/products/prod-123/images'));
    expect(req.request.method).toBe('POST');
    req.flush({
      message: 'Product images uploaded successfully',
      imagesCount: 1,
      product: {
        ...mockProduct,
        images: [
          {
            id: 'img-1',
            url: 'https://res.cloudinary.com/demo/image/upload/1.jpg',
            uploadedAt: new Date().toISOString(),
          },
        ],
      },
    });
  });

  it('should delete image', (done) => {
    service.deleteImage('prod-123', 'img-1').subscribe({
      next: (res) => {
        expect(res.images.length).toBe(0);
        done();
      },
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/v1/merchant/products/prod-123/images/img-1'),
    );
    expect(req.request.method).toBe('DELETE');
    req.flush({
      message: 'Product image deleted successfully',
      imagesCount: 0,
      product: { ...mockProduct, images: [] },
    });
  });
});
