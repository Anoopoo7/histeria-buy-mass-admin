import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface DashboardMetric {
  label: string;
  value: number;
  subtext: string;
  trend: string;
  trendType: 'positive' | 'neutral' | 'negative';
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  poolName: string;
  createdAt: string;
}

export interface DashboardPickupItem {
  id: string;
  pickupCode: string;
  customerName: string;
  customerPhone: string;
  itemsCount: number;
  otpStatus: 'PENDING_OTP' | 'VERIFIED';
  readySince: string;
}

export interface ActivityDay {
  day: string;
  orders: number;
  pickups: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardMockService {
  /**
   * Clearly isolated mock metrics.
   * This is explicitly separated from production services to prevent accidental fabrication.
   */
  getMockMetrics(): Observable<DashboardMetric[]> {
    return of([
      {
        label: 'Total Orders',
        value: 128,
        subtext: 'Across all active pools',
        trend: '+12% from last week',
        trendType: 'positive',
      },
      {
        label: 'Pending Orders',
        value: 14,
        subtext: 'Awaiting pool target',
        trend: '3 closing today',
        trendType: 'neutral',
      },
      {
        label: 'Ready for Pickup',
        value: 9,
        subtext: 'In-store waiting collection',
        trend: 'Requires 6-digit OTP',
        trendType: 'neutral',
      },
      {
        label: 'Completed Orders',
        value: 105,
        subtext: 'Fulfilled & collected',
        trend: '98% fulfillment rate',
        trendType: 'positive',
      },
      {
        label: 'Active Campaigns',
        value: 4,
        subtext: 'Community group-buying pools',
        trend: '2 reaching threshold',
        trendType: 'positive',
      },
    ]);
  }

  getMockRecentOrders(): Observable<DashboardRecentOrder[]> {
    return of([
      {
        id: 'ord-101',
        orderNumber: 'BM-ORD-8941',
        customerName: 'Suresh Kumar',
        itemsCount: 3,
        totalAmount: 1450,
        status: 'READY_FOR_PICKUP',
        poolName: 'Palakkad Matta Rice 25kg Pool',
        createdAt: '10 mins ago',
      },
      {
        id: 'ord-102',
        orderNumber: 'BM-ORD-8940',
        customerName: 'Fatima Zahra',
        itemsCount: 1,
        totalAmount: 890,
        status: 'CONFIRMED',
        poolName: 'Wayad Organic Cardamom Pool',
        createdAt: '45 mins ago',
      },
      {
        id: 'ord-103',
        orderNumber: 'BM-ORD-8939',
        customerName: 'Rahul Menon',
        itemsCount: 2,
        totalAmount: 2300,
        status: 'COMPLETED',
        poolName: 'Malabar Coconut Oil 5L Pool',
        createdAt: '2 hours ago',
      },
      {
        id: 'ord-104',
        orderNumber: 'BM-ORD-8938',
        customerName: 'Anju Varghese',
        itemsCount: 4,
        totalAmount: 1720,
        status: 'PENDING',
        poolName: 'Kumarakom Duck Egg Bulk Pool',
        createdAt: '4 hours ago',
      },
    ]);
  }

  getMockPickupQueue(): Observable<DashboardPickupItem[]> {
    return of([
      {
        id: 'pck-01',
        pickupCode: 'PK-4921',
        customerName: 'Suresh Kumar',
        customerPhone: '+91 98470 *****',
        itemsCount: 3,
        otpStatus: 'PENDING_OTP',
        readySince: 'Today, 11:30 AM',
      },
      {
        id: 'pck-02',
        pickupCode: 'PK-4919',
        customerName: 'Deepak Pillai',
        customerPhone: '+91 94471 *****',
        itemsCount: 1,
        otpStatus: 'PENDING_OTP',
        readySince: 'Today, 09:15 AM',
      },
    ]);
  }

  getMockActivityChart(): Observable<ActivityDay[]> {
    return of([
      { day: 'Mon', orders: 12, pickups: 9 },
      { day: 'Tue', orders: 18, pickups: 14 },
      { day: 'Wed', orders: 24, pickups: 19 },
      { day: 'Thu', orders: 16, pickups: 15 },
      { day: 'Fri', orders: 32, pickups: 28 },
      { day: 'Sat', orders: 28, pickups: 24 },
      { day: 'Sun', orders: 15, pickups: 12 },
    ]);
  }
}
