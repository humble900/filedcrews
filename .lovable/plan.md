
# Add "Show Address" Button for Staff Locations

## What This Does
Adds a small button next to the coordinates in the sidebar that, when clicked, converts the GPS coordinates into a human-readable street address using Google Maps' built-in Reverse Geocoding service. No additional API keys or setup required — the Geocoder is part of the same Google Maps JavaScript API already loaded.

## How It Works
- A small map-pin/home icon button appears next to the coordinate text for each staff member (in the live view) and each history entry
- Clicking it calls `google.maps.Geocoder.geocode()` with the lat/lng
- The address replaces or appears below the coordinates, with a toggle to switch back
- A loading spinner shows briefly while the geocoding request is in progress

## Technical Details

### File: `src/components/LiveMap.tsx`

1. **Create a reusable `AddressLookup` component** inside the file:
   - Takes `lat` and `lng` as props
   - Uses `google.maps.Geocoder` (available globally since the API is loaded)
   - Manages its own state: `idle` / `loading` / `address string` / `error`
   - Renders a small icon button; on click, fetches and displays the formatted address
   - Clicking again toggles back to coordinates view
   - Caches results in a `useRef` Map to avoid repeated API calls for the same coordinates

2. **Add the component in two places:**
   - **Live staff list** (line ~371): Next to the coordinate `<p>` tag for each staff member
   - **History entries** (line ~333): Next to the coordinate `<p>` tag for each history point

3. **UI behavior:**
   - Small button with a `MapPinHouse` or `Navigation` icon from lucide-react
   - On click: shows a brief `Loader2` spinner, then the address text below coordinates
   - Address text styled in `text-xs text-foreground` to distinguish from the raw coordinates
   - Click the button again to hide the address

No database changes, no new edge functions, no new dependencies needed.
