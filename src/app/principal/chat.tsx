import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cores, fontes } from '../../tema';
import { API_URL } from '../../config';
import { apagarHistorico, consultarHistorico, enviarMensagem } from '../../api';
import {
  MenuInferior,
  NavegacaoContext,
  type TelaInterna,
  estilos,
  sairDaConta,
  useEvolua,
  useLayoutInfo,
  useNavegacao,
  useTecladoVisivel,
} from './compartilhado';
import TelaConfiguracoes from './configuracoes';
import TelaNotificacoes from './notificacoes';

type Msg = { id: string; autor: 'bot' | 'eu'; texto: string; alerta?: boolean };

const SAUDACAO = 'Olá! Como posso te ajudar hoje?';

// Respostas rápidas, cada uma em um tom pastel das outras telas
const RAPIDAS = [
  { texto: 'Estou ansioso(a)', fundo: '#EEE9F8', cor: '#44395E' },
  { texto: 'Estou triste', fundo: '#E1EFF9', cor: '#29465F' },
  { texto: 'Não consigo dormir', fundo: '#FCEBDD', cor: '#604936' },
  { texto: 'Quero um exercício de respiração', fundo: '#E8F1E5', cor: '#3D5140' },
  { texto: 'Estou bem hoje', fundo: '#DFF2EF', cor: '#294B49' },
];

async function obterSessao(): Promise<string> {
  const novo = Date.now().toString(36) + Math.random().toString(36).slice(2);
  try {
    let id = await AsyncStorage.getItem('evolua_sessao');
    if (!id) {
      id = novo;
      await AsyncStorage.setItem('evolua_sessao', id);
    }
    return id;
  } catch {
    return novo;
  }
}

function msgErro(e: unknown): Msg {
  return {
    id: `x${Date.now()}`,
    autor: 'bot',
    texto: `Falha ao conectar em ${API_URL}\n${String(e)}`,
  };
}

/* ================================== TOPO ================================ */

