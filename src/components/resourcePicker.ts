import type { ResourceStatus } from "@/platform/places";

/** A kind the Resource picker offers (`ResourcePickerDialog.vue`). */
export interface PickerKind<T extends string> {
  type: T;
  plural: string;
  /** Why the kind cannot be picked, such as a capability switched off; null when it can. */
  off?: string | null;
}

/** A Resource the picker lists. */
export interface Pickable {
  id: string;
  title: string;
  status: ResourceStatus;
  /** An exhibit code a visitor types, shown labelled ("Code 103") and searched. */
  code?: string | null;
  /** The Place the Resource belongs to, for the Place filter and the row's second line. */
  placeId?: string | null;
  placeName?: string | null;
}
