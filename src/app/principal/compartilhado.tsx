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

/* =============================================================================
 * 2. TIPOS E INTERFACES
 * ========================================================================== */

export type Genero = 'homem' | 'mulher' | 'outro' | 'nao_informar';

/** Dados do usuário. Fonte única da verdade para Home, Perfil, Configurações e Notificações. */
export interface PerfilUsuario {
  id: string;
  nome: string;
  sobrenome: string;
  apelido: string;               // usado em "Olá, [apelido]!"
  usuario: string;                // usuário definido no cadastro
  fotoUrl: string | null;        // uri local ou URL; null = avatar padrão
  biografia: string;
  dataNascimento: string | null; // ISO "AAAA-MM-DD"
  genero: Genero;
  contato: { email: string; telefone: string };
}

export type EmocaoChave = 'muito_feliz' | 'feliz' | 'neutro' | 'triste' | 'muito_triste';

/** Registro de um check-in emocional (ver o guia na seção 4). */
export interface RegistroCheckin {
  id: string;
  usuarioId: string;
  criadoEmISO: string;  // instante exato, ex.: "2025-03-10T14:32:05.123Z"
  dataLocal: string;    // dia no fuso do usuário "AAAA-MM-DD" (agrupar por dia)
  emocao: EmocaoChave;
  emocaoNivel: 1 | 2 | 3 | 4 | 5; // 5 = muito feliz ... 1 = muito triste
  ansiedade: number;    // 1 a 10
  estresse: number;     // 1 a 10
  energia: number;      // 1 a 10
}

export type StatusNotificacao = 'nao_lida' | 'lida' | 'arquivada';

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  dataISO?: string;     // opcional
  status: StatusNotificacao;
}

export interface EstadoEvolua {
  perfil: PerfilUsuario;
  checkins: RegistroCheckin[];      // mais recente primeiro
  notificacoes: Notificacao[];
  preferencias: { idioma: 'pt-BR' };
}

/** Telas internas deste arquivo. */
export type TelaInterna = 'home' | 'perfil' | 'configuracoes' | 'notificacoes';

export type IconeNome = React.ComponentProps<typeof Ionicons>['name'];

/* =============================================================================
 * 3. TEMA, LAYOUT RESPONSIVO E EMOÇÕES
 * ========================================================================== */

export const PADDING_CARTAO = 16;
export const BP_DESKTOP = 900; // a partir daqui: layout largo de web

/**
 * Medidas que dependem do tamanho da janela (celular, tablet ou navegador).
 *   largura   → largura útil da coluna de conteúdo
 *   compacto  → < 520 px (celular): cabeçalho em duas linhas
 *   estreito  → < 380 px (celulares pequenos)
 *   largo     → >= 480 px
 *   desktop   → >= 900 px (web em tela grande): duas colunas, menu flutuante
 */
export function useLayoutInfo() {
  const { width } = useWindowDimensions();
  const desktop = width >= BP_DESKTOP;
  const larguraMax = desktop ? 1120 : 640;
  const largura = Math.min(width, larguraMax);
  return { width, largura, larguraMax, desktop, compacto: largura < 520, estreito: largura < 380, largo: largura >= 480 };
}

