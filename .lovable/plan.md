
## Fix: Stop map auto-zooming while keeping location updates

### Problem
The `FitBounds` component re-runs `map.fitBounds()` every time the `locations` state changes (every 8s poll + realtime events). This hijacks the user's manual pan/zoom. The data updates are fine and must continue.

### What stays the same
- Polling every 8 seconds (line 57) -- keeps running
- Realtime subscription on `staff_locations` (lines 59-64) -- keeps running  
- Markers update their positions automatically when `locations` state changes -- keeps working
- The staff sidebar list updates in real-time -- keeps working

### Changes to `src/components/LiveMap.tsx`

1. **FitBounds: run only once**
   - Add a `useRef(false)` flag called `hasFitted`
   - On first render with locations, call `fitBounds` and set flag to `true`
   - On all subsequent renders, do nothing -- markers still move, but the camera stays where the user left it

2. **Add click-to-locate on sidebar staff items**
   - Create a small `MapController` component that exposes the map instance via a ref
   - When a user clicks a staff member in the sidebar, call `map.flyTo([lat, lng], 16)` to smoothly navigate to them
   - Store a ref to the map instance using a callback pattern

3. **Store map ref for sidebar interaction**
   - Use a `useRef<L.Map | null>` at the `LiveMap` level
   - A `MapRefSetter` child component inside `MapContainer` calls `useMap()` and writes it to the parent ref
   - Sidebar click handler reads from this ref to call `flyTo`

### Result
- Markers glide to new positions in real-time as staff move
- Map camera stays exactly where the admin placed it
- Clicking a staff name in the sidebar flies the map to that person
- Initial load still auto-fits to show all staff
