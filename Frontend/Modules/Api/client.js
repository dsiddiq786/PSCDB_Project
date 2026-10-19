/* Small JSON client for the PSCDB API. Never throws: returns { ok, status, data, message, field }. */
export async function api(path, { method = "GET", body, signal } = {}) {
  try {
    const response = await fetch(`/api/v1${path}`, {
      method,
      signal,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok && payload.success !== false, status: response.status, data: payload.data, message: payload.message, field: payload.field };
  } catch (error) {
    if (error.name === "AbortError") return { ok: false, status: 0, aborted: true };
    return { ok: false, status: 0, message: "We could not reach the server. Check your connection and try again." };
  }
}

/* Uploads one file as multipart form data. Same result shape as api(). */
export async function upload(path, field, file, { method = "POST" } = {}) {
  try {
    const form = new FormData();
    form.append(field, file);
    const response = await fetch(`/api/v1${path}`, { method, credentials: "same-origin", body: form, headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok && payload.success !== false, status: response.status, data: payload.data, message: payload.message, field: payload.field };
  } catch {
    return { ok: false, status: 0, message: "We could not reach the server. Check your connection and try again." };
  }
}
