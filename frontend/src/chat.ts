const API = "https://127.0.0.1:8000";

interface RespostaChat {
    resposta: string;
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
    "Quero um exercicio de respiração",
    "Estou bem hoje",
];

function adicionarMensagem(texto: string, quem: "bot"| "eu", extra = ""): HTMLDivElement {
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
    body: JSON.stringify({ texto }),
  });
  if (!r.ok) throw new Error("Erro no servidor");
  return (await r.json()) as RespostaChat;
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

adicionarMensagem("Olá! Como posso te ajudar hoje?", "bot");