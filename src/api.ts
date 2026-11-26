import { API_URL } from "./config";

export interface RespostaChat {
  resposta: string;
  alerta: boolean;
}

export interface ItemHistorico {
  autor: "bot" | "eu";
  texto: string;
  alerta: boolean;
}

async function pedir<T>(caminho: string, opcoes: RequestInit = {}, ms = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers: {
        "bypass-tunnel-reminder": "true",
        ...((opcoes.headers as Record<string, string>) ?? {}),
      },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`Servidor respondeu ${r.status}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// Só consulta
export const consultarHistorico = (sessao: string) =>
  pedir<ItemHistorico[]>(`/historico?sessao=${encodeURIComponent(sessao)}`);

// Só apaga
export const apagarHistorico = (sessao: string) =>
  pedir<{ status: string }>(`/historico?sessao=${encodeURIComponent(sessao)}`, {
    method: "DELETE",
  });

export const enviarMensagem = (texto: string, sessao: string) =>
  pedir<RespostaChat>("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, sessao }),
  });
