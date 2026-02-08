import crypto from "crypto";
import type {
  CanvaTokens,
  CanvaBrandTemplate,
  CanvaTemplateDataset,
  CanvaDesign,
  CanvaAutofillData,
  CanvaExportFormat,
  CanvaExportResult,
} from "./types";

const CANVA_API_BASE = "https://api.canva.com/rest/v1";

class CanvaApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "CanvaApiError";
  }
}

async function canvaRequest<T>(
  path: string,
  accessToken: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  const url = new URL(`${CANVA_API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new CanvaApiError(
      response.status,
      `Canva API error ${response.status}: ${errorBody}`,
      errorBody
    );
  }

  return (await response.json()) as T;
}

// ─── PKCE Helpers ────────────────────────────────────────────────

/**
 * Generate a cryptographically random code_verifier for PKCE.
 * Must be 43-128 chars, ASCII letters/numbers and -._~ only.
 */
export function generateCodeVerifier(): string {
  const buffer = crypto.randomBytes(64);
  return buffer
    .toString("base64url")
    .replace(/[^A-Za-z0-9\-._~]/g, "")
    .slice(0, 128);
}

/**
 * Generate code_challenge from code_verifier using SHA-256.
 */
export function generateCodeChallenge(codeVerifier: string): string {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
}

/**
 * Get Basic Auth header value for Canva token requests.
 * Canva requires Base64(client_id:client_secret) for token exchange.
 */
function getBasicAuthHeader(): string {
  const clientId = process.env.CANVA_CLIENT_ID!;
  const clientSecret = process.env.CANVA_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return `Basic ${credentials}`;
}

// ─── OAuth ───────────────────────────────────────────────────────

/**
 * Build the Canva OAuth authorization URL with PKCE.
 *
 * The code_verifier is encoded into the `state` parameter as an HMAC-signed
 * payload. This avoids cookie issues with redirect-based OAuth flows.
 * Canva returns the `state` back to us in the callback, so we can extract
 * the code_verifier without needing cookies.
 *
 * @param returnTo - Optional URL path to redirect to after auth completes
 */
export function getCanvaAuthUrl(returnTo?: string): string {
  const clientId = process.env.CANVA_CLIENT_ID!;
  const redirectUri = process.env.CANVA_REDIRECT_URI!;
  const scopes = [
    "design:content:read",
    "design:content:write",
    "design:meta:read",
    "brandtemplate:content:read",
    "brandtemplate:meta:read",
    "asset:read",
    "asset:write",
  ].join(" ");

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Encode code_verifier + returnTo into state as a signed payload
  const state = encodeOAuthState(codeVerifier, returnTo);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
}

/**
 * Encode the code_verifier and optional returnTo path into the OAuth state.
 * Uses HMAC-SHA256 to sign the payload so it can't be tampered with.
 */
function encodeOAuthState(codeVerifier: string, returnTo?: string): string {
  const secret = process.env.CANVA_CLIENT_SECRET || process.env.NEXTAUTH_SECRET || "canva-oauth-state-secret";
  const payload = JSON.stringify({
    v: codeVerifier,
    r: returnTo || "/dashboard",
    t: Date.now(),
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

/**
 * Decode and verify the OAuth state parameter.
 * Returns the code_verifier and returnTo path, or null if invalid.
 */
export function decodeOAuthState(state: string): { codeVerifier: string; returnTo: string } | null {
  try {
    const secret = process.env.CANVA_CLIENT_SECRET || process.env.NEXTAUTH_SECRET || "canva-oauth-state-secret";
    const [encoded, signature] = state.split(".");
    if (!encoded || !signature) return null;

    // Verify signature
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(encoded)
      .digest("base64url");
    if (signature !== expectedSig) return null;

    // Decode payload
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());

    // Check timestamp — reject if older than 10 minutes
    if (Date.now() - payload.t > 10 * 60 * 1000) return null;

    return {
      codeVerifier: payload.v,
      returnTo: payload.r || "/dashboard",
    };
  } catch {
    return null;
  }
}

/**
 * Exchange an authorization code for tokens using Basic Auth and PKCE code_verifier.
 */
export async function exchangeCanvaCode(code: string, codeVerifier: string): Promise<CanvaTokens> {
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getBasicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      redirect_uri: process.env.CANVA_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Canva token exchange error:", response.status, errorText);
    throw new CanvaApiError(response.status, `Failed to exchange Canva auth code: ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshCanvaToken(refreshToken: string): Promise<CanvaTokens> {
  const response = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getBasicAuthHeader(),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Canva token refresh error:", response.status, errorText);
    throw new CanvaApiError(response.status, `Failed to refresh Canva token: ${errorText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// ─── Brand Templates ─────────────────────────────────────────────

export async function searchBrandTemplates(
  accessToken: string,
  options?: { query?: string; dataset?: "non_empty"; continuation?: string }
): Promise<{ items: CanvaBrandTemplate[]; continuation?: string }> {
  const params: Record<string, string> = {};
  if (options?.query) params.query = options.query;
  if (options?.dataset) params.dataset = options.dataset;
  if (options?.continuation) params.continuation = options.continuation;

  return canvaRequest("/brand-templates", accessToken, { params });
}

export async function getTemplateDataset(
  accessToken: string,
  templateId: string
): Promise<CanvaTemplateDataset> {
  const raw = await canvaRequest<Record<string, unknown>>(
    `/brand-templates/${templateId}/dataset`,
    accessToken
  );

  console.log(
    "Template dataset raw keys:",
    Object.keys(raw),
    "| raw sample:",
    JSON.stringify(raw).slice(0, 300),
  );

  // The Canva API returns: { dataset: { fieldName: { type: "text" }, ... } }
  // We need to normalize this to: { fields: { fieldName: { type: "text" }, ... } }

  const dataset = (raw as { dataset?: Record<string, unknown> }).dataset;
  if (dataset) {
    // Check if dataset already has a "fields" key (unlikely but possible)
    if ((dataset as { fields?: unknown }).fields) {
      console.log("Dataset has 'fields' key, using it directly");
      return dataset as unknown as CanvaTemplateDataset;
    }
    // Otherwise, dataset IS the fields map — wrap it
    console.log("Dataset IS the fields map, wrapping in { fields: ... }, keys:", Object.keys(dataset).slice(0, 10));
    return { fields: dataset as Record<string, { name: string; type: "text" | "image"; required?: boolean }> };
  }

  // Maybe it's directly { fields: { ... } }
  if ((raw as { fields?: unknown }).fields) {
    console.log("Raw has 'fields' key, using directly");
    return raw as unknown as CanvaTemplateDataset;
  }

  // Last resort: maybe the raw response IS the fields map (no wrapper at all)
  const keys = Object.keys(raw);
  if (keys.length > 0 && typeof raw[keys[0]] === "object" && raw[keys[0]] !== null) {
    const firstVal = raw[keys[0]] as Record<string, unknown>;
    if (firstVal.type === "text" || firstVal.type === "image") {
      console.log("Raw IS the fields map (no wrapper), keys:", keys.slice(0, 10));
      return { fields: raw as Record<string, { name: string; type: "text" | "image"; required?: boolean }> };
    }
  }

  // Last resort: return empty fields so we don't crash
  console.warn("Unexpected dataset structure:", JSON.stringify(raw).slice(0, 500));
  return { fields: {} } as CanvaTemplateDataset;
}

// ─── Autofill Design ─────────────────────────────────────────────

/**
 * Create a design from a brand template using autofill.
 * This is an async job — we POST to start, then poll until complete.
 */
export async function autofillDesign(
  accessToken: string,
  templateId: string,
  data: CanvaAutofillData,
  title?: string
): Promise<{ id: string; url: string; editUrl: string; thumbnailUrl?: string }> {
  // Step 1: Start the autofill job
  const jobResult = await canvaRequest<{
    job: { id: string; status: string };
  }>("/autofills", accessToken, {
    method: "POST",
    body: {
      brand_template_id: templateId,
      data,
      title: title || "CMA Report",
    },
  });

  const jobId = jobResult.job?.id;
  if (!jobId) throw new Error("Autofill job creation failed — no job ID returned");

  // Step 2: Poll for completion (up to 60s)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollResult = await canvaRequest<{
      job: {
        id: string;
        status: string;
        result?: {
          design?: {
            id: string;
            url: string;
            urls?: { edit_url?: string; view_url?: string };
            thumbnail?: { url: string };
          };
        };
        error?: { code: string; message: string };
      };
    }>(`/autofills/${jobId}`, accessToken);

    const status = pollResult.job?.status;

    if (status === "success") {
      const design = pollResult.job.result?.design;
      console.log("Autofill job succeeded — full result:", JSON.stringify(pollResult.job.result, null, 2));
      if (!design) throw new Error("Autofill succeeded but no design returned");
      console.log("Autofill design ID:", design.id, "| URL:", design.url, "| edit_url:", design.urls?.edit_url);
      return {
        id: design.id,
        url: design.urls?.edit_url || design.urls?.view_url || design.url,
        editUrl: design.urls?.edit_url || design.url,
        thumbnailUrl: design.thumbnail?.url,
      };
    }

    if (status === "failed") {
      const errMsg = pollResult.job.error?.message || "Unknown error";
      throw new Error(`Autofill job failed: ${errMsg}`);
    }
  }

  throw new Error("Autofill job timed out after 60 seconds");
}

// ─── Design Operations ───────────────────────────────────────────

export async function getDesign(
  accessToken: string,
  designId: string
): Promise<CanvaDesign> {
  return canvaRequest(`/designs/${designId}`, accessToken);
}

// ─── Asset Upload ────────────────────────────────────────────────

export async function uploadAssetFromUrl(
  accessToken: string,
  url: string,
  name: string
): Promise<{ id: string }> {
  // Canva requires /url-asset-uploads for URL-based uploads (not /asset-uploads which is for binary)
  // Docs: https://www.canva.dev/docs/connect/api-reference/assets/create-url-asset-upload-job/

  // Step 1: Start the URL upload job
  const jobResult = await canvaRequest<{
    job: { id: string; status: string; asset?: { id: string } };
  }>("/url-asset-uploads", accessToken, {
    method: "POST",
    body: { url, name: name.slice(0, 255) },
  });

  // Some responses may return the asset directly on success
  if (jobResult.job?.asset?.id) {
    return { id: jobResult.job.asset.id };
  }

  const jobId = jobResult.job?.id;
  if (!jobId) {
    throw new Error("Asset upload job creation failed — no job ID returned");
  }

  // Step 2: Poll for completion (up to 30s)
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const pollResult = await canvaRequest<{
      job: {
        id: string;
        status: string;
        asset?: { id: string };
        error?: { code: string; message: string };
      };
    }>(`/url-asset-uploads/${jobId}`, accessToken);

    if (pollResult.job?.asset?.id) {
      return { id: pollResult.job.asset.id };
    }

    if (pollResult.job?.status === "failed") {
      const errMsg = pollResult.job.error?.message || "Unknown error";
      throw new Error(`Asset upload failed: ${errMsg}`);
    }
  }

  throw new Error("Asset upload timed out after 30 seconds");
}

// ─── Export Design ───────────────────────────────────────────────

export async function exportDesign(
  accessToken: string,
  designId: string,
  format: CanvaExportFormat
): Promise<CanvaExportResult> {
  // Canva export API: POST /v1/exports with design_id in body
  // Docs: https://www.canva.dev/docs/connect/api-reference/exports/create-design-export-job/

  // Start export job
  const job = await canvaRequest<{ job: { id: string; status: string } }>(
    "/exports",
    accessToken,
    {
      method: "POST",
      body: { design_id: designId, format },
    }
  );

  const jobId = job.job?.id;
  if (!jobId) {
    throw new CanvaApiError(500, "Export job creation failed — no job ID returned");
  }

  // Poll for completion via GET /v1/exports/{exportId}
  let attempts = 0;
  const maxAttempts = 30;
  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const status = await canvaRequest<{
      job: {
        id: string;
        status: string;
        urls?: string[];
        error?: { code: string; message: string };
      };
    }>(`/exports/${jobId}`, accessToken);

    console.log("Export poll response:", JSON.stringify(status.job, null, 2));
    if (status.job.status === "success" && status.job.urls?.[0]) {
      console.log(`Export complete: ${status.job.urls.length} download URL(s)`);
      return {
        downloadUrl: status.job.urls[0],
        downloadUrls: status.job.urls,
        format: format.type,
      };
    }
    if (status.job.status === "failed") {
      const errMsg = status.job.error?.message || "Unknown export error";
      throw new CanvaApiError(500, `Canva export job failed: ${errMsg}`);
    }
    attempts++;
  }

  throw new CanvaApiError(408, "Canva export job timed out");
}
