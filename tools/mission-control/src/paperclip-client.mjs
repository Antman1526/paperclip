import { normalizeCompanyState } from "./state.mjs";

function requestError(status) {
  return new Error(`Paperclip request failed: ${status}`);
}

export function createPaperclipClient({ baseUrl, apiKey, fetchImpl = fetch }) {
  const root = String(baseUrl ?? "").replace(/\/$/, "");

  async function get(path) {
    let response;
    try {
      response = await fetchImpl(`${root}${path}`, {
        headers: {
          accept: "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
      });
    } catch {
      throw requestError("network");
    }

    if (!response?.ok) throw requestError(response?.status ?? "unknown");

    try {
      return await response.json();
    } catch {
      throw requestError("invalid response");
    }
  }

  return {
    async readCompanyState(companyId) {
      const encodedId = encodeURIComponent(String(companyId));
      const [company, dashboard, agents, routines, issues] = await Promise.all([
        get(`/api/companies/${encodedId}`),
        get(`/api/companies/${encodedId}/dashboard`),
        get(`/api/companies/${encodedId}/agents`),
        get(`/api/companies/${encodedId}/routines`),
        get(`/api/companies/${encodedId}/issues?limit=20`),
      ]);

      return normalizeCompanyState({ company, dashboard, agents, routines, issues, approvals: [] });
    },
  };
}
