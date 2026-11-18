<script setup lang="ts">
/**
 * A Leaflet map on the OpenFreeMap base map (`basemap.ts`, D-064). In visitor view it shows the bounds as cropped:
 * the outside is covered, and the map cannot be panned past them or zoomed out further than they fill the canvas.
 * While editing the bounds, a rectangle with four corner handles and a centre handle can be dragged or, focused,
 * nudged with the arrow keys (Shift for ten times), with the outside dimmed. Markers are numbered and can be dragged
 * or nudged the same way; route lines are drawn under them. Every move is announced (D-081, contract in
 * `ux-audit/round-1/implementation/system.md`).
 */
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addBasemap, cssColour as tok, type Basemap, type TileState } from "@/components/map/basemap";
import MapMoveButton from "@/components/map/MapMoveButton.vue";
import { useMapMoveMode } from "@/components/map/mapGestures";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCoordinate } from "@/components/map/coordinates";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { say } from "@/lib/announcer";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

export type LatLng = [number, number];
/** South-west and north-east corners. */
export type Bounds = [LatLng, LatLng];

export interface CanvasMarker {
  key: string;
  lat: number;
  lng: number;
  label: string;
  title: string;
  draggable?: boolean;
  /** Muted markers are placed but hidden from visitors by the map's visibility. */
  muted?: boolean;
  /** The marker lies outside the map's bounds: drawn with a dashed warning rim and a badge, named as such. */
  warn?: boolean;
}

const props = withDefaults(
  defineProps<{
    view: { lat: number; lng: number; zoom: number };
    bounds: Bounds | null;
    editBounds?: boolean;
    /** Show only the area inside the bounds, as visitors see it. */
    limitToBounds?: boolean;
    /**
     * Show the whole bounds whatever the canvas size, instead of the saved initial view, whose zoom was chosen in
     * the editor's wider canvas: the visitor preview, drawn at phone, web, or kiosk width.
     */
    fitToBounds?: boolean;
    /** With `fitToBounds`, the area to fit instead of the bounds, such as the bounds plus every marker. */
    frame?: Bounds | null;
    markers?: CanvasMarker[];
    lines?: LatLng[][];
    height?: string;
    /** Fit the bounds whenever this changes, such as a newly picked search result. */
    fitKey?: string | number;
    /** Accessible name of the map region. */
    label: string;
    /** The one set of zoom buttons (44 px on a coarse pointer); a page must not draw a second set. */
    showZoomControls?: boolean;
    /** Markers that are not draggable get a Tab stop only when this is set; draggable markers always have one. */
    contextMarkersFocusable?: boolean;
    /** Called with every marker or handle move, for a page live region; the default speaks politely. */
    announce?: (text: string) => void;
    /** Draw the "map background could not be loaded" card with Try again; `false` leaves it to the page. */
    tileErrorCard?: boolean;
  }>(),
  {
    editBounds: false,
    limitToBounds: false,
    fitToBounds: false,
    frame: null,
    markers: () => [],
    lines: () => [],
    height: "460px",
    fitKey: "",
    showZoomControls: true,
    contextMarkersFocusable: false,
    announce: undefined,
    tileErrorCard: true,
  },
);
const emit = defineEmits<{
  boundsChange: [bounds: Bounds];
  markerMove: [key: string, lat: number, lng: number];
  viewChange: [view: { lat: number; lng: number; zoom: number }];
  tileState: [state: TileState];
}>();

const host = ref<HTMLDivElement | null>(null);
const tileState = ref<TileState>("loading");
let map: L.Map | null = null;
let basemap: Basemap | null = null;
let staticLayer: L.LayerGroup | null = null;
let markerLayer: L.LayerGroup | null = null;
let editLayer: L.LayerGroup | null = null;
let dragging = false;
let resizeObserver: ResizeObserver | null = null;
/** The bounds the handle editor currently draws; a prop equal to it needs no rebuild (it would drop focus). */
let editorState: Bounds | null = null;

/** Screen pixels one arrow key moves a pin or handle; Shift moves ten times as far. */
const NUDGE_PX = 2;

/** On a finger, the map starts at rest so a swipe scrolls the page; "Move map" turns panning on (D-096, C2-84). */
const gestures = useMapMoveMode(() => map);

