"use client";

import dynamic from "next/dynamic";

/** Leaflet touches `window` on import, so it is loaded on the client only (code-split). */
const MapLoader = dynamic(() => import("./PharmacyMap"), {
  ssr: false,
  loading: () => <div className="skeleton h-full min-h-[320px] w-full !rounded-[1.75rem]" aria-label="جاري تحميل الخريطة" />,
});

export default MapLoader;