function FaixaTopo() {
  const insets = useSafeAreaInsets();
  const { desktop, estreito, larguraMax } = useLayoutInfo();
  const { irTela } = useNavegacao();
  const naoLidas = useEvolua((e) => e.notificacoes).filter((n) => n.status === 'nao_lida').length;
  const tamIcone = estreito ? 24 : 26;

  return (
    <View style={[local.faixaTitulo, { paddingTop: insets.top + FAIXA_ESPACO_CIMA }]}>
      <View style={[local.faixaInterna, { maxWidth: larguraMax, paddingHorizontal: desktop ? 32 : 14 }]}>
        <View style={local.faixaMarca} accessibilityRole="header">
          <Ionicons
            name="chatbubbles"
            size={desktop ? 34 : estreito ? 26 : 30}
            color={cores.azulEvolua}
          />
          <Text
            style={[local.tituloPagina, { fontSize: desktop ? 36 : estreito ? 26 : 32 }]}
            numberOfLines={1}
          >
            Chat
          </Text>
        </View>

        <View style={estilos.iconesLinha}>
          <Pressable style={estilos.iconeBtn} onPress={() => irTela('configuracoes')} accessibilityRole="button" accessibilityLabel="Abrir Configurações">
            <Ionicons name="settings-outline" size={tamIcone} color={cores.azulMarinho} />
          </Pressable>
          <Pressable
            style={estilos.iconeBtn}
            onPress={() => irTela('notificacoes')}
            accessibilityRole="button"
            accessibilityLabel={naoLidas > 0 ? `Abrir Notificações, ${naoLidas} não lidas` : 'Abrir Notificações'}
          >
            <Ionicons name="notifications-outline" size={tamIcone} color={cores.azulMarinho} />
            {naoLidas > 0 && (
              <View style={estilos.selo}><Text style={estilos.seloTexto}>{naoLidas}</Text></View>
            )}
          </Pressable>
          <Pressable style={estilos.iconeBtn} onPress={sairDaConta} accessibilityRole="button" accessibilityLabel="Sair da conta">
            <Ionicons name="log-out-outline" size={tamIcone} color={cores.azulMarinho} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ================================== CONVERSA ============================ */

function TelaChat() {
  const { desktop, larguraMax } = useLayoutInfo();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState('');
  const [sessao, setSessao] = useState('');
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
      setMsgs([{ id: 'ola', autor: 'bot', texto: SAUDACAO }]);
    })();
  }, []);

  async function enviar(textoRapido?: string) {
    const conteudo = (textoRapido ?? texto).trim();
    if (!conteudo || !sessao) return;

    setTexto('');
    setMostrarRapidas(false);
    setMsgs((m) => [...m, { id: `e${Date.now()}`, autor: 'eu', texto: conteudo }]);

    try {
      const d = await enviarMensagem(conteudo, sessao);
      setMsgs((m) => [
        ...m,
        { id: `b${Date.now()}`, autor: 'bot', texto: d.resposta, alerta: d.alerta },
      ]);
    } catch (e) {
      setMsgs((m) => [...m, msgErro(e)]);
    }
  }

  async function limpar() {
    try {
      await apagarHistorico(sessao);
      setMsgs([{ id: 'ola', autor: 'bot', texto: SAUDACAO }]);
      setMostrarRapidas(true);
    } catch (e) {
      setMsgs((m) => [...m, msgErro(e)]);
    }
  }

  function confirmarLimpar() {
    const aviso = 'Isso apaga o histórico desta conversa. Deseja continuar?';
    if (Platform.OS === 'web') {
      // Alert.alert não funciona no navegador
      if (window.confirm(aviso)) limpar();
      return;
    }
    Alert.alert('Limpar conversa', aviso, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: limpar },
    ]);
  }

  return (
    <View
      style={[
        local.area,
        { maxWidth: larguraMax, paddingHorizontal: desktop ? 32 : 14, paddingTop: ESPACO_APOS_FAIXA },
      ]}
    >
      <View style={local.fraseLinha}>
        <Text style={[estilos.frase, local.fraseTexto, desktop && { fontSize: 17, lineHeight: 24 }]}>
          Conte como você está, no seu ritmo.
        </Text>
        <Pressable
          style={local.botaoLimpar}
          onPress={confirmarLimpar}
          accessibilityRole="button"
          accessibilityLabel="Limpar conversa"
        >
          <Ionicons name="trash-outline" size={15} color={cores.azulEvolua} />
          <Text style={local.botaoLimparTexto}>Limpar</Text>
        </Pressable>
      </View>

      <FlatList
        ref={lista}
        data={msgs}
        keyExtractor={(m) => m.id}
        style={{ flex: 1 }}
        contentContainerStyle={local.lista}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View
            style={[
              local.balao,
              item.autor === 'eu' ? local.eu : local.bot,
              item.alerta && local.alerta,
            ]}
            accessible
            accessibilityLabel={`${item.autor === 'eu' ? 'Você' : 'Assistente'}: ${item.texto}`}
          >
            <Text
              style={[
                local.textoBalao,
                item.autor === 'eu' && { color: '#FFFFFF' },
                item.alerta && { color: '#8C3A5C' },
              ]}
            >
              {item.texto}
            </Text>
          </View>
        )}
      />

      {mostrarRapidas && (
        <View style={local.chipsLinha}>
          {RAPIDAS.map((r) => (
            <Pressable
              key={r.texto}
              style={[local.chip, { backgroundColor: r.fundo }]}
              onPress={() => enviar(r.texto)}
              accessibilityRole="button"
              accessibilityLabel={r.texto}
            >
              <Text style={[local.chipTexto, { color: r.cor }]}>{r.texto}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={local.linhaInput}>
        <TextInput
          style={local.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Digite sua mensagem…"
          placeholderTextColor={cores.cinzaAzulado}
          onSubmitEditing={() => enviar()}
          returnKeyType="send"
          accessibilityLabel="Digite sua mensagem"
        />
        <Pressable
          style={local.botaoEnviar}
          onPress={() => enviar()}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text style={local.nota}>Este chat não substitui acompanhamento profissional.</Text>
    </View>
  );
}

/* ================================== TELA ================================ */

type TelaAtual = 'chat' | 'configuracoes' | 'notificacoes';

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { desktop, larguraMax } = useLayoutInfo();
  const navigation = useNavigation();
  const tecladoVisivel = useTecladoVisivel();
  const [tela, setTela] = useState<TelaAtual>('chat');
  const scrollRef = useRef<any>(null);;

  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  const irTela = useCallback((t: TelaInterna) => {
    setTela(t === 'home' ? 'chat' : t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  useEffect(() => {
    if (tela === 'chat') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      irTela('home');
      return true;
    });
    return () => sub.remove();
  }, [tela, irTela]);

  const noChat = tela === 'chat';

  return (
    <NavegacaoContext.Provider value={{ irTela }}>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient
          colors={['#FFFFFF', '#F7F9FC', '#EEF2F6']}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />

        {noChat && <FaixaTopo />}

        {noChat ? (
          <TelaChat />
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[
              estilos.conteudo,
              {
                maxWidth: larguraMax,
                paddingHorizontal: desktop ? 32 : 14,
                paddingTop: insets.top + (desktop ? 24 : 8),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {tela === 'configuracoes' && <TelaConfiguracoes />}
            {tela === 'notificacoes' && <TelaNotificacoes />}
          </ScrollView>
        )}

        {!tecladoVisivel && <MenuInferior ativo={noChat ? 'chat' : null} />}
      </KeyboardAvoidingView>
    </NavegacaoContext.Provider>
  );
}

const FAIXA_ESPACO_CIMA = 24;
const FAIXA_ESPACO_BAIXO = 26;
const ESPACO_APOS_FAIXA = 30;

const local = StyleSheet.create({
  // Faixa do topo: igual à do Progresso
  faixaTitulo: {
    width: '100%',
    backgroundColor: 'rgba(205, 229, 247, 0.68)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160, 194, 220, 0.45)',
    paddingBottom: FAIXA_ESPACO_BAIXO,
  },
  faixaInterna: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faixaMarca: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  tituloPagina: { fontFamily: fontes.titulo, color: cores.azulEvolua },

  // Área da conversa
  area: { flex: 1, width: '100%', alignSelf: 'center' },
  fraseLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  fraseTexto: { flex: 1 },
  botaoLimpar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: cores.azulGelo,
  },
  botaoLimparTexto: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.azulEvolua },

  lista: { paddingVertical: 14, gap: 10 },
  balao: { maxWidth: '84%', paddingVertical: 11, paddingHorizontal: 15, borderRadius: 18 },
  bot: {
    alignSelf: 'flex-start',
    backgroundColor: '#F7F9FF',
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    borderBottomLeftRadius: 6,
  },
  eu: {
    alignSelf: 'flex-end',
    backgroundColor: cores.azulEvolua,
    borderBottomRightRadius: 6,
  },
  alerta: {
    backgroundColor: '#FCE3EC',
    borderWidth: 2,
    borderColor: cores.rosaVibrante,
  },
  textoBalao: { fontFamily: fontes.texto, fontSize: 15, lineHeight: 22, color: cores.azulMarinho },

  chipsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  chipTexto: { fontFamily: fontes.textoMedio, fontSize: 13 },

  linhaInput: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 6 },
  input: {
    flex: 1,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    fontFamily: fontes.texto,
    fontSize: 15,
    color: cores.azulMarinho,
  },
  botaoEnviar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.azulEvolua,
  },
  nota: {
    fontFamily: fontes.texto,
    fontSize: 11,
    textAlign: 'center',
    color: cores.cinzaGrafite,
    paddingBottom: 8,
  },
});