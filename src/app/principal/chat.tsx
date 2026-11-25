import { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { apagarHistorico, consultarHistorico, enviarMensagem } from "../../api";

type Msg = { id: string; autor: "bot" | "eu"; texto: string; alerta?: boolean };

const SAUDACAO = "Olá! Como posso te ajudar hoje?";

const RAPIDAS = [
  "Estou ansioso(a)",
  "Estou triste",
  "Não consigo dormir",
  "Quero um exercício de respiração",
  "Estou bem hoje",
];

async function obterSessao(): Promise<string> {
  const novo = Date.now().toString(36) + Math.random().toString(36).slice(2);
  try {
    let id = await AsyncStorage.getItem("evolua_sessao");
    if (!id) {
      id = novo;
      await AsyncStorage.setItem("evolua_sessao", id);
    }
    return id;
  } catch {
    return novo;
  }
}

function msgErro(e: unknown): Msg {
  return {
    id: `x${Date.now()}`,
    autor: "bot",
    texto: `Falha ao conectar em ${API_URL}\n${String(e)}`,
  };
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
        const itens = await consultarHistorico(s);
        if (itens.length > 0) {
          setMostrarRapidas(false);
          setMsgs(itens.map((i, n) => ({ id: `h${n}`, ...i })));
          return;
        }
      } catch {
        // sem servidor: segue com a saudação
      }
      setMsgs([{ id: "ola", autor: "bot", texto: SAUDACAO }]);
    })();
  }, []);

  async function enviar(textoRapido?: string) {
    const conteudo = (textoRapido ?? texto).trim();
    if (!conteudo || !sessao) return;

    setTexto("");
    setMostrarRapidas(false);
    setMsgs((m) => [...m, { id: `e${Date.now()}`, autor: "eu", texto: conteudo }]);

    try {
      const d = await enviarMensagem(conteudo, sessao);
      setMsgs((m) => [
        ...m,
        { id: `b${Date.now()}`, autor: "bot", texto: d.resposta, alerta: d.alerta },
      ]);
    } catch (e) {
      setMsgs((m) => [...m, msgErro(e)]);
    }
  }

  async function limpar() {
    try {
      await apagarHistorico(sessao);
      setMsgs([{ id: "ola", autor: "bot", texto: SAUDACAO }]);
      setMostrarRapidas(true);
    } catch (e) {
      setMsgs((m) => [...m, msgErro(e)]);
    }
  }

  function confirmarLimpar() {
    const aviso = "Isso apaga o histórico desta conversa. Deseja continuar?";
    if (Platform.OS === "web") {
      // Alert.alert não funciona no navegador
      if (window.confirm(aviso)) limpar();
      return;
    }
    Alert.alert("Limpar conversa", aviso, [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: limpar },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={s.tela}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.header}>
        <View>
          <Text style={s.titulo}>Conversar</Text>
          <Text style={s.sub}>Assistente Evolua</Text>
        </View>
        <Pressable style={s.limpar} onPress={confirmarLimpar}>
          <Text style={s.limparTexto}>Limpar</Text>
        </Pressable>
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
  header: {
    backgroundColor: ROXO,
    padding: 16,
    paddingTop: 48,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  titulo: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sub: { color: "#fff", opacity: 0.9 },
  limpar: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  limparTexto: { color: "#fff", fontSize: 13 },
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