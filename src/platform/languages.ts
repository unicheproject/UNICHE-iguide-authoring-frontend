import { apiRequest } from "./api";

export type TextDirection = "LTR" | "RTL";

export interface ProjectLanguage {
  languageCode: string;
  /** The language's own name, as visitors see it in the language switcher. */
  displayName: string;
  direction: TextDirection;
  isDefault: boolean;
  sortOrder: number;
  /** Non-archived Places and Points of Interest with a title in this language. */
  titledResourceCount: number;
}

export interface ProjectLanguages {
  languages: ProjectLanguage[];
  /** Non-archived Places and Points of Interest in the Project. */
  resourceCount: number;
}

export interface LanguageInput {
  languageCode: string;
  displayName: string;
  direction: TextDirection;
  isDefault: boolean;
}

export function fetchProjectLanguages(projectId: string, signal?: AbortSignal): Promise<ProjectLanguages> {
  return apiRequest<ProjectLanguages>(`/projects/${encodeURIComponent(projectId)}/languages`, { signal });
}

/** Replaces the complete, ordered list; a language left out is removed and its translations hidden. */
export function updateProjectLanguages(projectId: string, languages: LanguageInput[]): Promise<ProjectLanguages> {
  return apiRequest<ProjectLanguages>(`/projects/${encodeURIComponent(projectId)}/languages`, {
    method: "PUT",
    body: { languages },
  });
}
