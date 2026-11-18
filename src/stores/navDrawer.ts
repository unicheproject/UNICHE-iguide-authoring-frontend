import { reactive, readonly } from "vue";

/** Open state of the workspace navigation drawer (below 1100 px); the header's button and `WorkspaceNav` share it. */
const state = reactive({ open: false });
export const navDrawer = readonly(state);

/** Opens or closes the drawer. */
export function setNavDrawer(open: boolean): void {
  state.open = open;
}
