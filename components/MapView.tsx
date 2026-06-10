"use client";

// Mapa interactivo con Leaflet "puro" (sin react-leaflet) + Leaflet.draw.
// Se carga solo en cliente (dynamic ssr:false desde la página del mapa).

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import type { LatLng } from "@/lib/geo";
import type { SearchCandidate } from "@/lib/types";

type Props = {
  onAreaChange: (polygon: LatLng[] | null) => void;
  results: SearchCandidate[];
  searchCircle?: { center: LatLng; radiusMeters: number } | null;
  focusPlaceId?: string | null;
};

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038]; // Madrid
const DEFAULT_ZOOM = 13;

function esc(s?: string): string {
  if (!s) return "";
  return s.replace(/[<>&"]/g, (ch) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[ch] as string)
  );
}

function popupHtml(c: SearchCandidate): string {
  return `
    <div style="min-width:190px;font-family:inherit">
      <div style="font-weight:600;color:#181c20">${esc(c.name)}</div>
      ${c.address ? `<div style="color:#414754;font-size:12px;margin-top:2px">${esc(c.address)}</div>` : ""}
      ${c.phone ? `<div style="font-size:12px;margin-top:4px;color:#414754">📞 ${esc(c.phone)}</div>` : ""}
      ${c.rating != null ? `<div style="font-size:12px;color:#414754">⭐ ${c.rating}${c.userRatingCount ? ` (${c.userRatingCount})` : ""}</div>` : ""}
      ${
        c.alreadyImported
          ? `<div style="color:#1E8E3E;font-size:11px;margin-top:5px;font-weight:600">✓ Ya importado</div>`
          : `<div style="color:#005bbf;font-size:11px;margin-top:5px;font-weight:600">● Sin web · nuevo prospecto</div>`
      }
    </div>`;
}

function applySpanishLabels() {
  const d = L.drawLocal.draw;
  d.toolbar.buttons.polygon = "Dibujar área de búsqueda";
  d.toolbar.actions.title = "Cancelar dibujo";
  d.toolbar.actions.text = "Cancelar";
  d.toolbar.finish.title = "Terminar el área";
  d.toolbar.finish.text = "Terminar";
  d.toolbar.undo.title = "Borrar último punto dibujado";
  d.toolbar.undo.text = "Borrar punto";
  d.handlers.polygon.tooltip.start = "Haz clic para empezar el área.";
  d.handlers.polygon.tooltip.cont = "Haz clic para seguir dibujando.";
  d.handlers.polygon.tooltip.end = "Haz clic en el primer punto para cerrar el área.";
  const e = L.drawLocal.edit;
  e.toolbar.buttons.edit = "Editar área";
  e.toolbar.buttons.editDisabled = "No hay área para editar";
  e.toolbar.buttons.remove = "Borrar área";
  e.toolbar.buttons.removeDisabled = "No hay área para borrar";
  e.toolbar.actions.save.title = "Guardar cambios";
  e.toolbar.actions.save.text = "Guardar";
  e.toolbar.actions.cancel.title = "Cancelar edición";
  e.toolbar.actions.cancel.text = "Cancelar";
  e.handlers.edit.tooltip.text = "Arrastra los puntos para ajustar el área.";
  e.handlers.remove.tooltip.text = "Haz clic en el área para borrarla.";
}

export default function MapView({ onAreaChange, results, searchCircle, focusPlaceId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const resultsLayerRef = useRef<L.LayerGroup | null>(null);
  const circleLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<globalThis.Map<string, L.CircleMarker>>(new Map());

  // mantenemos el callback más reciente sin re-inicializar el mapa
  const onAreaChangeRef = useRef(onAreaChange);
  onAreaChangeRef.current = onAreaChange;

  // ---- init (una sola vez) ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      DEFAULT_CENTER,
      DEFAULT_ZOOM
    );
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;
    resultsLayerRef.current = L.layerGroup().addTo(map);
    circleLayerRef.current = L.layerGroup().addTo(map);

    applySpanishLabels();

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false, // evita el bug de readableArea en leaflet-draw
          shapeOptions: { color: "#005bbf", weight: 2, fillOpacity: 0.08 },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    map.addControl(drawControl);

    const emit = () => {
      const layers = drawnItems.getLayers();
      if (layers.length === 0) {
        onAreaChangeRef.current(null);
        return;
      }
      const poly = layers[0] as L.Polygon;
      const ring = poly.getLatLngs()[0] as L.LatLng[];
      onAreaChangeRef.current(ring.map((ll) => ({ lat: ll.lat, lng: ll.lng })));
    };

    map.on("draw:created", (e: L.LeafletEvent) => {
      drawnItems.clearLayers(); // solo un área a la vez
      drawnItems.addLayer((e as L.DrawEvents.Created).layer);
      emit();
    });
    map.on("draw:edited", emit);
    map.on("draw:deleted", emit);

    // geolocalización best-effort para centrar el mapa
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (drawnItemsRef.current?.getLayers().length) return; // no mover si ya dibujó
          mapRef.current?.setView(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            15
          );
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    const t = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      clearTimeout(t);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      drawnItemsRef.current = null;
      resultsLayerRef.current = null;
      circleLayerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ---- marcadores de resultados ----
  useEffect(() => {
    const layer = resultsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    results.forEach((c) => {
      const fill = c.alreadyImported ? "#727785" : "#005bbf";
      const marker = L.circleMarker({ lat: c.location.lat, lng: c.location.lng }, {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: fill,
        fillOpacity: 0.95,
      });
      marker.bindPopup(popupHtml(c));
      marker.addTo(layer);
      markersRef.current.set(c.placeId, marker);
    });

    // encuadrar resultados
    if (results.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        results.map((c) => ({ lat: c.location.lat, lng: c.location.lng }))
      );
      mapRef.current.fitBounds(bounds.pad(0.2), { maxZoom: 16 });
    }
  }, [results]);

  // ---- círculo de búsqueda (bounding circle) ----
  useEffect(() => {
    const layer = circleLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (searchCircle) {
      L.circle({ lat: searchCircle.center.lat, lng: searchCircle.center.lng }, {
        radius: searchCircle.radiusMeters,
        color: "#005bbf",
        weight: 1,
        dashArray: "6 6",
        fillColor: "#005bbf",
        fillOpacity: 0.04,
      }).addTo(layer);
    }
  }, [searchCircle]);

  // ---- foco en un marcador concreto ----
  useEffect(() => {
    if (!focusPlaceId || !mapRef.current) return;
    const m = markersRef.current.get(focusPlaceId);
    if (m) {
      mapRef.current.panTo(m.getLatLng());
      m.openPopup();
    }
  }, [focusPlaceId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
