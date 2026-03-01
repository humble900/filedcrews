

## Add Simple Map Filter Toggle

A small control on the map to toggle visibility of businesses/POIs and reduce map clutter.

### Approach
Add a toggle button (or small dropdown) on the map that switches between "Default" and "Clean" map styles. The clean style will hide business POIs, reduce label density, and simplify the map appearance.

### Implementation

**File: `src/components/LiveMap.tsx`**

1. Define two style arrays -- a "default" (empty/null) and a "clean" style that hides POIs (businesses, attractions), reduces road label density, and hides transit icons:

```typescript
const CLEAN_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
```

2. Add a state variable `cleanMap` (persisted in `localStorage`) to toggle between the two styles.

3. Since the project uses `mapId` (cloud-based styling), and `styles` prop doesn't work alongside `mapId`, the approach will be to conditionally remove the `mapId` prop when clean mode is active, and pass the `styles` array instead. This way the default mode uses the cloud map style, and clean mode uses the inline style array.

4. Add a small toggle button in a `MapControl` (top-right area) with a layers icon to switch between modes.

**No database changes needed. Single file edit.**
