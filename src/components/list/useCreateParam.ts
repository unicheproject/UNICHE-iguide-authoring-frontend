import { watch, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";

/**
 * The `?create=1` contract of the Content lists (C2-26; the Dashboard's first-run guide links to `/pois?create=1`):
 * when the address carries `create=1`, the list opens its create dialog and removes the parameter (`router.replace`,
 * every other query key stays), so Back, a reload and a shared link do not reopen it. `ready` holds the opening back
 * until the dialog can be shown (the Project's languages are known and the default language exists); while it is
 * false the parameter stays in the address. Call once per list view, in `<script setup>`, with the ref that controls
 * the create dialog (`creating`).
 */
export function useCreateParam(creating: Ref<boolean>, ready: Ref<boolean>): void {
  const route = useRoute();
  const router = useRouter();
  const routeName = route.name;

  watch(
    [() => route.query.create, ready],
    ([create, isReady]) => {
      const wanted = Array.isArray(create) ? create[0] : create;
      if (wanted !== "1" || !isReady || route.name !== routeName) return;
      creating.value = true;
      const { create: _gone, ...rest } = route.query;
      void router.replace({ query: rest, hash: route.hash });
    },
    { immediate: true },
  );
}