/** Sombra suave igual em iOS, Android e web. */
export const SOMBRA: ViewStyle = (Platform.select({
  web: { boxShadow: '0px 4px 16px rgba(46, 91, 154, 0.10)' },
  default: {
    shadowColor: cores.azulProfundo,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
}) ?? {}) as ViewStyle;

/** Emoções do check-in. ORDEM: índice 0 = muito feliz (esquerda, lado "+") … 4 = muito triste. */
export const EMOCOES: ReadonlyArray<{
  chave: EmocaoChave;
  rotulo: string;
  nivel: 1 | 2 | 3 | 4 | 5;
  cor: string;
  corPastel: string;
}> = [
  { chave: 'muito_feliz', rotulo: 'Muito feliz', nivel: 5, cor: cores.muitoFeliz, corPastel: cores.muitoFelizPastel },
  { chave: 'feliz', rotulo: 'Feliz', nivel: 4, cor: cores.feliz, corPastel: cores.felizPastel },
  { chave: 'neutro', rotulo: 'Neutro', nivel: 3, cor: cores.neutro, corPastel: cores.neutroPastel },
  { chave: 'triste', rotulo: 'Triste', nivel: 2, cor: cores.triste, corPastel: cores.tristePastel },
  { chave: 'muito_triste', rotulo: 'Muito triste', nivel: 1, cor: cores.muitoTriste, corPastel: cores.muitoTristePastel },
];

export const FRASES_MOTIVACIONAIS: ReadonlyArray<string> = [
  'A persistência realiza o impossível!',
  'Um passo de cada vez já é caminho percorrido.',
  'Cuidar de você também é progresso.',
  'Hoje é um bom dia para recomeçar.',
  'Pequenas conquistas constroem grandes mudanças.',
];

/** Avisa o usuário: Alert.alert não funciona na web, então usamos window.alert lá. */
export function avisar(titulo: string, mensagem: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${titulo}\n\n${mensagem}`);
    return;
  }
  Alert.alert(titulo, mensagem);
}

/** true enquanto o teclado está aberto (só celular). Usado para esconder o menu. */
export function useTecladoVisivel(): boolean {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const ios = Platform.OS === 'ios';
    const a = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisivel(true));
    const b = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisivel(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  return visivel;
}

/* =============================================================================
 * 4. DADOS COMPARTILHADOS (STORE CENTRAL) E CONTA (MOCKUP)
 * -----------------------------------------------------------------------------
 * Estado único em memória, fora do React, lido com useSyncExternalStore.
 * Qualquer arquivo pode importar os hooks/funções exportados daqui.
 *
 * O QUE CADA TELA FAZ COM ELE:
 *   - Trocar a foto (Configurações)  → atualiza Home, Perfil e Notificações.
 *   - Trocar o apelido               → atualiza "Olá, [apelido]!" na Home e o Perfil.
 *   - Trocar nome/sobrenome          → atualiza o Perfil.
 *   - Salvar um check-in             → entra em estado.checkins (ver guia abaixo).
 *   - Mudar status de notificação    → muda a aba em que ela aparece.
 *
 * MOCKUP: nada é persistido (sem banco, sem AsyncStorage): ao fechar o app os
 * dados se perdem. Quando houver servidor, carregue os dados com
 * inicializarDadosEvolua() e grave as mudanças usando os ouvintes
 * (aoSalvarCheckin, aoMudarPerfil, aoMudarNotificacoes).
 * ========================================================================== */

/** Valores iniciais de PLACEHOLDER. Substitua com inicializarDadosEvolua(). */
export const PERFIL_PADRAO: PerfilUsuario = {
  id: 'usuario-local',
  nome: 'Nome',
  sobrenome: 'Sobrenome',
  apelido: 'Liné',
  usuario: '',
  fotoUrl: null,
  biografia: '',
  dataNascimento: null,
  genero: 'nao_informar',
  contato: { email: 'email@exemplo.com', telefone: '(11) 9XXXX-XXXX' },
};

export const horasAtrasISO = (h: number): string => new Date(Date.now() - h * 3600 * 1000).toISOString();

/**
 * ===========================================================================
 * >>> NOTIFICAÇÕES — ONDE EDITAR TÍTULO E MENSAGEM <<<
 * Cada item abaixo é uma notificação:
 *   titulo   → título exibido no cartão (EDITE AQUI)
 *   mensagem → texto completo; a prévia é cortada com "..." automaticamente (EDITE AQUI)
 *   dataISO  → opcional; remova a linha para não mostrar data
 *   status   → 'nao_lida' | 'lida' | 'arquivada' (define em qual aba aparece)
 * Para dados reais, use inicializarDadosEvolua({ notificacoes }).
 * ===========================================================================
 */
export const NOTIFICACOES_EXEMPLO: Notificacao[] = [
  {
    id: 'notif-1',
    titulo: 'Check-in', // <-- TÍTULO
    mensagem: // <-- MENSAGEM
      'Você já fez seu check-in emocional hoje? Reserve um instante para registrar como você está se sentindo e acompanhar sua evolução ao longo dos dias.',
    dataISO: horasAtrasISO(2),
    status: 'nao_lida',
  },
  {
    id: 'notif-2',
    titulo: 'Seu relatório mensal está pronto', // <-- TÍTULO
    mensagem: 'Acesse a aba Evolua para conferir', // <-- MENSAGEM
    dataISO: horasAtrasISO(26),
    status: 'nao_lida',
  },
  {
    id: 'notif-3',
    titulo: 'Atualização', // <-- TÍTULO
    mensagem: 'Confira as novas funcionalidades disponíveis no Evolua.', // <-- MENSAGEM
    status: 'nao_lida',
  },
  {
    id: 'notif-4',
    titulo: 'Um recomeço', // <-- TÍTULO
    mensagem: 'Você já deu o primeiro passo, agora é só continuar. Cada dia conta na sua jornada.', // <-- MENSAGEM
    dataISO: horasAtrasISO(72),
    status: 'nao_lida',
  },
];

export let estadoAtual: EstadoEvolua = {
  perfil: PERFIL_PADRAO,
  checkins: [],
  notificacoes: NOTIFICACOES_EXEMPLO,
  preferencias: { idioma: 'pt-BR' },
};

export const ouvintesEstado = new Set<() => void>();
export const ouvintesCheckin = new Set<(r: RegistroCheckin) => void>();
export const ouvintesPerfil = new Set<(p: PerfilUsuario) => void>();
export const ouvintesNotificacoes = new Set<(n: Notificacao[]) => void>();

export function definirEstado(novo: EstadoEvolua): void {
  estadoAtual = novo;
  ouvintesEstado.forEach((l) => l());
}

/** Leitura pontual do estado (fora de componentes). Dentro de componentes use useEvolua(). */
export const lerEstadoEvolua = (): EstadoEvolua => estadoAtual;

/**
 * Hook para ler o estado compartilhado. Passe um seletor que devolva uma parte
 * já existente do estado (sem criar objetos novos), ex.:
 *     const perfil = useEvolua((e) => e.perfil);
 *     const checkins = useEvolua((e) => e.checkins);
 */
export function useEvolua<T>(seletor: (e: EstadoEvolua) => T): T {
  const assinar = useCallback((l: () => void) => {
    ouvintesEstado.add(l);
    return () => { ouvintesEstado.delete(l); };
  }, []);
  return useSyncExternalStore(assinar, () => seletor(estadoAtual), () => seletor(estadoAtual));
}

/** Carrega dados reais (usuário, check-ins, notificações). Chame ao iniciar a sessão. */
export function inicializarDadosEvolua(dados: {
  perfil?: Partial<PerfilUsuario>;
  checkins?: RegistroCheckin[];
  notificacoes?: Notificacao[];
}): void {
  definirEstado({
    ...estadoAtual,
    perfil: dados.perfil
      ? { ...estadoAtual.perfil, ...dados.perfil, contato: { ...estadoAtual.perfil.contato, ...dados.perfil.contato } }
      : estadoAtual.perfil,
    checkins: dados.checkins ?? estadoAtual.checkins,
    notificacoes: dados.notificacoes ?? estadoAtual.notificacoes,
  });
}

export function atualizarPerfil(parcial: Partial<PerfilUsuario>): void {
  const perfil = { ...estadoAtual.perfil, ...parcial };
  definirEstado({ ...estadoAtual, perfil });
  ouvintesPerfil.forEach((l) => l(perfil));
}

export function definirStatusNotificacao(id: string, status: StatusNotificacao): void {
  const notificacoes = estadoAtual.notificacoes.map((n) => (n.id === id ? { ...n, status } : n));
  definirEstado({ ...estadoAtual, notificacoes });
  ouvintesNotificacoes.forEach((l) => l(notificacoes));
}

/** Registra um ouvinte chamado a cada check-in salvo. Retorna a função para cancelar. */
export function aoSalvarCheckin(l: (r: RegistroCheckin) => void): () => void {
  ouvintesCheckin.add(l);
  return () => { ouvintesCheckin.delete(l); };
}
export function aoMudarPerfil(l: (p: PerfilUsuario) => void): () => void {
  ouvintesPerfil.add(l);
  return () => { ouvintesPerfil.delete(l); };
}
export function aoMudarNotificacoes(l: (n: Notificacao[]) => void): () => void {
  ouvintesNotificacoes.add(l);
  return () => { ouvintesNotificacoes.delete(l); };
}

/**
 * ===========================================================================
 * >>> SALVAR CHECK-IN EMOCIONAL — GUIA PARA QUEM FAZ O HISTÓRICO <<<
 *
 * ESTA FUNÇÃO (salvarCheckin) É A PARTE DO CÓDIGO QUE SALVA O CHECK-IN.
 * Ela é chamada pelo botão "Salvar o meu dia" da Home. Quem estiver
 * programando a página de histórico deve USAR ESTE PONTO para linkar o
 * check-in salvo e fazê-lo aparecer no histórico.
 *
 * Como os dados são organizados:
 *   Cada clique gera UM RegistroCheckin, inserido no início de estado.checkins.
 *   Nada é sobrescrito; vários registros no mesmo dia são permitidos.
 *
 * O que é armazenado em cada registro:
 *   id, usuarioId, criadoEmISO, dataLocal, emocao, emocaoNivel (1–5),
 *   ansiedade (0–10), estresse (0–10), energia (0–10).
 *
 * Como identificar registro e data:
 *   - `id` é único por registro (use como key da lista).
 *   - `criadoEmISO` = instante exato; `dataLocal` ("AAAA-MM-DD") = dia no fuso
 *     do usuário, use para agrupar/filtrar por dia.
 *
 * Como recuperar os registros na página de histórico:
 *     import { useCheckins } from './home';            // ajuste o caminho
 *     const registros = useCheckins({ de: '2025-03-01', ate: '2025-03-31' });
 *   ou, sem filtro, useEvolua((e) => e.checkins).
 * ===========================================================================
 */
export function salvarCheckin(dados: Pick<RegistroCheckin, 'emocao' | 'ansiedade' | 'estresse' | 'energia'>): RegistroCheckin {
  const agora = new Date();
  const registro: RegistroCheckin = {
    id: gerarId('checkin'),
    usuarioId: estadoAtual.perfil.id,
    criadoEmISO: agora.toISOString(),
    dataLocal: dataLocalISO(agora),
    emocao: dados.emocao,
    emocaoNivel: EMOCOES.find((e) => e.chave === dados.emocao)?.nivel ?? 3,
    ansiedade: dados.ansiedade,
    estresse: dados.estresse,
    energia: dados.energia,
  };
  definirEstado({ ...estadoAtual, checkins: [registro, ...estadoAtual.checkins] });
  ouvintesCheckin.forEach((l) => l(registro));
  return registro;
}

export interface FiltroCheckins { de?: string; ate?: string; emocao?: EmocaoChave }

/** Filtra check-ins (funciona com qualquer array de RegistroCheckin). */
export function filtrarCheckins(registros: RegistroCheckin[], f: FiltroCheckins = {}): RegistroCheckin[] {
  return registros.filter(
    (r) => (!f.de || r.dataLocal >= f.de) && (!f.ate || r.dataLocal <= f.ate) && (!f.emocao || r.emocao === f.emocao),
  );
}

/** Hook para o histórico: check-ins já filtrados, atualizando sozinho a cada novo salvamento. */
export function useCheckins(filtro?: FiltroCheckins): RegistroCheckin[] {
  const todos = useEvolua((e) => e.checkins);
  return useMemo(() => filtrarCheckins(todos, filtro), [todos, filtro?.de, filtro?.ate, filtro?.emocao]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ---------------------------------------------------------------------------
 * CONTA (MOCKUP): senha, sair e excluir conta, tudo local.
 * A senha fica só nesta variável do módulo (nunca no store compartilhado).
 * Enquanto nenhuma senha tiver sido definida aqui, qualquer "senha atual"
 * preenchida é aceita; depois de trocar, a senha atual passa a ser conferida.
 * ------------------------------------------------------------------------- */
export let senhaLocal: string | null = null;

export const senhaAtualCorreta = (s: string): boolean => senhaLocal === null || s === senhaLocal;
export const definirSenhaLocal = (s: string): void => { senhaLocal = s; };

/** Sai da conta e volta para a tela de login. */
export function sairDaConta(): void {
  router.replace('/acesso/login' as Href);
}

/** Apaga os dados locais (perfil, check-ins, notificações) e volta para o login. */
export function excluirContaLocal(): void {
  senhaLocal = null;
  definirEstado({ perfil: PERFIL_PADRAO, checkins: [], notificacoes: NOTIFICACOES_EXEMPLO, preferencias: { idioma: 'pt-BR' } });
  ouvintesPerfil.forEach((l) => l(PERFIL_PADRAO));
  router.replace('/acesso/login' as Href);
}

/* =============================================================================
 * 5. FUNÇÕES AUXILIARES
 * ========================================================================== */

export function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "AAAA-MM-DD" no fuso local (não use toISOString, que é UTC). */
export function dataLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatarDataNascimento(iso: string | null): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Máscara DD/MM/AAAA enquanto o usuário digita. */
export function mascararData(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

/** Máscara (DD) 9XXXX-XXXX enquanto o usuário digita. */
export function mascararTelefone(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

/** "DD/MM/AAAA" → "AAAA-MM-DD" ou null se a data não existir ou estiver no futuro. */
export function dataBRparaISO(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const [, dd, mm, aa] = m;
  const d = new Date(Number(aa), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(aa) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  if (d.getTime() > Date.now()) return null;
  return `${aa}-${mm}-${dd}`;
}

export function formatarDataNotificacao(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fraseDoDia(hoje: Date = new Date()): string {
  const dia = Math.floor((hoje.getTime() - new Date(hoje.getFullYear(), 0, 0).getTime()) / 86400000);
  return FRASES_MOTIVACIONAIS[dia % FRASES_MOTIVACIONAIS.length];
}

export const GENEROS: ReadonlyArray<{ valor: Genero; rotulo: string }> = [
  { valor: 'homem', rotulo: 'Homem' },
  { valor: 'mulher', rotulo: 'Mulher' },
  { valor: 'outro', rotulo: 'Outro' },
  { valor: 'nao_informar', rotulo: 'Prefiro não informar' },
];

export const emailValido = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const telefoneValido = (v: string): boolean => [10, 11].includes(v.replace(/\D/g, '').length);

export const TAMANHO_MAX_FOTO = 5 * 1024 * 1024; // 5 MB

/* =============================================================================
 * 6. ROTAS DAS ATIVIDADES — PONTOS DE INTEGRAÇÃO COM OUTRAS PÁGINAS
 * -----------------------------------------------------------------------------
 * Os cartões de atividade da Home e do Perfil abrem a página de outro
 * colaborador. Quando a página existir, troque `null` pelo caminho dela
 * (ex.: '/principal/metas'). Enquanto for null, o toque mostra um aviso
 * "em breve" — o botão já está clicável e pronto.
 * ========================================================================== */

export type ChaveAtividade = 'checkinEmocional' | 'evolucaoPessoal' | 'questionarios' | 'exercicios' | 'metas';

export const ROTAS_ATIVIDADES: Record<ChaveAtividade, Href | null> = {
  checkinEmocional: null, // PERFIL → "Check-in Emocional": ligar à página de histórico de check-ins
  evolucaoPessoal: null,  // HOME e PERFIL → "Evolução Pessoal": ligar à página de evolução pessoal
  questionarios: null,    // HOME ("Meus Questionários") e PERFIL ("Questionários"): ligar à página de questionários
  exercicios: null,       // HOME ("Meus Exercícios") e PERFIL ("Exercícios"): ligar à página de exercícios
  metas: null,            // HOME ("Minhas Metas") e PERFIL ("Metas"): ligar à página de metas
};

export function abrirAtividade(chave: ChaveAtividade): void {
  const rota = ROTAS_ATIVIDADES[chave];
  if (rota) router.navigate(rota);
  else avisar('Em breve', 'Esta página ainda não foi conectada.');
}

/* Contexto local de navegação entre as telas internas (evita repassar props). */
export const NavegacaoContext = createContext<{ irTela: (t: TelaInterna) => void }>({ irTela: () => {} });
export const useNavegacao = () => useContext(NavegacaoContext);

/* =============================================================================
 * 7. COMPONENTES BASE
 * ========================================================================== */

/**
 * Foto de perfil lida do estado compartilhado (ou avatar padrão na cor do tema).
 * `uri` (opcional) mostra uma foto ainda não salva (prévia nas Configurações);
 * passe null para forçar o avatar padrão.
 */
export function Avatar({ tamanho, uri }: { tamanho: number; uri?: string | null }) {
  const perfil = useEvolua((e) => e.perfil);
  const foto = uri !== undefined ? uri : perfil.fotoUrl;
  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cores.azulGelo }}
        contentFit="cover"
        accessibilityLabel={`Foto de perfil de ${perfil.apelido}`}
      />
    );
  }
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100" accessibilityLabel="Foto de perfil padrão">
      <Circle cx={50} cy={50} r={50} fill={cores.azulEvolua} />
      <Circle cx={50} cy={38} r={15} fill={cores.branco} />
      <Path d="M18 88c4-20 18-28 32-28s28 8 32 28a50 50 0 0 1-64 0z" fill={cores.branco} />
    </Svg>
  );
}

/** Botão principal (degradê laranja, igual ao "Entrar" do login). */
export function BotaoDestaque({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable style={estilos.btnPrimarioBase} onPress={onPress} accessibilityRole="button" accessibilityLabel={texto}>
      <LinearGradient
        colors={[cores.laranjaSuave, cores.laranja, cores.laranjaSuave]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={estilos.btnPrimario}
      >
        <Text style={estilos.btnPrimarioTexto}>{texto}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Botão azul exclusivo para salvar o check-in, sem alterar os outros botões principais. */
export function BotaoSalvarDia({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={estilos.btnSalvarDiaBase}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Salvar o meu dia"
    >
      <LinearGradient
        colors={[cores.azulCeu, cores.azulEvolua, cores.azulCeu]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={estilos.btnSalvarDia}
      >
        <Text style={estilos.btnSalvarDiaTexto}>Salvar o meu dia</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function BotaoSecundario({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable style={estilos.btnSecundario} onPress={onPress} accessibilityRole="button">
      <Text style={estilos.btnSecundarioTexto}>{texto}</Text>
    </Pressable>
  );
}

/** Botão "Voltar" que fica no fim das telas internas e leva de volta à Home. */
export function BotaoVoltar() {
  const { irTela } = useNavegacao();
  return (
    <Pressable style={estilos.btnVoltar} onPress={() => irTela('home')} accessibilityRole="button" accessibilityLabel="Voltar para a Home">
      <Ionicons name="arrow-back" size={20} color={cores.azulProfundo} />
      <Text style={estilos.btnVoltarTexto}>Voltar para a Home</Text>
    </Pressable>
  );
}

export interface PropsCabecalho {
  titulo: string;
  subtitulo?: string;
  mostrarFoto?: boolean; // foto à esquerda → Meu Perfil
}

/**
 * Cabeçalho das telas. Ícones à direita: Configurações (engrenagem),
 * Notificações (sino, com contador de não lidas) e Sair da conta.
 * Celular: duas linhas (foto + ícones, depois o título). Tela maior: uma linha.
 */
export function Cabecalho({ titulo, subtitulo, mostrarFoto }: PropsCabecalho) {
  const { irTela } = useNavegacao();
  const { compacto, estreito, desktop } = useLayoutInfo();
  const naoLidas = useEvolua((e) => e.notificacoes).filter((n) => n.status === 'nao_lida').length;
  const tamIcone = estreito ? 24 : 26;
  const ladoLargura = 3 * 42 + 2 * 6;

  const foto = mostrarFoto ? (
    <Pressable onPress={() => irTela('perfil')} accessibilityRole="button" accessibilityLabel="Abrir Meu Perfil" style={estilos.avatarCabecalho}>
      <Avatar tamanho={compacto ? 50 : 58} />
    </Pressable>
  ) : null;

  const icones = (
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
  );

  const bloco = (
    <View style={estilos.cabCentro}>
      <Text
        style={[estilos.titulo, { fontSize: desktop ? 32 : estreito ? 24 : 28, lineHeight: desktop ? 38 : estreito ? 30 : 34 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        accessibilityRole="header"
      >
        {titulo}
      </Text>
      {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );

  if (compacto) {
    return (
      <View style={{ marginBottom: 12 }}>
        <View style={estilos.cabLinhaTopo}>
          <View>{foto}</View>
          {icones}
        </View>
        <View style={{ marginTop: 6 }}>{bloco}</View>
      </View>
    );
  }
  return (
    <View style={estilos.cabecalho}>
      <View style={{ width: ladoLargura, alignItems: 'flex-start' }}>{foto}</View>
      {bloco}
      <View style={{ width: ladoLargura, alignItems: 'flex-end' }}>{icones}</View>
    </View>
  );
}

/**
 * ===========================================================================
 * MENU INFERIOR (aba arredondada azul com 5 botões)
 *
 * Cada botão leva a uma parte do app e já está codificado para ser clicado.
 * Os comentários "BOTÃO ..." abaixo identificam cada um para os colaboradores.
 * Celular: colado embaixo. Web em tela grande: barra flutuante centralizada.
 *
 * Props:
 *   ativo              → qual botão aparece selecionado ('home', 'evolua', ...). null = nenhum.
 *   aoPressionarHome   → opcional. Dentro de home.tsx volta para a tela Home interna;
 *                        nas demais telas, deixe vazio para navegar até /principal/home.
 * ===========================================================================
 */
export type ItemMenu = 'home' | 'evolua' | 'chat' | 'progresso' | 'saibaMais';

/** Botão do menu: ícone cinza (azul quando selecionado) + rótulo. */
export function BotaoMenu({ rotulo, icone, selecionado, estreito, desktop, aoPressionar }: {
  rotulo: string; icone: IconeNome; selecionado: boolean; estreito: boolean; desktop: boolean; aoPressionar: () => void;
}) {
  return (
    <Pressable
      style={[estilos.menuBotao, { height: desktop ? 66 : estreito ? 62 : 70 }, selecionado && estilos.menuBotaoAtivo]}
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={rotulo}
    >
      <Ionicons name={icone} size={estreito ? 26 : 30} color={selecionado ? cores.azulEvolua : cores.cinzaAzulado} />
      <Text
        style={{ textAlign: 'center', fontFamily: selecionado ? fontes.textoMedio : fontes.texto, fontSize: desktop ? 13 : estreito ? 10 : 11, color: selecionado ? cores.azulEvolua : cores.cinzaGrafite }}
        numberOfLines={1}
      >
        {rotulo}
      </Text>
    </Pressable>
  );
}

export function MenuInferior({ ativo = null, aoPressionarHome }: { ativo?: ItemMenu | null; aoPressionarHome?: () => void }) {
  const insets = useSafeAreaInsets();
  const { estreito, desktop } = useLayoutInfo();

  return (
    <View style={[estilos.menuFundo, desktop && estilos.menuFundoDesktop]}>
      <View
        style={[
          estilos.menu,
          desktop ? estilos.menuDesktop : { paddingBottom: Math.max(insets.bottom, 10) + 6 },
          { width: '100%', maxWidth: '100%' },
        ]}
      >
        {/* BOTÃO HOME: volta à página inicial (/principal/home). Já implementado neste arquivo. */}
        <BotaoMenu rotulo="Home" icone="home" selecionado={ativo === 'home'} estreito={estreito} desktop={desktop} aoPressionar={aoPressionarHome ?? (() => router.navigate('/principal/home' as Href))} />
        {/* BOTÃO EVOLUA: abre /principal/evolua. A página (src/app/principal/evolua.tsx) é de outro colaborador. */}
        <BotaoMenu rotulo="Evolua" icone="moon" selecionado={ativo === 'evolua'} estreito={estreito} desktop={desktop} aoPressionar={() => router.navigate('/principal/evolua' as Href)} />
        {/* BOTÃO CHAT: abre /principal/chat. A página (chat.tsx) é de outro colaborador. */}
        <BotaoMenu rotulo="Chat" icone="chatbubbles" selecionado={ativo === 'chat'} estreito={estreito} desktop={desktop} aoPressionar={() => router.navigate('/principal/chat' as Href)} />
        {/* BOTÃO PROGRESSO: abre /principal/progresso. A página (progresso.tsx) é de outro colaborador. */}
        <BotaoMenu rotulo="Progresso" icone="stats-chart" selecionado={ativo === 'progresso'} estreito={estreito} desktop={desktop} aoPressionar={() => router.navigate('/principal/progresso' as Href)} />
        {/* BOTÃO SAIBA +: abre /principal/saiba-mais. A página (saiba-mais.tsx) é de outro colaborador. */}
        <BotaoMenu rotulo="Saiba +" icone="bulb" selecionado={ativo === 'saibaMais'} estreito={estreito} desktop={desktop} aoPressionar={() => router.navigate('/principal/saiba-mais' as Href)} />
      </View>
    </View>
  );
}

/* =============================================================================
 * 8. DESLIZADOR DISCRETO
 * -----------------------------------------------------------------------------
 * Controle arrastável com N posições fixas. A bolinha NUNCA para entre dois
 * pontos: ela sempre encaixa no centro de um dos N segmentos iguais.
 *   - Emoção: N = 5 (cada segmento fica sob um rosto).
 *   - Ansiedade / Estresse / Energia: N = 10 (valores 1 a 10).
 * `indice` vai de 0 a N-1; null = ainda não escolhido (bolinha opaca no meio).
 * Funciona com toque (iOS/Android) e mouse (web).
 * ========================================================================== */

export interface PropsDeslizador {
  quantidade: number;
  indice: number | null;
  onChange: (indice: number) => void;
  trilha: React.ReactNode;      // desenho da barra (ocupa toda a largura)
  rotulo: string;               // texto de acessibilidade
  textoValor: (indice: number | null) => string;
}

export const TAMANHO_BOLINHA = 34;

export function DeslizadorDiscreto({ quantidade, indice, onChange, trilha, rotulo, textoValor }: PropsDeslizador) {
  const larguraRef = useRef(0);
  const [largura, setLargura] = useState(0);
  const inicioX = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const posX = useRef(new Animated.Value(0)).current;

  const indiceDoX = useCallback((x: number): number => {
    const w = larguraRef.current;
    if (!w) return 0;
    return Math.min(quantidade - 1, Math.max(0, Math.floor((x / w) * quantidade)));
  }, [quantidade]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // impede o ScrollView de "roubar" o gesto
      onPanResponderGrant: (e) => {
        inicioX.current = e.nativeEvent.locationX;
        onChangeRef.current(indiceDoX(inicioX.current));
      },
      onPanResponderMove: (_, g) => onChangeRef.current(indiceDoX(inicioX.current + g.dx)),
    }),
  ).current;

  // Centro do segmento escolhido (ou meio da barra se nada foi escolhido).
  useEffect(() => {
    if (!largura) return;
    const centro = indice === null ? largura / 2 : ((indice + 0.5) / quantidade) * largura;
    Animated.timing(posX, { toValue: centro - TAMANHO_BOLINHA / 2, duration: 120, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [indice, largura, quantidade, posX]);

  const aoMedir = (e: LayoutChangeEvent) => {
    larguraRef.current = e.nativeEvent.layout.width;
    setLargura(e.nativeEvent.layout.width);
  };

  return (
    <View
      {...pan.panHandlers}
      onLayout={aoMedir}
      style={[estilos.deslizador, estilos.semGestoNativo]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ text: textoValor(indice) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const atual = indice ?? Math.floor(quantidade / 2);
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(quantidade - 1, atual + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(0, atual - 1));
      }}
    >
      {/* pointerEvents="none": o toque é sempre recebido pelo contêiner, o que mantém locationX confiável. */}
      <View pointerEvents="none" style={estilos.deslizadorInterno}>
        {trilha}
        <Animated.View style={[estilos.bolinha, indice === null && { opacity: 0.55 }, { transform: [{ translateX: posX }] }]} />
      </View>
    </View>
  );
}

/* =============================================================================
 * 9. CHECK-IN EMOCIONAL
 * ========================================================================== */

/** Rostinhos do check-in (SVG). Cada rosto usa a cor da sua emoção. */
export function RostoEmocao({ chave, cor, tamanho }: { chave: EmocaoChave; cor: string; tamanho: number }) {
  const tr = { stroke: cores.azulMarinho, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={39} fill={cor} />
      {chave === 'muito_feliz' && (
        <>
          <Path d="M20 31q5-7 10 0M50 31q5-7 10 0" {...tr} />
          <Path d="M20 46h40a20 18 0 0 1-40 0z" fill={cores.azulMarinho} />
        </>
      )}
      {chave === 'feliz' && (
        <>
          <Circle cx={29} cy={32} r={3.5} fill={cores.azulMarinho} />
          <Circle cx={51} cy={32} r={3.5} fill={cores.azulMarinho} />
          <Path d="M26 48q14 12 28 0" {...tr} />
        </>
      )}
      {chave === 'neutro' && (
        <>
          <Circle cx={29} cy={32} r={3.5} fill={cores.azulMarinho} />
          <Circle cx={51} cy={32} r={3.5} fill={cores.azulMarinho} />
          <Path d="M27 52h26" {...tr} />
        </>
      )}
      {chave === 'triste' && (
        <>
          <Circle cx={29} cy={32} r={3.5} fill={cores.azulMarinho} />
          <Circle cx={51} cy={32} r={3.5} fill={cores.azulMarinho} />
          <Path d="M26 56q14-12 28 0" {...tr} />
        </>
      )}
      {chave === 'muito_triste' && (
        <>
          <Path d="M23 26l9 9M32 26l-9 9M48 26l9 9M57 26l-9 9" {...tr} strokeWidth={3.4} />
          <Path d="M28 60a12 13 0 0 1 24 0z" fill={cores.azulMarinho} />
        </>
      )}
    </Svg>
  );
}

/** Bloco de um controle numérico (Ansiedade, Estresse ou Energia), valores de 0 a 10 em 11 pontos fixos. */
export function EscalaNumerica({ rotulo, valor, onChange, gradiente }: {
  rotulo: string; valor: number | null; onChange: (v: number) => void; gradiente: readonly [string, string, ...string[]];
}) {
  return (
    <View style={estilos.escalaNum}>
      <View style={estilos.escalaNumLinha}>
        <Text style={estilos.escalaNumRotulo}>{rotulo}</Text>
        <Text style={estilos.escalaNumValor} accessibilityLiveRegion="polite">{valor ?? '-'} /10</Text>
      </View>
      <DeslizadorDiscreto
        quantidade={11}
        indice={valor}
        onChange={onChange}
        rotulo={rotulo}
        textoValor={(i) => (i === null ? 'Não escolhido' : `${i} de 10`)}
        trilha={
          <LinearGradient colors={gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.trilhaNumerica} />
        }
      />
    </View>
  );
}

/** Cartão "Como está se sentindo hoje?". */
export function CheckinEmocional() {
  const [larguraCartao, setLarguraCartao] = useState(0);
  const [indiceEmocao, setIndiceEmocao] = useState<number | null>(null);
  const [ansiedade, setAnsiedade] = useState<number | null>(null);
  const [estresse, setEstresse] = useState<number | null>(null);
  const [energia, setEnergia] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  // Tamanho do rostinho conforme a largura REAL do cartão (5 células iguais entre os sinais "+" e "–").
  const espacoCelula = larguraCartao ? (larguraCartao - PADDING_CARTAO * 2 - 52) / 5 : 56;
  const rosto = Math.floor(Math.min(58, Math.max(34, espacoCelula - 10)));
  const anel = rosto + 10;

  const salvar = () => {
    const faltando: string[] = [];
    if (indiceEmocao === null) faltando.push('a emoção');
    if (ansiedade === null) faltando.push('a ansiedade');
    if (estresse === null) faltando.push('o estresse');
    if (energia === null) faltando.push('a energia');
    if (faltando.length > 0) {
      setAviso({ tipo: 'erro', texto: `Para salvar, escolha ${faltando.join(', ')}.` });
      return;
    }
    /* >>> AQUI O CHECK-IN É SALVO. <<<
     * salvarCheckin() (seção 4) guarda o registro em estado.checkins.
     * QUEM ESTIVER PROGRAMANDO O HISTÓRICO deve usar este ponto/estes dados
     * (useCheckins) para listar o check-in salvo na página de histórico. */
    const registro = salvarCheckin({
      emocao: EMOCOES[indiceEmocao as number].chave,
      ansiedade: ansiedade as number,
      estresse: estresse as number,
      energia: energia as number,
    });
    setAviso({
      tipo: 'ok',
      texto: `Dia salvo em ${new Date(registro.criadoEmISO).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.`,
    });
    setIndiceEmocao(null); setAnsiedade(null); setEstresse(null); setEnergia(null);
  };

  return (
    <View style={estilos.cartao} onLayout={(e) => setLarguraCartao(e.nativeEvent.layout.width)}>
      <Text style={estilos.secaoTitulo} accessibilityRole="header">Como está se sentindo hoje?</Text>

      {/* Rostos: 5 células iguais; o centro de cada uma fica alinhado ao segmento colorido da barra abaixo. */}
      <View style={estilos.emocoesLinha} accessibilityRole="radiogroup">
        {EMOCOES.map((e, i) => {
          const selecionada = indiceEmocao === i;
          return (
            <Pressable
              key={e.chave}
              style={estilos.emocaoCelula}
              onPress={() => setIndiceEmocao(i)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selecionada }}
              accessibilityLabel={e.rotulo}
            >
<View style={[estilos.emocaoAnel, { width: anel, height: anel, borderRadius: anel / 2 }, selecionada && estilos.emocaoAnelAtivo]}>
  <RostoEmocao chave={e.chave} cor={e.cor} tamanho={rosto} />
</View>

<Text style={estilos.emocaoRotulo}>
  {e.rotulo}
</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Barra de emoção: cada segmento tem a MESMA cor do rosto acima dele. */}
      <View style={estilos.emocaoBarraLinha}>
        <Text style={[estilos.sinal, { color: cores.roxoVibrante }]}>+</Text>
        <View style={{ flex: 1 }}>
          <DeslizadorDiscreto
            quantidade={5}
            indice={indiceEmocao}
            onChange={setIndiceEmocao}
            rotulo="Indicador de emoção"
            textoValor={(i) => (i === null ? 'Nenhuma emoção selecionada' : EMOCOES[i].rotulo)}
            trilha={
              <View style={estilos.faixaEmocao}>
                {EMOCOES.map((e) => (<View key={e.chave} style={{ flex: 1, backgroundColor: e.corPastel }} />))}
              </View>
            }
          />
        </View>
        <Text style={[estilos.sinal, { color: cores.turquesa }]}>–</Text>
      </View>

<EscalaNumerica
  rotulo="Ansiedade"
  valor={ansiedade}
  onChange={setAnsiedade}
  gradiente={[cores.lavanda, cores.lilas, cores.azulCeu]}
/>

<EscalaNumerica
  rotulo="Estresse"
  valor={estresse}
  onChange={setEstresse}
  gradiente={[cores.rosaPastel, cores.pessego, cores.laranjaSuave]}
/>

<EscalaNumerica
  rotulo="Energia"
  valor={energia}
  onChange={setEnergia}
  gradiente={[cores.verdeSuave, cores.verdeMenta, cores.amareloPastel]}
/>
      <BotaoSalvarDia onPress={salvar} />
      {aviso && (
        <Text style={[estilos.aviso, aviso.tipo === 'ok' ? estilos.avisoOk : estilos.avisoErro]} accessibilityLiveRegion="polite">
          {aviso.texto}
        </Text>
      )}
    </View>
  );
}

/* =============================================================================
 * 10. TELA HOME
 * ========================================================================== */

export type AtividadeHome = { chave: ChaveAtividade; titulo: string; fundo: string; texto: string; corIcone: string; icone: IconeNome };

// Tons pastel inspirados na paleta azul, verde e pêssego do aplicativo.
export const ATIVIDADES_HOME: ReadonlyArray<AtividadeHome> = [
  { chave: 'evolucaoPessoal', titulo: 'Evolução Pessoal', fundo: '#E1EFF9', texto: '#29465F', corIcone: '#2877AE', icone: 'trending-up' },
  { chave: 'questionarios', titulo: 'Meus Questionários', fundo: '#DFF2EF', texto: '#294B49', corIcone: '#25877E', icone: 'clipboard' },
  { chave: 'metas', titulo: 'Minhas Metas', fundo: '#FCEBDD', texto: '#604936', corIcone: '#C47A3B', icone: 'flag' },
  { chave: 'exercicios', titulo: 'Meus Exercícios', fundo: '#E8F1E5', texto: '#3D5140', corIcone: '#628A57', icone: 'fitness' },
];

/** Cartão de atividade. PONTO DE INTEGRAÇÃO: o destino é definido em ROTAS_ATIVIDADES (seção 6). */
export function CartaoAtividadeHome({ a, estiloExtra, fonte }: { a: AtividadeHome; estiloExtra: ViewStyle; fonte: number }) {
  return (
    <Pressable
      style={[estilos.atividade, { backgroundColor: a.fundo }, estiloExtra]}
      onPress={() => abrirAtividade(a.chave)}
      accessibilityRole="button"
      accessibilityLabel={a.titulo}
    >
      <View style={[estilos.atividadeIconeBox, { backgroundColor: 'rgba(255,255,255,0.72)' }]}>
        <Ionicons name={a.icone} size={fonte + 5} color={a.corIcone} />
      </View>
      <Text style={[estilos.atividadeTexto, { color: a.texto, fontSize: fonte, lineHeight: fonte + 4 }]} numberOfLines={2}>{a.titulo}</Text>
      <Ionicons name="chevron-forward" size={18} color={a.corIcone} />
    </Pressable>
  );
}

/** Web em tela grande: as 4 atividades em grade 2x2 (sem rolagem lateral). */
export function GradeAtividades() {
  return (
    <View style={estilos.gradeAtividades}>
      {ATIVIDADES_HOME.map((a) => (
        <CartaoAtividadeHome key={a.chave} a={a} fonte={19} estiloExtra={{ width: '48.5%', minHeight: 86 }} />
      ))}
    </View>
  );
}

/**
 * Carrossel horizontal de atividades (celular/tablet). As bordas têm FADE
 * (degradê para o branco do cartão). O botão circular indica que há mais
 * atividades e rola a lista ao ser tocado.
 */
export function CarrosselAtividades() {
  const scrollRef = useRef<ScrollView>(null);
  const deslocamento = useRef(0);
  const [posicao, setPosicao] = useState<'inicio' | 'meio' | 'fim'>('inicio');
  const [larguraCont, setLarguraCont] = useState(0);
  const medidas = useRef({ visivel: 0, conteudo: 0 });

  // Mostra ~2 cartões e meio, para sugerir que dá para rolar.
  const larguraCartao = Math.round(Math.min(220, Math.max(120, ((larguraCont || 300) - 10) / 1.5)));
  const alturaCartao = 86;

  const recalcular = (x: number) => {
    deslocamento.current = x;
    const max = medidas.current.conteudo - medidas.current.visivel;
    if (max <= 4) setPosicao('fim');
    else if (x <= 4) setPosicao('inicio');
    else if (x >= max - 4) setPosicao('fim');
    else setPosicao('meio');
  };

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    medidas.current = { visivel: e.nativeEvent.layoutMeasurement.width, conteudo: e.nativeEvent.contentSize.width };
    recalcular(e.nativeEvent.contentOffset.x);
  };

  return (
    <View onLayout={(e) => setLarguraCont(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={aoRolar}
        onLayout={(e) => { medidas.current.visivel = e.nativeEvent.layout.width; recalcular(deslocamento.current); }}
        onContentSizeChange={(w) => { medidas.current.conteudo = w; recalcular(deslocamento.current); }}
        contentContainerStyle={{ gap: 10, paddingRight: 8, paddingBottom: 4 }}
      >
        {ATIVIDADES_HOME.map((a) => (
          <CartaoAtividadeHome
            key={a.chave}
            a={a}
            fonte={larguraCartao >= 132 ? 16 : 14}
            estiloExtra={{ width: larguraCartao, height: alturaCartao }}
          />
        ))}
      </ScrollView>

      {/* Fade da direita (há mais atividades) e da esquerda (já rolou). */}
      {posicao !== 'fim' && (
        <LinearGradient colors={['rgba(255,255,255,0)', cores.branco]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[estilos.fade, { right: 0 }]} />
      )}
      {posicao !== 'inicio' && (
        <LinearGradient colors={[cores.branco, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[estilos.fade, { left: 0 }]} />
      )}
      {posicao !== 'inicio' && (
        <Pressable
          style={[estilos.setaCarrossel, estilos.setaCarrosselEsquerda]}
          onPress={() => {
            const maximo = Math.max(0, medidas.current.conteudo - medidas.current.visivel);
            const destino = Math.max(0, Math.min(maximo, deslocamento.current - larguraCartao));
            scrollRef.current?.scrollTo({ x: destino, animated: true });
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver atividades anteriores"
        >
          <Ionicons name="chevron-back" size={24} color={cores.branco} />
        </Pressable>
      )}
      {posicao !== 'fim' && (
        <Pressable
          style={estilos.setaCarrossel}
          onPress={() => {
            const maximo = Math.max(0, medidas.current.conteudo - medidas.current.visivel);
            const destino = Math.max(0, Math.min(maximo, deslocamento.current + larguraCartao));
            scrollRef.current?.scrollTo({ x: destino, animated: true });
          }}
          accessibilityRole="button"
          accessibilityLabel="Ver mais atividades"
        >
          <Ionicons name="chevron-forward" size={24} color={cores.branco} />
        </Pressable>
      )}
    </View>
  );
}

export function TelaHome() {
  const apelido = useEvolua((e) => e.perfil.apelido);
  const { estreito, desktop } = useLayoutInfo();
  const frase = useMemo(() => fraseDoDia(), []);

  const cartaoSaudacao = (
    <View style={estilos.homeIntro}>
      {/* O apelido vem do store: mudou nas Configurações, muda aqui. */}
      <Text style={[estilos.saudacao, { fontSize: desktop ? 34 : estreito ? 25 : 28 }]} numberOfLines={2}>Olá, {apelido}!</Text>
      <Text style={[estilos.frase, desktop && { fontSize: 17, lineHeight: 24 }]}>{frase}</Text>
      <Text style={estilos.secaoTitulo}>Suas atividades:</Text>
      {desktop ? <GradeAtividades /> : <CarrosselAtividades />}
    </View>
  );

  return (
    <>
      <Cabecalho titulo="Home" mostrarFoto />
      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1 }}>{cartaoSaudacao}</View>
          <View style={{ flex: 1.1 }}><CheckinEmocional /></View>
        </View>
      ) : (
        <>
          {cartaoSaudacao}
          <CheckinEmocional />
        </>
      )}
    </>
  );
}

/* =============================================================================
 * 11. TELA MEU PERFIL
 * ========================================================================== */

export function CartaoAtividadePerfil({ chave, titulo, corTexto = '#334155', estiloExtra, children }: {
  chave: ChaveAtividade; titulo: string; fundo: string; corTexto?: string; estiloExtra?: ViewStyle; children?: React.ReactNode;
}) {
  const icones: Partial<Record<ChaveAtividade, IconeNome>> = {
    checkinEmocional: 'heart', questionarios: 'clipboard', evolucaoPessoal: 'trending-up', exercicios: 'fitness', metas: 'flag',
  };
  return (
    <Pressable style={[estilos.cartaoPerfil, estiloExtra]} onPress={() => abrirAtividade(chave)} accessibilityRole="button" accessibilityLabel={titulo}>
      <View style={estilos.cartaoPerfilCabecalho}>
        <View style={estilos.atividadeIconeBox}>
          <Ionicons name={icones[chave] ?? 'apps'} size={21} color="#397FB5" />
        </View>
        <Text style={[estilos.cartaoPerfilTexto, { color: corTexto }]}>{titulo}</Text>
      </View>
      {children}
    </Pressable>
  );
}

export function TelaPerfil() {
  const perfil = useEvolua((e) => e.perfil);
  const { estreito, largo, desktop } = useLayoutInfo();
  // A biografia é editada num estado local e gravada ao sair do campo (evita gravar a cada letra).
  const [bio, setBio] = useState(perfil.biografia);

  const colunaA = (
    <View style={{ flex: 1, gap: 12 }}>
      <CartaoAtividadePerfil chave="checkinEmocional" titulo="Check-in Emocional" fundo={cores.rosaVibrante} />
      <CartaoAtividadePerfil chave="questionarios" titulo="Questionários" fundo={cores.turquesa} corTexto={cores.azulMarinho} />
    </View>
  );
  const colunaB = (
    <View style={{ flex: 1, gap: 12 }}>
      <CartaoAtividadePerfil chave="evolucaoPessoal" titulo="Evolução Pessoal" fundo={cores.azulProfundo} />
      <CartaoAtividadePerfil chave="exercicios" titulo="Exercícios" fundo={cores.laranja} corTexto={cores.azulMarinho} />
    </View>
  );
  const metas = (
    <CartaoAtividadePerfil
      chave="metas"
      titulo="Metas"
      fundo={cores.verdeMenta}
      corTexto={cores.azulMarinho}
      estiloExtra={{ flex: largo ? 1 : undefined, justifyContent: 'space-between' }}
    >
      <View style={estilos.metasBarras}>
        <View style={[estilos.metasBarra, { height: '45%' }]} />
        <View style={[estilos.metasBarra, { height: '70%' }]} />
        <View style={[estilos.metasBarra, { height: '100%' }]} />
      </View>
    </CartaoAtividadePerfil>
  );

  const cartaoPessoa = (
    <View style={estilos.cartao}>
      <View style={estilos.perfilBannerBox}>
        <LinearGradient
          colors={['#F8FAFC', '#EAF4FB', '#DCECF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.perfilBanner}
        />
        <View style={estilos.perfilFoto}><Avatar tamanho={estreito ? 92 : 108} /></View>
      </View>
      {/* Nome, sobrenome e apelido vêm do store (editados nas Configurações). */}
      <Text style={estilos.perfilNome}>{perfil.nome} {perfil.sobrenome}</Text>
      <Text style={estilos.perfilApelido}>{perfil.apelido}</Text>
      <Text style={estilos.perfilBioRotulo}>Biografia:</Text>
      <TextInput
        style={estilos.perfilBio}
        placeholder="Apresente-se aqui!"
        placeholderTextColor={cores.cinzaAzulado}
        multiline
        maxLength={500}
        textAlignVertical="top"
        value={bio}
        onChangeText={setBio}
        onBlur={() => atualizarPerfil({ biografia: bio })}
        accessibilityLabel="Biografia"
      />
    </View>
  );

  const cartaoAtividades = (
    <View style={estilos.cartao}>
      <Text style={[estilos.secaoTitulo, { fontSize: 20 }]}>Suas Atividades aparecerão aqui</Text>
      {/*
       * BLOCOS DE ATIVIDADES DO PERFIL (para os demais colaboradores):
       *  - "Check-in Emocional": histórico dos check-ins → ligar a ROTAS_ATIVIDADES.checkinEmocional
       *  - "Evolução Pessoal"  → ROTAS_ATIVIDADES.evolucaoPessoal
       *  - "Questionários"     → ROTAS_ATIVIDADES.questionarios
       *  - "Exercícios"        → ROTAS_ATIVIDADES.exercicios
       *  - "Metas"             → ROTAS_ATIVIDADES.metas
       * Todos já são clicáveis; basta preencher os caminhos na seção 6.
       */}
      {largo ? (
        <View style={estilos.perfilGrade}>
          {colunaA}
          {colunaB}
          <View style={{ flex: 0.8 }}>{metas}</View>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <View style={estilos.perfilGrade}>{colunaA}{colunaB}</View>
          {metas}
        </View>
      )}
      {/* Indicador "..." do design (apenas visual: sinaliza que a seção é extensível). */}
      <View style={estilos.maisIndicador}><Text style={estilos.maisTexto}>. . .</Text></View>
    </View>
  );

  return (
    <>
      <Cabecalho titulo="Meu Perfil" />
      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1 }}>{cartaoPessoa}</View>
          <View style={{ flex: 1 }}>{cartaoAtividades}</View>
        </View>
      ) : (
        <>
          {cartaoPessoa}
          {cartaoAtividades}
        </>
      )}
      <BotaoVoltar />
    </>
  );
}

export const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.brancoAzulado },
  /** Coluna central (largura máxima e paddings são definidos no componente, por tamanho de tela). */
  conteudo: { width: '100%', alignSelf: 'center', paddingBottom: 28 },
  /** Impede o navegador de rolar a página quando o dedo/mouse arrasta o deslizador. */
  semGestoNativo: Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none' } as unknown as ViewStyle) : {},
  duasColunas: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },

  /* Cabeçalho */
  cabecalho: { flexDirection: 'row', alignItems: 'center', minHeight: 72, marginBottom: 12 },
  cabLinhaTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 54 },
  cabCentro: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  avatarCabecalho: { borderRadius: 40, borderWidth: 3, borderColor: cores.branco, overflow: 'hidden', ...SOMBRA },
  titulo: { fontFamily: fontes.titulo, color: cores.azulMarinho, textAlign: 'center' },
  subtitulo: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, textAlign: 'center', marginTop: 2 },
  iconesLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconeBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.75)' },
  selo: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: cores.rosaVibrante, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: cores.brancoAzulado },
  seloTexto: { color: cores.branco, fontSize: 11, fontFamily: fontes.textoMedio },

  /* Cartões e textos gerais */
  cartao: { backgroundColor: cores.branco, borderRadius: 22, padding: PADDING_CARTAO, marginBottom: 18, ...SOMBRA },
  cartaoPerigo: { borderWidth: 1, borderColor: '#FFC9D6' },
  saudacao: { fontFamily: fontes.titulo, color: cores.azulMarinho },
  frase: { fontFamily: fontes.texto, fontSize: 15, lineHeight: 21, color: cores.cinzaGrafite, marginTop: 4, marginBottom: 16 },
  secaoTitulo: { fontFamily: fontes.titulo, fontSize: 20, color: cores.azulMarinho, marginBottom: 12 },
  aviso: { fontFamily: fontes.textoMedio, fontSize: 14, lineHeight: 20, padding: 12, borderRadius: 12, marginTop: 14, overflow: 'hidden', color: cores.azulMarinho },
  avisoOk: { backgroundColor: cores.verdeSuave },
  avisoErro: { backgroundColor: '#FFE0E6' },

  /* Atividades (Home) */
  homeIntro: { backgroundColor: 'transparent', borderRadius: 0, padding: 0, marginBottom: 18 },
  atividade: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(85, 125, 155, 0.10)' },
  atividadeTexto: { flex: 1, fontFamily: fontes.textoMedio, color: '#334155' },
  atividadeIconeBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EAF4FB', alignItems: 'center', justifyContent: 'center' },
  gradeAtividades: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  fade: { position: 'absolute', top: 0, bottom: 4, width: 52, pointerEvents: 'none' },
  setaCarrossel: { position: 'absolute', right: 2, top: '50%', marginTop: -23, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30,42,68,0.55)', alignItems: 'center', justifyContent: 'center' },
  setaCarrosselEsquerda: { left: 2, right: undefined },

  /* Check-in */
  emocaoRotulo: {
  fontFamily: fontes.texto,
  fontSize: 10,
  color: cores.cinzaGrafite,
  textAlign: 'center',
  marginTop: 5,
  minHeight: 28,
  },
  emocoesLinha: { flexDirection: 'row', marginHorizontal: 26, marginTop: 2 },
  emocaoCelula: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  emocaoAnel: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  emocaoAnelAtivo: { borderColor: cores.azulEvolua, backgroundColor: cores.branco },
  emocaoBarraLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sinal: { width: 26, fontSize: 24, fontFamily: fontes.titulo, textAlign: 'center' },
  faixaEmocao: { flexDirection: 'row', height: 12, width: '100%', borderRadius: 6, overflow: 'hidden' },
  deslizador: { height: 46, justifyContent: 'center', width: '100%' },
  deslizadorInterno: { height: TAMANHO_BOLINHA, justifyContent: 'center' },
  bolinha: {
    position: 'absolute', left: 0, top: 0, width: TAMANHO_BOLINHA, height: TAMANHO_BOLINHA, borderRadius: TAMANHO_BOLINHA / 2,
    backgroundColor: cores.branco, borderWidth: 4, borderColor: cores.azulEvolua, ...SOMBRA,
  },
  trilhaNumerica: { height: 12, width: '100%', borderRadius: 6 },
  escalaNum: { marginTop: 8 },
  escalaNumLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4 },
  escalaNumRotulo: { fontFamily: fontes.textoMedio, fontSize: 17, color: cores.azulMarinho },
  escalaNumValor: { fontFamily: fontes.texto, fontSize: 15, color: cores.cinzaGrafite },

  /* Botões */
  btnPrimarioBase: { alignSelf: 'center', width: '82%', maxWidth: 340, marginTop: 18, marginBottom: 6, borderRadius: 16, overflow: 'hidden', ...SOMBRA },
  btnPrimario: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnPrimarioTexto: { fontFamily: fontes.botao, fontSize: 19, color: cores.branco, textShadowColor: 'rgba(30,42,68,0.25)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  btnSalvarDiaBase: { alignSelf: 'center', width: '82%', maxWidth: 340, marginTop: 18, marginBottom: 6, borderRadius: 8, overflow: 'hidden', ...SOMBRA },
  btnSalvarDia: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnSalvarDiaTexto: { fontFamily: fontes.botao, fontSize: 19, color: cores.branco },
  btnSecundario: { alignSelf: 'flex-start', backgroundColor: cores.azulGelo, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, marginTop: 6, marginRight: 8 },
  btnSecundarioTexto: { fontFamily: fontes.botao, fontSize: 15, color: cores.azulProfundo },
  btnVoltar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center', width: '84%', maxWidth: 360, marginTop: 4, marginBottom: 8, paddingVertical: 14, borderRadius: 16, backgroundColor: cores.branco, borderWidth: 2, borderColor: cores.azulCeu },
  btnVoltarTexto: { fontFamily: fontes.botao, fontSize: 16, color: cores.azulProfundo },

  /* Perfil */
  perfilBannerBox: { height: 130, marginBottom: 58 },
  perfilBanner: { ...StyleSheet.absoluteFillObject, borderRadius: 18 },
  perfilFoto: { position: 'absolute', left: 16, bottom: -52, borderWidth: 4, borderColor: cores.branco, borderRadius: 70, overflow: 'hidden', backgroundColor: cores.branco },
  perfilNome: { fontFamily: fontes.titulo, fontSize: 22, color: cores.azulMarinho, marginHorizontal: 6 },
  perfilApelido: { fontFamily: fontes.textoMedio, fontSize: 14, color: '#397FB5', marginHorizontal: 6, marginTop: 2 },
  perfilBioRotulo: { fontFamily: fontes.textoMedio, fontSize: 15, color: cores.azulMarinho, marginTop: 14, marginHorizontal: 6, marginBottom: 6 },
  perfilBio: { minHeight: 120, borderRadius: 18, backgroundColor: cores.brancoAzulado, borderWidth: 1, borderColor: cores.cinzaClaro, padding: 14, fontFamily: fontes.texto, fontSize: 15, lineHeight: 21, color: cores.azulMarinho },
  perfilGrade: { flexDirection: 'row', gap: 12 },
  cartaoPerfil: { borderRadius: 14, padding: 14, minHeight: 76, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAF0' },
  cartaoPerfilCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartaoPerfilTexto: { flex: 1, fontFamily: fontes.textoMedio, fontSize: 16, lineHeight: 21 },
  metasBarras: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 52, marginTop: 10 },
  metasBarra: { flex: 1, backgroundColor: '#B7D7EF', borderRadius: 4 },
  maisIndicador: { alignSelf: 'center', width: 90, height: 48, borderRadius: 14, backgroundColor: '#EAF2F8', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  maisTexto: { color: '#397FB5', letterSpacing: 3, fontSize: 16, fontFamily: fontes.titulo },

  /* Configurações (formulário único) */
  fotoLinha: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  fotoPrevia: { borderRadius: 42, overflow: 'hidden' },
  linhaCampos: { flexDirection: 'row', gap: 12 },
  campoRotulo: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.azulMarinho, marginBottom: 6 },
  campo: { height: 46, borderRadius: 12, backgroundColor: cores.brancoAzulado, borderWidth: 1, borderColor: cores.cinzaClaro, paddingHorizontal: 12, fontFamily: fontes.texto, fontSize: 16, color: cores.azulMarinho },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: cores.azulGelo },
  chipAtivo: { backgroundColor: cores.azulEvolua },
  chipTexto: { fontFamily: fontes.botao, fontSize: 14, color: cores.azulProfundo },
  painelTitulo: { fontFamily: fontes.textoMedio, fontSize: 16, color: cores.azulMarinho, marginBottom: 10 },
  painelTexto: { fontFamily: fontes.texto, fontSize: 14, lineHeight: 20, color: cores.cinzaGrafite, marginBottom: 12 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  acoesForm: { alignItems: 'center', marginBottom: 22 },
  btnPerigo: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#FFE0E6', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18 },
  btnPerigoTexto: { fontFamily: fontes.botao, fontSize: 15, color: cores.azulMarinho },
  btnPerigoConfirmar: { alignSelf: 'flex-start', backgroundColor: cores.rosaVibrante, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, marginTop: 6, marginRight: 8 },
  btnPerigoConfirmarTexto: { fontFamily: fontes.botao, fontSize: 15, color: cores.branco },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: cores.azulEvolua, alignItems: 'center', justifyContent: 'center' },
  radioMiolo: { width: 11, height: 11, borderRadius: 6, backgroundColor: cores.azulEvolua },
  seta: { width: 38, height: 38, borderRadius: 19, backgroundColor: cores.azulEvolua, alignItems: 'center', justifyContent: 'center' },

  /* Notificações */
  abas: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  aba: { flex: 1, borderRadius: 12, paddingVertical: 9, backgroundColor: cores.azulGelo, alignItems: 'center' },
  abaAtiva: { backgroundColor: cores.azulEvolua },
  abaTexto: { fontFamily: fontes.botao, fontSize: 14, color: cores.azulProfundo },
  notif: { backgroundColor: cores.branco, borderRadius: 20, marginBottom: 12, paddingHorizontal: 16, paddingBottom: 14, ...SOMBRA },
  notifCabeca: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 14 },
  notifTituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifPonto: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.rosaVibrante },
  notifTitulo: { flexShrink: 1, fontFamily: fontes.titulo, fontSize: 18, color: cores.azulMarinho },
  notifMsg: { fontFamily: fontes.texto, fontSize: 15, lineHeight: 21, color: cores.cinzaGrafite, marginTop: 4 },
  notifData: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaAzulado, marginTop: 8 },
  notifTagLida: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 8, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, backgroundColor: cores.verdeSuave },
  notifTagLidaTexto: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.azulMarinho },
  notifAcoes: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  vazio: { fontFamily: fontes.texto, fontSize: 16, lineHeight: 22, color: cores.cinzaGrafite, textAlign: 'center', marginVertical: 56, marginHorizontal: 20 },

  /* Menu inferior */
  menuFundo: { width: '100%', alignItems: 'stretch' },
  menuFundoDesktop: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: 6 },
  menu: { width: '100%', flexDirection: 'row', gap: 8, backgroundColor: 'rgba(205, 229, 247, 0.68)', borderRadius: 0, borderTopWidth: 1, borderTopColor: 'rgba(160, 194, 220, 0.45)', paddingTop: 10, paddingHorizontal: 12 },
  menuDesktop: { borderRadius: 0, paddingTop: 12, paddingBottom: 12 },
  menuBotao: { flex: 1, borderRadius: 0, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 2 },
  menuBotaoAtivo: { backgroundColor: 'rgba(255, 255, 255, 0.42)', borderRadius: 0, borderBottomWidth: 3, borderBottomColor: '#397FB5' },
});


