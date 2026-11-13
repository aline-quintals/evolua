import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { cores, fontes } from '../../tema';

import {
  Genero,
  PerfilUsuario,
  EmocaoChave,
  RegistroCheckin,
  StatusNotificacao,
  Notificacao,
  EstadoEvolua,
  TelaInterna,
  IconeNome,
  PADDING_CARTAO,
  BP_DESKTOP,
  useLayoutInfo,
  SOMBRA,
  EMOCOES,
  FRASES_MOTIVACIONAIS,
  avisar,
  useTecladoVisivel,
  PERFIL_PADRAO,
  horasAtrasISO,
  NOTIFICACOES_EXEMPLO,
  estadoAtual,
  ouvintesEstado,
  ouvintesCheckin,
  ouvintesPerfil,
  ouvintesNotificacoes,
  definirEstado,
  lerEstadoEvolua,
  useEvolua,
  inicializarDadosEvolua,
  atualizarPerfil,
  definirStatusNotificacao,
  aoSalvarCheckin,
  aoMudarPerfil,
  aoMudarNotificacoes,
  salvarCheckin,
  FiltroCheckins,
  filtrarCheckins,
  useCheckins,
  senhaLocal,
  senhaAtualCorreta,
  definirSenhaLocal,
  sairDaConta,
  excluirContaLocal,
  gerarId,
  dataLocalISO,
  formatarDataNascimento,
  mascararData,
  mascararTelefone,
  dataBRparaISO,
  formatarDataNotificacao,
  fraseDoDia,
  GENEROS,
  emailValido,
  telefoneValido,
  TAMANHO_MAX_FOTO,
  ChaveAtividade,
  ROTAS_ATIVIDADES,
  abrirAtividade,
  NavegacaoContext,
  useNavegacao,
  Avatar,
  BotaoDestaque,
  BotaoSalvarDia,
  BotaoSecundario,
  BotaoVoltar,
  PropsCabecalho,
  Cabecalho,
  ItemMenu,
  BotaoMenu,
  MenuInferior,
  PropsDeslizador,
  TAMANHO_BOLINHA,
  DeslizadorDiscreto,
  RostoEmocao,
  EscalaNumerica,
  CheckinEmocional,
  AtividadeHome,
  ATIVIDADES_HOME,
  CartaoAtividadeHome,
  GradeAtividades,
  CarrosselAtividades,
  TelaHome,
  CartaoAtividadePerfil,
  TelaPerfil,
  estilos
} from './compartilhado';

type AbaNotificacoes = StatusNotificacao;
const ABAS_NOTIFICACAO: ReadonlyArray<{ id: AbaNotificacoes; rotulo: string; vazio: string }> = [
  { id: 'nao_lida', rotulo: 'Não Lidas', vazio: 'Você não tem notificações não lidas.' },
  { id: 'lida', rotulo: 'Lidas', vazio: 'Você ainda não tem notificações lidas.' },
  { id: 'arquivada', rotulo: 'Arquivadas', vazio: 'Você não tem notificações arquivadas.' },
];

function CartaoNotificacao({ n, aberta, aoAlternar, aoMarcarNaoLida, aoArquivar }: {
  n: Notificacao; aberta: boolean; aoAlternar: () => void; aoMarcarNaoLida: () => void; aoArquivar: () => void;
}) {
  const data = formatarDataNotificacao(n.dataISO);
  return (
    <View style={estilos.notif}>
      <Pressable style={estilos.notifCabeca} onPress={aoAlternar} accessibilityRole="button" accessibilityState={{ expanded: aberta }}>
        <View style={{ flex: 1 }}>
          <View style={estilos.notifTituloLinha}>
            {n.status === 'nao_lida' && <View style={estilos.notifPonto} />}
            {/* TÍTULO da notificação (vem de n.titulo) */}
            <Text style={estilos.notifTitulo} numberOfLines={aberta ? undefined : 1}>{n.titulo}</Text>
          </View>
          {/* MENSAGEM (vem de n.mensagem). Fechada: 1 linha com "..." no fim; aberta: texto completo. */}
          <Text style={estilos.notifMsg} numberOfLines={aberta ? undefined : 1} ellipsizeMode="tail">{n.mensagem}</Text>
          {data ? <Text style={estilos.notifData}>{data}</Text> : null}
          {aberta && n.status === 'lida' && (
            <View style={estilos.notifTagLida}>
              <Ionicons name="checkmark" size={14} color={cores.verdeAgua} />
              <Text style={estilos.notifTagLidaTexto}>Lida</Text>
            </View>
          )}
        </View>
        <View style={[estilos.seta, aberta && { transform: [{ rotate: '90deg' }] }]}>
          <Ionicons name="chevron-forward" size={22} color={cores.branco} />
        </View>
      </Pressable>
      {aberta && (
        <View style={estilos.notifAcoes}>
          <BotaoSecundario texto="Marcar como “não lida”" onPress={aoMarcarNaoLida} />
          {n.status !== 'arquivada' && <BotaoSecundario texto="Arquivar" onPress={aoArquivar} />}
        </View>
      )}
    </View>
  );
}

export default function TelaNotificacoes() {
  const notificacoes = useEvolua((e) => e.notificacoes);
  const [aba, setAba] = useState<AbaNotificacoes>('nao_lida'); // sempre inicia em "Não Lidas"
  const [abertaId, setAbertaId] = useState<string | null>(null);

  const trocarAba = (nova: AbaNotificacoes) => { setAba(nova); setAbertaId(null); };
  const visiveis = notificacoes.filter((n) => n.status === aba || n.id === abertaId);

  const alternar = (n: Notificacao) => {
    if (abertaId === n.id) { setAbertaId(null); return; }
    setAbertaId(n.id);
    if (n.status === 'nao_lida') definirStatusNotificacao(n.id, 'lida'); // vira "lida" assim que é tocada
  };

  return (
    <>
      <Cabecalho titulo="Notificações" subtitulo="Suas notificações aparecerão aqui" mostrarFoto />
      <View style={estilos.abas} accessibilityRole="tablist">
        {ABAS_NOTIFICACAO.map((a) => (
          <Pressable key={a.id} style={[estilos.aba, aba === a.id && estilos.abaAtiva]} onPress={() => trocarAba(a.id)} accessibilityRole="tab" accessibilityState={{ selected: aba === a.id }}>
            <Text style={[estilos.abaTexto, aba === a.id && { color: cores.branco }]} numberOfLines={1}>{a.rotulo}</Text>
          </Pressable>
        ))}
      </View>
      {visiveis.length === 0 ? (
        <Text style={estilos.vazio}>{ABAS_NOTIFICACAO.find((a) => a.id === aba)?.vazio}</Text>
      ) : (
        visiveis.map((n) => (
          <CartaoNotificacao
            key={n.id}
            n={n}
            aberta={abertaId === n.id}
            aoAlternar={() => alternar(n)}
            aoMarcarNaoLida={() => { definirStatusNotificacao(n.id, 'nao_lida'); setAbertaId(null); }}
            aoArquivar={() => { definirStatusNotificacao(n.id, 'arquivada'); setAbertaId(null); }}
          />
        ))
      )}
      <BotaoVoltar />
    </>
  );
}




