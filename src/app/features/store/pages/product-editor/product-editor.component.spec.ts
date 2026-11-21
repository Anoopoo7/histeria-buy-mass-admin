import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductRecord } from '../../../../core/models/product.model';
import { CloudinaryService } from '../../../../core/services/cloudinary.service';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProductEditorComponent } from './product-editor.component';

describe('ProductEditorComponent', () => {
  let component: ProductEditorComponent;
  let fixture: ComponentFixture<ProductEditorComponent>;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockCloudinaryService: jasmine.SpyObj<CloudinaryService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let router: Router;

  const mockProduct: ProductRecord = {
    id: 'prod-101',
    storeId: 'store-1',
    ownerUserId: 'user-1',
    name: 'Tata Nexon Fearless Plus S',
    description: 'Electric SUV with 40.5kWh battery pack and 465km range.',
    category: 'Cars - Compact & Mid SUV',
    brand: 'Tata Motors',
    sku: 'BM-CAR-NEX-01',
    price: 1450000,
    unit: 'unit',
    status: 'ACTIVE',
    images: [
      {
        id: 'img-1',
        url: 'https://res.cloudinary.com/demo/image/upload/nexon1.jpg',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'img-2',
        url: 'https://res.cloudinary.com/demo/image/upload/nexon2.jpg',
        uploadedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const setupTestBed = async (routeId: string | null = 'new') => {
    mockProductService = jasmine.createSpyObj('ProductService', [
      'getProduct',
      'createProduct',
      'updateProduct',
      'archiveProduct',
      'uploadImages',
      'deleteImage',
    ]);
    mockCloudinaryService = jasmine.createSpyObj('CloudinaryService', [
      'isConfigured',
      'uploadImage',
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', [
      'info',
      'success',
      'warning',
      'danger',
    ]);

    mockCloudinaryService.isConfigured.and.returnValue(true);
    mockProductService.getProduct.and.returnValue(of(mockProduct));
    mockProductService.createProduct.and.returnValue(
      of({ ...mockProduct, id: 'prod-created-1' }),
    );
    mockProductService.updateProduct.and.returnValue(
      of({ ...mockProduct, name: 'Updated Matta Rice' }),
    );
    mockProductService.archiveProduct.and.returnValue(
      of({ ...mockProduct, status: 'ARCHIVED' }),
    );
    mockProductService.uploadImages.and.returnValue(of(mockProduct));
    mockProductService.deleteImage.and.returnValue(
      of({ ...mockProduct, images: [mockProduct.images[0]] }),
    );

    await TestBed.configureTestingModule({
      imports: [ProductEditorComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? routeId : null),
              },
            },
          },
        },
        { provide: ProductService, useValue: mockProductService },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(ProductEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Create Mode (/store/products/new)', () => {
    beforeEach(async () => {
      await setupTestBed('new');
    });

    it('should initialize in create mode with empty form and DRAFT status', () => {
      expect(component).toBeTruthy();
      expect(component.isEditing()).toBeFalse();
      expect(component.productStatus()).toBe('DRAFT');
      expect(component.productForm.get('name')?.value).toBe('');
      expect(component.breadcrumbs().some((b) => b.label === 'New Product')).toBeTrue();
    });

    it('should validate required fields before saving', () => {
      component.saveProduct();
      expect(component.productForm.invalid).toBeTrue();
      expect(component.errorMessage()).toContain('resolve all validation errors');
      expect(mockProductService.createProduct).not.toHaveBeenCalled();
    });

    it('should create product as draft when valid', fakeAsync(() => {
      component.productForm.patchValue({
        name: 'Royal Enfield Classic 350',
        category: 'Motorcycles - Cruiser & Adventure',
        price: 220000,
        unit: 'Bike / Two-Wheeler',
        description: 'Timeless retro cruiser motorcycle powered by 349cc J-series engine.',
      });

      component.saveProduct('DRAFT');
      tick();

      expect(mockProductService.createProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'Royal Enfield Classic 350',
          price: 220000,
          unit: 'Bike / Two-Wheeler',
        }),
      );
      expect(router.navigate).toHaveBeenCalledWith(['/store/products']);
    }));

    it('should prevent setting status to ACTIVE if zero images exist', () => {
      component.productForm.patchValue({
        name: 'Royal Enfield Classic 350',
        category: 'Motorcycles - Cruiser & Adventure',
        price: 220000,
        unit: 'Bike / Two-Wheeler',
        description: 'Timeless retro cruiser motorcycle.',
      });

      component.saveProduct('ACTIVE');
      expect(component.errorMessage()).toContain('At least 1 product photo must be uploaded');
      expect(mockProductService.createProduct).not.toHaveBeenCalled();
    });

    it('should attach manual image URL to staged gallery in create mode', () => {
      component.manualImageUrl = 'https://images.unsplash.com/photo-1234.jpg';
      component.addManualImageUrl();

      expect(component.currentImages().length).toBe(1);
      expect(component.currentImages()[0].url).toBe('https://images.unsplash.com/photo-1234.jpg');
      expect(component.manualImageUrl).toBe('');
    });

    it('should generate a random SKU when clicking Generate SKU', () => {
      component.productForm.patchValue({ category: 'Cars - Hatchback' });
      component.generateRandomSku();
      const sku = component.productForm.get('sku')?.value;
      expect(sku).toMatch(/^BM-CAR-\d{4}$/);
    });
  });

  describe('Edit Mode (/store/products/:id/edit)', () => {
    beforeEach(async () => {
      await setupTestBed('prod-101');
    });

    it('should load product details into form and media gallery', () => {
      expect(component.isEditing()).toBeTrue();
      expect(mockProductService.getProduct).toHaveBeenCalledWith('prod-101');
      expect(component.productForm.get('name')?.value).toBe('Tata Nexon Fearless Plus S');
      expect(component.productForm.get('price')?.value).toBe(1450000);
      expect(component.productStatus()).toBe('ACTIVE');
      expect(component.currentImages().length).toBe(2);
      expect(component.breadcrumbs().some((b) => b.label === 'Tata Nexon Fearless Plus S')).toBeTrue();
    });

    it('should update existing product on save', fakeAsync(() => {
      component.productForm.patchValue({
        name: 'Tata Nexon Fearless Plus S (Dark Edition)',
        price: 1490000,
      });

      component.saveProduct();
      tick();

      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        'prod-101',
        jasmine.objectContaining({
          name: 'Tata Nexon Fearless Plus S (Dark Edition)',
          price: 1490000,
        }),
      );
      expect(mockToastService.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/store/products']);
    }));

    it('should quickly change status to DRAFT and back', fakeAsync(() => {
      component.quickStatusChange('DRAFT');
      tick();

      expect(mockProductService.updateProduct).toHaveBeenCalledWith(
        'prod-101',
        jasmine.objectContaining({ status: 'DRAFT' }),
      );
    }));

    it('should open archive modal and confirm archiving product', fakeAsync(() => {
      component.openArchiveModal();
      expect(component.showArchiveModal()).toBeTrue();

      component.confirmArchive();
      tick();

      expect(mockProductService.archiveProduct).toHaveBeenCalledWith('prod-101');
      expect(component.showArchiveModal()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/store/products']);
    }));

    it('should call deleteImage on server when removing an existing image', fakeAsync(() => {
      const imgToDelete = component.currentImages()[1];
      component.deleteProductImage(imgToDelete, 1);
      tick();

      expect(mockProductService.deleteImage).toHaveBeenCalledWith('prod-101', 'img-2');
    }));

    it('should reorder cover image when setAsPrimaryImage is called', () => {
      const originalSecond = component.currentImages()[1];
      component.setAsPrimaryImage(1);

      expect(component.currentImages()[0].id).toBe(originalSecond.id);
      expect(mockToastService.info).toHaveBeenCalledWith('Cover photo updated.');
    });
  });

  describe('Cloudinary Image Upload', () => {
    beforeEach(async () => {
      await setupTestBed('prod-101');
    });

    it('should upload selected file to Cloudinary and attach to product', fakeAsync(() => {
      const file = new File(['dummy-content'], 'matta.png', { type: 'image/png' });
      component.selectedImageFile.set(file);

      mockCloudinaryService.uploadImage.and.returnValue(
        of({
          url: 'https://res.cloudinary.com/demo/image/upload/new-photo.png',
          secure_url: 'https://res.cloudinary.com/demo/image/upload/new-photo.png',
          public_id: 'new-photo',
        }),
      );

      component.uploadSelectedImage();
      tick();

      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(file, 'buymass/products');
      expect(mockProductService.uploadImages).toHaveBeenCalledWith(
        'prod-101',
        [{ url: 'https://res.cloudinary.com/demo/image/upload/new-photo.png' }],
      );
      expect(component.isUploadingImage()).toBeFalse();
    }));
  });
});
