import type { Navigation, NavigationItem } from "@/platform/navigation";
import type { PreviewMenuItem, PreviewTarget } from "@/workspace/preview";
import { titleOf, type PreviewContext } from "@/workspace/previewModels";

/*
 * Navigation items as the stand-in visitor app draws them (`03` §13, `13` "Moving through content", D-055): a label
 * in the previewed language, else the target's title in that language (which itself falls back to the default
 * language), else, for a heading, its default-language label.
 */

export function itemTarget(item: NavigationItem): PreviewTarget | null {
  return item.itemType === "RESOURCE" && item.targetResourceType && item.targetResourceId
    ? { type: item.targetResourceType, id: item.targetResourceId }
    : null;
}

/** The label visitors of `ctx.language` read for the item. */
export function itemLabel(item: NavigationItem, ctx: PreviewContext): string {
  const own = (ctx.language && item.labels[ctx.language]?.trim()) || "";
  if (own) return own;
  const target = itemTarget(item);
  if (target) return titleOf(ctx, target);
  return (ctx.defaultLanguage && item.labels[ctx.defaultLanguage]?.trim()) || "";
}

/** The Navigation's items as a tree for the preview; empty when there is no Navigation. */
export function previewMenu(navigation: Navigation | null | undefined, ctx: PreviewContext): PreviewMenuItem[] {
  if (!navigation) return [];
  const byParent = new Map<string | null, NavigationItem[]>();
  for (const item of navigation.items) {
    const siblings = byParent.get(item.parentItemId) ?? [];
    siblings.push(item);
    byParent.set(item.parentItemId, siblings);
  }
  const build = (parent: string | null): PreviewMenuItem[] =>
    (byParent.get(parent) ?? []).map((item) => ({
      key: item.id,
      label: itemLabel(item, ctx),
      target: itemTarget(item),
      children: build(item.id),
    }));
  return build(null);
}
