# BuyMass Store Admin

Merchant-facing administration portal for **BuyMass**, a Kerala-first group-buying platform.

## Technology Stack

- **Angular 19.2** (Standalone Components, Signals, Router)
- **TypeScript 5.7** (Strict Mode)
- **SCSS** with BuyMass Design Tokens (`#176B50` Forest Green)
- **Lucide Icons** (`lucide-angular`)
- **Package Manager**: `pnpm`

---

## Getting Started

Because the Angular CLI is installed locally within the project (`node_modules/.bin/ng`), you do not need to install it globally. Run the scripts using `pnpm`:

### Development Server
```bash
pnpm start
# or: pnpm exec ng serve
# or: npx ng serve
```
Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Production Build
```bash
pnpm run build
# or: pnpm exec ng build --configuration=production
```
The build artifacts are stored in the `dist/histeria-buy-mass-admin` directory.

### Unit Tests
```bash
pnpm test
# or: pnpm exec ng test --watch=false --browsers=ChromeHeadless
```

---

### Optional: Enable `ng` Globally

If you want to run `ng` directly in your terminal without typing `pnpm` or `npx`:

```bash
npm install -g @angular/cli@19
```
*(Note: requires Node.js v22.13+ compatible version `@angular/cli@19`)*
