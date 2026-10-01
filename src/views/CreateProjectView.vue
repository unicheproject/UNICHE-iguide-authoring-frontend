<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "@/platform/api";
import { createProject } from "@/platform/catalogue";
import { SLUG_PATTERN, slugify } from "@/lib/format";
import { canCreateProjects, manageableOrganisations, projectsState, upsertProject } from "@/stores/projects";

const router = useRouter();

const orgId = ref("");
const name = ref("");
const slug = ref("");
const slugEdited = ref(false);
const submitting = ref(false);

const nameError = ref<string | null>(null);
const slugError = ref<string | null>(null);
const formError = ref<{ title: string; detail: string; requestId: string | null } | null>(null);

watch(
  manageableOrganisations,
  (orgs) => {
    if (!orgs.some((o) => o.id === orgId.value)) orgId.value = orgs[0]?.id ?? "";
  },
  { immediate: true },
);

// The slug follows the name until the author edits it, as in the mockup.
watch(name, (value) => {
  if (!slugEdited.value) slug.value = slugify(value);
});

function onSlugInput(event: Event) {
  slugEdited.value = true;
  slug.value = (event.target as HTMLInputElement).value;
}

const selectedOrgName = computed(
  () => manageableOrganisations.value.find((o) => o.id === orgId.value)?.name ?? "",
);

function validate(): boolean {
  nameError.value = name.value.trim() ? null : "Enter a name. It identifies the Project in the Catalogue and in the picker.";
  slugError.value = SLUG_PATTERN.test(slug.value)
    ? null
    : "Use lowercase Latin letters, digits, and single hyphens, for example cycladic-gallery-guide.";
  return !nameError.value && !slugError.value;
}

async function submit() {
  formError.value = null;
  if (!validate() || submitting.value) return;
  submitting.value = true;
  try {
    const project = await createProject(orgId.value, { name: name.value.trim(), slug: slug.value });
    upsertProject(project);
    await router.push({ name: "project", params: { projectId: project.id } });
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    showError(e);
  } finally {
    submitting.value = false;
  }
}

function showError(e: ApiError) {
  switch (e.status) {
    case 409:
      slugError.value = `Another Project in ${selectedOrgName.value} already uses this slug. Choose a different one.`;
      return;
    case 403:
      formError.value = {
        title: "The UNICHE Catalogue did not allow this",
        detail: `Only managers of ${selectedOrgName.value} can create Projects in it.`,
        requestId: e.requestId,
      };
      return;
    case 400:
    case 422:
      formError.value = {
        title: "The UNICHE Catalogue rejected the Project",
        detail: "Check the name and the slug, then try again.",
        requestId: e.requestId,
      };
      return;
    default:
      formError.value = {
        title: e.platformUnavailable ? "The UNICHE platform is not reachable" : "The Project could not be created",
        detail: e.platformUnavailable
          ? "Nothing was created. Try again in a moment."
          : e.message,
        requestId: e.requestId,
      };
  }
}

function close() {
  if (window.history.state?.back) {
    router.back();
  } else {
    void router.push({ name: "home" });
  }
}
</script>

