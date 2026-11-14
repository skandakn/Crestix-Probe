# Terrain Feature Module

- **Owner**: Member 2
- **Route**: `/terrain`
- **Scope**:
  - 3D surface elevation mapping & LiDAR visualization
  - Geological hazard detection (craters, escarpments, boulders)
  - Waypoint and probe traverse path planning
- **Contracts**:
  - Use UI components from `@/components/ui`
  - Fetch telemetry from `/api/terrain` using `apiClient` from `@/lib/api-client`
  - Color conventions: Charcoal backgrounds, Slate contours, Cyan probe markers, Amber hazard flags
