<script setup lang="ts" generic="T extends EditableResource">
/**
 * The two "someone else changed this" dialogs of an editor (`12` §5, D-025, D-095): after a refused Save, and after a
 * refused Apply of a Working Copy.
 *
 * Save is a three-way merge: only a field the author changed since they started can conflict, so only those are listed
 * (per field Mine or Current, nothing preselected; a list shows how each side changed it, "Mine: 1 added. Current: 2
 * removed."); everything else takes the other person's value or keeps the author's, without a question. The primary
 * action is "Keep my changes"; "Reload their version (discards your 3 changes)" says exactly what it loses. The request
 * id is shown, and who or when only when the API supplies it (GAPS.md G-035). Choices are saved on top of the current
 * version; Apply is tried again afterwards.
 */
import AppDialog from "@/components/AppDialog.vue";
import { Button } from "@/components/ui/button";
import type { ConflictField, EditableResource, ResourceEditor } from "@/workspace/useResourceEditor";

const props = defineProps<{ editor: ResourceEditor<T>; title: string }>();

/** A conflicting value as one short line: text as is, lists by their size, anything else as JSON. */
function conflictValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (Array.isArray(value)) return value.length === 1 ? "1 item" : `${value.length} items`;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
const open = (fields: ConflictField[]) => fields.filter((f) => f.choice === null).length;
const chooseReason = (fields: ConflictField[]) => {
  const n = open(fields);
  return n ? `Choose Mine or Current for ${n === 1 ? "the field" : `${n} fields`} first` : undefined;
};
const kind = () => props.editor.kind;
/** "Title" or "Title and Summary": the author's own changes that no conflict touches, kept whichever way the choices go. */
const keptNames = (paths: string[]) => {
  const names = [...new Set(paths.map((p) => props.editor.describePath(p)))];
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
};
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
</script>

