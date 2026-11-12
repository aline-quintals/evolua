/* =============================================================================
 * src/app/principal/home.tsx — MÓDULO HOME DO PROJETO EVOLUA
 * (React Native + Expo Router + TypeScript, arquivo único)
 * =============================================================================
 *
 * ESTE ARQUIVO CONTÉM, NESTA ORDEM:
 *   1.  Imports
 *   2.  Tipos e interfaces
 *   3.  Tokens de design (cores e fontes)
 *   4.  Dados compartilhados (store central + hooks exportados)
 *   5.  Pontos de integração com o BACKEND (serviços)
 *   6.  Funções auxiliares
 *   7.  Rotas das atividades (pontos de integração com outras páginas)
 *   8.  Componentes base (Avatar, Cabeçalho, Menu Inferior)
 *   9.  Deslizador discreto (usado no Check-in)
 *  10.  Check-in Emocional
 *  11.  Tela Home
 *  12.  Tela Meu Perfil
 *  13.  Tela Configurações
 *  14.  Tela Notificações
 *  15.  Componente da rota (export default)
 *
 * ---------------------------------------------------------------------------
 * PÁGINA DE ENTRADA DO APP  (comentário pedido na especificação)
 * ---------------------------------------------------------------------------
 * O app abre em src/app/index.tsx, que faz <Redirect href="/acesso/abertura" />.
 * >>> É LÁ (em src/app/index.tsx / telas de src/app/acesso/) que devem ser
 * >>> ADICIONADAS AS PÁGINAS DE INICIALIZAÇÃO DO APP (abertura, login etc.).
 * Este arquivo só cuida do que acontece DEPOIS do login (rota /principal/home).
 * Sugestão: cole o comentário acima também em src/app/index.tsx.
 *
 * ---------------------------------------------------------------------------
 * COMO ESTA TELA SE ENCAIXA NO ROUTER
 * ---------------------------------------------------------------------------
 * - Rota: /principal/home. Perfil, Configurações e Notificações são TELAS
 *   INTERNAS deste arquivo (trocadas por estado), para manter tudo em um só
 *   arquivo. O menu inferior continua visível em todas, como no design.
 * - Os 5 botões do menu navegam com expo-router para:
 *     /principal/home, /principal/evolua, /principal/chat,
 *     /principal/progresso, /principal/saiba-mais.
 * - MENU INFERIOR: este arquivo desenha o menu (componente <MenuInferior />,
 *   exportado). Para não aparecer DUAS barras, no src/app/principal/_layout.tsx
 *   esconda a barra padrão das Tabs (ex.: <Tabs tabBar={() => null} /> ou
 *   tabBarStyle: { display: 'none' }) e renderize <MenuInferior ativo="evolua" />
 *   no fim das telas dos colegas — OU use <MenuInferior /> como `tabBar`
 *   customizada. Quem fizer o _layout decide; o componente funciona nos dois casos.
 *
 * ---------------------------------------------------------------------------
 * DADOS COMPARTILHADOS COM OUTRAS TELAS
 * ---------------------------------------------------------------------------
 * O estado (perfil, check-ins, notificações) vive em um store de módulo, FORA
 * da árvore React. Qualquer arquivo do projeto pode importar:
 *     import { useCheckins, useEvolua } from './home';
 * sem precisar de Provider. Veja a seção 4.
 *
 * ---------------------------------------------------------------------------
 * DEPENDÊNCIAS
 * ---------------------------------------------------------------------------
 * Já presentes no package.json: expo-router, react-native-svg, expo-linear-gradient,
 * expo-image, @expo/vector-icons, react-native-safe-area-context.
 * NÃO presente (precisa instalar pelo integrador):
 *     npx expo install expo-image-picker      ← usada na troca de foto
 *
 * ---------------------------------------------------------------------------
 * FONTES (nomes de família usados neste arquivo, ver FONTES na seção 3)
 * ---------------------------------------------------------------------------
 *   principal: 'StixTwoMath' | secundária: 'AverageSans' | títulos: 'BebasNeue'
 *   textos e botões: 'AXES'
 * Este arquivo NÃO carrega fontes. Carregue-as uma vez no layout raiz com
 * expo-font, registrando exatamente estes nomes, por exemplo:
 *     useFonts({ StixTwoMath: require('...'), AverageSans: require('...'),
 *                BebasNeue: require('...'), AXES: require('...') })
 * Enquanto não carregadas, o sistema usa a fonte padrão.
 *
 * Este código não foi executado, compilado nem testado.
 * ========================================================================== */

/* =============================================================================
 * 1. IMPORTS
 * ========================================================================== */
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
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

/* =============================================================================
 * 2. TIPOS E INTERFACES
 * ========================================================================== */

export type Genero = 'homem' | 'mulher' | 'outro' | 'nao_informar';