const say_ = (text: string) => (props.announce ? props.announce(text) : say(text));
const coarse = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
const fmt = (n: number) => formatCoordinate(n, 5);

const SVG_ATTRS = 'width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const ICON_HIDDEN = `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`;
const ICON_WARN = `<svg ${SVG_ATTRS}><path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
const ICON_MOVE = `<svg ${SVG_ATTRS.replace('width="14" height="14"', 'width="16" height="16"')}><path d="m5 9-3 3 3 3"/><path d="m9 5 3-3 3 3"/><path d="m15 19-3 3-3-3"/><path d="m19 9 3 3-3 3"/><path d="M2 12h20"/><path d="M12 2v20"/></svg>`;

onMounted(() => {
  if (!host.value) return;
  map = L.map(host.value, { zoomControl: props.showZoomControls, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120 });
  basemap = addBasemap(map, (state) => {
    tileState.value = state;
    emit("tileState", state);
  });
  staticLayer = L.layerGroup().addTo(map);
  editLayer = L.layerGroup().addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  map.setView([props.view.lat, props.view.lng], props.view.zoom);
  gestures.apply();
  map.on("moveend", () => {
    if (!map) return;
    const c = map.getCenter();
    emit("viewChange", { lat: round(c.lat, 6), lng: round(c.lng, 6), zoom: Math.round(map.getZoom() * 100) / 100 });
  });
  redraw();
  syncEditor();
  applyLimits();
  fitIfAsked();
  // Leaflet measures its box once; the box changes when a panel opens, a preview surface changes, or a scaled
  // frame settles, so it measures again on every size change and, in the preview, fits the bounds again.
  resizeObserver = new ResizeObserver(() => {
    if (!map) return;
    map.invalidateSize({ animate: false });
    applyLimits();
    fitIfAsked();
  });
  resizeObserver.observe(host.value);
  host.value.addEventListener("click", onZoomClick);
  host.value.addEventListener("keydown", onZoomKey);
});

/**
 * Zoom is announced when the author changes it with the buttons or the plus and minus keys, so the change is not silent
 * (C3-76). The map's own zooms (fitting the bounds) say nothing.
 */
let zoomTimer: ReturnType<typeof setTimeout> | null = null;
function announceZoomSoon() {
  if (!map) return;
  if (zoomTimer) clearTimeout(zoomTimer);
  const before = map.getZoom();
  zoomTimer = setTimeout(() => {
    zoomTimer = null;
    if (map && map.getZoom() !== before) say_(`Zoom ${formatCoordinate(map.getZoom(), 2)}`);
  }, 350);
}
function onZoomClick(event: MouseEvent) {
  if ((event.target as HTMLElement).closest(".leaflet-control-zoom a")) announceZoomSoon();
}
function onZoomKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (["+", "=", "-", "_"].includes(event.key) && (event.target as HTMLElement).closest(".leaflet-container")) announceZoomSoon();
}

onBeforeUnmount(() => {
  if (zoomTimer) clearTimeout(zoomTimer);
  host.value?.removeEventListener("click", onZoomClick);
  host.value?.removeEventListener("keydown", onZoomKey);
  resizeObserver?.disconnect();
  resizeObserver = null;
  basemap?.dispose();
  basemap = null;
  markers.clear();
  map?.remove();
  map = null;
});

/**
 * "Try again": the card goes away as soon as loading starts, so focus moves to the map region first and stays in the
 * map; it never falls to the page (C3-09, D-103).
 */
function retryTiles() {
  const region = host.value;
  if (region && errorCard.value?.$el.contains(document.activeElement)) {
    region.setAttribute("tabindex", "-1");
    region.focus({ preventScroll: true });
  }
  basemap?.retry();
}
const errorCard = ref<InstanceType<typeof Alert> | null>(null);

function fitIfAsked() {
  const area = props.frame ?? props.bounds;
  if (map && props.fitToBounds && area && !props.editBounds) {
    map.fitBounds(L.latLngBounds(area), { padding: props.frame ? [28, 28] : [6, 6], animate: false });
  }
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

const cropped = () => !!props.bounds && props.limitToBounds && !props.editBounds;

/**
 * Visitor view keeps the map within the bounds, zoomed in at least as far as the whole area fills the canvas, so
 * nothing past the crop is reachable; editing frees it.
 */
function applyLimits() {
  if (!map) return;
  if (props.bounds && cropped()) {
    const lb = L.latLngBounds(props.bounds);
    map.setMinZoom(0);
    map.setMaxBounds(lb);
    map.options.maxBoundsViscosity = 1;
    map.setMinZoom(Math.max(0, map.getBoundsZoom(lb)));
  } else {
    map.setMaxBounds(null as unknown as L.LatLngBounds);
    map.setMinZoom(0);
    map.options.maxBoundsViscosity = 0;
  }
}

function maskRings(b: Bounds): L.LatLngExpression[][] {
  return [
    [
      [89, -179.9],
      [89, 179.9],
      [-89, 179.9],
      [-89, -179.9],
    ],
    [
      [b[0][0], b[0][1]],
      [b[1][0], b[0][1]],
      [b[1][0], b[1][1]],
      [b[0][0], b[1][1]],
    ],
  ];
}

function maskOf(b: Bounds, opacity: number, color: string) {
  return L.polygon(maskRings(b), { stroke: false, fillColor: color, fillOpacity: opacity, interactive: false });
}

/** Moves `from` by a number of screen pixels at the current zoom. */
function shifted(from: L.LatLng, dx: number, dy: number): L.LatLng {
  if (!map) return from;
  return map.containerPointToLatLng(map.latLngToContainerPoint(from).add([dx, dy]));
}

/** The pixel delta of an arrow key, or null for any other key. Shift multiplies by ten. */
function arrowDelta(event: KeyboardEvent): [number, number] | null {
  const step = NUDGE_PX * (event.shiftKey ? 10 : 1);
  switch (event.key) {
    case "ArrowUp":
      return [0, -step];
    case "ArrowDown":
      return [0, step];
    case "ArrowLeft":
      return [-step, 0];
    case "ArrowRight":
      return [step, 0];
    default:
      return null;
  }
}

/**
 * Makes the marker's element move with the arrow keys; the map itself must not also pan, so the event stops here.
 * `to` receives the new position and returns the text to announce.
 */
function onArrowKeys(marker: L.Marker, to: (next: L.LatLng) => string) {
  const el = marker.getElement();
  if (!el) return;
  el.addEventListener("keydown", (event) => {
    const delta = arrowDelta(event);
    if (!delta || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    event.stopPropagation();
    const next = shifted(marker.getLatLng(), delta[0], delta[1]);
    marker.setLatLng(next);
    say_(to(next));
  });
}

const HANDLE_NAMES = ["South-west corner", "North-west corner", "North-east corner", "South-east corner"];

/** The bounds editor: corner handles resize, the centre handle moves the whole area; all reachable by keyboard. */
function boundsEditor(target: L.LayerGroup, bounds: Bounds) {
  let sw: LatLng = [...bounds[0]];
  let ne: LatLng = [...bounds[1]];
  const touch = coarse();
  const size = touch ? 44 : 26;
  const accent = tok("--primary");
  const mask = maskOf([sw, ne], 0.28, tok("--foreground")).addTo(target);
  const rect = L.rectangle([sw, ne], { color: accent, weight: 2, dashArray: "6 5", fill: false, interactive: false }).addTo(target);
  const handleIcon = (cursor: string) =>
    L.divIcon({
      className: "map-handle",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      html: `<span style="display:block;width:16px;height:16px;background:hsl(var(--card));border:3px solid hsl(var(--primary));border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:${cursor}"></span>`,
    });
  const moveIcon = L.divIcon({
    className: "map-handle map-handle-centre",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="width:28px;height:28px;border-radius:9999px;background:hsl(var(--card));border:2px solid hsl(var(--primary));color:hsl(var(--primary));display:flex;align-items:center;justify-content:center;cursor:move">${ICON_MOVE}</span>`,
  });
  const corners = (): LatLng[] => [
    [sw[0], sw[1]],
    [ne[0], sw[1]],
    [ne[0], ne[1]],
    [sw[0], ne[1]],
  ];
  const centre = (): LatLng => [(sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2];
  const cursors = ["nesw-resize", "nwse-resize", "nesw-resize", "nwse-resize"];
  const handles = corners().map((c, i) =>
    L.marker(c, {
      icon: handleIcon(cursors[i]),
      draggable: true,
      zIndexOffset: 1000,
      title: `${HANDLE_NAMES[i]}: drag to resize the area`,
      alt: HANDLE_NAMES[i],
      keyboard: true,
    }).addTo(target),
  );
  const mover = L.marker(centre(), { icon: moveIcon, draggable: true, zIndexOffset: 900, title: "Drag to move the whole area", alt: "Centre of the area", keyboard: true }).addTo(target);
  handles.forEach((h, i) => h.getElement()?.setAttribute("aria-label", `${HANDLE_NAMES[i]} of the area. Arrow keys move it, Shift for larger steps.`));
  mover.getElement()?.setAttribute("aria-label", "Centre of the area. Arrow keys move the whole area, Shift for larger steps.");

  const refresh = (skip?: number | "m") => {
    rect.setBounds([sw, ne]);
    mask.setLatLngs(maskRings([sw, ne]) as L.LatLngExpression[][]);
    corners().forEach((c, i) => {
      if (i !== skip) handles[i].setLatLng(c);
    });
    if (skip !== "m") mover.setLatLng(centre());
  };
  const opposite = [2, 3, 0, 1];
  const commit = () => {
    refresh();
    const out: Bounds = [
      [round(sw[0], 5), round(sw[1], 5)],
      [round(ne[0], 5), round(ne[1], 5)],
    ];
    editorState = [[sw[0], sw[1]], [ne[0], ne[1]]];
    emit("boundsChange", out);
    return out;
  };
  const moveCorner = (i: number, p: L.LatLng) => {
    const o = corners()[opposite[i]];
    sw = [Math.min(p.lat, o[0]), Math.min(p.lng, o[1])];
    ne = [Math.max(p.lat, o[0]), Math.max(p.lng, o[1])];
  };
  const shiftArea = (dLat: number, dLng: number, from: { sw: LatLng; ne: LatLng }) => {
    sw = [from.sw[0] + dLat, from.sw[1] + dLng];
    ne = [from.ne[0] + dLat, from.ne[1] + dLng];
  };
  handles.forEach((h, i) => {
    h.on("dragstart", () => (dragging = true));
    h.on("drag", (e) => {
      moveCorner(i, (e.target as L.Marker).getLatLng());
      refresh(i);
    });
    h.on("dragend", () => {
      dragging = false;
      commit();
      say_(`${HANDLE_NAMES[i]} moved to ${fmt(corners()[i][0])}, ${fmt(corners()[i][1])}`);
    });
    onArrowKeys(h, (next) => {
      moveCorner(i, next);
      commit();
      const c = corners()[i];
      return `${HANDLE_NAMES[i]} moved to ${fmt(c[0])}, ${fmt(c[1])}. Area ${fmt(sw[0])}, ${fmt(sw[1])} to ${fmt(ne[0])}, ${fmt(ne[1])}`;
    });
  });
  let start: { c: LatLng; sw: LatLng; ne: LatLng } | null = null;
  mover.on("dragstart", () => {
    dragging = true;
    start = { c: centre(), sw: [...sw], ne: [...ne] };
  });
  mover.on("drag", (e) => {
    if (!start) return;
    const p = (e.target as L.Marker).getLatLng();
    shiftArea(p.lat - start.c[0], p.lng - start.c[1], start);
    refresh("m");
  });
  mover.on("dragend", () => {
    dragging = false;
    commit();
    say_(`Area moved. Centre ${fmt(centre()[0])}, ${fmt(centre()[1])}`);
  });
  onArrowKeys(mover, (next) => {
    const c = centre();
    shiftArea(next.lat - c[0], next.lng - c[1], { sw: [...sw], ne: [...ne] });
    commit();
    return `Area moved. Centre ${fmt(centre()[0])}, ${fmt(centre()[1])}`;
  });
}

