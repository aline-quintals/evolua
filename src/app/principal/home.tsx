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
import TelaConfiguracoes from './configuracoes';
import TelaNotificacoes from './notificacoes';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { desktop, larguraMax } = useLayoutInfo();
  const navigation = useNavigation();
  const tecladoVisivel = useTecladoVisivel();
  const [tela, setTela] = useState<TelaInterna>('home');
  const scrollRef = useRef<ScrollView>(null);

  // Esconde a barra padrão das Tabs: só vale o <MenuInferior /> deste arquivo (um único menu).
  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  const irTela = useCallback((t: TelaInterna) => {
    setTela(t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  // Botão "voltar" do Android: de Perfil/Configurações/Notificações volta para a Home.
  useEffect(() => {
    if (tela === 'home') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { irTela('home'); return true; });
    return () => sub.remove();
  }, [tela, irTela]);

  return (
    <NavegacaoContext.Provider value={{ irTela }}>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient
          colors={['#FFFFFF', '#F7F9FC', '#EEF2F6']}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[
            estilos.conteudo,
            { maxWidth: larguraMax, paddingHorizontal: desktop ? 32 : 14, paddingTop: insets.top + (desktop ? 24 : 8) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tela === 'home' && <TelaHome />}
          {tela === 'perfil' && <TelaPerfil />}
          {tela === 'configuracoes' && <TelaConfiguracoes />}
          {tela === 'notificacoes' && <TelaNotificacoes />}
        </ScrollView>
        {/* Perfil, Configurações e Notificações não marcam nenhum botão (como no design). */}
        {!tecladoVisivel && <MenuInferior ativo={tela === 'home' ? 'home' : null} aoPressionarHome={() => irTela('home')} />}
      </KeyboardAvoidingView>
    </NavegacaoContext.Provider>
  );
}




