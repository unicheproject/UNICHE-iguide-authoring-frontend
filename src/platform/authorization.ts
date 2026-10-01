import { apiRequest } from "./api";

/**
 * The Catalogue's authorization view for the signed-in subject, served by `GET /me/authorization`.
 *
 * It exists so the CMS can hide what the Catalogue would reject; it is not an enforcement mechanism.
 * The backend still checks access with the Catalogue on every Project-scoped request.
 */
export interface MyAuthorization {
  subject: string;
  platformAdmin: boolean;
  managedOrganisations: string[];
  projectMemberships: ProjectMembership[];
}

export interface ProjectMembership {
  projectId: string;
  orgId: string;
  role: string;
}

export function fetchMyAuthorization(signal?: AbortSignal): Promise<MyAuthorization> {
  return apiRequest<MyAuthorization>("/me/authorization", { signal });
}