function markerIcon(m: CanvasMarker) {
  const size = coarse() ? 44 : 26;
  const bg = m.muted ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))";
  // A hidden or out-of-area marker also gets a dashed rim and a badge, so it does not rest on colour alone (`14` §4).
  const rim = m.warn ? "2px dashed hsl(var(--warning))" : m.muted ? "2px dashed hsl(var(--ink-2))" : "2px solid hsl(var(--card))";
  const badgeColour = m.warn ? "hsl(var(--warning))" : "hsl(var(--ink-2))";
  const badge =
    m.muted || m.warn
      ? `<span style="position:absolute;top:-7px;right:-7px;width:16px;height:16px;border-radius:9999px;background:hsl(var(--card));color:${badgeColour};display:flex;align-items:center;justify-content:center">${m.warn ? ICON_WARN : ICON_HIDDEN}</span>`
      : "";
  return L.divIcon({
    className: "map-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="position:relative;width:26px;height:26px;border-radius:9999px;background:${bg};color:hsl(var(--primary-foreground));font-family:inherit;font-weight:700;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:${rim}">${m.label}${badge}</span>`,
  });
}

interface DrawnMarker {
  marker: L.Marker;
  signature: string;
}
/** Markers on the map by key; kept between redraws so a focused pin keeps focus while its coordinates change. */
const markers = new Map<string, DrawnMarker>();