<template>
  <AppDialog
    v-if="editor.applyConflict"
    :title="`The live ${kind()} changed`"
    size="lg"
    :busy="editor.saving || editor.applying"
    @close="editor.applyConflict = null"
  >
    <p class="text-sm text-ink-2">
      Someone else applied changes to “{{ title }}” after you started your pending changes. For each field below, choose
      whether to keep your version or the current one. Your choices are saved as pending changes on the current version;
      apply them again when ready.
    </p>
    <p v-if="!editor.applyConflict.fields.length" class="mt-3 text-sm text-ink-2">
      No field differs: saving reopens your pending changes on the current version.
    </p>
    <fieldset v-for="field in editor.applyConflict.fields" :key="field.path" class="mt-3 rounded-md border border-border px-3 py-2">
      <legend class="px-1 text-sm font-semibold">{{ editor.describePath(field.path) }}</legend>
      <label class="flex min-h-9 items-start gap-2 py-1 text-sm">
        <input v-model="field.choice" type="radio" :name="`apply-${field.path}`" value="mine" class="mt-1" />
        <span><span class="font-semibold">Mine:</span> {{ conflictValue(field.mine) }}</span>
      </label>
      <label class="flex min-h-9 items-start gap-2 py-1 text-sm">
        <input v-model="field.choice" type="radio" :name="`apply-${field.path}`" value="current" class="mt-1" />
        <span><span class="font-semibold">Current:</span> {{ conflictValue(field.current) }}</span>
      </label>
    </fieldset>
    <p v-if="editor.applyConflict.requestId ?? editor.conflict?.requestId" class="mono mt-3 text-muted-foreground" data-request-id>Request id {{ editor.applyConflict.requestId ?? editor.conflict?.requestId }}</p>
    <p v-if="chooseReason(editor.applyConflict.fields)" class="mt-3 text-sm font-medium text-ink-2" role="status" data-choose-reason>{{ chooseReason(editor.applyConflict.fields) }}.</p>
    <template #actions>
      <Button variant="ghost" class="text-destructive" :disabled="editor.saving || editor.applying" @click="editor.discardChanges(title)">Discard my changes</Button>
      <Button variant="primary" :loading="editor.saving || editor.applying" :disabled-reason="chooseReason(editor.applyConflict.fields)" @click="editor.resolveApplyConflict()">Save my choices</Button>
    </template>
  </AppDialog>

  <AppDialog
    v-if="editor.conflict"
    :title="`Someone else changed this ${kind()}`"
    :size="editor.saveConflict?.fields.length ? 'lg' : 'md'"
    :busy="editor.saving"
    @close="editor.closeConflict()"
  >
    <template v-if="editor.saveConflict">
      <p class="text-sm text-ink-2">
        It was saved by someone else while you were editing.
        <template v-if="editor.saveConflict.fields.length">
          You and they both changed {{ plural(editor.saveConflict.fields.length, "field") }}: choose which version of each to keep.
        </template>
        <template v-else>
          Nothing you changed clashes with their changes, so your changes can be saved on top of their version.
        </template>
      </p>
      <fieldset v-for="field in editor.saveConflict.fields" :key="field.path" class="mt-3 rounded-md border border-border px-3 py-2">
        <legend class="px-1 text-sm font-semibold">{{ editor.describePath(field.path) }}</legend>
        <p v-if="field.diff" class="text-xs text-muted-foreground">{{ field.diff }}</p>
        <label class="flex min-h-9 items-start gap-2 py-1 text-sm">
          <input v-model="field.choice" type="radio" :name="`save-${field.path}`" value="mine" class="mt-1" />
          <span><span class="font-semibold">Mine:</span> {{ conflictValue(field.mine) }}</span>
        </label>
        <label class="flex min-h-9 items-start gap-2 py-1 text-sm">
          <input v-model="field.choice" type="radio" :name="`save-${field.path}`" value="current" class="mt-1" />
          <span><span class="font-semibold">Current:</span> {{ conflictValue(field.current) }}</span>
        </label>
      </fieldset>
      <p v-if="editor.saveConflict.takeCurrent.length" class="mt-3 text-sm text-ink-2">
        {{ plural(editor.saveConflict.takeCurrent.length, "other field") }} changed only by them will keep their version.
      </p>
      <p v-if="editor.saveConflict.kept.length" class="mt-3 text-sm text-ink-2" data-kept>
        Your other {{ editor.saveConflict.kept.length === 1 ? "change" : "changes" }} ({{ keptNames(editor.saveConflict.kept) }}) {{ editor.saveConflict.kept.length === 1 ? "is" : "are" }} kept either way.
      </p>
    </template>
    <p v-else class="text-sm text-ink-2">
      It was saved by someone else while you were editing. Reload to see their version and lose your changes, or keep your
      changes and save them over theirs.
    </p>
    <p v-if="editor.conflict.requestId" class="mono mt-3 text-muted-foreground" data-request-id>Request id {{ editor.conflict.requestId }}</p>
    <p v-if="editor.saveConflict && chooseReason(editor.saveConflict.fields)" class="mt-3 text-sm font-medium text-ink-2" role="status" data-choose-reason>{{ chooseReason(editor.saveConflict.fields) }}.</p>
    <template #actions>
      <Button variant="secondary" :disabled="editor.saving" @click="editor.reloadDiscardingChanges()">
        Reload their version<template v-if="editor.saveConflict && editor.saveConflict.myChanges"> (discards your {{ plural(editor.saveConflict.myChanges, "change") }})</template>
      </Button>
      <Button
        v-if="editor.saveConflict"
        variant="primary"
        :loading="editor.saving"
        :disabled-reason="chooseReason(editor.saveConflict.fields)"
        @click="editor.resolveSaveConflict()"
      >Keep my changes</Button>
      <Button v-else-if="editor.conflict.currentVersion !== null" variant="primary" :loading="editor.saving" @click="editor.overwrite()">Keep my changes</Button>
    </template>
  </AppDialog>
</template>
