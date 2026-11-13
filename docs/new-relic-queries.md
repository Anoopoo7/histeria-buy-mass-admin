# New Relic NRQL Queries & Telemetry Guide

BuyMass Store Admin transmits structured telemetry to New Relic across three layers:
1. **`PageAction` Events**: Business operations (Orders, Pickups, Auth, Catalog).
2. **`Log` Events**: Real-time structured application logs from `LoggerService`.
3. **`JavaScriptError` Events**: Uncaught exceptions and failed backend API requests (`4xx`/`5xx`).

---

## 1. Store Pickup & Order Fulfillment Queries

### A. All Pickup OTP Verifications (Successful vs Failed)
```sql
SELECT count(*) 
FROM PageAction 
WHERE actionName IN ('order_pickup_verified', 'order_pickup_otp_failed') 
FACET actionName 
SINCE 7 days ago
```

### B. Failed Pickup OTP Attempts (Suspected Fraud or Customer Confusion)
Inspect orders where customers provided an invalid or expired OTP code:
```sql
SELECT timestamp, storeName, orderNumber, orderId, reason, error 
FROM PageAction 
WHERE actionName = 'order_pickup_otp_failed' 
SINCE 24 hours ago
```

### C. Hourly Fulfillment Velocity (Orders Confirmed vs Picked Up)
```sql
SELECT filter(count(*), WHERE actionName = 'order_confirmed') AS 'Orders Confirmed',
       filter(count(*), WHERE actionName = 'order_ready_for_pickup') AS 'Ready for Pickup',
       filter(count(*), WHERE actionName = 'order_pickup_verified') AS 'Picked Up (Completed)'
FROM PageAction 
WHERE actionName LIKE 'order_%' 
TIMESERIES 1 hour 
SINCE 3 days ago
```

### D. Revenue Settled at Physical Store Counters
```sql
SELECT sum(finalAmount) AS 'Total INR Fulfilled',
       count(*) AS 'Orders Completed' 
FROM PageAction 
WHERE actionName = 'order_pickup_verified' 
FACET storeName 
SINCE 30 days ago
```

---

## 2. Merchant Authentication & Security Queries

### A. Login Success vs Failure Ratio
```sql
SELECT count(*) 
FROM PageAction 
WHERE actionName IN ('auth_login_success', 'auth_login_failed') 
FACET actionName 
SINCE 24 hours ago
```

### B. Failed Login Attempts with Status & Error
```sql
SELECT timestamp, identifier, status, message, route 
FROM PageAction 
WHERE actionName = 'auth_login_failed' 
ORDER BY timestamp DESC 
LIMIT 50
```

---

## 3. Product Catalog & Campaign Operations

### A. Merchant Product Activity
```sql
SELECT count(*) 
FROM PageAction 
WHERE actionName LIKE 'product_%' 
FACET actionName, storeName 
SINCE 7 days ago
```

### B. Group Buying Pool Creation & Lifecycle Transitions
```sql
SELECT timestamp, storeName, poolId, action 
FROM PageAction 
WHERE actionName LIKE 'campaign_%' 
ORDER BY timestamp DESC 
LIMIT 50
```

---

## 4. Frontend Errors & API Failures

### A. Most Frequent Frontend Errors
```sql
SELECT count(*) 
FROM JavaScriptError 
FACET errorMessage, requestUri 
SINCE 7 days ago
```

### B. Backend REST API Failures (HTTP 4xx / 5xx)
```sql
SELECT timestamp, errorMessage, status, method, url, route 
FROM JavaScriptError 
WHERE errorMessage LIKE 'HTTP %' 
ORDER BY timestamp DESC 
LIMIT 50
```

---

## 5. Core Web Vitals & SPA Performance

### A. 75th Percentile Core Web Vitals (Google Standards)
```sql
SELECT percentile(largestContentfulPaint, 75) AS 'LCP (s)',
       percentile(firstInputDelay, 75) AS 'FID (ms)',
       percentile(cumulativeLayoutShift, 75) AS 'CLS'
FROM PageViewTiming 
WHERE appName = 'BuyMass Store Admin' 
SINCE 7 days ago
```

### B. Slowest Angular SPA Route Changes
```sql
SELECT average(duration) AS 'Avg Transition Time (s)',
       percentile(duration, 95) AS 'p95 Duration (s)',
       count(*) AS 'Visits'
FROM BrowserInteraction 
FACET targetGroupedUrl 
SINCE 7 days ago
```

---

## 6. Real-Time Application Logs

### A. Structured Info & Warning Stream
```sql
SELECT timestamp, message, level, route, storeName, userEmail 
FROM Log 
WHERE appName = 'BuyMass Store Admin' 
ORDER BY timestamp DESC 
LIMIT 100
```