function markerName(m: CanvasMarker): string {
  const flags = [m.muted ? "hidden from visitors" : "", m.warn ? "outside the map area" : ""].filter(Boolean);
  return flags.length ? `${m.title} (${flags.join(", ")})` : m.title;
}

function syncMarkers() {
  if (!markerLayer) return;
  const layer = markerLayer;
  const seen = new Set<string>();
  for (const m of props.markers) {
    if (Number.isNaN(m.lat) || Number.isNaN(m.lng)) continue;
    seen.add(m.key);
    const focusable = !!m.draggable || props.contextMarkersFocusable;
    const signature = [m.label, m.title, m.draggable, m.muted, m.warn, focusable, coarse()].join("|");
    const drawn = markers.get(m.key);
    if (drawn && drawn.signature === signature) {
      const at = drawn.marker.getLatLng();
      if (!dragging && (Math.abs(at.lat - m.lat) > 1e-7 || Math.abs(at.lng - m.lng) > 1e-7)) drawn.marker.setLatLng([m.lat, m.lng]);
      continue;
    }
    if (drawn) layer.removeLayer(drawn.marker);
    const name = markerName(m);
    const marker = L.marker([m.lat, m.lng], { icon: markerIcon(m), draggable: !!m.draggable, title: name, alt: name, keyboard: focusable });
    marker.on("dragstart", () => (dragging = true));
    marker.on("dragend", (e) => {
      dragging = false;
      const ll = (e.target as L.Marker).getLatLng();
      emit("markerMove", m.key, round(ll.lat, 6), round(ll.lng, 6));
      say_(`${m.title} moved to ${fmt(ll.lat)}, ${fmt(ll.lng)}`);
    });
    marker.addTo(layer);
    const el = marker.getElement();
    // The accessible name starts with the number drawn on the pin (label in name, `14` §4).
    if (el && focusable) el.setAttribute("aria-label", `${m.label}. ${name}${m.draggable ? ". Arrow keys move it, Shift for larger steps." : ""}`);
    if (m.draggable) {
      onArrowKeys(marker, (next) => {
        emit("markerMove", m.key, round(next.lat, 6), round(next.lng, 6));
        return `${m.title} moved to ${fmt(next.lat)}, ${fmt(next.lng)}`;
      });
    }
    markers.set(m.key, { marker, signature });
  }
  for (const [key, drawn] of [...markers]) {
    if (!seen.has(key)) {
      layer.removeLayer(drawn.marker);
      markers.delete(key);
    }
  }
}

