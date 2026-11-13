import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AdminApplicationDetailResponse,
  AdminApplicationsResponse,
  MerchantRecord,
  MerchantStatus,
} from '../models/merchant.model';
import { ApiClientService } from './api-client.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class AdminMerchantService {
  private readonly apiClient = inject(ApiClientService);
  private readonly toast = inject(ToastService);

  listApplications(status?: MerchantStatus): Observable<MerchantRecord[]> {
    const params = status ? { status } : undefined;
    return this.apiClient
      .get<AdminApplicationsResponse>('/api/v1/admin/merchants/applications', { params })
      .pipe(map((res) => res.applications || []));
  }

  getApplication(id: string): Observable<MerchantRecord> {
    return this.apiClient
      .get<AdminApplicationDetailResponse>(`/api/v1/admin/merchants/applications/${id}`)
      .pipe(map((res) => res.application));
  }

  approveApplication(id: string): Observable<MerchantRecord> {
    return this.apiClient
      .post<{ message: string; application: MerchantRecord }>(
        `/api/v1/admin/merchants/applications/${id}/approve`,
        {},
      )
      .pipe(
        map((res) => res.application),
        map((app) => {
          this.toast.success('Store application approved successfully!');
          return app;
        }),
      );
  }

  rejectApplication(id: string, rejectionReason: string): Observable<MerchantRecord> {
    return this.apiClient
      .post<{ message: string; application: MerchantRecord }>(
        `/api/v1/admin/merchants/applications/${id}/reject`,
        { rejectionReason },
      )
      .pipe(
        map((res) => res.application),
        map((app) => {
          this.toast.warning('Store application marked as rejected.');
          return app;
        }),
      );
  }
}
