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
}
