<script setup lang="ts">
/**
 * The application header (D-073): 56 px, one row at every width. Left to right: the menu button (below 1100 px, inside
 * a Project), the UNICHE logo (a bundled asset, 26 px high, linking to the Project list with a 44 px hit area, D-106), "iGuide CMS", the Project switcher, and
 * the user menu. "Manage members" links to the Platform Portal when one is configured and is absent otherwise; there is
 * no "Help" until it has a destination (Q-016).
 */
import { ExternalLink, LogOut, Menu } from "lucide-vue-next";
import { computed } from "vue";
import { useRoute } from "vue-router";
import logoUrl from "@/assets/uniche-logo.png";
import ProjectSwitcher from "@/components/ProjectSwitcher.vue";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logout, platformConfig, session } from "@/platform/auth";
import { navDrawer, setNavDrawer } from "@/stores/navDrawer";

const route = useRoute();
const inProject = computed(() => typeof route.params.projectId === "string" && route.name !== "project-create");
const portalUrl = platformConfig().portalUrl;
</script>

<template>
  <header class="relative z-sticky flex h-header flex-none items-center gap-3 border-b border-border bg-card px-4 nav:px-6">
    <button
      v-if="inProject"
      id="nav-toggle"
      type="button"
      class="inline-flex size-11 flex-none items-center justify-center rounded-md text-foreground hover:bg-surface-hover nav:hidden"
      aria-controls="workspace-nav"
      :aria-expanded="navDrawer.open"
      aria-label="Menu"
      @click="setNavDrawer(!navDrawer.open)"
    >
      <Menu class="size-5" aria-hidden="true" />
    </button>
    <RouterLink v-if="session.status === 'authenticated'" :to="{ name: 'home' }" class="hit-44 flex flex-none items-center rounded-sm" aria-label="UNICHE, all projects">
      <img :src="logoUrl" alt="" width="122" height="26" class="block h-logo w-auto" />
    </RouterLink>
    <img v-else :src="logoUrl" alt="UNICHE" width="122" height="26" class="block h-logo w-auto flex-none" />
    <span class="hidden flex-none whitespace-nowrap border-l border-border pl-3 text-xs font-semibold text-muted-foreground md:inline">
      iGuide CMS
    </span>

    <ProjectSwitcher v-if="session.status === 'authenticated'" class="min-w-0" />

    <div v-if="session.user" class="ml-auto flex flex-none items-center">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="flex min-h-control items-center gap-2 rounded-md px-1.5 hover:bg-surface-hover"
          >
            <span class="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">
              {{ session.user.initials }}
            </span>
            <span class="whitespace-nowrap text-sm font-semibold max-md:sr-only">{{ session.user.shortName }}</span>
            <span class="sr-only">, account menu</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-64">
          <div class="px-3 py-2">
            <span class="block text-sm font-semibold">{{ session.user.displayName }}</span>
            <span v-if="session.user.email" class="block break-all text-xs text-muted-foreground">{{ session.user.email }}</span>
            <span class="mt-1 block text-xs text-muted-foreground">Signed in with your UNICHE account</span>
          </div>
          <DropdownMenuSeparator />
          <template v-if="portalUrl && inProject">
            <DropdownMenuLabel>Project</DropdownMenuLabel>
            <DropdownMenuItem as-child>
              <a :href="portalUrl" target="_blank" rel="noopener">
                <ExternalLink aria-hidden="true" />Manage members<span class="sr-only"> (opens the UNICHE Platform Portal in a new tab)</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </template>
          <DropdownMenuItem @select="logout()"><LogOut aria-hidden="true" />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>
