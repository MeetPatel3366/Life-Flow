// /**
//  * Geocode an address using OpenStreetMap Nominatim API (free, no API key).
//  * Returns { latitude, longitude } or null on failure.
//  */

export async function geocodeAddress({
  name = "",
  street = "",
  city = "",
  state = "",
  pincode = "",
  country = "India",
}) {
  const baseUrl = "https://nominatim.openstreetmap.org/search";
  const commonParams = {
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
    countrycodes: "in",
  };

  const headers = {
    Accept: "application/json",
  };

  const qs = (params) => new URLSearchParams(params).toString();

  const fetchJson = async (url) => {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error("Geocoding failed");
    return res.json();
  };

  const normalizeResult = (item) => ({
    latitude: item.lat,
    longitude: item.lon,
    displayName: item.display_name,
    raw: item,
  });

  const scoreResult = (item) => {
    const text = `${item.display_name || ""} ${JSON.stringify(item.address || {})}`.toLowerCase();

    let score = 0;
    if (name && text.includes(name.toLowerCase())) score += 5;
    if (street && text.includes(street.toLowerCase())) score += 4;
    if (city && text.includes(city.toLowerCase())) score += 3;
    if (state && text.includes(state.toLowerCase())) score += 2;
    if (pincode && text.includes(pincode.toLowerCase())) score += 5;

    score += Number(item.importance || 0);
    return score;
  };

  // 1) Structured query
  let results = await fetchJson(
    `${baseUrl}?${qs({
      ...commonParams,
      street,
      city,
      state,
      postalcode: pincode,
      country,
    })}`
  );

  if (results?.length) {
    results.sort((a, b) => scoreResult(b) - scoreResult(a));
    return normalizeResult(results[0]);
  }

  // 2) Hospital name + full address fallback
  const freeForm = [name, street, city, state, pincode, country]
    .filter(Boolean)
    .join(", ");

  results = await fetchJson(
    `${baseUrl}?${qs({
      ...commonParams,
      q: freeForm,
    })}`
  );

  if (results?.length) {
    results.sort((a, b) => scoreResult(b) - scoreResult(a));
    return normalizeResult(results[0]);
  }

  // 3) Name + city + pincode fallback
  const fallback = [name, city, state, pincode, country]
    .filter(Boolean)
    .join(", ");

  results = await fetchJson(
    `${baseUrl}?${qs({
      ...commonParams,
      q: fallback,
    })}`
  );

  if (results?.length) {
    results.sort((a, b) => scoreResult(b) - scoreResult(a));
    return normalizeResult(results[0]);
  }

  return null;
}