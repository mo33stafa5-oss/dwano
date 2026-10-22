"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed } from "lucide-react";
import type { AvailabilityStatus } from "@/types";
import { STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  status: AvailabilityStatus;
  title: string;
  subtitle?: string;
}

interface Props {
  points: MapPoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** fallback center when there are no points [lat, lng] */
  center?: [number, number];
  className?: string;
  zoom?: number;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function pinIcon(p: MapPoint, selected: boolean, delay: number, anim = true) {
  const color = STATUS_META[p.status].marker;
  return L.divIcon({
    className: "dw-marker",
    html: `<div class="dw-pin${selected ? " is-selected" : ""}" style="--c:${color};animation-delay:${delay}ms${anim ? "" : ";animation:none"}"><span class="dw-pin-body"></span><span class="dw-pin-dot"></span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}

function popupHtml(p: MapPoint) {
  const m = STATUS_META[p.status];
  return `<div class="dw-popup"><strong>${esc(p.title)}</strong>${p.subtitle ? `<span>${esc(p.subtitle)}</span>` : ""}<em style="color:${m.marker}">${esc(m.label)}</em><small>موقع توضيحي · بيانات تجريبية</small></div>`;
}

/**
 * Leaflet + OpenStreetMap (no API key). Coordinates are illustrative and the pharmacies are fictional.
 * Marker clustering is intentionally omitted: a result set never exceeds ~30 points.
 */
export default function PharmacyMap({ points, selectedId, onSelect, center = [29.31, 30.84], className, zoom = 11 }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Map<string, { marker: L.Marker; point: MapPoint }>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef<string | null | undefined>(selectedId);
  selectedRef.current = selectedId;
  const prevSel = useRef<string | null | undefined>(null);

  // init once
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: true }).setView(center, zoom);
    L.control.zoom({ position: "bottomright" }).addTo(m);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      layer.current = null;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // markers follow the result set
  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    markers.current.clear();
    points.forEach((p, i) => {
      const marker = L.marker([p.lat, p.lng], { icon: pinIcon(p, false, Math.min(i, 12) * 60), keyboard: true, title: p.title })
        .bindPopup(popupHtml(p), { closeButton: false, offset: [0, -4] })
        .on("click", () => onSelectRef.current?.(p.id));
      marker.addTo(g);
      markers.current.set(p.id, { marker, point: p });
    });
    prevSel.current = null;
    if (points.length > 0) {
      const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      m.flyToBounds(b, { padding: [48, 48], maxZoom: 14, duration: 0.8 });
    } else {
      m.flyTo(center, zoom, { duration: 0.8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // selection highlight + smooth movement
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    [prevSel.current, selectedId].forEach((id) => {
      if (!id) return;
      const h = markers.current.get(id);
      if (!h) return;
      h.marker.setIcon(pinIcon(h.point, id === selectedId, 0, false));
      h.marker.setZIndexOffset(id === selectedId ? 1000 : 0);
    });
    prevSel.current = selectedId;
    if (selectedId) {
      const hit = markers.current.get(selectedId);
      if (hit) {
        m.flyTo(hit.marker.getLatLng(), Math.max(m.getZoom(), 14), { duration: 0.7 });
        hit.marker.openPopup();
      }
    } else {
      m.closePopup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, points]);

  const recenter = () => {
    const m = map.current;
    if (!m) return;
    if (points.length > 0) m.flyToBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), { padding: [48, 48], maxZoom: 14 });
    else m.flyTo(center, zoom);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-[1.75rem] border border-navy/10 bg-[#EAF4F0]", className)}>
      <div ref={el} className="absolute inset-0" role="application" aria-label="خريطة الصيدليات (مواقع توضيحية)" />
      <button
        type="button"
        onClick={recenter}
        aria-label="إعادة التمركز"
        className="absolute end-3 top-3 z-[500] grid size-10 place-items-center rounded-full border border-navy/10 bg-white text-navy shadow-soft transition hover:text-brand"
      >
        <LocateFixed className="size-5" />
      </button>
      <span className="pointer-events-none absolute start-3 top-3 z-[500] rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-muted shadow-soft">
        مواقع توضيحية لصيدليات خيالية
      </span>
    </div>
  );
}
