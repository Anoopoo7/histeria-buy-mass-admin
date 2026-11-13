import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  resource_type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private readonly http = inject(HttpClient);

  readonly config = environment.cloudinary || {
    cloudName: '',
    uploadPreset: '',
    apiKey: '',
  };

  /**
   * Check whether Cloudinary cloud name and unsigned upload preset are configured in environment.
   */
  isConfigured(): boolean {
    return Boolean(this.config.cloudName?.trim() && this.config.uploadPreset?.trim());
  }

  /**
   * Upload an image (store photo, product image, etc.) directly to Cloudinary.
   */
  uploadImage(file: File, folder: string = 'buymass/stores/photos'): Observable<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      return throwError(
        () =>
          new Error(
            'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to your .env file.',
          ),
      );
    }

    if (!file.type.startsWith('image/')) {
      return throwError(() => new Error('Invalid file type: Please select an image file (PNG, JPG, WebP, etc.).'));
    }

    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxBytes) {
      return throwError(() => new Error('Image exceeds maximum permitted file size of 10MB.'));
    }

    const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudName)}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }
    if (this.config.apiKey?.trim()) {
      formData.append('api_key', this.config.apiKey.trim());
    }

    return this.http.post<CloudinaryUploadResult>(url, formData).pipe(
      map((res) => ({
        ...res,
        url: res.secure_url || res.url,
      })),
      catchError((err: HttpErrorResponse) => {
        const errorMsg =
          err.error?.error?.message ||
          err.message ||
          'Upload to Cloudinary failed. Please verify your Cloudinary cloud name and unsigned upload preset.';
        return throwError(() => new Error(errorMsg));
      }),
    );
  }

  /**
   * Upload a business document (PDF or image) to Cloudinary.
   */
  uploadDocument(
    file: File,
    folder: string = 'buymass/stores/documents',
  ): Observable<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      return throwError(
        () =>
          new Error(
            'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to your .env file.',
          ),
      );
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const isAllowed = allowedTypes.includes(file.type) || file.type.startsWith('image/');
    if (!isAllowed) {
      return throwError(() => new Error('Invalid file format: Please select a PDF or image file (JPG, PNG).'));
    }

    const maxBytes = 15 * 1024 * 1024; // 15 MB
    if (file.size > maxBytes) {
      return throwError(() => new Error('Document exceeds maximum permitted file size of 15MB.'));
    }

    // Use auto endpoint to accept raw/pdf or images
    const url = `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudName)}/auto/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.config.uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }
    if (this.config.apiKey?.trim()) {
      formData.append('api_key', this.config.apiKey.trim());
    }

    return this.http.post<CloudinaryUploadResult>(url, formData).pipe(
      map((res) => ({
        ...res,
        url: res.secure_url || res.url,
      })),
      catchError((err: HttpErrorResponse) => {
        const errorMsg =
          err.error?.error?.message ||
          err.message ||
          'Document upload to Cloudinary failed. Please verify your Cloudinary upload preset settings.';
        return throwError(() => new Error(errorMsg));
      }),
    );
  }
}
