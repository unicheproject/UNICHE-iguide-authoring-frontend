<script setup lang="ts">
import { ref } from "vue";
import { onClickOutside, onKeyStroke } from "@vueuse/core";
import ProjectSwitcher from "@/components/ProjectSwitcher.vue";
import { logout, session } from "@/platform/auth";

const menuOpen = ref(false);
const menuRoot = ref<HTMLElement | null>(null);

onClickOutside(menuRoot, () => {
  menuOpen.value = false;
});
onKeyStroke("Escape", () => {
  menuOpen.value = false;
});

// Placeholders: "Manage members" will open the Catalogue's own membership screen for the current
// Project (02-uniche-auth-tenancy.md section 14); "Help" has no destination yet.
function openManageMembers() {}
function openHelp() {}
</script>

<template>
  <!-- Wraps at narrow widths and high zoom instead of widening the page (WCAG 1.4.10, D-054). -->
  <header class="flex min-h-[60px] flex-none flex-wrap items-center gap-x-[18px] gap-y-2 border-b bg-card px-4 py-2.5 md:px-5">
    <img
      src="https://uniche-eccch.eu/static/assets/images/uniche-logo-transparent-header.png"
      alt="UNICHE"
      class="block h-[26px] w-auto"
    />
    <span
      class="whitespace-nowrap border-l pl-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary"
    >
      iGuide CMS
    </span>

    <!-- Below 768 pixels the switcher takes its own row under the brand and the avatar, keeping the fixed header low (D-062). -->
    <ProjectSwitcher v-if="session.status === 'authenticated'" class="max-md:order-last max-md:ml-0 max-md:basis-full" />

    <div v-if="session.user" class="ml-auto flex flex-wrap items-center gap-x-[18px] gap-y-1">
      <button
        type="button"
        class="hidden whitespace-nowrap text-xs font-semibold text-primary hover:text-highlight hover:underline md:inline"
        @click="openManageMembers"
      >
        Manage members <span aria-hidden="true">↗</span>
      </button>
      <button
        type="button"
        class="hidden whitespace-nowrap text-xs font-semibold text-muted-foreground hover:text-highlight hover:underline md:inline"
        @click="openHelp"
      >
        Help
      </button>

      <div ref="menuRoot" class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <span
            class="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-primary-foreground"
            aria-hidden="true"
          >
            {{ session.user.initials }}
          </span>
          <span class="sr-only whitespace-nowrap text-xs font-semibold md:not-sr-only">{{ session.user.shortName }}</span>
        </button>

        <div
          v-if="menuOpen"
          role="menu"
          class="absolute right-0 top-[calc(100%+8px)] z-[80] w-64 overflow-hidden rounded-[10px] border bg-card shadow-[0_18px_44px_rgba(3,7,18,0.18)]"
        >
          <div class="border-b px-3.5 py-3">
            <span class="block text-xs font-bold">{{ session.user.displayName }}</span>
            <span v-if="session.user.email" class="block break-all text-[11px] text-muted-foreground">
              {{ session.user.email }}
            </span>
            <span class="mt-1 block text-[10px] text-muted-foreground">Signed in with your UNICHE account</span>
          </div>
          <!-- On a small screen "Manage members" and "Help" live here instead of in the bar. -->
          <button
            type="button"
            role="menuitem"
            class="w-full border-b px-3.5 py-3 text-left text-xs font-semibold text-primary hover:bg-accent md:hidden"
            @click="menuOpen = false; openManageMembers()"
          >
            Manage members <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            role="menuitem"
            class="w-full border-b px-3.5 py-3 text-left text-xs font-semibold text-foreground hover:bg-accent md:hidden"
            @click="menuOpen = false; openHelp()"
          >
            Help
          </button>
          <button
            type="button"
            role="menuitem"
            class="w-full px-3.5 py-3 text-left text-xs font-bold text-primary hover:bg-accent"
            @click="logout()"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
