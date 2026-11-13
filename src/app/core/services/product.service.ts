import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import {
  CreateProductRequest,
  PaginatedProductsResponse,
  ProductRecord,
  QueryProductsParams,
  UpdateProductRequest,
} from '../models/product.model';
import { ApiClientService } from './api-client.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly apiClient = inject(ApiClientService);
  private readonly toast = inject(ToastService);

  /**
   * List products with pagination and server-side filters.
   * GET /api/v1/merchant/products
   */
  listProducts(params?: QueryProductsParams): Observable<PaginatedProductsResponse> {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.page !== undefined) queryParams['page'] = params.page;
      if (params.limit !== undefined) queryParams['limit'] = params.limit;
      if (params.status) queryParams['status'] = params.status;
      if (params.category) queryParams['category'] = params.category;
    }

    return this.apiClient.get<PaginatedProductsResponse>('/api/v1/merchant/products', {
      params: queryParams,
    });
  }

  /**
   * Get single product detail.
   * GET /api/v1/merchant/products/:productId
   */
  getProduct(productId: string): Observable<ProductRecord> {
    return this.apiClient
      .get<{ product: ProductRecord }>(`/api/v1/merchant/products/${productId}`)
      .pipe(map((res) => res.product));
  }

  /**
   * Create a new product in DRAFT state.
   * POST /api/v1/merchant/products
   */
  createProduct(dto: CreateProductRequest): Observable<ProductRecord> {
    return this.apiClient
      .post<{ message: string; product: ProductRecord }>('/api/v1/merchant/products', dto)
      .pipe(
        map((res) => res.product),
        tap((product) => {
          this.toast.success(`Product '${product.name}' created as draft.`);
        }),
      );
  }

  /**
   * Update an existing product.
   * PATCH /api/v1/merchant/products/:productId
   */
  updateProduct(productId: string, dto: UpdateProductRequest): Observable<ProductRecord> {
    return this.apiClient
      .patch<{ message: string; product: ProductRecord }>(
        `/api/v1/merchant/products/${productId}`,
        dto,
      )
      .pipe(
        map((res) => res.product),
        tap((product) => {
          this.toast.success(`Product '${product.name}' updated successfully.`);
        }),
      );
  }

  /**
   * Archive product (soft delete).
   * DELETE /api/v1/merchant/products/:productId
   */
  archiveProduct(productId: string): Observable<ProductRecord> {
    return this.apiClient
      .delete<{ message: string; product: ProductRecord }>(
        `/api/v1/merchant/products/${productId}`,
      )
      .pipe(
        map((res) => res.product),
        tap((product) => {
          this.toast.info(`Product '${product.name}' moved to archive.`);
        }),
      );
  }

  /**
   * Upload image URLs to a product.
   * POST /api/v1/merchant/products/:productId/images
   */
  uploadImages(productId: string, images: { url: string }[]): Observable<ProductRecord> {
    return this.apiClient
      .post<{ message: string; imagesCount: number; product: ProductRecord }>(
        `/api/v1/merchant/products/${productId}/images`,
        { images },
      )
      .pipe(
        map((res) => res.product),
        tap(() => {
          this.toast.success('Product image(s) attached successfully.');
        }),
      );
  }

  /**
   * Delete an image from a product.
   * DELETE /api/v1/merchant/products/:productId/images/:imageId
   */
  deleteImage(productId: string, imageId: string): Observable<ProductRecord> {
    return this.apiClient
      .delete<{ message: string; imagesCount: number; product: ProductRecord }>(
        `/api/v1/merchant/products/${productId}/images/${imageId}`,
      )
      .pipe(
        map((res) => res.product),
        tap(() => {
          this.toast.info('Product image removed.');
        }),
      );
  }
}