/**
 * Layers that cannot be moved are not Tab stops (D-096, C2-58): a marker or path that Leaflet marks interactive but
 * that is neither a draggable marker nor a handle gets `tabindex="-1"`; only pins that move with the arrow keys, the
 * handles and the map's own controls stay in the order.
 */
function leaveTabOrder() {
  host.value?.querySelectorAll<SVGElement | HTMLElement>("path.leaflet-interactive, .leaflet-marker-icon:not([tabindex='0'])").forEach((el) => el.setAttribute("tabindex", "-1"));
  host.value?.querySelectorAll<HTMLElement>(".leaflet-control-attribution a").forEach((el) => el.setAttribute("tabindex", "-1"));
}

/** Mask and route lines: cheap to redraw and never focusable. */
function redraw() {
  if (!map || !staticLayer) return;
  staticLayer.clearLayers();
  if (props.bounds && !props.editBounds) {
    // Cropped, the outside is covered in the canvas colour where the area's shape differs from the canvas's.
    if (props.limitToBounds) {
      // The gutter where the area's shape differs from the canvas's is tinted a step darker than an empty tile, with
      // the area's edge drawn, so it does not look like tiles that failed to load (C3-73).
      maskOf(props.bounds, 1, tok("--surface-active")).addTo(staticLayer);
      L.rectangle(props.bounds, { color: tok("--ink-2"), weight: 1, dashArray: "4 4", fill: false, interactive: false }).addTo(staticLayer);
    }
    else maskOf(props.bounds, 0.12, tok("--foreground")).addTo(staticLayer);
  }
  for (const line of props.lines) {
    if (line.length > 1) L.polyline(line, { color: tok("--primary"), weight: 4, opacity: 0.8, lineJoin: "round", interactive: false }).addTo(staticLayer);
  }
  syncMarkers();
  leaveTabOrder();
}