<template>
  <main class="min-w-0 flex-1 overflow-y-auto px-7 pb-16 pt-6">
    <div class="mx-auto w-full max-w-[860px] pb-10">
      <div class="mb-7 flex items-start gap-6">
        <div class="min-w-0 flex-1">
          <div class="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-gray-400">New project</div>
          <h1 class="text-[26px] font-extrabold leading-tight tracking-[-0.01em]">Create a Project</h1>
          <p class="mt-1.5 max-w-[560px] text-[13px] text-muted-foreground">
            The Project is created in the UNICHE Catalogue, which owns its name and who can open it. Only
            managers of an organisation can create Projects in it.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex flex-shrink-0 items-center gap-[7px] rounded-full border bg-card px-[15px] py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground hover:border-destructive hover:text-destructive"
          @click="close"
        >
          <span class="text-[13px] leading-none" aria-hidden="true">✕</span>Close
        </button>
      </div>

      <div
        v-if="projectsState.status === 'loading' || projectsState.status === 'idle'"
        class="animate-skeleton rounded-[10px] border bg-card px-[26px] py-6"
        aria-busy="true"
      >
        <div class="mb-4 h-3.5 w-1/3 rounded bg-[#dcdde2]"></div>
        <div class="h-11 w-full max-w-[460px] rounded-lg bg-[#e6e7eb]"></div>
        <span class="sr-only">Loading your organisations</span>
      </div>

      <div
        v-else-if="!canCreateProjects"
        role="alert"
        class="rounded-lg border border-l-[3px] border-l-[#9a6200] bg-card px-[18px] py-4"
      >
        <strong class="block text-[13px] font-bold">You cannot create Projects</strong>
        <p class="mt-1 text-[13px] text-gray-700">
          The UNICHE Catalogue lists no organisation you manage. A manager of your organisation can create the
          Project, or make you a manager in the Catalogue.
        </p>
      </div>

      <form
        v-else
        novalidate
        class="rounded-[10px] border border-primary bg-card px-[26px] py-6 shadow-[0_4px_18px_rgba(76,29,139,0.08)]"
        aria-labelledby="step-1-title"
        @submit.prevent="submit"
      >
        <div class="mb-5 flex items-center gap-3">
          <span
            class="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary bg-primary text-xs font-extrabold text-primary-foreground"
            aria-hidden="true"
          >
            1
          </span>
          <h2 id="step-1-title" class="min-w-0 flex-1 text-[13px] font-extrabold tracking-[0.02em]">
            Create the Project
          </h2>
        </div>

        <div class="flex flex-col gap-4 pl-[38px]">
          <div
            v-if="formError"
            role="alert"
            class="rounded-lg border border-l-[3px] border-l-destructive bg-card px-4 py-3"
          >
            <strong class="block text-[13px] font-bold text-destructive">{{ formError.title }}</strong>
            <p class="mt-0.5 text-[13px] text-gray-700">{{ formError.detail }}</p>
            <p v-if="formError.requestId" class="mt-0.5 font-mono text-[11px] text-muted-foreground">
              Request id {{ formError.requestId }}
            </p>
          </div>

          <div class="flex flex-col gap-[7px]">
            <label for="project-org" class="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">
              Organisation
            </label>
            <select
              v-if="manageableOrganisations.length > 1"
              id="project-org"
              v-model="orgId"
              class="w-full max-w-[460px] rounded-lg border-[1.5px] bg-card px-3.5 py-3 text-[15px] focus:border-primary focus:outline-none"
            >
              <option v-for="org in manageableOrganisations" :key="org.id" :value="org.id">{{ org.name }}</option>
            </select>
            <span v-else id="project-org" class="text-[15px] font-semibold">{{ selectedOrgName }}</span>
          </div>

          <div class="flex flex-col gap-[7px]">
            <label for="project-name" class="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">
              Project name
            </label>
            <input
              id="project-name"
              v-model="name"
              type="text"
              autocomplete="off"
              placeholder="Cycladic Gallery Guide"
              :aria-invalid="!!nameError"
              :aria-describedby="nameError ? 'project-name-error' : undefined"
              class="w-full max-w-[460px] rounded-lg border-[1.5px] px-3.5 py-3 text-[15px] focus:border-primary focus:outline-none"
              :class="nameError ? 'border-destructive' : ''"
            />
            <span v-if="nameError" id="project-name-error" class="text-xs text-destructive">{{ nameError }}</span>
          </div>

          <div class="flex flex-col gap-[7px]">
            <label for="project-slug" class="text-[11px] font-extrabold uppercase tracking-[0.08em] text-gray-700">
              Slug
            </label>
            <input
              id="project-slug"
              :value="slug"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="cycladic-gallery-guide"
              :aria-invalid="!!slugError"
              aria-describedby="project-slug-help"
              class="w-full max-w-[460px] rounded-lg border-[1.5px] px-3.5 py-2.5 font-mono text-[13px] focus:border-primary focus:outline-none"
              :class="slugError ? 'border-destructive' : ''"
              @input="onSlugInput"
            />
            <span v-if="slugError" id="project-slug-help" class="text-xs text-destructive">{{ slugError }}</span>
            <span v-else id="project-slug-help" class="text-xs text-muted-foreground">
              {{ slugEdited ? "Unique within the organisation." : "Updates with the name until you edit it." }}
            </span>
          </div>

          <div>
            <button
              type="submit"
              :disabled="submitting"
              class="rounded-full bg-primary px-[26px] py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-primary-foreground hover:bg-[#3a1469] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ submitting ? "Creating…" : "Create Project" }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </main>
</template>