/** Dados do usuário. Fonte única da verdade para Home, Perfil, Configurações e Notificações. */
export interface PerfilUsuario {
  id: string;                    // id do usuário (vem do backend após o login)
  nome: string;
  sobrenome: string;
  apelido: string;               // usado em "Olá, [apelido]!"
  fotoUrl: string | null;        // uri local ou URL do backend; null = avatar padrão
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
type TelaInterna = 'home' | 'perfil' | 'configuracoes' | 'notificacoes';

export interface ResultadoServico {
  ok: boolean;
  mensagem?: string;
  naoConectado?: boolean; // true na implementação padrão (nada foi simulado)
}

/** Contrato dos serviços que dependem de backend (seção 5). */
export interface ServicosBackend {
  solicitarCodigoAlteracaoContato(d: { tipo: 'email' | 'telefone'; novoValor: string }): Promise<ResultadoServico>;
  confirmarAlteracaoContato(d: { tipo: 'email' | 'telefone'; novoValor: string; codigo: string }): Promise<ResultadoServico>;
  alterarSenha(d: { senhaAtual: string; novaSenha: string }): Promise<ResultadoServico>;
  solicitarCodigoRecuperacao(d: { canal: 'email' | 'telefone' }): Promise<ResultadoServico>;
  confirmarRecuperacaoSenha(d: { codigo: string; novaSenha: string }): Promise<ResultadoServico>;
  encerrarSessao(): Promise<ResultadoServico>;
}

/* =============================================================================
 * 3. TOKENS DE DESIGN
 * ========================================================================== */

export const CORES = {
  azulEvolua: '#4A7BD9', azulCeu: '#A7C8FF', azulGelo: '#D7E6FF', lilas: '#B79CFF', lavanda: '#E7D9FF',
  verdeMenta: '#A7E8D4', verdeSuave: '#C8EBD8', turquesa: '#7FD3D6', amareloPastel: '#FFE7A3',
  pessego: '#FFB88C', rosaPastel: '#FFB6D9',
  azulProfundo: '#2E5B9A', roxoVibrante: '#7B61FF', roxo: '#A855F7', rosaVibrante: '#FF7EB6',
  laranja: '#FFB347', verdeAgua: '#1BA7A7',
  azulMarinho: '#1E2A44', cinzaGrafite: '#4B5563', cinzaAzulado: '#94A3B8', cinzaClaro: '#E2E8F0',
  branco: '#FFFFFF', brancoAzulado: '#F7F9FF',
} as const;

/** Nomes das famílias de fonte (devem ser registrados com expo-font no layout raiz). */
export const FONTES = {
  principal: 'StixTwoMath',
  secundaria: 'AverageSans',
  titulo: 'BebasNeue',
  texto: 'AXES', // textos E botões
} as const;

/** Emoções do check-in. ORDEM: índice 0 = muito feliz (esquerda, lado "+") … 4 = muito triste. */
const EMOCOES: ReadonlyArray<{ chave: EmocaoChave; rotulo: string; nivel: 1 | 2 | 3 | 4 | 5; cor: string }> = [
  { chave: 'muito_feliz', rotulo: 'Muito feliz', nivel: 5, cor: '#8A7AD8' },
  { chave: 'feliz', rotulo: 'Feliz', nivel: 4, cor: '#A5B8E3' },
  { chave: 'neutro', rotulo: 'Neutro', nivel: 3, cor: '#FFDDB4' },
  { chave: 'triste', rotulo: 'Triste', nivel: 2, cor: '#DDEDEA' },
  { chave: 'muito_triste', rotulo: 'Muito triste', nivel: 1, cor: '#B3E3D5' },
];

const FRASES_MOTIVACIONAIS: ReadonlyArray<string> = [
  'A persistência realiza o impossível!',
  'Um passo de cada vez já é caminho percorrido.',
  'Cuidar de você também é progresso.',
  'Hoje é um bom dia para recomeçar.',
  'Pequenas conquistas constroem grandes mudanças.',
];

/* =============================================================================
 * 4. DADOS COMPARTILHADOS (STORE CENTRAL)
 * -----------------------------------------------------------------------------
 * Estado único em memória, fora do React, lido com useSyncExternalStore.
 * Qualquer arquivo pode importar os hooks/funções exportados daqui.
 *
 * O QUE CADA TELA FAZ COM ELE:
 *   - Trocar a foto (Configurações)  → atualiza Home, Perfil e Notificações.
 *   - Trocar o apelido               → atualiza "Olá, [apelido]!" na Home e o Perfil.
 *   - Trocar nome/sobrenome          → atualiza o Perfil e a linha "Nome" das Configurações.
 *   - Salvar um check-in             → entra em estado.checkins (ver guia abaixo).
 *   - Mudar status de notificação    → muda a aba em que ela aparece.
 *
 * Nada é persistido (sem banco, sem AsyncStorage): ao fechar o app os dados se
 * perdem. Para integrar, carregue os dados do backend com inicializarDadosEvolua()
 * e grave as mudanças usando os ouvintes (aoSalvarCheckin, aoMudarPerfil, aoMudarNotificacoes).
 * ========================================================================== */

/** Valores iniciais de PLACEHOLDER (textos do design). Substitua com inicializarDadosEvolua(). */
const PERFIL_PADRAO: PerfilUsuario = {
  id: 'usuario-local',
  nome: 'Nome',
  sobrenome: 'Sobrenome',
  apelido: 'Apelido',
  fotoUrl: null,
  biografia: '',
  dataNascimento: null,
  genero: 'nao_informar',
  contato: { email: 'email.exemple', telefone: '(11) 9XXXX-XXXX' },
};

const horasAtrasISO = (h: number): string => new Date(Date.now() - h * 3600 * 1000).toISOString();

/**
 * ===========================================================================
 * >>> NOTIFICAÇÕES — ONDE EDITAR TÍTULO E MENSAGEM <<<
 * Cada item abaixo é uma notificação:
 *   titulo   → título exibido no cartão (EDITE AQUI)
 *   mensagem → texto completo; a prévia é cortada com "..." automaticamente (EDITE AQUI)
 *   dataISO  → opcional; remova a linha para não mostrar data
 *   status   → 'nao_lida' | 'lida' | 'arquivada' (define em qual aba aparece)
 * Para dados reais do backend, use inicializarDadosEvolua({ notificacoes }).
 * ===========================================================================
 */
const NOTIFICACOES_EXEMPLO: Notificacao[] = [
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

let estadoAtual: EstadoEvolua = {
  perfil: PERFIL_PADRAO,
  checkins: [],
  notificacoes: NOTIFICACOES_EXEMPLO,
  preferencias: { idioma: 'pt-BR' },
};

const ouvintesEstado = new Set<() => void>();
const ouvintesCheckin = new Set<(r: RegistroCheckin) => void>();
const ouvintesPerfil = new Set<(p: PerfilUsuario) => void>();
const ouvintesNotificacoes = new Set<(n: Notificacao[]) => void>();

function definirEstado(novo: EstadoEvolua): void {
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

/** Carrega dados reais (usuário, check-ins, notificações) vindos do backend. Chame ao iniciar a sessão. */
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
  ouvintesPerfil.forEach((l) => l(perfil)); // INTEGRAÇÃO: persistir perfil no backend
}

export function atualizarContato(parcial: Partial<PerfilUsuario['contato']>): void {
  atualizarPerfil({ contato: { ...estadoAtual.perfil.contato, ...parcial } });
}

export function definirStatusNotificacao(id: string, status: StatusNotificacao): void {
  const notificacoes = estadoAtual.notificacoes.map((n) => (n.id === id ? { ...n, status } : n));
  definirEstado({ ...estadoAtual, notificacoes });
  ouvintesNotificacoes.forEach((l) => l(notificacoes)); // INTEGRAÇÃO: persistir status no backend
}

/** Registra um ouvinte chamado a cada check-in salvo (ex.: enviar ao backend). Retorna a função para cancelar. */
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
 *   ansiedade (1–10), estresse (1–10), energia (1–10).
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
 *
 * Como enviar ao backend: use aoSalvarCheckin((registro) => api.post(...)).
 * Para carregar o histórico salvo: inicializarDadosEvolua({ checkins }).
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

/* =============================================================================
 * 5. PONTOS DE INTEGRAÇÃO COM O BACKEND
 * -----------------------------------------------------------------------------
 * Tudo aqui depende de servidor (autenticação, envio de códigos por e-mail/SMS,
 * validação da senha atual, sessão). Por segurança NADA é simulado: a
 * implementação padrão devolve { ok:false, naoConectado:true } e a tela avisa
 * o usuário. Para integrar, chame configurarServicosBackend({...}) com a
 * implementação real (ex.: no layout raiz).
 * ========================================================================== */

const MSG_NAO_CONECTADO = 'Esta ação depende de integração com o backend, que ainda não foi conectada.';

const servicosPadrao: ServicosBackend = {
  // BACKEND: gerar código, enviar ao NOVO e-mail/telefone, guardar com validade curta.
  solicitarCodigoAlteracaoContato: async () => ({ ok: false, naoConectado: true, mensagem: MSG_NAO_CONECTADO }),
  // BACKEND: comparar o código e aplicar a troca de contato na conta autenticada.
  confirmarAlteracaoContato: async () => ({ ok: false, naoConectado: true, mensagem: MSG_NAO_CONECTADO }),
  // BACKEND: validar a senha ATUAL, aplicar política de senha e gravar o hash da nova.
  alterarSenha: async () => ({ ok: false, naoConectado: true, mensagem: MSG_NAO_CONECTADO }),
  // BACKEND: enviar código de recuperação ao e-mail/telefone JÁ cadastrados.
  solicitarCodigoRecuperacao: async () => ({ ok: false, naoConectado: true, mensagem: MSG_NAO_CONECTADO }),
  // BACKEND: validar o código recebido e redefinir a senha.
  confirmarRecuperacaoSenha: async () => ({ ok: false, naoConectado: true, mensagem: MSG_NAO_CONECTADO }),
  // BACKEND: invalidar a sessão/token. Se ok, esta tela vai para /acesso/login.
  encerrarSessao: async () => ({ ok: false, naoConectado: true, mensagem: MSG_NAO_CONECTADO }),
};

let servicos: ServicosBackend = servicosPadrao;

/** Substitui os serviços padrão pela implementação real do backend. */
export function configurarServicosBackend(implementacao: ServicosBackend): void {
  servicos = implementacao;
}

/* =============================================================================
 * 6. FUNÇÕES AUXILIARES
 * ========================================================================== */

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "AAAA-MM-DD" no fuso local (não use toISOString, que é UTC). */
function dataLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatarDataNascimento(iso: string | null): string {
  if (!iso) return '00/00/0000';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Máscara DD/MM/AAAA enquanto o usuário digita. */
function mascararData(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

/** "DD/MM/AAAA" → "AAAA-MM-DD" ou null se a data não existir ou estiver no futuro. */
function dataBRparaISO(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const [, dd, mm, aa] = m;
  const d = new Date(Number(aa), Number(mm) - 1, Number(dd));
  if (d.getFullYear() !== Number(aa) || d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  if (d.getTime() > Date.now()) return null;
  return `${aa}-${mm}-${dd}`;
}

function formatarDataNotificacao(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fraseDoDia(hoje: Date = new Date()): string {
  const dia = Math.floor((hoje.getTime() - new Date(hoje.getFullYear(), 0, 0).getTime()) / 86400000);
  return FRASES_MOTIVACIONAIS[dia % FRASES_MOTIVACIONAIS.length];
}

const GENEROS: ReadonlyArray<{ valor: Genero; rotulo: string }> = [
  { valor: 'homem', rotulo: 'Homem' },
  { valor: 'mulher', rotulo: 'Mulher' },
  { valor: 'outro', rotulo: 'Outro' },
  { valor: 'nao_informar', rotulo: 'Prefiro não informar' },
];
const rotuloGenero = (g: Genero): string => GENEROS.find((x) => x.valor === g)?.rotulo ?? 'Prefiro não informar';

const emailValido = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const telefoneValido = (v: string): boolean => [10, 11].includes(v.replace(/\D/g, '').length);

const TAMANHO_MAX_FOTO = 5 * 1024 * 1024; // 5 MB

/* =============================================================================
 * 7. ROTAS DAS ATIVIDADES — PONTOS DE INTEGRAÇÃO COM OUTRAS PÁGINAS
 * -----------------------------------------------------------------------------
 * Os cartões de atividade da Home e do Perfil abrem a página de outro
 * colaborador. Quando a página existir, troque `null` pelo caminho dela
 * (ex.: '/principal/metas'). Enquanto for null, o toque mostra um aviso
 * "em breve" — o botão já está clicável e pronto.
 * ========================================================================== */

export type ChaveAtividade = 'checkinEmocional' | 'evolucaoPessoal' | 'questionarios' | 'exercicios' | 'metas';

export const ROTAS_ATIVIDADES: Record<ChaveAtividade, Href | null> = {
  checkinEmocional: null, // PERFIL → "Chek-in Emocional": ligar à página de histórico de check-ins
  evolucaoPessoal: null,  // HOME e PERFIL → "Evolução Pessoal": ligar à página de evolução pessoal
  questionarios: null,    // HOME ("Meus Questionários") e PERFIL ("Questionarios"): ligar à página de questionários
  exercicios: null,       // HOME ("Meus Exercícios") e PERFIL ("Exercícios"): ligar à página de exercícios
  metas: null,            // HOME ("Minhas Metas") e PERFIL ("Metas"): ligar à página de metas
};

function abrirAtividade(chave: ChaveAtividade): void {
  const rota = ROTAS_ATIVIDADES[chave];
  if (rota) router.navigate(rota);
  else Alert.alert('Em breve', 'Esta página ainda não foi conectada.');
}

/* Contexto local de navegação entre as telas internas (evita repassar props). */
const NavegacaoContext = createContext<{ irTela: (t: TelaInterna) => void }>({ irTela: () => {} });
const useNavegacao = () => useContext(NavegacaoContext);

/* =============================================================================
 * 8. COMPONENTES BASE
 * ========================================================================== */

/** Foto de perfil lida do estado compartilhado (ou avatar padrão preto). */
function Avatar({ tamanho }: { tamanho: number }) {
  const perfil = useEvolua((e) => e.perfil);
  if (perfil.fotoUrl) {
    return (
      <Image
        source={{ uri: perfil.fotoUrl }}
        style={{ width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: '#000' }}
        contentFit="cover"
        accessibilityLabel={`Foto de perfil de ${perfil.apelido}`}
      />
    );
  }
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 100 100" accessibilityLabel="Foto de perfil padrão">
      <Circle cx={50} cy={50} r={50} fill="#000" />
      <Circle cx={50} cy={38} r={15} fill="#fff" />
      <Path d="M18 88c4-20 18-28 32-28s28 8 32 28a50 50 0 0 1-64 0z" fill="#fff" />
    </Svg>
  );
}

interface PropsCabecalho {
  titulo: string;
  subtitulo?: string;
  mostrarFoto?: boolean;      // foto à esquerda → Meu Perfil
  mostrarEngrenagem?: boolean; // → Configurações
  mostrarCarta?: boolean;      // → Notificações (com contador de não lidas)
}

/** Cabeçalho das telas: título sempre centralizado; ícones levam às respectivas telas. */
function Cabecalho({ titulo, subtitulo, mostrarFoto, mostrarEngrenagem = true, mostrarCarta }: PropsCabecalho) {
  const { irTela } = useNavegacao();
  const naoLidas = useEvolua((e) => e.notificacoes).filter((n) => n.status === 'nao_lida').length;
  return (
    <View style={estilos.cabecalho}>
      <View style={estilos.cabLado}>
        {mostrarFoto && (
          <Pressable onPress={() => irTela('perfil')} accessibilityRole="button" accessibilityLabel="Abrir Meu Perfil">
            <Avatar tamanho={64} />
          </Pressable>
        )}
      </View>
      <View style={estilos.cabCentro}>
        <Text style={estilos.titulo} accessibilityRole="header">{titulo}</Text>
        {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
      </View>
      <View style={[estilos.cabLado, estilos.cabLadoDir]}>
        {mostrarEngrenagem && (
          <Pressable style={estilos.iconeBtn} onPress={() => irTela('configuracoes')} accessibilityRole="button" accessibilityLabel="Abrir Configurações">
            <Ionicons name="settings-sharp" size={30} color="#000" />
          </Pressable>
        )}
        {mostrarCarta && (
          <Pressable
            style={estilos.iconeBtn}
            onPress={() => irTela('notificacoes')}
            accessibilityRole="button"
            accessibilityLabel={naoLidas > 0 ? `Abrir Notificações, ${naoLidas} não lidas` : 'Abrir Notificações'}
          >
            <Ionicons name="mail-outline" size={34} color="#000" />
            {naoLidas > 0 && (
              <View style={estilos.selo}><Text style={estilos.seloTexto}>{naoLidas}</Text></View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * ===========================================================================
 * MENU INFERIOR (aba retangular azul com 5 botões)
 *
 * Cada botão leva a uma parte do app e já está codificado para ser clicado.
 * Os comentários "BOTÃO ..." abaixo identificam cada um para os colaboradores.
 *
 * Props:
 *   ativo              → qual botão aparece selecionado ('home', 'evolua', ...). null = nenhum.
 *   aoPressionarHome   → opcional. Dentro de home.tsx volta para a tela Home interna;
 *                        nas demais telas, deixe vazio para navegar até /principal/home.
 * ===========================================================================
 */
export type ItemMenu = 'home' | 'evolua' | 'chat' | 'progresso' | 'saibaMais';

export function MenuInferior({ ativo = null, aoPressionarHome }: { ativo?: ItemMenu | null; aoPressionarHome?: () => void }) {
  const insets = useSafeAreaInsets();

  /** Item do menu: ícone cinza (azul claro quando selecionado) + rótulo. */
  const Item = ({ id, rotulo, icone, aoPressionar }: { id: ItemMenu; rotulo: string; icone: React.ComponentProps<typeof Ionicons>['name']; aoPressionar: () => void }) => {
    const selecionado = ativo === id;
    return (
      <Pressable
        style={[estilos.menuBotao, selecionado && estilos.menuBotaoAtivo]}
        onPress={aoPressionar}
        accessibilityRole="button"
        accessibilityState={{ selected: selecionado }}
        accessibilityLabel={rotulo}
      >
        <Ionicons name={icone} size={34} color={selecionado ? '#5CB2FF' : '#6D6D6D'} />
        <Text style={[estilos.menuRotulo, selecionado && { fontWeight: '700' }]} numberOfLines={1}>{rotulo}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[estilos.menu, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      {/* BOTÃO HOME: volta à página inicial (/principal/home). Já implementado neste arquivo. */}
      <Item id="home" rotulo="Home" icone="home" aoPressionar={aoPressionarHome ?? (() => router.navigate('/principal/home' as Href))} />
      {/* BOTÃO EVOLUA: abre /principal/evolua. A página (src/app/principal/evolua.tsx) é de outro colaborador. */}
      <Item id="evolua" rotulo="Evolua" icone="moon" aoPressionar={() => router.navigate('/principal/evolua' as Href)} />
      {/* BOTÃO CHAT: abre /principal/chat. A página (chat.tsx) é de outro colaborador. */}
      <Item id="chat" rotulo="Chat" icone="chatbubbles" aoPressionar={() => router.navigate('/principal/chat' as Href)} />
      {/* BOTÃO PROGRESSO: abre /principal/progresso. A página (progresso.tsx) é de outro colaborador. */}
      <Item id="progresso" rotulo="Progresso" icone="stats-chart" aoPressionar={() => router.navigate('/principal/progresso' as Href)} />
      {/* BOTÃO SAIBA +: abre /principal/saiba-mais. A página (saiba-mais.tsx) é de outro colaborador. */}
      <Item id="saibaMais" rotulo="Saiba +" icone="bulb" aoPressionar={() => router.navigate('/principal/saiba-mais' as Href)} />
    </View>
  );
}

/* =============================================================================
 * 9. DESLIZADOR DISCRETO
 * -----------------------------------------------------------------------------
 * Controle arrastável com N posições fixas. A bolinha NUNCA para entre dois
 * pontos: ela sempre encaixa no centro de um dos N segmentos iguais.
 *   - Emoção: N = 5 (cada segmento fica sob um rosto).
 *   - Ansiedade / Estresse / Energia: N = 10 (valores 1 a 10).
 * `indice` vai de 0 a N-1; null = ainda não escolhido (bolinha opaca no meio).
 * ========================================================================== */

interface PropsDeslizador {
  quantidade: number;
  indice: number | null;
  onChange: (indice: number) => void;
  trilha: React.ReactNode;      // desenho da barra (ocupa toda a largura)
  rotulo: string;               // texto de acessibilidade
  textoValor: (indice: number | null) => string;
}

const TAMANHO_BOLINHA = 38;

function DeslizadorDiscreto({ quantidade, indice, onChange, trilha, rotulo, textoValor }: PropsDeslizador) {
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
    Animated.timing(posX, { toValue: centro - TAMANHO_BOLINHA / 2, duration: 120, useNativeDriver: true }).start();
  }, [indice, largura, quantidade, posX]);

  const aoMedir = (e: LayoutChangeEvent) => {
    larguraRef.current = e.nativeEvent.layout.width;
    setLargura(e.nativeEvent.layout.width);
  };

  return (
    <View
      {...pan.panHandlers}
      onLayout={aoMedir}
      style={estilos.deslizador}
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
 * 10. CHECK-IN EMOCIONAL
 * ========================================================================== */

/** Rostinhos do check-in (SVG). Cada rosto usa a cor da sua emoção. */
function RostoEmocao({ chave, cor, tamanho }: { chave: EmocaoChave; cor: string; tamanho: number }) {
  const tr = { stroke: CORES.azulMarinho, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 80 80">
      <Circle cx={40} cy={40} r={39} fill={cor} />
      {chave === 'muito_feliz' && (
        <>
          <Path d="M20 31q5-7 10 0M50 31q5-7 10 0" {...tr} />
          <Path d="M20 46h40a20 18 0 0 1-40 0z" fill={CORES.azulMarinho} />
        </>
      )}
      {chave === 'feliz' && (
        <>
          <Circle cx={29} cy={32} r={3.5} fill={CORES.azulMarinho} />
          <Circle cx={51} cy={32} r={3.5} fill={CORES.azulMarinho} />
          <Path d="M26 48q14 12 28 0" {...tr} />
        </>
      )}
      {chave === 'neutro' && (
        <>
          <Circle cx={29} cy={32} r={3.5} fill={CORES.azulMarinho} />
          <Circle cx={51} cy={32} r={3.5} fill={CORES.azulMarinho} />
          <Path d="M27 52h26" {...tr} />
        </>
      )}
      {chave === 'triste' && (
        <>
          <Circle cx={29} cy={32} r={3.5} fill={CORES.azulMarinho} />
          <Circle cx={51} cy={32} r={3.5} fill={CORES.azulMarinho} />
          <Path d="M26 56q14-12 28 0" {...tr} />
        </>
      )}
      {chave === 'muito_triste' && (
        <>
          <Path d="M23 26l9 9M32 26l-9 9M48 26l9 9M57 26l-9 9" {...tr} strokeWidth={3.4} />
          <Path d="M28 60a12 13 0 0 1 24 0z" fill={CORES.azulMarinho} />
        </>
      )}
    </Svg>
  );
}

/** Bloco de um controle numérico (Ansiedade, Estresse ou Energia), valores 1 a 10 em 10 pontos fixos. */
function EscalaNumerica({ rotulo, valor, onChange }: { rotulo: string; valor: number | null; onChange: (v: number) => void }) {
  return (
    <View style={estilos.escalaNum}>
      <View style={estilos.escalaNumLinha}>
        <Text style={estilos.escalaNumRotulo}>{rotulo}</Text>
        <Text style={estilos.escalaNumValor} accessibilityLiveRegion="polite">{valor ?? '-'} /10</Text>
      </View>
      <DeslizadorDiscreto
        quantidade={10}
        indice={valor === null ? null : valor - 1}
        onChange={(i) => onChange(i + 1)}
        rotulo={rotulo}
        textoValor={(i) => (i === null ? 'Não escolhido' : `${i + 1} de 10`)}
        trilha={<View style={estilos.trilhaNumerica} />}
      />
    </View>
  );
}

/** Cartão "Como está se sentindo hoje?". */
function CheckinEmocional() {
  const [indiceEmocao, setIndiceEmocao] = useState<number | null>(null);
  const [ansiedade, setAnsiedade] = useState<number | null>(null);
  const [estresse, setEstresse] = useState<number | null>(null);
  const [energia, setEnergia] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

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
    <View style={estilos.cartao}>
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
              <View style={[estilos.emocaoAnel, selecionada && estilos.emocaoAnelAtivo]}>
                <RostoEmocao chave={e.chave} cor={e.cor} tamanho={50} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Barra de emoção: cada segmento tem a MESMA cor do rosto acima dele. */}
      <View style={estilos.emocaoBarraLinha}>
        <Text style={[estilos.sinal, { color: CORES.roxoVibrante }]}>+</Text>
        <View style={{ flex: 1 }}>
          <DeslizadorDiscreto
            quantidade={5}
            indice={indiceEmocao}
            onChange={setIndiceEmocao}
            rotulo="Indicador de emoção"
            textoValor={(i) => (i === null ? 'Nenhuma emoção selecionada' : EMOCOES[i].rotulo)}
            trilha={
              <View style={estilos.faixaEmocao}>
                {EMOCOES.map((e) => (<View key={e.chave} style={{ flex: 1, backgroundColor: e.cor }} />))}
              </View>
            }
          />
        </View>
        <Text style={[estilos.sinal, { color: CORES.turquesa }]}>–</Text>
      </View>

      <EscalaNumerica rotulo="Ansiedade" valor={ansiedade} onChange={setAnsiedade} />
      <EscalaNumerica rotulo="Estresse" valor={estresse} onChange={setEstresse} />
      <EscalaNumerica rotulo="Energia" valor={energia} onChange={setEnergia} />

      <Pressable style={estilos.btnPrimario} onPress={salvar} accessibilityRole="button">
        <Text style={estilos.btnPrimarioTexto}>Salvar o meu dia</Text>
      </Pressable>
      {aviso && (
        <Text style={[estilos.aviso, aviso.tipo === 'ok' ? estilos.avisoOk : estilos.avisoErro]} accessibilityLiveRegion="polite">
          {aviso.texto}
        </Text>
      )}
    </View>
  );
}

/* =============================================================================
 * 11. TELA HOME
 * ========================================================================== */

const ATIVIDADES_HOME: ReadonlyArray<{ chave: ChaveAtividade; titulo: string; fundo: string; texto: string }> = [
  { chave: 'evolucaoPessoal', titulo: 'Evolução Pessoal', fundo: CORES.azulEvolua, texto: CORES.branco },
  { chave: 'questionarios', titulo: 'Meus Questionários', fundo: CORES.azulCeu, texto: CORES.azulMarinho },
  { chave: 'metas', titulo: 'Minhas Metas', fundo: CORES.verdeAgua, texto: CORES.branco },
  { chave: 'exercicios', titulo: 'Meus Exercícios', fundo: CORES.lavanda, texto: CORES.azulMarinho },
];

/**
 * Carrossel horizontal de atividades. As bordas têm FADE (degradê para o branco
 * do cartão): os cartões ficam "transparentes" ao sair da área visível. O botão
 * circular indica que há mais atividades e rola a lista ao ser tocado.
 */
function CarrosselAtividades() {
  const scrollRef = useRef<ScrollView>(null);
  const deslocamento = useRef(0);
  const [posicao, setPosicao] = useState<'inicio' | 'meio' | 'fim'>('inicio');
  const medidas = useRef({ visivel: 0, conteudo: 0 });

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
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={aoRolar}
        onLayout={(e) => { medidas.current.visivel = e.nativeEvent.layout.width; recalcular(deslocamento.current); }}
        onContentSizeChange={(w) => { medidas.current.conteudo = w; recalcular(deslocamento.current); }}
        contentContainerStyle={{ gap: 10, paddingRight: 8 }}
      >
        {ATIVIDADES_HOME.map((a) => (
          // PONTO DE INTEGRAÇÃO: o destino de cada cartão é definido em ROTAS_ATIVIDADES (seção 7).
          <Pressable
            key={a.chave}
            style={[estilos.atividade, { backgroundColor: a.fundo }]}
            onPress={() => abrirAtividade(a.chave)}
            accessibilityRole="button"
            accessibilityLabel={a.titulo}
          >
            <Text style={[estilos.atividadeTexto, { color: a.texto }]}>{a.titulo}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Fade da direita (há mais atividades) e da esquerda (já rolou). */}
      {posicao !== 'fim' && (
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0)', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[estilos.fade, { right: 0 }]} />
      )}
      {posicao !== 'inicio' && (
        <LinearGradient pointerEvents="none" colors={['#FFFFFF', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[estilos.fade, { left: 0 }]} />
      )}
      {posicao !== 'fim' && (
        <Pressable
          style={estilos.setaCarrossel}
          onPress={() => scrollRef.current?.scrollTo({ x: deslocamento.current + 120, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Ver mais atividades"
        >
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

function TelaHome() {
  const apelido = useEvolua((e) => e.perfil.apelido);
  const frase = useMemo(() => fraseDoDia(), []);
  return (
    <>
      <Cabecalho titulo="Home" mostrarFoto mostrarEngrenagem mostrarCarta />
      <View style={estilos.cartao}>
        {/* O apelido vem do store: mudou nas Configurações, muda aqui. */}
        <Text style={estilos.saudacao}>Olá, {apelido}!</Text>
        <Text style={estilos.frase}>{frase}</Text>
        <Text style={estilos.secaoTitulo}>Suas atividades:</Text>
        <CarrosselAtividades />
      </View>
      <CheckinEmocional />
    </>
  );
}

/* =============================================================================
 * 12. TELA MEU PERFIL
 * ========================================================================== */

function CartaoAtividadePerfil({ chave, titulo, fundo, estiloExtra, children }: { chave: ChaveAtividade; titulo: string; fundo: string; estiloExtra?: object; children?: React.ReactNode }) {
  return (
    <Pressable style={[estilos.cartaoPerfil, { backgroundColor: fundo }, estiloExtra]} onPress={() => abrirAtividade(chave)} accessibilityRole="button" accessibilityLabel={titulo}>
      <Text style={estilos.cartaoPerfilTexto}>{titulo}</Text>
      {children}
    </Pressable>
  );
}

function TelaPerfil() {
  const perfil = useEvolua((e) => e.perfil);
  return (
    <>
      <Cabecalho titulo="Meu Perfil" mostrarEngrenagem mostrarCarta />

      <View style={estilos.cartao}>
        <View style={estilos.perfilBanner}>
          <View style={estilos.perfilFoto}><Avatar tamanho={110} /></View>
        </View>
        {/* Nome, sobrenome e apelido vêm do store (editados nas Configurações). */}
        <Text style={estilos.perfilNome}>{perfil.nome} {perfil.sobrenome}</Text>
        <Text style={estilos.perfilApelido}>{perfil.apelido}</Text>
        <Text style={estilos.perfilBioRotulo}>Biografia:</Text>
        <TextInput
          style={estilos.perfilBio}
          placeholder="Apresente-se aqui!"
          placeholderTextColor={CORES.cinzaAzulado}
          multiline
          maxLength={500}
          textAlignVertical="top"
          value={perfil.biografia}
          onChangeText={(t) => atualizarPerfil({ biografia: t })}
          accessibilityLabel="Biografia"
        />
      </View>

      <View style={estilos.cartao}>
        <Text style={[estilos.secaoTitulo, { fontSize: 26 }]}>Suas Atividades aparecerão aqui</Text>
        {/*
         * BLOCOS DE ATIVIDADES DO PERFIL (para os demais colaboradores):
         *  - "Chek-in Emocional": histórico dos check-ins → ligar a ROTAS_ATIVIDADES.checkinEmocional
         *  - "Evolução Pessoal"  → ROTAS_ATIVIDADES.evolucaoPessoal
         *  - "Questionarios"     → ROTAS_ATIVIDADES.questionarios
         *  - "Exercícios"        → ROTAS_ATIVIDADES.exercicios
         *  - "Metas"             → ROTAS_ATIVIDADES.metas
         * Todos já são clicáveis; basta preencher os caminhos na seção 7.
         */}
        <View style={estilos.perfilGrade}>
          <View style={{ flex: 1, gap: 12 }}>
            <CartaoAtividadePerfil chave="checkinEmocional" titulo="Chek-in Emocional" fundo={CORES.rosaVibrante} />
            <CartaoAtividadePerfil chave="questionarios" titulo="Questionarios" fundo={CORES.turquesa} />
          </View>
          <View style={{ flex: 1, gap: 12 }}>
            <CartaoAtividadePerfil chave="evolucaoPessoal" titulo="Evolução Pessoal" fundo={CORES.azulProfundo} />
            <CartaoAtividadePerfil chave="exercicios" titulo="Exercícios" fundo={CORES.laranja} />
          </View>
          <View style={{ flex: 0.8 }}>
            <CartaoAtividadePerfil chave="metas" titulo="Metas" fundo={CORES.verdeMenta} estiloExtra={{ flex: 1, justifyContent: 'space-between', height: undefined }}>
              <View style={estilos.metasBarras}>
                <View style={[estilos.metasBarra, { height: '45%' }]} />
                <View style={[estilos.metasBarra, { height: '70%' }]} />
                <View style={[estilos.metasBarra, { height: '100%' }]} />
              </View>
            </CartaoAtividadePerfil>
          </View>
        </View>
        {/* Indicador "..." do design (apenas visual: sinaliza que a seção é extensível). */}
        <View style={estilos.maisIndicador}><Text style={estilos.maisTexto}>. . .</Text></View>
      </View>
    </>
  );
}

/* =============================================================================
 * 13. TELA CONFIGURAÇÕES
 * -----------------------------------------------------------------------------
 * Cada linha abre um painel (um por vez). Mudanças de perfil passam por
 * atualizarPerfil/atualizarContato e refletem em todas as telas.
 * O que depende de backend usa `servicos` (seção 5) e é sinalizado na tela.
 * Nada de segurança é simulado.
 * ========================================================================== */

type SecaoConfig = 'foto' | 'nome' | 'apelido' | 'nascimento' | 'genero' | 'telefone' | 'email' | 'senha';
type AvisoConfig = { tipo: 'ok' | 'erro' | 'info'; texto: string };
type OnAviso = (a: AvisoConfig) => void;

function LinhaConfig({ rotulo, valor, aberta, onAlternar, children }: { rotulo: string; valor: React.ReactNode; aberta: boolean; onAlternar: () => void; children: React.ReactNode }) {
  return (
    <View style={estilos.linha}>
      <Pressable style={estilos.linhaCabeca} onPress={onAlternar} accessibilityRole="button" accessibilityState={{ expanded: aberta }} accessibilityLabel={rotulo}>
        <Text style={estilos.linhaRotulo}>{rotulo}</Text>
        <View style={estilos.linhaValorBox}>
          {typeof valor === 'string' ? <Text style={estilos.linhaValor} numberOfLines={1}>{valor}</Text> : valor}
        </View>
        <View style={[estilos.seta, aberta && { transform: [{ rotate: '90deg' }] }]}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </View>
      </Pressable>
      {aberta && <View style={estilos.linhaPainel}>{children}</View>}
    </View>
  );
}

function Campo({ rotulo, ...props }: { rotulo: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 10, flex: 1 }}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      <TextInput style={estilos.campo} placeholderTextColor={CORES.cinzaAzulado} accessibilityLabel={rotulo} {...props} />
    </View>
  );
}

function BotaoConfirmar({ texto, onPress, desabilitado }: { texto: string; onPress: () => void; desabilitado?: boolean }) {
  return (
    <Pressable style={[estilos.btnConfirmar, desabilitado && { opacity: 0.5 }]} onPress={onPress} disabled={desabilitado} accessibilityRole="button">
      <Text style={estilos.btnConfirmarTexto}>{texto}</Text>
    </Pressable>
  );
}
function BotaoSecundario({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Pressable style={estilos.btnSecundario} onPress={onPress} accessibilityRole="button">
      <Text style={estilos.btnSecundarioTexto}>{texto}</Text>
    </Pressable>
  );
}
const AvisoBackend = ({ texto }: { texto: string }) => (
  <Text style={estilos.dependencia}>Depende do backend: {texto}</Text>
);

/**
 * Painel da FOTO: escolher imagem da galeria do celular ou, na versão web, do
 * computador (o mesmo seletor abre o explorador de arquivos) e ARRASTAR E SOLTAR
 * (somente web). Atualiza Home, Perfil e Notificações via atualizarPerfil.
 * INTEGRAÇÃO: para guardar a foto no servidor, envie `fotoUrl` ao storage do
 * backend (use aoMudarPerfil) e troque pela URL final.
 */
function PainelFoto({ onAviso }: { onAviso: OnAviso }) {
  const [arrastando, setArrastando] = useState(false);

  const aplicarUri = (uri: string, tamanho?: number) => {
    if (tamanho && tamanho > TAMANHO_MAX_FOTO) { onAviso({ tipo: 'erro', texto: 'A imagem é grande demais. O limite é 5 MB.' }); return; }
    atualizarPerfil({ fotoUrl: uri });
    onAviso({ tipo: 'ok', texto: 'Foto de perfil atualizada.' });
  };

  const escolher = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!r.canceled && r.assets[0]) aplicarUri(r.assets[0].uri, r.assets[0].fileSize);
    } catch {
      onAviso({ tipo: 'erro', texto: 'Não foi possível abrir a galeria.' });
    }
  };

  // Arrastar e soltar: só existe na web. Usa um <div> do react-dom (disponível via react-native-web).
  const aoSoltarWeb = (ev: any) => {
    ev.preventDefault();
    setArrastando(false);
    const arquivo: File | undefined = ev.dataTransfer?.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) { onAviso({ tipo: 'erro', texto: 'Solte um arquivo de imagem.' }); return; }
    aplicarUri(URL.createObjectURL(arquivo), arquivo.size);
  };

  return (
    <View>
      {Platform.OS === 'web' &&
        React.createElement(
          'div',
          {
            onDragOver: (ev: any) => { ev.preventDefault(); setArrastando(true); },
            onDragLeave: () => setArrastando(false),
            onDrop: aoSoltarWeb,
            style: {
              border: `2px dashed ${arrastando ? CORES.azulEvolua : CORES.cinzaAzulado}`,
              borderRadius: 14, padding: 18, textAlign: 'center', marginBottom: 12,
              background: arrastando ? CORES.azulGelo : 'transparent', fontFamily: FONTES.texto,
            },
          },
          'Arraste uma imagem para cá',
        )}
      <BotaoSecundario texto="Escolher da galeria ou do computador" onPress={escolher} />
    </View>
  );
}

function PainelNome({ onAviso }: { onAviso: OnAviso }) {
  const perfil = useEvolua((e) => e.perfil);
  const [nome, setNome] = useState(perfil.nome);
  const [sobrenome, setSobrenome] = useState(perfil.sobrenome);
  return (
    <View>
      <Text style={estilos.painelTitulo}>Insira seus dados:</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="given-name" />
        <Campo rotulo="Sobrenome" value={sobrenome} onChangeText={setSobrenome} autoComplete="family-name" />
      </View>
      <BotaoConfirmar texto="Salvar" onPress={() => {
        if (!nome.trim()) { onAviso({ tipo: 'erro', texto: 'Informe o nome.' }); return; }
        atualizarPerfil({ nome: nome.trim(), sobrenome: sobrenome.trim() });
        onAviso({ tipo: 'ok', texto: 'Nome atualizado.' });
      }} />
    </View>
  );
}

function PainelApelido({ onAviso }: { onAviso: OnAviso }) {
  const perfil = useEvolua((e) => e.perfil);
  const [apelido, setApelido] = useState(perfil.apelido);
  return (
    <View>
      <Text style={estilos.painelTitulo}>Insira seu apelido:</Text>
      <Campo rotulo="Apelido" value={apelido} onChangeText={setApelido} maxLength={30} />
      <BotaoConfirmar texto="Salvar" onPress={() => {
        if (!apelido.trim()) { onAviso({ tipo: 'erro', texto: 'Informe um apelido.' }); return; }
        atualizarPerfil({ apelido: apelido.trim() }); // atualiza a saudação da Home
        onAviso({ tipo: 'ok', texto: 'Apelido atualizado.' });
      }} />
    </View>
  );
}

function PainelNascimento({ onAviso }: { onAviso: OnAviso }) {
  const perfil = useEvolua((e) => e.perfil);
  const [data, setData] = useState(perfil.dataNascimento ? formatarDataNascimento(perfil.dataNascimento) : '');
  return (
    <View>
      <Text style={estilos.painelTitulo}>Insira sua data de nascimento:</Text>
      <Campo rotulo="Data de nascimento" value={data} onChangeText={(t) => setData(mascararData(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" maxLength={10} />
      <BotaoConfirmar texto="Salvar" onPress={() => {
        if (!data) { atualizarPerfil({ dataNascimento: null }); onAviso({ tipo: 'ok', texto: 'Data removida.' }); return; }
        const iso = dataBRparaISO(data);
        if (!iso) { onAviso({ tipo: 'erro', texto: 'Informe uma data válida, que não esteja no futuro.' }); return; }
        atualizarPerfil({ dataNascimento: iso });
        onAviso({ tipo: 'ok', texto: 'Data de nascimento atualizada.' });
      }} />
    </View>
  );
}

function PainelGenero({ onAviso }: { onAviso: OnAviso }) {
  const genero = useEvolua((e) => e.perfil.genero);
  return (
    <View accessibilityRole="radiogroup">
      {GENEROS.map((g) => (
        <Pressable
          key={g.valor}
          style={estilos.opcao}
          onPress={() => { atualizarPerfil({ genero: g.valor }); onAviso({ tipo: 'ok', texto: 'Gênero atualizado.' }); }}
          accessibilityRole="radio"
          accessibilityState={{ checked: genero === g.valor }}
        >
          <View style={estilos.radio}>{genero === g.valor && <View style={estilos.radioMiolo} />}</View>
          <Text style={estilos.opcaoTexto}>{g.rotulo}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Alteração de e-mail ou telefone em duas etapas:
 *  1) o usuário digita o novo valor → aviso de que um código de confirmação será enviado;
 *  2) o usuário digita o código recebido para efetivar a alteração.
 * As duas etapas dependem do backend; o contato só muda se o serviço confirmar.
 */
function PainelContato({ tipo, onAviso }: { tipo: 'email' | 'telefone'; onAviso: OnAviso }) {
  const [novoValor, setNovoValor] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'informar' | 'codigo'>('informar');
  const [ocupado, setOcupado] = useState(false);
  const nome = tipo === 'email' ? 'e-mail' : 'telefone';

  const solicitar = async () => {
    const valido = tipo === 'email' ? emailValido(novoValor) : telefoneValido(novoValor);
    if (!valido) { onAviso({ tipo: 'erro', texto: tipo === 'email' ? 'Informe um e-mail válido.' : 'Informe um telefone com DDD.' }); return; }
    setOcupado(true);
    const r = await servicos.solicitarCodigoAlteracaoContato({ tipo, novoValor: novoValor.trim() });
    setOcupado(false);
    if (r.ok) { setEtapa('codigo'); onAviso({ tipo: 'info', texto: r.mensagem ?? `Enviamos um código de confirmação para o novo ${nome}.` }); }
    else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível solicitar o código.' });
  };

  const confirmar = async () => {
    if (!codigo.trim()) { onAviso({ tipo: 'erro', texto: 'Digite o código recebido.' }); return; }
    setOcupado(true);
    const r = await servicos.confirmarAlteracaoContato({ tipo, novoValor: novoValor.trim(), codigo: codigo.trim() });
    setOcupado(false);
    if (r.ok) {
      atualizarContato(tipo === 'email' ? { email: novoValor.trim() } : { telefone: novoValor.trim() });
      setNovoValor(''); setCodigo(''); setEtapa('informar');
      onAviso({ tipo: 'ok', texto: `${tipo === 'email' ? 'E-mail' : 'Telefone'} atualizado.` });
    } else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Código inválido.' });
  };

  return (
    <View>
      <AvisoBackend texto="o envio e a validação do código de confirmação são feitos pelo servidor." />
      <Campo
        rotulo={`Novo ${nome}`}
        value={novoValor}
        onChangeText={setNovoValor}
        editable={etapa === 'informar'}
        keyboardType={tipo === 'email' ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
      />
      {etapa === 'informar' ? (
        <>
          <Text style={estilos.painelTexto}>Será enviado um código de confirmação para o novo {nome}.</Text>
          <BotaoConfirmar texto="Enviar código" onPress={solicitar} desabilitado={ocupado} />
        </>
      ) : (
        <>
          <Campo rotulo="Código de confirmação" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" />
          <BotaoConfirmar texto="Confirmar" onPress={confirmar} desabilitado={ocupado} />
          <BotaoSecundario texto="Cancelar" onPress={() => { setEtapa('informar'); setCodigo(''); }} />
        </>
      )}
    </View>
  );
}

/**
 * Alteração de senha. Fluxo:
 *  - Modo "alterar": senha atual + nova + confirmação. O SERVIDOR valida a senha atual;
 *    se estiver correta a troca é feita. Se o usuário não lembra, usa "Esqueci minha senha".
 *  - Modo "recuperar": escolhe receber o código por e-mail ou telefone → digita o código
 *    → define a nova senha.
 * Senhas ficam só em estados locais do componente e vão direto ao backend;
 * NUNCA entram no store compartilhado.
 * (As telas /acesso/recuperar-senha e /acesso/redefinir-senha, do login, são outro fluxo — sem usuário logado.)
 */
function PainelSenha({ onAviso }: { onAviso: OnAviso }) {
  const [modo, setModo] = useState<'alterar' | 'recuperar'>('alterar');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [canal, setCanal] = useState<'email' | 'telefone'>('email');
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const validarNova = (): boolean => {
    if (novaSenha.length < 8) { onAviso({ tipo: 'erro', texto: 'A nova senha precisa ter ao menos 8 caracteres.' }); return false; }
    if (novaSenha !== confirmacao) { onAviso({ tipo: 'erro', texto: 'A confirmação não é igual à nova senha.' }); return false; }
    return true;
  };
  const limpar = () => { setSenhaAtual(''); setNovaSenha(''); setConfirmacao(''); setCodigo(''); setCodigoEnviado(false); };

  const alterar = async () => {
    if (!senhaAtual) { onAviso({ tipo: 'erro', texto: 'Informe a senha atual.' }); return; }
    if (!validarNova()) return;
    setOcupado(true);
    const r = await servicos.alterarSenha({ senhaAtual, novaSenha });
    setOcupado(false);
    if (r.ok) { limpar(); onAviso({ tipo: 'ok', texto: 'Senha alterada.' }); }
    else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível alterar a senha. Confira a senha atual.' });
  };

  const enviarCodigo = async () => {
    setOcupado(true);
    const r = await servicos.solicitarCodigoRecuperacao({ canal });
    setOcupado(false);
    if (r.ok) { setCodigoEnviado(true); onAviso({ tipo: 'info', texto: r.mensagem ?? 'Código enviado.' }); }
    else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível enviar o código.' });
  };

  const redefinir = async () => {
    if (!codigo.trim()) { onAviso({ tipo: 'erro', texto: 'Digite o código recebido.' }); return; }
    if (!validarNova()) return;
    setOcupado(true);
    const r = await servicos.confirmarRecuperacaoSenha({ codigo: codigo.trim(), novaSenha });
    setOcupado(false);
    if (r.ok) { limpar(); setModo('alterar'); onAviso({ tipo: 'ok', texto: 'Senha redefinida.' }); }
    else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível redefinir a senha.' });
  };

  return (
    <View>
      <AvisoBackend texto="a validação da senha e o envio de códigos são feitos pelo servidor." />
      {modo === 'alterar' ? (
        <>
          <Campo rotulo="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry autoCapitalize="none" autoComplete="current-password" />
          <Campo rotulo="Nova senha" value={novaSenha} onChangeText={setNovaSenha} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
          <Campo rotulo="Confirme a nova senha" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
          <BotaoConfirmar texto="Alterar senha" onPress={alterar} desabilitado={ocupado} />
          <BotaoSecundario texto="Esqueci minha senha" onPress={() => { limpar(); setModo('recuperar'); }} />
        </>
      ) : (
        <>
          <Text style={estilos.painelTitulo}>Receber o código por:</Text>
          {(['email', 'telefone'] as const).map((c) => (
            <Pressable key={c} style={estilos.opcao} onPress={() => !codigoEnviado && setCanal(c)} accessibilityRole="radio" accessibilityState={{ checked: canal === c, disabled: codigoEnviado }}>
              <View style={estilos.radio}>{canal === c && <View style={estilos.radioMiolo} />}</View>
              <Text style={estilos.opcaoTexto}>{c === 'email' ? 'E-mail' : 'Telefone'}</Text>
            </Pressable>
          ))}
          {!codigoEnviado ? (
            <BotaoConfirmar texto="Enviar código" onPress={enviarCodigo} desabilitado={ocupado} />
          ) : (
            <>
              <Campo rotulo="Código recebido" value={codigo} onChangeText={setCodigo} keyboardType="number-pad" />
              <Campo rotulo="Nova senha" value={novaSenha} onChangeText={setNovaSenha} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
              <Campo rotulo="Confirme a nova senha" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
              <BotaoConfirmar texto="Redefinir senha" onPress={redefinir} desabilitado={ocupado} />
            </>
          )}
          <BotaoSecundario texto="Voltar" onPress={() => { limpar(); setModo('alterar'); }} />
        </>
      )}
    </View>
  );
}

function TelaConfiguracoes() {
  const perfil = useEvolua((e) => e.perfil);
  const [secao, setSecao] = useState<SecaoConfig | null>(null);
  const [aviso, setAviso] = useState<AvisoConfig | null>(null);
  const alternar = (s: SecaoConfig) => { setSecao((a) => (a === s ? null : s)); setAviso(null); };
  const props = (s: SecaoConfig) => ({ aberta: secao === s, onAlternar: () => alternar(s) });

  /** Logout: depende do backend. Só sai (vai ao login) se o serviço confirmar. */
  const sair = async () => {
    const r = await servicos.encerrarSessao();
    if (r.ok) router.replace('/acesso/login' as Href);
    else setAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível encerrar a sessão.' });
  };

  return (
    <>
      <Cabecalho titulo="Configurações" mostrarEngrenagem mostrarCarta />
      {aviso && (
        <Text style={[estilos.aviso, aviso.tipo === 'ok' ? estilos.avisoOk : aviso.tipo === 'erro' ? estilos.avisoErro : estilos.avisoInfo, { marginBottom: 12 }]} accessibilityLiveRegion="polite">
          {aviso.texto}
        </Text>
      )}
      <LinhaConfig {...props('foto')} rotulo="Foto" valor={<View style={{ alignItems: 'flex-end' }}><Avatar tamanho={60} /></View>}><PainelFoto onAviso={setAviso} /></LinhaConfig>
      <LinhaConfig {...props('nome')} rotulo="Nome" valor={`${perfil.nome} ${perfil.sobrenome}`.trim()}><PainelNome onAviso={setAviso} /></LinhaConfig>
      <LinhaConfig {...props('apelido')} rotulo="Apelido" valor={perfil.apelido}><PainelApelido onAviso={setAviso} /></LinhaConfig>
      <LinhaConfig {...props('nascimento')} rotulo="Data de Nascimento" valor={formatarDataNascimento(perfil.dataNascimento)}><PainelNascimento onAviso={setAviso} /></LinhaConfig>
      <LinhaConfig {...props('genero')} rotulo="Gênero" valor={rotuloGenero(perfil.genero)}><PainelGenero onAviso={setAviso} /></LinhaConfig>
      <LinhaConfig {...props('telefone')} rotulo="Telefone" valor={perfil.contato.telefone}><PainelContato tipo="telefone" onAviso={setAviso} /></LinhaConfig>
      <LinhaConfig {...props('email')} rotulo="E-MAIL" valor={perfil.contato.email}><PainelContato tipo="email" onAviso={setAviso} /></LinhaConfig>
      <LinhaConfig {...props('senha')} rotulo="Senha" valor="Redefinir senha"><PainelSenha onAviso={setAviso} /></LinhaConfig>
      <Pressable style={estilos.btnLogout} onPress={sair} accessibilityRole="button">
        <Text style={estilos.btnLogoutTexto}>Fazer logout</Text>
      </Pressable>
    </>
  );
}

/* =============================================================================
 * 14. TELA NOTIFICAÇÕES
 * -----------------------------------------------------------------------------
 * Regras:
 *  - Abre na aba "Não Lidas"; o usuário pode trocar para "Lidas" e "Arquivadas".
 *  - Uma notificação só vira "lida" quando é ABERTA (toque no cartão).
 *  - Aberta: mostra a mensagem completa e dois botões: "Marcar como não lida"
 *    (volta para "Não Lidas") e "Arquivar" (vai para "Arquivadas").
 *  - O cartão aberto permanece na tela até ser fechado ou a aba ser trocada.
 *  - Prévia: uma linha, com reticências quando passa do fim do cartão.
 *
 * ONDE EDITAR TÍTULOS E MENSAGENS: constante NOTIFICACOES_EXEMPLO (seção 4) e,
 * na renderização, os pontos marcados com "TÍTULO" e "MENSAGEM" em CartaoNotificacao.
 *
 * CONEXÃO COM O BACKEND:
 *  - Entrada: inicializarDadosEvolua({ notificacoes }) com a lista do servidor.
 *  - Saída: aoMudarNotificacoes((lista) => ...) recebe a lista atualizada a cada
 *    mudança de status; persista no servidor (ex.: PATCH /notificacoes/:id).
 * ========================================================================== */

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
          {/* TÍTULO da notificação (vem de n.titulo) */}
          <Text style={estilos.notifTitulo}>{n.titulo}</Text>
          {/* MENSAGEM (vem de n.mensagem). Fechada: 1 linha com "..." no fim; aberta: texto completo. */}
          <Text style={estilos.notifMsg} numberOfLines={aberta ? undefined : 1} ellipsizeMode="tail">{n.mensagem}</Text>
          {data ? <Text style={estilos.notifData}>{data}</Text> : null}
        </View>
        <View style={[estilos.seta, aberta && { transform: [{ rotate: '90deg' }] }]}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
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

function TelaNotificacoes() {
  const notificacoes = useEvolua((e) => e.notificacoes);
  const [aba, setAba] = useState<AbaNotificacoes>('nao_lida'); // sempre inicia em "Não Lidas"
  const [abertaId, setAbertaId] = useState<string | null>(null);

  const trocarAba = (nova: AbaNotificacoes) => { setAba(nova); setAbertaId(null); };
  const visiveis = notificacoes.filter((n) => n.status === aba || n.id === abertaId);

  const alternar = (n: Notificacao) => {
    if (abertaId === n.id) { setAbertaId(null); return; }
    setAbertaId(n.id);
    if (n.status === 'nao_lida') definirStatusNotificacao(n.id, 'lida'); // só vira "lida" ao abrir
  };

  return (
    <>
      <Cabecalho titulo="Notificações" subtitulo="Suas notificações aparecerão aqui" mostrarFoto mostrarEngrenagem />
      <View style={estilos.abas} accessibilityRole="tablist">
        {ABAS_NOTIFICACAO.map((a) => (
          <Pressable key={a.id} style={[estilos.aba, aba === a.id && estilos.abaAtiva]} onPress={() => trocarAba(a.id)} accessibilityRole="tab" accessibilityState={{ selected: aba === a.id }}>
            <Text style={[estilos.abaTexto, aba === a.id && { color: '#000' }]}>{a.rotulo}</Text>
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
    </>
  );
}

/* =============================================================================
 * 15. COMPONENTE DA ROTA (/principal/home)
 * ========================================================================== */

export default function Home() {
  const insets = useSafeAreaInsets();
  const [tela, setTela] = useState<TelaInterna>('home');
  const scrollRef = useRef<ScrollView>(null);

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
      <View style={estilos.raiz}>
        <LinearGradient colors={['#DDEAFE', '#E9F0FC', '#F7F9FF']} style={StyleSheet.absoluteFill} />
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 14, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tela === 'home' && <TelaHome />}
          {tela === 'perfil' && <TelaPerfil />}
          {tela === 'configuracoes' && <TelaConfiguracoes />}
          {tela === 'notificacoes' && <TelaNotificacoes />}
        </ScrollView>
        {/* Perfil, Configurações e Notificações não marcam nenhum botão (como no design). */}
        <MenuInferior ativo={tela === 'home' ? 'home' : null} aoPressionarHome={() => irTela('home')} />
      </View>
    </NavegacaoContext.Provider>
  );
}

/* =============================================================================
 * ESTILOS
 * ========================================================================== */

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: CORES.brancoAzulado },

  /* Cabeçalho */
  cabecalho: { flexDirection: 'row', alignItems: 'center', minHeight: 76, marginBottom: 8 },
  cabLado: { width: 96, alignItems: 'flex-start' },
  cabLadoDir: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  cabCentro: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: FONTES.titulo, fontSize: 38, lineHeight: 42, color: '#000', textAlign: 'center' },
  subtitulo: { fontFamily: FONTES.principal, fontSize: 13, color: '#000', textAlign: 'center' },
  iconeBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  selo: { position: 'absolute', top: 0, right: 0, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: '#FF2D55', alignItems: 'center', justifyContent: 'center' },
  seloTexto: { color: '#fff', fontSize: 12, fontFamily: FONTES.texto, fontWeight: '700' },

  /* Cartões e textos gerais */
  cartao: { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 18 },
  saudacao: { fontFamily: FONTES.principal, fontWeight: '700', fontSize: 32, color: '#000' },
  frase: { fontFamily: FONTES.secundaria, fontSize: 15, color: '#000', marginTop: 2, marginBottom: 12 },
  secaoTitulo: { fontFamily: FONTES.titulo, fontSize: 26, color: '#000', marginBottom: 8 },
  aviso: { fontFamily: FONTES.texto, fontSize: 14, padding: 10, borderRadius: 10, marginTop: 12, overflow: 'hidden', color: CORES.azulMarinho },
  avisoOk: { backgroundColor: CORES.verdeSuave },
  avisoErro: { backgroundColor: '#FFE0E6' },
  avisoInfo: { backgroundColor: CORES.azulGelo },

  /* Carrossel */
  atividade: { width: 104, height: 108, borderRadius: 12, padding: 8 },
  atividadeTexto: { fontFamily: FONTES.secundaria, fontSize: 17, lineHeight: 20 },
  fade: { position: 'absolute', top: 0, bottom: 0, width: 52 },
  setaCarrossel: { position: 'absolute', right: 2, top: '50%', marginTop: -23, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(75,85,99,0.55)', alignItems: 'center', justifyContent: 'center' },

  /* Check-in */
  emocoesLinha: { flexDirection: 'row', marginHorizontal: 26, marginTop: 4 },
  emocaoCelula: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  emocaoAnel: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  emocaoAnelAtivo: { borderColor: CORES.azulProfundo, backgroundColor: '#fff' },
  emocaoBarraLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sinal: { width: 26, fontSize: 26, fontWeight: '700', textAlign: 'center', fontFamily: FONTES.texto },
  faixaEmocao: { flexDirection: 'row', height: 12, width: '100%' },
  deslizador: { height: 46, justifyContent: 'center', width: '100%' },
  deslizadorInterno: { height: TAMANHO_BOLINHA, justifyContent: 'center' },
  bolinha: {
    position: 'absolute', left: 0, top: 0, width: TAMANHO_BOLINHA, height: TAMANHO_BOLINHA, borderRadius: TAMANHO_BOLINHA / 2,
    backgroundColor: CORES.cinzaGrafite, borderBottomWidth: 4, borderBottomColor: '#2B323C', elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3, shadowOffset: { width: 0, height: 2 },
  },
  trilhaNumerica: { height: 10, width: '100%', backgroundColor: CORES.azulProfundo, borderRadius: 2 },
  escalaNum: { marginTop: 6 },
  escalaNumLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 6 },
  escalaNumRotulo: { fontFamily: FONTES.texto, fontSize: 20, color: '#000' },
  escalaNumValor: { fontFamily: FONTES.texto, fontSize: 16, color: '#000' },
  btnPrimario: { alignSelf: 'center', width: '72%', marginTop: 14, paddingVertical: 14, borderRadius: 10, backgroundColor: '#7FA0E3', alignItems: 'center' },
  btnPrimarioTexto: { fontFamily: FONTES.texto, fontSize: 20, fontWeight: '700', color: '#fff' },

  /* Perfil */
  perfilBanner: { height: 150, borderRadius: 16, backgroundColor: CORES.rosaPastel },
  perfilFoto: { position: 'absolute', left: 2, top: 20, borderWidth: 3, borderColor: '#000', borderRadius: 60, overflow: 'hidden' },
  perfilNome: { fontFamily: FONTES.principal, fontWeight: '700', fontSize: 24, color: '#000', marginTop: 12, marginHorizontal: 12 },
  perfilApelido: { fontFamily: FONTES.texto, fontSize: 14, color: '#000', marginHorizontal: 12 },
  perfilBioRotulo: { fontFamily: FONTES.texto, fontSize: 15, color: '#000', marginTop: 10, marginHorizontal: 12, marginBottom: 4 },
  perfilBio: { minHeight: 120, borderRadius: 18, backgroundColor: CORES.cinzaClaro, padding: 14, fontFamily: FONTES.texto, fontSize: 15, color: CORES.azulMarinho, marginHorizontal: 6, marginBottom: 6 },
  perfilGrade: { flexDirection: 'row', gap: 12 },
  cartaoPerfil: { borderRadius: 18, padding: 12, height: 100 },
  cartaoPerfilTexto: { fontFamily: FONTES.secundaria, fontSize: 18, lineHeight: 20, color: '#fff' },
  metasBarras: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: '65%' },
  metasBarra: { flex: 1, backgroundColor: CORES.verdeAgua, borderRadius: 3 },
  maisIndicador: { alignSelf: 'center', width: 90, height: 52, borderRadius: 14, backgroundColor: CORES.cinzaClaro, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  maisTexto: { color: '#fff', letterSpacing: 3, fontSize: 16 },

  /* Configurações */
  linha: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, overflow: 'hidden' },
  linhaCabeca: { flexDirection: 'row', alignItems: 'center', minHeight: 72, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  linhaRotulo: { fontFamily: FONTES.texto, fontSize: 18, color: CORES.azulMarinho, width: '36%' },
  linhaValorBox: { flex: 1 },
  linhaValor: { fontFamily: FONTES.secundaria, fontSize: 18, color: CORES.cinzaAzulado },
  seta: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A6A8AB', alignItems: 'center', justifyContent: 'center' },
  linhaPainel: { paddingHorizontal: 14, paddingBottom: 16 },
  painelTitulo: { fontFamily: FONTES.texto, fontSize: 16, color: CORES.azulMarinho, marginBottom: 8 },
  painelTexto: { fontFamily: FONTES.texto, fontSize: 14, color: CORES.cinzaGrafite, marginBottom: 8 },
  campoRotulo: { fontFamily: FONTES.texto, fontSize: 16, color: CORES.azulMarinho, marginBottom: 4 },
  campo: { height: 44, borderRadius: 10, backgroundColor: CORES.cinzaClaro, paddingHorizontal: 12, fontFamily: FONTES.texto, fontSize: 16, color: CORES.azulMarinho },
  btnConfirmar: { alignSelf: 'flex-start', backgroundColor: '#7FA0E3', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, marginTop: 4, marginRight: 8 },
  btnConfirmarTexto: { fontFamily: FONTES.texto, fontSize: 16, fontWeight: '700', color: '#fff' },
  btnSecundario: { alignSelf: 'flex-start', backgroundColor: CORES.cinzaClaro, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginTop: 8, marginRight: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
  btnSecundarioTexto: { fontFamily: FONTES.texto, fontSize: 15, color: CORES.azulMarinho },
  dependencia: { fontFamily: FONTES.texto, fontSize: 12, backgroundColor: CORES.amareloPastel, borderRadius: 8, padding: 8, marginBottom: 10, overflow: 'hidden', color: CORES.azulMarinho },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  opcaoTexto: { fontFamily: FONTES.texto, fontSize: 17, color: CORES.azulMarinho },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: CORES.azulEvolua, alignItems: 'center', justifyContent: 'center' },
  radioMiolo: { width: 11, height: 11, borderRadius: 6, backgroundColor: CORES.azulEvolua },
  btnLogout: { alignSelf: 'center', width: '84%', marginTop: 14, paddingVertical: 18, borderRadius: 12, backgroundColor: '#4C566A', alignItems: 'center' },
  btnLogoutTexto: { fontFamily: FONTES.texto, fontSize: 18, color: '#fff' },

  /* Notificações */
  abas: { flexDirection: 'row', gap: 16, paddingHorizontal: 6, marginBottom: 16 },
  aba: { flex: 1, borderRadius: 4, paddingVertical: 3, backgroundColor: '#4C566A', alignItems: 'center' },
  abaAtiva: { backgroundColor: '#94A3B8' },
  abaTexto: { fontFamily: FONTES.texto, fontSize: 16, color: '#fff' },
  notif: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, paddingHorizontal: 14, paddingBottom: 12 },
  notifCabeca: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 12 },
  notifTitulo: { fontFamily: FONTES.principal, fontSize: 22, color: '#000' },
  notifMsg: { fontFamily: FONTES.texto, fontSize: 17, color: CORES.cinzaAzulado, marginTop: 2 },
  notifData: { fontFamily: FONTES.texto, fontSize: 12, color: CORES.cinzaAzulado, marginTop: 6 },
  notifAcoes: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  vazio: { fontFamily: FONTES.texto, fontSize: 16, color: CORES.cinzaGrafite, textAlign: 'center', marginVertical: 56, marginHorizontal: 20 },

  /* Menu inferior */
  menu: { flexDirection: 'row', gap: 8, backgroundColor: '#7FA0E3', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingHorizontal: 12 },
  menuBotao: { flex: 1, height: 72, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 2 },
  menuBotaoAtivo: { borderBottomWidth: 4, borderBottomColor: '#5CB2FF' },
  menuRotulo: { fontFamily: FONTES.texto, fontSize: 11, color: CORES.azulMarinho },
});