const sameBounds = (a: Bounds, b: Bounds) => a.every((c, i) => Math.abs(c[0] - b[i][0]) < 2e-5 && Math.abs(c[1] - b[i][1]) < 2e-5);

/** Builds, rebuilds (a typed value moved the area) or removes the handle editor. */
function syncEditor() {
  if (!map || !editLayer) return;
  if (!props.editBounds || !props.bounds) {
    editLayer.clearLayers();
    editorState = null;
    return;
  }
  if (editorState && sameBounds(editorState, props.bounds)) return;
  if (dragging) return;
  editLayer.clearLayers();
  editorState = [[props.bounds[0][0], props.bounds[0][1]], [props.bounds[1][0], props.bounds[1][1]]];
  boundsEditor(editLayer, props.bounds);
}

watch(() => [props.bounds, props.editBounds, props.markers, props.lines, props.contextMarkersFocusable], () => {
  redraw();
  syncEditor();
}, { deep: true });
watch(() => [props.bounds, props.frame, props.editBounds, props.limitToBounds], () => {
  applyLimits();
  fitIfAsked();
}, { deep: true });
watch(
  () => props.fitKey,
  () => {
    if (map && props.bounds) map.fitBounds(L.latLngBounds(props.bounds), { padding: [36, 36] });
  },
);
/**
 * Starting to edit the bounds keeps the author's zoom; the map only jumps to the area when none of it is
 * on screen, so there is something to drag.
 */
watch(
  () => props.editBounds,
  (editing) => {
    if (!editing || !map || !props.bounds) return;
    keepHandlesInside();
  },
);

/** Room kept round the area while its handles are edited: the bottom row is higher, clear of the attribution strip. */
const EDIT_INSET = { top: 16, right: 16, bottom: 40, left: 16 };

/**
 * Starting to edit the bounds: when a corner handle would sit on, or past, the edge of the map box (it is half clipped
 * there, and the bottom ones lie under the attribution), the map zooms out just far enough to leave room round the
 * area. The author's zoom is otherwise kept (C3-72).
 */
function keepHandlesInside() {
  if (!map || !props.bounds) return;
  const area = L.latLngBounds(props.bounds);
  const size = map.getSize();
  const sw = map.latLngToContainerPoint(area.getSouthWest());
  const ne = map.latLngToContainerPoint(area.getNorthEast());
  const roomy = sw.x >= EDIT_INSET.left && ne.x <= size.x - EDIT_INSET.right && ne.y >= EDIT_INSET.top && sw.y <= size.y - EDIT_INSET.bottom;
  if (roomy) return;
  const zoom = map.getBoundsZoom(area, false, L.point(EDIT_INSET.left + EDIT_INSET.right, EDIT_INSET.top + EDIT_INSET.bottom));
  map.fitBounds(area, {
    paddingTopLeft: [EDIT_INSET.left, EDIT_INSET.top],
    paddingBottomRight: [EDIT_INSET.right, EDIT_INSET.bottom],
    maxZoom: Math.min(map.getZoom(), zoom),
    animate: false,
  });
}
/**
 * Follows view changes made outside the map, such as typed coordinates. The source is a string so the
 * watcher fires only when the numbers change: a parent passing an inline `view` object hands over a new
 * object on every render, and comparing arrays by identity reset the author's zoom each time.
 */
