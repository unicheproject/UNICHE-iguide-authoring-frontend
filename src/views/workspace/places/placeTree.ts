import { placeTitle, type Place, type PlaceType } from "@/platform/places";

/** A Place in hierarchy order, with its depth for indentation. */
export interface PlaceNode {
  place: Place;
  depth: number;
}

export interface PlaceOption {
  id: string;
  label: string;
}

/**
 * Orders Places as a tree: each parent is followed by its children, siblings by `sortOrder`. A Place whose
 * parent is missing from the list is shown at the top level.
 */
export function flattenPlaceTree(places: Place[]): PlaceNode[] {
  const ids = new Set(places.map((p) => p.id));
  const children = new Map<string | null, Place[]>();
  for (const place of places) {
    const parent = place.parentPlaceId && ids.has(place.parentPlaceId) ? place.parentPlaceId : null;
    children.set(parent, [...(children.get(parent) ?? []), place]);
  }
  for (const list of children.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);

  const result: PlaceNode[] = [];
  const visited = new Set<string>();
  const walk = (parent: string | null, depth: number) => {
    for (const place of children.get(parent) ?? []) {
      if (visited.has(place.id)) continue;
      visited.add(place.id);
      result.push({ place, depth });
      walk(place.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

/**
 * Places that can contain `exclude` (or any Place when absent): not archived, not the Place itself, and not
 * one of its descendants. Labels are indented by depth.
 */
export function parentOptions(
  places: Place[],
  defaultLanguage: string | null,
  exclude?: string,
): PlaceOption[] {
  const blocked = new Set<string>();
  if (exclude) {
    blocked.add(exclude);
    let grew = true;
    while (grew) {
      grew = false;
      for (const p of places) {
        if (p.parentPlaceId && blocked.has(p.parentPlaceId) && !blocked.has(p.id)) {
          blocked.add(p.id);
          grew = true;
        }
      }
    }
  }
  return flattenPlaceTree(places)
    .filter(({ place }) => place.status !== "ARCHIVED" && !blocked.has(place.id))
    .map(({ place, depth }) => ({
      id: place.id,
      label: `${"   ".repeat(depth)}${placeTitle(place, null, defaultLanguage)}`,
    }));
}

const TYPE_LABELS: Record<PlaceType, string> = {
  REGION: "Region",
  DESTINATION: "Destination",
  SITE: "Site",
  BUILDING: "Building",
  FLOOR: "Floor",
  ROOM: "Room",
  AREA: "Area",
  OTHER: "Other",
};

export function placeTypeLabel(type: PlaceType): string {
  return TYPE_LABELS[type];
}
