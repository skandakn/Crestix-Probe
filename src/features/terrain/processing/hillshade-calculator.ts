/**
 * Crestix Probe - Hillshade & Relief Illuminator
 * Implements standard cartographic shaded relief illumination based on Horn (1981).
 */

/**
 * Computes hillshade intensity (0 - 255) for terrain cells.
 * 
 * @param slopes Float32Array of slope values in degrees
 * @param aspects Float32Array of aspect values in degrees (-1 for flat)
 * @param sunAzimuth Light direction in degrees clockwise from North (e.g. 315° = North-West)
 * @param sunAltitude Light angle above horizon in degrees (e.g. 45°)
 */
export function calculateHillshade(
  slopes: Float32Array,
  aspects: Float32Array,
  sunAzimuth: number = 315,
  sunAltitude: number = 45
): Uint8Array {
  const total = slopes.length;
  const hillshade = new Uint8Array(total);

  const degToRad = Math.PI / 180;
  const zenithRad = (90 - sunAltitude) * degToRad;
  const azimuthRad = (360 - sunAzimuth + 90) * degToRad;

  const cosZenith = Math.cos(zenithRad);
  const sinZenith = Math.sin(zenithRad);

  for (let i = 0; i < total; i++) {
    const slopeRad = slopes[i] * degToRad;
    const aspect = aspects[i];

    if (aspect < 0) {
      // Flat surface gets baseline lighting proportional to solar altitude
      const val = Math.round(255 * Math.sin(sunAltitude * degToRad));
      hillshade[i] = Math.min(255, Math.max(0, val));
      continue;
    }

    const aspectRad = aspect * degToRad;

    // Standard USGS hillshade formula
    const intensity = 
      (cosZenith * Math.cos(slopeRad)) + 
      (sinZenith * Math.sin(slopeRad) * Math.cos(azimuthRad - aspectRad));

    const shadedValue = Math.round(255 * Math.max(0, intensity));
    hillshade[i] = Math.min(255, Math.max(0, shadedValue));
  }

  return hillshade;
}