watch(
  () => `${props.view.lat},${props.view.lng},${props.view.zoom}`,
  () => {
    if (!map || props.fitToBounds) return;
    const c = map.getCenter();
    if (Math.abs(c.lat - props.view.lat) > 0.00006 || Math.abs(c.lng - props.view.lng) > 0.00006 || Math.abs(map.getZoom() - props.view.zoom) > 0.011) {
      map.setView([props.view.lat, props.view.lng], props.view.zoom, { animate: false });
    }
  },
);

defineExpose({
  /** The zoom that fits the bounds in this canvas, for a new map's initial view. */
  zoomFor(bounds: Bounds): number {
    return map ? Math.round(map.getBoundsZoom(L.latLngBounds(bounds)) * 100) / 100 : 14;
  },
  currentView(): { lat: number; lng: number; zoom: number } | null {
    if (!map) return null;
    const c = map.getCenter();
    return { lat: round(c.lat, 6), lng: round(c.lng, 6), zoom: Math.round(map.getZoom() * 100) / 100 };
  },
  zoomBy(delta: number) {
    map?.setZoom(map.getZoom() + delta);
  },
  /** Loads the base map again after a `tileState` of `error`. */
  retryTiles,
});
</script>

<template>
  <div class="geo-map w-full">
    <div class="relative w-full" :style="{ height }">
      <div ref="host" class="relative z-0 h-full w-full overflow-hidden rounded-lg border border-input bg-muted" role="region" :aria-label="label"></div>
      <!-- The status region is always there, so the text is announced when it appears (C3-76). -->
      <div role="status" class="pointer-events-none absolute left-1/2 top-3 z-sticky -translate-x-1/2">
        <div v-if="tileState === 'loading'" class="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-ink-2 shadow-1">
          <Spinner class="size-3.5" />
          Loading the map background
        </div>
      </div>
      <!-- Over the map's top edge, never below the fold (C3-73); the bottom of the map keeps pins and the attribution. -->
      <Alert v-if="tileState === 'error' && tileErrorCard" ref="errorCard" tone="warning" title="The map background could not be loaded." class="absolute left-14 right-3 top-3 z-sticky max-w-md shadow-2 [@media(pointer:coarse)]:right-40">
        Placement still works with the coordinate fields.
        <template #actions>
          <Button size="sm" variant="secondary" @click="retryTiles">Try again</Button>
        </template>
      </Alert>
      <MapMoveButton v-if="gestures.coarse" :pressed="gestures.moveOn.value" @toggle="gestures.toggle" />
    </div>
    <p v-if="gestures.coarse" class="mt-1.5 text-xs text-muted-foreground" data-map-gesture-hint>{{ gestures.hint.value }}</p>
  </div>
</template>

<style>
/* One set of zoom buttons, 44 px where a finger is the pointer (C1-99, C1-123). */
@media (pointer: coarse) {
  .geo-map .leaflet-bar a,
  .geo-map .leaflet-bar a:hover {
    width: 44px;
    height: 44px;
    line-height: 44px;
    /* The coarse-pointer zoom glyph: 22 px is outside the type scale on purpose (a plus or minus fills a 44 px button). */
    font-size: 22px;
  }
}
/* Pins and handles are dragged with a finger even while the map itself lets the page scroll. */
.geo-map .leaflet-marker-draggable {
  touch-action: none;
}
.geo-map .leaflet-bar a:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: -2px;
}
.geo-map .map-pin,
.geo-map .map-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: transparent;
  border: 0;
}
.geo-map .leaflet-container {
  font-family: inherit;
  font-size: 0.75rem;
}
</style>
