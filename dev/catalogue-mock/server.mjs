// In-memory stand-in for the UNICHE Catalogue API, for local development only.
//
// It serves the Catalogue paths the authoring backend calls, for the single test user in fixture.json,
// and enforces the rules the CMS depends on: only managers of an organisation create Projects in it,
// slugs are unique per organisation, and a Project the user is not a member of answers 404. State lives
// in memory and resets on restart. It does not validate tokens; it only requires one to be present,
// because the backend has already validated it.
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8080);
const TOOL_SLUG = process.env.TOOL_SLUG ?? "iguide";
const fixture = JSON.parse(readFileSync(new URL("./fixture.json", import.meta.url), "utf8"));

const organisations = new Map(fixture.organisations.map((o) => [o.id, o]));
const projects = new Map(fixture.projects.map((p) => [p.id, { ...p, deletedAt: null }]));
let authorizationRevision = 1;

const routes = [
  ["GET", /^\/api\/v1\/me\/authorization$/, meAuthorization],
  ["GET", /^\/api\/v1\/organisations\/([^/]+)$/, getOrganisation],
  ["GET", /^\/api\/v1\/organisations\/([^/]+)\/projects$/, listProjects],
  ["POST", /^\/api\/v1\/organisations\/([^/]+)\/projects$/, createProject],
  ["GET", /^\/api\/v1\/projects\/([^/]+)$/, getProject],
];

function meAuthorization() {
  return json(200, {
    subject: fixture.subject,
    platformAdmin: false,
    managedOrganisations: [...organisations.values()].filter((o) => o.managed).map((o) => o.id),
    projectMemberships: [...projects.values()]
      .filter((p) => p.member && !p.deletedAt)
      .map((p) => ({ projectId: p.id, orgId: p.orgId, role: "curator" })),
    etag: `"rev-${authorizationRevision}"`,
    ttlSeconds: 30,
  });
}

function getOrganisation(orgId) {
  const org = organisations.get(orgId);
  if (!org || !canSeeOrganisation(org)) return problem(404, "Organisation not found");
  return json(200, toOrganisation(org));
}

function listProjects(orgId) {
  const org = organisations.get(orgId);
  if (!org || !canSeeOrganisation(org)) return problem(404, "Organisation not found");
  const visible = [...projects.values()].filter(
    (p) => p.orgId === orgId && !p.deletedAt && (org.managed || p.member),
  );
  return json(200, visible.map(toProject));
}

function createProject(orgId, body) {
  const org = organisations.get(orgId);
  if (!org || !canSeeOrganisation(org)) return problem(404, "Organisation not found");
  if (!org.managed) return problem(403, "Only managers of the organisation can create Projects");
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return problem(422, "A name and a slug of lowercase letters, digits, and hyphens are required");
  }
  if (body.toolSlug !== TOOL_SLUG) return problem(404, `Unknown tool "${body.toolSlug}"`);
  const taken = [...projects.values()].some((p) => p.orgId === orgId && p.slug === slug && !p.deletedAt);
  if (taken) return problem(409, "A Project with this slug already exists in the organisation");

  const now = new Date().toISOString();
  const project = { id: randomUUID(), orgId, name, slug, status: "ACTIVE", member: true, createdAt: now, updatedAt: now, deletedAt: null };
  projects.set(project.id, project);
  authorizationRevision++;
  return json(201, toProject(project));
}

function getProject(projectId) {
  const project = projects.get(projectId);
  if (!project || project.deletedAt) return problem(404, "Project not found");
  const org = organisations.get(project.orgId);
  if (!project.member && !org?.managed) return problem(404, "Project not found");
  return json(200, toProject(project));
}

function canSeeOrganisation(org) {
  return org.managed || [...projects.values()].some((p) => p.orgId === org.id && p.member && !p.deletedAt);
}

function toOrganisation(o) {
  return { id: o.id, name: o.name, slug: o.slug, status: o.status };
}

function toProject(p) {
  return {
    id: p.id,
    orgId: p.orgId,
    name: p.name,
    slug: p.slug,
    status: p.status,
    tool: { slug: TOOL_SLUG },
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function json(status, body) {
  return { status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function problem(status, detail) {
  return {
    status,
    headers: { "Content-Type": "application/problem+json" },
    body: JSON.stringify({ type: "about:blank", title: detail, status, detail }),
  };
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let result;
  if (!/^Bearer .+/.test(req.headers.authorization ?? "")) {
    result = { status: 401, headers: { "WWW-Authenticate": "Bearer" }, body: "" };
  } else {
    const route = routes.find(([method, pattern]) => method === req.method && pattern.test(url.pathname));
    if (!route) {
      result = problem(404, `No mock for ${req.method} ${url.pathname}`);
    } else {
      const [, pattern, handler] = route;
      const params = url.pathname.match(pattern).slice(1).map(decodeURIComponent);
      let body = null;
      if (req.method === "POST") {
        try {
          body = JSON.parse((await readBody(req)) || "null");
        } catch {
          result = problem(400, "Body is not valid JSON");
        }
      }
      result ??= handler(...params, body);
    }
  }
  res.writeHead(result.status, result.headers);
  res.end(result.body);
  console.log(`${req.method} ${url.pathname} -> ${result.status}`);
}).listen(PORT, () => console.log(`Catalogue mock listening on ${PORT}`));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
