<script setup lang="ts">
/*
 * Create a Project (`12` §4, D-084): a four-step wizard (Name, Template and style, Languages and surfaces, Review). Step 1
 * creates the Project in the Catalogue; the others initialize it locally, so a Project created but not initialized
 * reopens at step 2 ("resume setup", `?resume=<id>`). One footer with one primary action per step closes the card (it does not float over the fields); every
 * error shows at its field and in one summary that takes focus. State and API calls live in `createProject/useCreateProject.ts`.
 */
import { ArrowLeft, X } from "lucide-vue-next";
import { computed } from "vue";
import PageFrame from "@/components/PageFrame.vue";
import PageHead from "@/components/PageHead.vue";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import FormErrorSummary from "@/components/ui/field/FormErrorSummary.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { describeError } from "@/lib/errors";
import { offlineReason } from "@/stores/connection";
import { canCreateProjects } from "@/stores/projects";
import StepLanguages from "./createProject/StepLanguages.vue";
import StepName from "./createProject/StepName.vue";
import StepReview from "./createProject/StepReview.vue";
import StepTemplate from "./createProject/StepTemplate.vue";
import Stepper from "./createProject/Stepper.vue";
import { STEPS, useCreateProject } from "./createProject/useCreateProject";

const w = useCreateProject();

const stepTitle: Record<string, string> = {
  name: "Name the Project",
  template: "Pick a Template and a style",
  languages: "Choose languages and surfaces",
  review: "Review and initialize",
};

/**
 * Why the footer's primary action cannot be used now, in words next to it (never only a tooltip): offline, no Template
 * chosen yet, or what the last step is missing. Empty when the action may go ahead.
 */
const footerReason = computed(() => {
  if (offlineReason() && (w.step === "review" || (w.step === "name" && !w.created))) return offlineReason() ?? "";
  if (w.step === "template" && !w.template) return w.templatesLoading || w.templatesError ? "The Templates are not loaded yet." : "Choose a Template to continue.";
  if (w.step === "review") return w.blockedReason ?? "";
  return "";
});

/** A press on Continue while no Template is chosen takes the author to the Template choice instead of doing nothing. */
function onFooterPress() {
  if (w.step !== "template" || w.template) return;
  document.querySelector<HTMLElement>('input[name="template"]')?.focus();
}

/** A summary link focuses the control it names. */
function focusField(id: string) {
  const el = document.getElementById(id);
  el?.focus();
  el?.scrollIntoView({ block: "center" });
}
</script>

<template>
  <PageFrame narrow>
    <PageHead title="Create Project" subtitle="Name it, then set it up: a Template and style, languages and surfaces. If setup is interrupted, resume it from the project list." subtitle-class="[@media(max-height:480px)]:sr-only">
      <template #actions>
        <Button variant="ghost" @click="w.close()"><X />Close</Button>
      </template>
    </PageHead>

    <div v-if="w.resuming || w.loadingOrganisations" role="status" aria-busy="true" class="rounded-lg border border-border bg-card p-6 shadow-1">
      <Skeleton class="mb-4 h-4 w-1/3" />
      <Skeleton class="h-10 w-full max-w-md" />
      <span class="sr-only">{{ w.resuming ? "Loading the Project" : "Loading your organisations" }}</span>
    </div>

    <Alert v-else-if="w.resumeError" tone="danger" :title="w.resumeError.status === 404 ? 'This Project is not available' : describeError(w.resumeError, 'load the Project').title" :request-id="w.resumeError.requestId">
      {{ w.resumeError.status === 404 ? "It no longer exists in the UNICHE Catalogue, or you are not a member of it any more." : describeError(w.resumeError, "load the Project").body }}
      <template #actions>
        <Button as-child variant="secondary" size="sm"><RouterLink :to="{ name: 'home' }" class="no-underline">Choose another Project</RouterLink></Button>
      </template>
    </Alert>

    <Alert v-else-if="!w.created && !canCreateProjects" tone="warning" title="You cannot create Projects">
      The UNICHE Catalogue lists no organisation you manage. A manager of your organisation can create the Project, or make you a manager in the Catalogue.
    </Alert>

    <template v-else>
      <Stepper class="[@media(max-height:480px)]:mb-3" :steps="STEPS" :current="w.step" :can-go="(k) => w.canGo(k)" @go="(k) => w.goTo(k)" />

      <form novalidate aria-labelledby="step-heading" class="rounded-lg border border-border bg-card shadow-1" @submit.prevent="w.step === 'name' && !w.created ? w.submitName() : undefined">
        <div class="p-4 sm:p-6">
          <h2 id="step-heading" tabindex="-1" class="mb-4 text-base font-bold outline-none">{{ stepTitle[w.step] }}</h2>

          <FormErrorSummary v-if="w.summary" class="mb-5" :summary="w.summary" @select="focusField" />

          <StepName v-if="w.step === 'name'" :w="w" />
          <StepTemplate v-else-if="w.step === 'template'" :w="w" />
          <StepLanguages v-else-if="w.step === 'languages'" :w="w" />
          <StepReview v-else :w="w" @change="(k) => w.goTo(k)" />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 rounded-b-lg border-t border-border bg-sunken px-4 py-3 sm:px-6">
          <Button v-if="w.step !== 'name'" variant="secondary" @click="w.goTo(w.step === 'template' ? 'name' : w.step === 'languages' ? 'template' : 'languages')"><ArrowLeft />Back</Button>
          <span v-else></span>
          <div class="flex flex-wrap items-center gap-3">
            <p v-if="footerReason" aria-hidden="true" class="max-w-xs text-xs text-muted-foreground">{{ footerReason }}</p>
            <Button v-if="w.step === 'name' && !w.created" type="submit" :loading="w.submitting" :disabled-reason="offlineReason()">{{ w.submitting ? "Creating" : "Create Project and continue" }}</Button>
            <Button v-else-if="w.step === 'name'" @click="w.goTo('template')">Continue</Button>
            <span v-else-if="w.step === 'template'" class="inline-flex" @click.capture="onFooterPress">
              <Button :disabled-reason="w.template ? undefined : footerReason" @click="w.goTo('languages')">Continue</Button>
            </span>
            <Button v-else-if="w.step === 'languages'" @click="w.continueFromLanguages()">Continue to review</Button>
            <Button v-else :loading="w.initializing" :disabled-reason="offlineReason() ?? w.blockedReason ?? undefined" @click="w.initialize()">{{ w.initializing ? "Initializing" : "Initialize Project" }}</Button>
          </div>
        </div>
      </form>
    </template>
  </PageFrame>
</template>
