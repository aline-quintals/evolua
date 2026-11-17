import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";

type Msg = { id: string; autor: "bot" | "eu"; texto: string; alerta?: boolean };

const RAPIDAS = [
  "Estou ansioso(a)",
  "Estou triste",
  "Não consigo dormir",
  "Quero um exercício de respiração",
  "Estou bem hoje",
];

async function obterSessao(): Promise<string> {
  let id = await AsyncStorage.getItem("evolua_sessao");
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    await AsyncStorage.setItem("evolua_sessao", id);
  }
  return id;
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [sessao, setSessao] = useState("");
  const [mostrarRapidas, setMostrarRapidas] = useState(true);
  const lista = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    (async () => {
      const s = await obterSessao();
      setSessao(s);
      try {
        const r = await fetch(`${API_URL}/historico?sessao=${encodeURIComponent(s)}`);
        const itens = await r.json();
        if (itens.length > 0) {
          setMostrarRapidas(false);
          setMsgs(itens.map((i: Omit<Msg, "id">, n: number) => ({ id: `h${n}`, ...i })));
          return;
        }
      } catch {
        // sem servidor: segue com a saudação
      }
      setMsgs([{ id: "ola", autor: "bot", texto: "Olá! Como posso te ajudar hoje?" }]);
    })();
  }, []);

  async function enviar(textoRapido?: string) {
    const conteudo = (textoRapido ?? texto).trim();
    if (!conteudo || !sessao) return;

    setTexto("");
    setMostrarRapidas(false);
    setMsgs((m) => [...m, { id: `e${Date.now()}`, autor: "eu", texto: conteudo }]);

    try {
      const r = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: conteudo, sessao }),
      });
      if (!r.ok) throw new Error("erro");
      const d = await r.json();
      setMsgs((m) => [
        ...m,
        { id: `b${Date.now()}`, autor: "bot", texto: d.resposta, alerta: d.alerta },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          id: `x${Date.now()}`,
          autor: "bot",
          texto: "Não consegui me conectar ao servidor. Verifique se o backend está rodando.",
        },
      ]);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.header}>
        <Text style={s.titulo}>Conversar</Text>
        <Text style={s.sub}>Assistente Evolua</Text>
      </View>

      <FlatList
        ref={lista}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={s.lista}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              s.balao,
              item.autor === "eu" ? s.eu : s.bot,
              item.alerta && s.alerta,
            ]}
          >
            <Text style={item.autor === "eu" ? s.textoEu : s.textoBot}>{item.texto}</Text>
          </View>
        )}
      />

      {mostrarRapidas && (
        <View style={s.chips}>
          {RAPIDAS.map((r) => (
            <Pressable key={r} style={s.chip} onPress={() => enviar(r)}>
              <Text style={s.chipTexto}>{r}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={s.linha}>
        <TextInput
          style={s.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite sua mensagem…"
          onSubmitEditing={() => enviar()}
          returnKeyType="send"
        />
        <Pressable style={s.enviar} onPress={() => enviar()}>
          <Text style={s.enviarTexto}>➤</Text>
        </Pressable>
      </View>
      <Text style={s.nota}>Este chat não substitui acompanhamento profissional.</Text>
    </KeyboardAvoidingView>
  );
}

const ROXO = "#6a4fc7";

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#f4efff" },
  header: { backgroundColor: ROXO, padding: 16, paddingTop: 48, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  titulo: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sub: { color: "#fff", opacity: 0.9 },
  lista: { padding: 14, gap: 10 },
  balao: { maxWidth: "80%", padding: 12, borderRadius: 18 },
  bot: { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 5 },
  eu: { backgroundColor: ROXO, alignSelf: "flex-end", borderBottomRightRadius: 5 },
  alerta: { borderWidth: 2, borderColor: "#e0567a", backgroundColor: "#fff5f8" },
  textoBot: { color: "#2b2148", fontSize: 15 },
  textoEu: { color: "#fff", fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  chip: { borderWidth: 1, borderColor: ROXO, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  chipTexto: { color: "#4a3596", fontSize: 13 },
  linha: { flexDirection: "row", gap: 8, padding: 10, backgroundColor: "#fff" },
  input: { flex: 1, backgroundColor: "#f4efff", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  enviar: { backgroundColor: ROXO, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  enviarTexto: { color: "#fff", fontSize: 18 },
  nota: { fontSize: 11, textAlign: "center", color: "#2b2148", opacity: 0.65, backgroundColor: "#fff", paddingBottom: 10 },
});