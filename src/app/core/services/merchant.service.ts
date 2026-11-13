import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import {
  CreateMerchantRequest,
  DocumentUploadItem,
  MerchantMeResponse,
  MerchantRecord,
  PhotoUploadItem,
  UpdateMerchantRequest,
} from '../models/merchant.model';
import { ApiClientService } from './api-client.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class MerchantService {
  private readonly apiClient = inject(ApiClientService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  getMyMerchant(): Observable<MerchantRecord | null> {
    return this.apiClient.get<MerchantMeResponse>('/api/v1/merchants/me').pipe(
      map((res) => res?.merchant || null),
      tap((merchant) => {
        // Also keep auth service's merchant signal synchronized
        if (merchant) {
          (this.authService as any)._currentMerchant?.set(merchant);
        }
      }),
    );
  }

  createApplication(dto: CreateMerchantRequest): Observable<MerchantRecord> {
    return this.apiClient
      .post<{ message: string; merchant: MerchantRecord }>('/api/v1/merchants/applications', dto)
      .pipe(
        map((res) => res.merchant),
        tap((merchant) => {
          this.toast.success('Store application draft created successfully');
          this.authService.loadCurrentMerchantProfile().subscribe();
        }),
      );
  }

  updateMyMerchant(dto: UpdateMerchantRequest): Observable<MerchantRecord> {
    return this.apiClient
      .patch<{ message: string; merchant: MerchantRecord }>('/api/v1/merchants/me', dto)
      .pipe(
        map((res) => res.merchant),
        tap((merchant) => {
          this.toast.success('Store details updated successfully');
          this.authService.loadCurrentMerchantProfile().subscribe();
        }),
      );
  }

  uploadPhotos(photos: PhotoUploadItem[]): Observable<MerchantRecord> {
    return this.apiClient
      .post<{ message: string; merchant: MerchantRecord }>('/api/v1/merchants/me/photos', { photos })
      .pipe(
        map((res) => res.merchant),
        tap(() => {
          this.toast.success('Store photograph uploaded successfully');
          this.authService.loadCurrentMerchantProfile().subscribe();
        }),
      );
  }

  deletePhoto(photoId: string): Observable<MerchantRecord> {
    return this.apiClient
      .delete<{ message: string; merchant: MerchantRecord }>(`/api/v1/merchants/me/photos/${photoId}`)
      .pipe(
        map((res) => res.merchant),
        tap(() => {
          this.toast.info('Photograph removed');
          this.authService.loadCurrentMerchantProfile().subscribe();
        }),
      );
  }

  uploadDocument(doc: DocumentUploadItem): Observable<MerchantRecord> {
    return this.apiClient
      .post<{ message: string; merchant: MerchantRecord }>('/api/v1/merchants/me/documents', doc)
      .pipe(
        map((res) => res.merchant),
        tap(() => {
          this.toast.success('Business document attached successfully');
          this.authService.loadCurrentMerchantProfile().subscribe();
        }),
      );
  }

  submitApplication(): Observable<MerchantRecord> {
    return this.apiClient
      .post<{ message: string; merchant: MerchantRecord }>('/api/v1/merchants/me/submit', {})
      .pipe(
        map((res) => res.merchant),
        tap((merchant) => {
          this.toast.success('Store application submitted for review!');
          this.authService.loadCurrentMerchantProfile().subscribe();
        }),
      );
  }
}
