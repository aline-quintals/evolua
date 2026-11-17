const API = "http://127.0.0.1:8000";

interface RespostaChat {
  resposta: string;
  alerta: boolean;
}

interface ItemHistorico {
  autor: "bot" | "eu";
  texto: string;
  alerta: boolean;
}

const log = document.getElementById("log") as HTMLDivElement;
const input = document.getElementById("input") as HTMLInputElement;
const chips = document.getElementById("chips") as HTMLDivElement;
const botaoEnviar = document.getElementById("enviar") as HTMLButtonElement;

const RAPIDAS: string[] = [
  "Estou ansioso(a)",
  "Estou triste",
  "Não consigo dormir",
  "Quero um exercício de respiração",
  "Estou bem hoje",
];

// Código que identifica esta pessoa/navegador
function obterSessao(): string {
  let id = localStorage.getItem("evolua_sessao");
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("evolua_sessao", id);
  }
  return id;
}
const SESSAO = obterSessao();

function adicionarMensagem(texto: string, quem: "bot" | "eu", extra = ""): HTMLDivElement {
  const div = document.createElement("div");
  div.className = `msg ${quem} ${extra}`.trim();
  div.textContent = texto;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

async function pedirResposta(texto: string): Promise<RespostaChat> {
  const r = await fetch(`${API}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, sessao: SESSAO }),
  });
  if (!r.ok) throw new Error("Erro no servidor");
  return (await r.json()) as RespostaChat;
}

async function carregarHistorico(): Promise<void> {
  try {
    const r = await fetch(`${API}/historico?sessao=${encodeURIComponent(SESSAO)}`);
    if (!r.ok) throw new Error("Erro no servidor");
    const itens = (await r.json()) as ItemHistorico[];

    if (itens.length > 0) {
      chips.style.display = "none";
      itens.forEach((i) => adicionarMensagem(i.texto, i.autor, i.alerta ? "alerta" : ""));
      return;
    }
  } catch {
    // Sem servidor: segue com a saudação normal
  }
  adicionarMensagem("Olá! Como posso te ajudar hoje?", "bot");
}

async function enviar(textoRapido?: string): Promise<void> {
  const texto = (textoRapido ?? input.value).trim();
  if (!texto) return;

  input.value = "";
  chips.style.display = "none";
  adicionarMensagem(texto, "eu");

  const digitando = adicionarMensagem("digitando…", "bot");
  try {
    const dados = await pedirResposta(texto);
    digitando.remove();
    adicionarMensagem(dados.resposta, "bot", dados.alerta ? "alerta" : "");
  } catch {
    digitando.remove();
    adicionarMensagem("Não consegui me conectar ao servidor. Verifique se o backend está rodando.", "bot");
  }
}

botaoEnviar.addEventListener("click", () => enviar());
input.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    e.preventDefault();
    enviar();
  }
});

RAPIDAS.forEach((texto) => {
  const botao = document.createElement("button");
  botao.textContent = texto;
  botao.addEventListener("click", () => enviar(texto));
  chips.appendChild(botao);
});

carregarHistorico();