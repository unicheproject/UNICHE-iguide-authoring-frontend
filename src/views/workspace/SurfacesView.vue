<script setup lang="ts">
/*
 * App settings → Surfaces (spec 12 section 4, Change surfaces; DECISIONS.md D-020, backend D-029): which of Web,
 * Mobile, and Kiosk the Project uses, and the Web surface's public web address, which QR codes and absolute links
 * need. The Template's own list of supported surfaces does not exist yet (backend M2a), so all three are offered.
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import PageHead from "@/components/PageHead.vue";
import SectionTabs from "@/components/SectionTabs.vue";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/platform/api";
import { fetchSurfaces, updateSurfaces, type ProjectSurface, type SurfaceName } from "@/platform/surfaces";
import { askConfirm } from "@/stores/confirm";
import { showToast } from "@/stores/toast";
import { useCurrentProject } from "@/workspace/currentProject";
import { findSection } from "@/workspace/sections";

const section = findSection("surfaces")!;
const project = useCurrentProject();

const ORDER: SurfaceName[] = ["WEB", "MOBILE", "KIOSK"];
const COPY: Record<SurfaceName, { label: string; hint: string }> = {
  WEB: { label: "Web", hint: "The visitor app in a browser, at the organization's own web address." },
  MOBILE: { label: "Mobile", hint: "The installable app for phones, with Bluetooth beacons and offline use." },
  KIOSK: { label: "Kiosk", hint: "A fixed screen in the venue, optionally with an attached QR scanner." },
};

const surfaces = ref<ProjectSurface[]>([]);
const loading = ref(true);
const loadError = ref<ApiError | null>(null);
const saving = ref(false);
const saveError = ref<ApiError | null>(null);
const fieldErrors = ref<Record<string, string>>({});

const form = reactive<Record<SurfaceName, { enabled: boolean; publicBaseUrl: string }>>({
  WEB: { enabled: false, publicBaseUrl: "" },
  MOBILE: { enabled: false, publicBaseUrl: "" },
  KIOSK: { enabled: false, publicBaseUrl: "" },
});
const snapshot = ref("");
const serialize = () => JSON.stringify(form);
const dirty = computed(() => snapshot.value !== "" && serialize() !== snapshot.value);

function reset(list: ProjectSurface[]) {
  surfaces.value = list;
  for (const name of ORDER) {
    const s = list.find((x) => x.surface === name);
    form[name].enabled = s?.enabled ?? false;
    form[name].publicBaseUrl = s?.configuration.publicBaseUrl ?? "";
  }
  snapshot.value = serialize();
}

let controller: AbortController | null = null;
async function load() {
  controller?.abort();
  controller = new AbortController();
  loading.value = true;
  loadError.value = null;
  try {
    reset(await fetchSurfaces(project.value.id, controller.signal));
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    if (!(e instanceof ApiError)) throw e;
    loadError.value = e;
  } finally {
    loading.value = false;
  }
}
watch(() => project.value.id, load, { immediate: true });
onBeforeUnmount(() => controller?.abort());

async function save() {
  saving.value = true;
  saveError.value = null;
  fieldErrors.value = {};
  try {
    const saved = await updateSurfaces(
      project.value.id,
      ORDER.map((name) => ({
        surface: name,
        enabled: form[name].enabled,
        configuration: name === "WEB" && form.WEB.publicBaseUrl.trim() ? { publicBaseUrl: form.WEB.publicBaseUrl.trim() } : {},
      })),
    );
    reset(saved);
    showToast("Surfaces saved", form.WEB.enabled && form.WEB.publicBaseUrl ? "QR codes now point at the public web address." : "");
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    // Paths name `surfaces[i].configuration.publicBaseUrl`; the index follows ORDER.
    const found: Record<string, string> = {};
    for (const [path, message] of Object.entries(e.fieldMessages())) {
      const match = /^surfaces\[(\d+)\]\.configuration\.publicBaseUrl/.exec(path);
      found[match ? `${ORDER[Number(match[1])]}.publicBaseUrl` : path] = message;
    }
    fieldErrors.value = found;
    saveError.value = e;
  } finally {
    saving.value = false;
  }
}

const saveErrorText = computed(() => {
  const e = saveError.value;
  if (!e) return null;
  if (e.platformUnavailable) return { title: "The UNICHE platform is not reachable", detail: "Nothing was changed. Try again in a moment." };
  return { title: "The surfaces were not saved", detail: e.details.join(" ") || e.message };
});

const addressMissing = computed(() => form.WEB.enabled && !form.WEB.publicBaseUrl.trim());

onBeforeRouteLeave(
  () =>
    !dirty.value ||
    askConfirm({
      title: "Leave without saving?",
      body: "You have unsaved changes to the surfaces. If you leave now, they are lost.",
      confirmLabel: "Leave without saving",
      cancelLabel: "Keep editing",
      danger: true,
    }),
);
</script>

<template>
  <main class="relative min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <PageHead title="App settings" :subtitle="section.subtitle">
      <template #actions>
        <span v-if="dirty" class="text-[11px] font-semibold text-[#9a6200]">Unsaved changes</span>
        <Button :disabled="!dirty || saving || loading" @click="save">{{ saving ? "Saving…" : "Save" }}</Button>
      </template>
    </PageHead>
    <SectionTabs :project-id="project.id" section="surfaces" />

    <div v-if="loading && !surfaces.length" class="max-w-[760px] animate-skeleton rounded-lg border bg-card" aria-busy="true" aria-label="Loading surfaces">
      <div v-for="n in 3" :key="n" class="border-b border-gray-100 px-[18px] py-4"><div class="h-3 w-40 rounded bg-[#dcdde2]"></div></div>
    </div>

    <div v-else-if="loadError" role="alert" class="max-w-[640px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-4">
      <strong class="block text-[13px] font-bold text-destructive">
        {{ loadError.platformUnavailable ? "The UNICHE platform is not reachable" : "The surfaces could not be loaded" }}
      </strong>
      <p v-if="loadError.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">Request id {{ loadError.requestId }}</p>
      <Button variant="outline" size="sm" class="mt-3" @click="load">Try again</Button>
    </div>

    <template v-else>
      <div v-if="saveErrorText" role="alert" class="mb-5 max-w-[760px] rounded-lg border border-l-[3px] border-l-destructive bg-card px-[18px] py-3.5">
        <strong class="block text-[13px] font-bold text-destructive">{{ saveErrorText.title }}</strong>
        <p class="mt-0.5 text-[13px] text-gray-700">{{ saveErrorText.detail }}</p>
        <p v-if="saveError?.requestId" class="mt-1 font-mono text-[11px] text-muted-foreground">Request id {{ saveError.requestId }}</p>
      </div>

      <div class="flex max-w-[760px] flex-col gap-4" :aria-busy="saving">
        <section v-for="name in ORDER" :key="name" class="overflow-hidden rounded-lg border bg-card">
          <div class="flex flex-wrap items-center gap-3 px-[18px] py-3.5">
            <div class="min-w-[200px] flex-1">
              <h2 :id="`surface-${name}`" class="text-[13px] font-bold">{{ COPY[name].label }}</h2>
              <p class="text-xs text-muted-foreground">{{ COPY[name].hint }}</p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="form[name].enabled"
              :aria-labelledby="`surface-${name}`"
              :disabled="saving"
              class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em]"
              :class="form[name].enabled ? 'text-primary' : 'text-gray-500'"
              @click="form[name].enabled = !form[name].enabled"
            >
              <span class="relative inline-block h-5 w-9 rounded-full transition-colors" :class="form[name].enabled ? 'bg-primary' : 'bg-gray-300'">
                <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all" :class="form[name].enabled ? 'left-[18px]' : 'left-0.5'"></span>
              </span>
              {{ form[name].enabled ? "Enabled" : "Off" }}
            </button>
          </div>
          <div v-if="name === 'WEB'" class="border-t border-gray-100 px-[18px] py-3.5">
            <label for="public-base-url" class="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">Public web address</label>
            <input
              id="public-base-url"
              v-model="form.WEB.publicBaseUrl"
              type="url"
              inputmode="url"
              placeholder="https://guide.museum.gr"
              :disabled="saving"
              :aria-invalid="!!fieldErrors['WEB.publicBaseUrl']"
              aria-describedby="public-base-url-help"
              class="field-input w-full font-mono text-[13px]"
              :class="{ invalid: fieldErrors['WEB.publicBaseUrl'] }"
            />
            <p v-if="fieldErrors['WEB.publicBaseUrl']" class="mt-1 text-xs font-semibold text-destructive">⚠ {{ fieldErrors["WEB.publicBaseUrl"] }}</p>
            <p id="public-base-url-help" class="mt-1 text-xs text-muted-foreground">
              Where the organization hosts the web app: https and the address only, without a path. For local tests,
              http://localhost works too. QR codes and shared links are built on it, so changing it later breaks
              printed codes.
            </p>
            <p v-if="addressMissing" class="mt-1 text-xs font-semibold text-[#9a6200]">
              Without an address the QR codes cannot be produced.
            </p>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>
