/* =============================================================================
 * home.txt — MÓDULO HOME DO PROJETO EVOLUA (React + TypeScript, arquivo único)
 * =============================================================================
 *
 * CONTEÚDO DESTE ARQUIVO (na ordem em que aparece):
 *   1.  Imports e dependências
 *   2.  Tipos e interfaces
 *   3.  Tokens de design (cores/fontes) e estilos CSS do módulo
 *   4.  Dados compartilhados (estado central, reducer, contexto, hooks)
 *   5.  Pontos de integração com o BACKEND (serviços)
 *   6.  Funções auxiliares
 *   7.  Ícones (SVG inline)
 *   8.  Componentes base (Avatar, Cabeçalho, Menu de Navegação, Placeholder)
 *   9.  Página Home (+ carrossel de atividades)
 *  10.  Componente de Check-in Emocional
 *  11.  Página Meu Perfil
 *  12.  Página Configurações
 *  13.  Página Notificações
 *  14.  Componente raiz do módulo (ModuloHome) e exports
 *
 * COMO USAR (para quem for integrar):
 *   - Este arquivo exporta por padrão o componente <ModuloHome />. Ele já traz
 *     seu próprio provedor de estado, roteamento interno e menu inferior.
 *   - Páginas de outros colaboradores entram pela prop `paginasExternas`
 *     (veja a seção 14 e a constante ROTAS_EXTERNAS na seção 2).
 *   - Dados reais (usuário, notificações, check-ins) entram pelas props
 *     `usuarioInicial`, `notificacoesIniciais` e `checkinsIniciais`.
 *   - Eventos importantes saem pelas props `onCheckinSalvo`, `onPerfilAtualizado`,
 *     `onNotificacoesAlteradas`, `onNavegarExterno` e `onLogout`.
 *   - Tudo que depende de backend (códigos de verificação, troca de senha,
 *     recuperação de conta, logout) passa pelo objeto `ServicosBackend`
 *     (seção 5). A implementação padrão NÃO simula nada: devolve
 *     "backend não conectado". Basta passar a prop `servicos` com a real.
 *   - Nenhum dado é salvo em banco, localStorage ou servidor por este arquivo.
 *     Tudo vive em memória (estado do React) até o backend ser conectado.
 *
 * FONTES (conforme definido pela equipe de design):
 *   principal: STIX Two Math | secundária: Average Sans | títulos: Bebas Neue
 *   textos e botões: AXES
 *   OBS.: "AXES" não está no Google Fonts. O arquivo da fonte precisa ser
 *   fornecido pelo projeto (veja o @font-face na seção 3). Enquanto isso, o
 *   navegador usa a fonte sans-serif padrão do sistema.
 *
 * Este código não foi executado, compilado nem testado.
 * ========================================================================== */

/* =============================================================================
 * 1. IMPORTS E DEPENDÊNCIAS
 * Somente React. Nenhuma biblioteca externa é necessária.
 * ========================================================================== */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

/* =============================================================================
 * 2. TIPOS E INTERFACES
 * ========================================================================== */

/** Gêneros aceitos nas Configurações. */
export type Genero = 'homem' | 'mulher' | 'outro' | 'nao_informar';

/**
 * Dados do usuário compartilhados por Home, Perfil, Configurações e Notificações.
 * Fonte única da verdade: qualquer alteração aqui reflete em todas as páginas.
 */
export interface PerfilUsuario {
  id: string;                    // identificador do usuário (vem do backend)
  nome: string;
  sobrenome: string;
  apelido: string;               // usado na saudação "Olá, [apelido]!"
  fotoUrl: string | null;        // data URL (local) ou URL do backend; null = avatar padrão
  biografia: string;
  dataNascimento: string | null; // formato ISO "AAAA-MM-DD"; null = não informada
  genero: Genero;
  contato: {
    email: string;
    telefone: string;
  };
}

/** Chaves das 5 emoções do check-in (da mais positiva para a mais negativa). */
export type EmocaoChave = 'muito_feliz' | 'feliz' | 'neutro' | 'triste' | 'muito_triste';

/**
 * Um registro de check-in emocional salvo pelo botão "Salvar o meu dia".
 * É ESTE o formato que a página de histórico deve consumir.
 */
export interface RegistroCheckin {
  id: string;            // identificador único do registro (use como chave no histórico)
  usuarioId: string;     // dono do registro (PerfilUsuario.id)
  criadoEmISO: string;   // instante exato do salvamento, ex.: "2025-03-10T14:32:05.123Z"
  dataLocal: string;     // dia no fuso do usuário "AAAA-MM-DD" — use para agrupar por dia
  emocao: EmocaoChave;
  emocaoNivel: 1 | 2 | 3 | 4 | 5; // 5 = muito feliz ... 1 = muito triste (bom para gráficos)
  ansiedade: number;     // 1 a 10
  estresse: number;      // 1 a 10
  energia: number;       // 1 a 10
}

/** Estados possíveis de uma notificação. Define em qual aba ela aparece. */
export type StatusNotificacao = 'nao_lida' | 'lida' | 'arquivada';

/** Notificação exibida na página Notificações. */
export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;          // texto completo (a prévia é cortada com reticências via CSS)
  dataISO?: string;          // opcional; quando ausente, nenhuma data é exibida
  status: StatusNotificacao;
}

/** Abas da página Notificações (cada uma corresponde a um StatusNotificacao). */
export type AbaNotificacoes = 'nao_lida' | 'lida' | 'arquivada';

/** Preferências necessárias às páginas deste módulo. */
export interface Preferencias {
  idioma: 'pt-BR';
  abaNotificacoesInicial: AbaNotificacoes; // aba aberta ao entrar em Notificações
}

/** Rotas internas deste módulo. */
export type RotaInterna = 'home' | 'perfil' | 'configuracoes' | 'notificacoes';

/**
 * Rotas que pertencem a OUTROS colaboradores. Este módulo só sabe o "id".
 * - evolua / chat / progresso / saibaMais  → botões do menu inferior
 * - evolucaoPessoal / questionarios / metas / exercicios / historicoCheckin
 *                                           → cartões de atividades (Home e Perfil)
 */
export const ROTAS_EXTERNAS = [
  'evolua',
  'chat',
  'progresso',
  'saibaMais',
  'evolucaoPessoal',
  'questionarios',
  'metas',
  'exercicios',
  'historicoCheckin',
] as const;
export type RotaExterna = (typeof ROTAS_EXTERNAS)[number];

export type Rota = RotaInterna | RotaExterna;

/** Props que toda página externa recebe ao ser plugada no módulo. */
export interface PropsPaginaExterna {
  rota: RotaExterna;
  irPara: (rota: Rota) => void;
}

/** Resultado padrão das chamadas de backend. */
export interface ResultadoServico {
  ok: boolean;
  mensagem?: string;
  /** true quando o serviço ainda não foi conectado (implementação padrão). */
  naoConectado?: boolean;
}

/** Contrato dos serviços que dependem de backend (implementar na integração). */
export interface ServicosBackend {
  /** Envia código de verificação para o NOVO e-mail/telefone solicitado. */
  solicitarCodigoAlteracaoContato(dados: { tipo: 'email' | 'telefone'; novoValor: string }): Promise<ResultadoServico>;
  /** Confirma o código recebido e efetiva a troca do contato. */
  confirmarAlteracaoContato(dados: { tipo: 'email' | 'telefone'; novoValor: string; codigo: string }): Promise<ResultadoServico>;
  /** Troca de senha de usuário autenticado (valida senha atual no servidor). */
  alterarSenha(dados: { senhaAtual: string; novaSenha: string }): Promise<ResultadoServico>;
  /** Passo 1 da recuperação: envia código por e-mail ou telefone cadastrados. */
  solicitarCodigoRecuperacao(dados: { canal: 'email' | 'telefone' }): Promise<ResultadoServico>;
  /** Passo 2 da recuperação: valida o código e define a nova senha. */
  confirmarRecuperacaoSenha(dados: { codigo: string; novaSenha: string }): Promise<ResultadoServico>;
  /** Encerra a sessão autenticada. */
  encerrarSessao(): Promise<ResultadoServico>;
}

/** Props do componente raiz do módulo (pontos de integração). */
export interface PropsModuloHome {
  usuarioInicial?: Partial<PerfilUsuario>;
  notificacoesIniciais?: Notificacao[];
  checkinsIniciais?: RegistroCheckin[];
  preferenciasIniciais?: Partial<Preferencias>;
  /** Páginas dos outros colaboradores, indexadas pelo id da rota. */
  paginasExternas?: Partial<Record<RotaExterna, React.ComponentType<PropsPaginaExterna>>>;
  /** Substitui os serviços de backend padrão (que não simulam nada). */
  servicos?: ServicosBackend;
  /** Chamado após cada check-in salvo. Aqui o backend pode persistir o registro. */
  onCheckinSalvo?: (registro: RegistroCheckin) => void;
  /** Chamado sempre que o perfil muda (nome, apelido, foto, biografia etc.). */
  onPerfilAtualizado?: (perfil: PerfilUsuario) => void;
  /** Chamado sempre que o status de alguma notificação muda. */
  onNotificacoesAlteradas?: (notificacoes: Notificacao[]) => void;
  /** Chamado quando o usuário abre uma rota externa (útil para o roteador do app). */
  onNavegarExterno?: (rota: RotaExterna) => void;
  /** Chamado depois que o serviço encerrarSessao() retornar ok. */
  onLogout?: () => void;
  /** Rota inicial do módulo (padrão: 'home'). */
  rotaInicial?: Rota;
}

/* =============================================================================
 * 3. TOKENS DE DESIGN E ESTILOS
 * Cores e fontes seguem exatamente a paleta do PDF de referência.
 * ========================================================================== */

export const CORES = {
  azulEvolua: '#4A7BD9',
  azulCeu: '#A7C8FF',
  azulGelo: '#D7E6FF',
  lilas: '#B79CFF',
  lavanda: '#E7D9FF',
  verdeMenta: '#A7E8D4',
  verdeSuave: '#C8EBD8',
  turquesa: '#7FD3D6',
  amareloPastel: '#FFE7A3',
  pessego: '#FFB88C',
  rosaPastel: '#FFB6D9',
  azulProfundo: '#2E5B9A',
  roxoVibrante: '#7B61FF',
  roxo: '#A855F7',
  rosaVibrante: '#FF7EB6',
  laranja: '#FFB347',
  verdeAgua: '#1BA7A7',
  azulMarinho: '#1E2A44',
  cinzaGrafite: '#4B5563',
  cinzaAzulado: '#94A3B8',
  cinzaClaro: '#E2E8F0',
  branco: '#FFFFFF',
  brancoAzulado: '#F7F9FF',
} as const;

/**
 * Definição das 5 emoções. A ORDEM importa: índice 0 = muito feliz (esquerda
 * do indicador, lado "+") e índice 4 = muito triste (direita, lado "−").
 * As cores dos rostos e dos segmentos da barra vêm da referência visual.
 */
export const EMOCOES: ReadonlyArray<{
  chave: EmocaoChave;
  rotulo: string;
  nivel: 1 | 2 | 3 | 4 | 5;
  cor: string;
}> = [
  { chave: 'muito_feliz', rotulo: 'Muito feliz', nivel: 5, cor: '#8A7AD8' },
  { chave: 'feliz', rotulo: 'Feliz', nivel: 4, cor: '#A5B8E3' },
  { chave: 'neutro', rotulo: 'Neutro', nivel: 3, cor: '#FFDDB4' },
  { chave: 'triste', rotulo: 'Triste', nivel: 2, cor: '#DDEDEA' },
  { chave: 'muito_triste', rotulo: 'Muito triste', nivel: 1, cor: '#B3E3D5' },
];

/** Cartões de atividade do carrossel da Home (cores e textos da referência). */
const ATIVIDADES_HOME: ReadonlyArray<{
  rota: RotaExterna;
  titulo: string;
  fundo: string;
  texto: string; // cor do texto, escolhida para manter boa legibilidade
}> = [
  { rota: 'evolucaoPessoal', titulo: 'Evolução Pessoal', fundo: CORES.azulEvolua, texto: CORES.branco },
  { rota: 'questionarios', titulo: 'Meus Questionários', fundo: CORES.azulCeu, texto: CORES.azulMarinho },
  { rota: 'metas', titulo: 'Minhas Metas', fundo: CORES.verdeAgua, texto: CORES.branco },
  { rota: 'exercicios', titulo: 'Meus Exercícios', fundo: CORES.lavanda, texto: CORES.azulMarinho },
];

/** Frases motivacionais. A frase do dia é escolhida por data (ver fraseDoDia). */
const FRASES_MOTIVACIONAIS: ReadonlyArray<string> = [
  'A persistência realiza o impossível!',
  'Um passo de cada vez já é caminho percorrido.',
  'Cuidar de você também é progresso.',
  'Hoje é um bom dia para recomeçar.',
  'Pequenas conquistas constroem grandes mudanças.',
];

/** Estilos do módulo. Todas as classes usam o prefixo "ev-" para não colidir com o resto do app. */
const ESTILOS = `
@import url('https://fonts.googleapis.com/css2?family=STIX+Two+Math&family=Average+Sans&family=Bebas+Neue&display=swap');

/* AXES: fonte de textos e botões. Forneça o arquivo em /fonts/AXES.woff2 (ou ajuste o caminho). */
@font-face { font-family: 'AXES'; src: local('AXES'), url('/fonts/AXES.woff2') format('woff2'); font-display: swap; }

.ev-app {
  --azul-evolua: ${CORES.azulEvolua}; --azul-ceu: ${CORES.azulCeu}; --azul-gelo: ${CORES.azulGelo};
  --azul-profundo: ${CORES.azulProfundo}; --azul-marinho: ${CORES.azulMarinho};
  --grafite: ${CORES.cinzaGrafite}; --cinza-azulado: ${CORES.cinzaAzulado}; --cinza-claro: ${CORES.cinzaClaro};
  --fonte-principal: 'STIX Two Math', 'Times New Roman', serif;
  --fonte-secundaria: 'Average Sans', sans-serif;
  --fonte-titulo: 'Bebas Neue', Impact, sans-serif;
  --fonte-texto: 'AXES', system-ui, sans-serif;
  font-family: var(--fonte-texto);
  color: var(--azul-marinho);
  max-width: 430px; margin: 0 auto; min-height: 100vh;
  display: flex; flex-direction: column; position: relative; overflow-x: hidden;
  background: radial-gradient(circle at 50% 55%, #B4CDEE 0%, #DCE8F8 30%, #F7F9FF 68%), ${CORES.brancoAzulado};
}
.ev-app *, .ev-app *::before, .ev-app *::after { box-sizing: border-box; }
.ev-app button { font-family: var(--fonte-texto); cursor: pointer; }
.ev-app :focus-visible { outline: 3px solid var(--azul-evolua); outline-offset: 2px; }
.ev-conteudo { flex: 1; padding: 12px 14px 28px; }

/* Cabeçalho */
.ev-cabecalho { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 76px; margin-bottom: 8px; }
.ev-cabecalho__esq { justify-self: start; }
.ev-cabecalho__centro { text-align: center; }
.ev-cabecalho__dir { justify-self: end; display: flex; gap: 8px; align-items: center; }
.ev-titulo { font-family: var(--fonte-titulo); font-size: 40px; line-height: 1; margin: 0; letter-spacing: .5px; }
.ev-subtitulo { font-family: var(--fonte-principal); font-size: 14px; margin: 2px 0 0; }
.ev-btn-icone { position: relative; background: none; border: 0; padding: 4px; width: 46px; height: 46px; display: grid; place-items: center; color: #000; }
.ev-selo { position: absolute; top: 0; right: 0; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; background: #FF2D55; color: #fff; font-size: 12px; font-weight: 700; display: grid; place-items: center; }
.ev-avatar { border-radius: 50%; overflow: hidden; background: #000; display: block; flex: none; }
.ev-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ev-avatar-btn { background: none; border: 0; padding: 0; border-radius: 50%; }

/* Cartões */
.ev-cartao { background: #fff; border-radius: 18px; padding: 14px; margin-bottom: 18px; }
.ev-saudacao { font-family: var(--fonte-principal); font-weight: 700; font-size: 36px; margin: 0; line-height: 1.1; }
.ev-frase { font-family: var(--fonte-secundaria); font-size: 16px; margin: 4px 0 12px; }
.ev-secao-titulo { font-family: var(--fonte-titulo); font-weight: 400; font-size: 24px; margin: 0 0 8px; letter-spacing: .3px; }

/* Carrossel de atividades (rolagem horizontal + fade nas bordas) */
.ev-carrossel { position: relative; }
.ev-carrossel__trilho {
  display: flex; gap: 12px; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; padding-right: 4px;
  -webkit-mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 56px), transparent 100%);
          mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 56px), transparent 100%);
  transition: -webkit-mask-image .25s, mask-image .25s;
}
.ev-carrossel__trilho::-webkit-scrollbar { display: none; }
.ev-carrossel--meio .ev-carrossel__trilho {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 32px, #000 calc(100% - 56px), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 32px, #000 calc(100% - 56px), transparent 100%);
}
.ev-carrossel--fim .ev-carrossel__trilho {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 32px, #000 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 32px, #000 100%);
}
.ev-atividade {
  flex: none; width: 178px; height: 188px; border: 0; border-radius: 12px; padding: 8px 10px; text-align: left; vertical-align: top;
  font-family: var(--fonte-secundaria); font-size: 24px; line-height: 1.1; scroll-snap-align: start; transition: transform .15s;
}
.ev-atividade:active { transform: scale(.97); }
.ev-carrossel__seta {
  position: absolute; right: 2px; top: 50%; transform: translateY(-50%); width: 46px; height: 46px; border-radius: 50%;
  border: 0; background: rgba(75,85,99,.55); color: #fff; display: grid; place-items: center; transition: opacity .2s;
}
.ev-carrossel--fim .ev-carrossel__seta { opacity: 0; pointer-events: none; }

/* Check-in emocional */
.ev-emocoes { display: flex; justify-content: space-between; padding: 4px 8px 10px; }
.ev-emocao { width: 52px; height: 52px; border-radius: 50%; border: 0; padding: 0; background: none; transition: transform .2s, box-shadow .2s; }
.ev-emocao svg { width: 100%; height: 100%; display: block; }
.ev-emocao[aria-checked='true'] { transform: scale(1.22); box-shadow: 0 0 0 3px #fff, 0 0 0 6px var(--azul-profundo); border-radius: 50%; }
.ev-escala-emocao { display: flex; align-items: center; gap: 6px; padding: 0 4px; margin-bottom: 12px; }
.ev-escala-emocao__sinal { font-size: 26px; font-weight: 700; width: 20px; text-align: center; line-height: 1; }
.ev-escala-emocao__trilha { position: relative; flex: 1; height: 42px; display: flex; align-items: center; touch-action: none; cursor: pointer; }
.ev-escala-emocao__faixa { display: flex; width: 100%; height: 12px; }
.ev-escala-emocao__faixa span { flex: 1; }
.ev-polegar {
  position: absolute; top: 50%; width: 38px; height: 38px; margin: -19px 0 0 -19px; border-radius: 50%;
  background: var(--grafite); box-shadow: 0 4px 0 #2B323C; transition: left .18s ease-out, opacity .2s; pointer-events: none;
}
.ev-polegar--inativo { opacity: .55; }
.ev-escala-numerica { margin-bottom: 8px; }
.ev-escala-numerica__linha { display: flex; justify-content: space-between; align-items: baseline; padding: 0 6px; }
.ev-escala-numerica__rotulo { font-size: 22px; }
.ev-escala-numerica__valor { font-size: 18px; }
.ev-range { -webkit-appearance: none; appearance: none; width: 100%; height: 44px; background: transparent; margin: 0; }
.ev-range::-webkit-slider-runnable-track { height: 10px; background: var(--azul-profundo); border-radius: 2px; }
.ev-range::-moz-range-track { height: 10px; background: var(--azul-profundo); border-radius: 2px; }
.ev-range::-webkit-slider-thumb { -webkit-appearance: none; width: 38px; height: 38px; margin-top: -14px; border-radius: 50%; background: var(--grafite); border: 0; box-shadow: 0 4px 0 #2B323C; }
.ev-range::-moz-range-thumb { width: 38px; height: 38px; border-radius: 50%; background: var(--grafite); border: 0; box-shadow: 0 4px 0 #2B323C; }
.ev-range--inativo::-webkit-slider-thumb { opacity: .55; }
.ev-range--inativo::-moz-range-thumb { opacity: .55; }
.ev-btn-primario {
  display: block; width: 72%; margin: 14px auto 0; padding: 14px 10px; border: 0; border-radius: 10px;
  background: #7FA0E3; color: #fff; font-size: 22px; font-weight: 700; transition: background .2s;
}
.ev-btn-primario:hover { background: var(--azul-evolua); }
.ev-aviso { margin: 12px 4px 0; padding: 10px 12px; border-radius: 10px; font-size: 14px; }
.ev-aviso--ok { background: #C8EBD8; }
.ev-aviso--erro { background: #FFE0E6; }
.ev-aviso--info { background: var(--azul-gelo); }

/* Perfil */
.ev-perfil__topo { position: relative; background: ${CORES.rosaPastel}; border-radius: 16px; height: 196px; }
.ev-perfil__topo .ev-avatar { position: absolute; left: 2px; top: 30px; border: 3px solid #000; }
.ev-perfil__nome { font-family: var(--fonte-principal); font-weight: 700; font-size: 26px; margin: 14px 14px 0; }
.ev-perfil__apelido { font-size: 15px; margin: 0 14px; }
.ev-perfil__bio-rotulo { display: block; margin: 12px 14px 4px; font-size: 16px; }
.ev-perfil__bio { width: calc(100% - 20px); margin: 0 10px 6px; min-height: 130px; border: 0; border-radius: 18px; background: var(--cinza-claro); padding: 14px; font: inherit; font-size: 16px; color: var(--azul-marinho); resize: vertical; }
.ev-perfil__bio::placeholder { color: var(--cinza-azulado); }
.ev-grade-atividades { display: grid; grid-template-columns: 1fr 1fr 0.8fr; grid-template-rows: 196px 196px; gap: 24px 24px; }
.ev-grade-atividades button { border: 0; border-radius: 22px; padding: 14px; text-align: left; font-family: var(--fonte-secundaria); font-size: 25px; line-height: 1.05; color: #fff; }
.ev-grade-atividades .ev-metas { grid-row: 1 / span 2; grid-column: 3; display: flex; flex-direction: column; justify-content: space-between; }
.ev-metas__barras { display: flex; align-items: flex-end; gap: 6px; height: 62%; }
.ev-metas__barras span { flex: 1; background: ${CORES.verdeAgua}; border-radius: 4px; }
.ev-mais { display: block; width: 100px; height: 60px; margin: 14px auto 0; border-radius: 16px; background: var(--cinza-claro); color: #fff; text-align: center; line-height: 60px; letter-spacing: 3px; }

/* Configurações */
.ev-linha { background: #fff; border-radius: 18px; margin-bottom: 14px; overflow: hidden; }
.ev-linha__cabeca { width: 100%; min-height: 76px; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 0; background: none; text-align: left; color: var(--azul-marinho); }
.ev-linha__rotulo { font-size: 20px; flex: none; width: 38%; }
.ev-linha__valor { flex: 1; font-size: 20px; color: var(--cinza-azulado); text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ev-linha__valor--avatar { display: flex; justify-content: flex-end; }
.ev-seta { flex: none; width: 46px; height: 46px; border-radius: 50%; background: #A6A8AB; color: #fff; display: grid; place-items: center; transition: transform .2s; }
.ev-linha--aberta .ev-seta { transform: rotate(90deg); }
.ev-linha__painel { padding: 4px 16px 18px; }
.ev-linha__painel h3 { font-size: 18px; font-weight: 400; margin: 6px 0 10px; }
.ev-campo { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: 18px; }
.ev-campo input, .ev-campo select { height: 44px; border: 0; border-radius: 10px; background: var(--cinza-claro); padding: 0 12px; font: inherit; font-size: 16px; color: var(--azul-marinho); width: 100%; }
.ev-campos-duplos { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ev-opcoes { display: flex; flex-direction: column; gap: 8px; }
.ev-opcao { display: flex; align-items: center; gap: 10px; font-size: 18px; min-height: 44px; }
.ev-opcao input { width: 22px; height: 22px; accent-color: var(--azul-evolua); }
.ev-btn-secundario { border: 0; border-radius: 10px; background: var(--cinza-claro); color: var(--azul-marinho); padding: 12px 16px; font-size: 16px; margin: 4px 8px 4px 0; box-shadow: 0 2px 4px rgba(0,0,0,.2); }
.ev-btn-confirmar { border: 0; border-radius: 10px; background: #7FA0E3; color: #fff; padding: 12px 18px; font-size: 16px; font-weight: 700; margin: 4px 8px 4px 0; }
.ev-btn-logout { display: block; width: 84%; margin: 22px auto 8px; padding: 18px; border: 0; border-radius: 12px; background: #4C566A; color: #fff; font-size: 20px; }
.ev-zona { border: 2px dashed var(--cinza-azulado); border-radius: 14px; padding: 18px 12px; text-align: center; margin-bottom: 12px; font-size: 16px; transition: background .2s, border-color .2s; }
.ev-zona--ativa { background: var(--azul-gelo); border-color: var(--azul-evolua); }
.ev-dependencia { display: block; font-size: 13px; background: ${CORES.amareloPastel}; border-radius: 8px; padding: 8px 10px; margin: 6px 0 12px; }
.ev-oculto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* Notificações */
.ev-abas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 0 6px; margin-bottom: 16px; }
.ev-aba { border: 0; border-radius: 4px; padding: 3px 4px; background: #4C566A; color: #fff; font-size: 18px; letter-spacing: .5px; }
.ev-aba[aria-selected='true'] { background: #94A3B8; color: #000; }
.ev-notif { background: #fff; border-radius: 18px; margin-bottom: 14px; padding: 6px 12px 14px 16px; }
.ev-notif__cabeca { width: 100%; display: flex; align-items: flex-start; gap: 10px; background: none; border: 0; padding: 8px 0 0; text-align: left; color: inherit; }
.ev-notif__texto { flex: 1; min-width: 0; }
.ev-notif__titulo { font-family: var(--fonte-principal); font-size: 24px; font-weight: 400; margin: 0; }
.ev-notif__msg { font-size: 19px; color: var(--cinza-azulado); margin: 4px 0 0; }
.ev-notif__msg--previa { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ev-notif__msg--completa { white-space: normal; line-height: 1.35; }
.ev-notif__data { font-size: 13px; color: var(--cinza-azulado); margin: 6px 0 0; }
.ev-notif__acoes { display: flex; flex-wrap: wrap; margin-top: 8px; }
.ev-notif--aberta .ev-seta { transform: rotate(90deg); }
.ev-vazio { text-align: center; color: var(--grafite); margin: 56px 20px; font-size: 18px; }

/* Menu de navegação inferior */
.ev-menu { position: sticky; bottom: 0; background: #7FA0E3; border-radius: 24px 24px 0 0; padding: 18px 12px 26px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.ev-menu__botao { height: 76px; border: 0; border-radius: 12px; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 13px; color: var(--azul-marinho); color-scheme: light; }
.ev-menu__botao svg { width: 40px; height: 40px; color: #6D6D6D; transition: color .2s; }
.ev-menu__botao[aria-current='page'] svg { color: #5CB2FF; }
.ev-menu__botao[aria-current='page'] { font-weight: 700; box-shadow: inset 0 -4px 0 #5CB2FF; }

/* Placeholder de página externa */
.ev-externa { background: #fff; border-radius: 18px; padding: 24px 16px; text-align: center; margin-top: 24px; }

@media (prefers-reduced-motion: reduce) {
  .ev-app * { transition: none !important; scroll-behavior: auto !important; }
}
`;

/* =============================================================================
 * 4. DADOS COMPARTILHADOS (ESTADO CENTRAL)
 * -----------------------------------------------------------------------------
 * TODAS as páginas deste módulo leem e escrevem neste estado único, que fica
 * dentro de um Context do React. Por isso:
 *   - trocar a foto nas Configurações atualiza Home, Perfil e Notificações;
 *   - trocar o apelido atualiza a saudação da Home e o Perfil;
 *   - trocar o nome/sobrenome atualiza o Perfil e a linha "Nome" das Configurações;
 *   - salvar um check-in adiciona um item em `estado.checkins`;
 *   - mudar o status de uma notificação muda a aba em que ela aparece.
 *
 * FORMA DO ESTADO (EstadoEvolua):
 *   perfil        → PerfilUsuario (nome, sobrenome, apelido, foto, bio, nascimento,
 *                   gênero e contato)
 *   checkins      → RegistroCheckin[]  (mais recente primeiro)
 *   notificacoes  → Notificacao[]
 *   preferencias  → Preferencias
 *   rota          → página atualmente exibida
 *
 * COMO OUTROS COLABORADORES ACESSAM OS DADOS:
 *   Dentro de <ModuloHome>, qualquer componente (inclusive as páginas plugadas
 *   por `paginasExternas`) pode usar:
 *       const { estado, acoes } = useEvolua();
 *       estado.perfil.apelido
 *       estado.checkins
 *   Fora do módulo, use as props de saída (onCheckinSalvo, onPerfilAtualizado,
 *   onNotificacoesAlteradas) para receber os dados e guardá-los onde o projeto
 *   preferir (store global, API etc.).
 * ========================================================================== */

export interface EstadoEvolua {
  perfil: PerfilUsuario;
  checkins: RegistroCheckin[];
  notificacoes: Notificacao[];
  preferencias: Preferencias;
  rota: Rota;
}

/**
 * Valores iniciais de PLACEHOLDER (textos da referência visual).
 * Na integração real, passe os dados do usuário logado em `usuarioInicial`.
 */
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

const PREFERENCIAS_PADRAO: Preferencias = { idioma: 'pt-BR', abaNotificacoesInicial: 'nao_lida' };

/** Retorna um ISO de "agora menos N horas" (apenas para os exemplos abaixo). */
const horasAtrasISO = (horas: number): string => new Date(Date.now() - horas * 3600 * 1000).toISOString();

/**
 * NOTIFICAÇÕES DE EXEMPLO (títulos e textos da referência visual).
 * São apenas dados iniciais para demonstrar o layout. Para usar dados reais,
 * passe `notificacoesIniciais` ao <ModuloHome>. Títulos, mensagens, datas e
 * status podem ser editados livremente aqui ou vir do backend.
 */
const NOTIFICACOES_EXEMPLO: Notificacao[] = [
  {
    id: 'notif-1',
    titulo: 'Check-in',
    mensagem:
      'Você já fez seu check-in emocional hoje? Reserve um instante para registrar como você está se sentindo e acompanhar sua evolução ao longo dos dias.',
    dataISO: horasAtrasISO(2),
    status: 'nao_lida',
  },
  {
    id: 'notif-2',
    titulo: 'Seu relatório mensal está pronto',
    mensagem: 'Acesse a aba Evolua para conferir',
    dataISO: horasAtrasISO(26),
    status: 'nao_lida',
  },
  {
    id: 'notif-3',
    titulo: 'Atualização',
    mensagem: 'Confira as novas funcionalidades disponíveis no Evolua.',
    status: 'nao_lida',
  },
  {
    id: 'notif-4',
    titulo: 'Um recomeço',
    mensagem: 'Você já deu o primeiro passo, agora é só continuar. Cada dia conta na sua jornada.',
    dataISO: horasAtrasISO(72),
    status: 'nao_lida',
  },
];

/* ---- Reducer: única porta de entrada para alterar o estado compartilhado ---- */

type AcaoEstado =
  | { tipo: 'perfil/atualizar'; parcial: Partial<PerfilUsuario> }
  | { tipo: 'perfil/atualizarContato'; parcial: Partial<PerfilUsuario['contato']> }
  | { tipo: 'checkin/adicionar'; registro: RegistroCheckin }
  | { tipo: 'notificacao/definirStatus'; id: string; status: StatusNotificacao }
  | { tipo: 'navegacao/ir'; rota: Rota };

function reducerEvolua(estado: EstadoEvolua, acao: AcaoEstado): EstadoEvolua {
  switch (acao.tipo) {
    case 'perfil/atualizar':
      return { ...estado, perfil: { ...estado.perfil, ...acao.parcial } };
    case 'perfil/atualizarContato':
      return {
        ...estado,
        perfil: { ...estado.perfil, contato: { ...estado.perfil.contato, ...acao.parcial } },
      };
    case 'checkin/adicionar':
      // Mais recente primeiro.
      return { ...estado, checkins: [acao.registro, ...estado.checkins] };
    case 'notificacao/definirStatus':
      return {
        ...estado,
        notificacoes: estado.notificacoes.map((n) => (n.id === acao.id ? { ...n, status: acao.status } : n)),
      };
    case 'navegacao/ir':
      return { ...estado, rota: acao.rota };
    default:
      return estado;
  }
}

/* ---- Seletores de check-ins (para a página de histórico de outro colaborador) ---- */

/**
 * CHECK-INS — GUIA PARA O RESPONSÁVEL PELO HISTÓRICO
 *
 * Como os dados são organizados:
 *   Cada clique em "Salvar o meu dia" gera UM RegistroCheckin imutável, inserido
 *   no início de `estado.checkins`. Nada é sobrescrito: vários registros no mesmo
 *   dia são permitidos (use ultimoCheckinPorDia para ficar com o mais recente).
 *
 * Informações armazenadas por registro:
 *   id, usuarioId, criadoEmISO, dataLocal, emocao, emocaoNivel (1–5),
 *   ansiedade (1–10), estresse (1–10), energia (1–10).
 *
 * Como identificar cada registro e sua data:
 *   - `id` identifica o registro (chave única).
 *   - `criadoEmISO` guarda o instante exato; `dataLocal` ("AAAA-MM-DD") guarda o dia
 *     no fuso do usuário e deve ser usada para agrupar/filtrar por dia.
 *
 * Como recuperar:
 *   - Dentro do módulo:  const { estado } = useEvolua();  → estado.checkins
 *                        ou  const registros = useCheckins({ de: '2025-03-01' });
 *   - Fora do módulo:    receba cada novo registro em `onCheckinSalvo` e grave
 *                        no backend; depois injete a lista de volta em
 *                        `checkinsIniciais` ao montar o <ModuloHome>.
 *   - Funções puras abaixo (filtrarCheckins, ultimoCheckinPorDia) funcionam com
 *     qualquer array de RegistroCheckin, em qualquer lugar do projeto.
 */
export interface FiltroCheckins {
  de?: string;       // "AAAA-MM-DD" inclusive
  ate?: string;      // "AAAA-MM-DD" inclusive
  emocao?: EmocaoChave;
}

export function filtrarCheckins(registros: RegistroCheckin[], filtro: FiltroCheckins = {}): RegistroCheckin[] {
  return registros.filter(
    (r) =>
      (!filtro.de || r.dataLocal >= filtro.de) &&
      (!filtro.ate || r.dataLocal <= filtro.ate) &&
      (!filtro.emocao || r.emocao === filtro.emocao),
  );
}

/** Reduz a lista a um registro por dia (o mais recente de cada dia), chaveado por dataLocal. */
export function ultimoCheckinPorDia(registros: RegistroCheckin[]): Record<string, RegistroCheckin> {
  const porDia: Record<string, RegistroCheckin> = {};
  for (const r of registros) {
    const atual = porDia[r.dataLocal];
    if (!atual || r.criadoEmISO > atual.criadoEmISO) porDia[r.dataLocal] = r;
  }
  return porDia;
}

/* ---- Contexto ---- */

/** Ações expostas aos componentes. Use estas funções em vez de mexer no estado diretamente. */
export interface AcoesEvolua {
  irPara: (rota: Rota) => void;
  atualizarPerfil: (parcial: Partial<PerfilUsuario>) => void;
  atualizarContato: (parcial: Partial<PerfilUsuario['contato']>) => void;
  /** Cria e guarda um check-in. Retorna o registro criado. */
  salvarCheckin: (dados: Pick<RegistroCheckin, 'emocao' | 'ansiedade' | 'estresse' | 'energia'>) => RegistroCheckin;
  definirStatusNotificacao: (id: string, status: StatusNotificacao) => void;
}

interface ValorContexto {
  estado: EstadoEvolua;
  acoes: AcoesEvolua;
  servicos: ServicosBackend;
  paginasExternas: PropsModuloHome['paginasExternas'];
  onLogout?: () => void;
}

const EvoluaContext = createContext<ValorContexto | null>(null);

/** Hook principal: dá acesso ao estado compartilhado e às ações. */
export function useEvolua(): ValorContexto {
  const ctx = useContext(EvoluaContext);
  if (!ctx) throw new Error('useEvolua deve ser usado dentro de <ModuloHome>.');
  return ctx;
}

/** Hook de conveniência para o histórico: devolve os check-ins já filtrados. */
export function useCheckins(filtro?: FiltroCheckins): RegistroCheckin[] {
  const { estado } = useEvolua();
  return useMemo(() => filtrarCheckins(estado.checkins, filtro), [estado.checkins, filtro?.de, filtro?.ate, filtro?.emocao]); // eslint-disable-line react-hooks/exhaustive-deps
}

/* =============================================================================
 * 5. PONTOS DE INTEGRAÇÃO COM O BACKEND
 * -----------------------------------------------------------------------------
 * As funções abaixo dependem de servidor (autenticação, envio de códigos por
 * e-mail/SMS, validação de senha, encerramento de sessão). Por segurança NADA
 * disso é simulado: a implementação padrão sempre devolve
 * { ok: false, naoConectado: true } e a interface avisa o usuário.
 *
 * Para integrar: crie um objeto que implemente `ServicosBackend` e passe em
 * <ModuloHome servicos={meusServicos} />. Cada método documenta o que o
 * servidor precisa fazer.
 * ========================================================================== */

const MENSAGEM_NAO_CONECTADO =
  'Esta ação depende de integração com o backend, que ainda não foi conectada.';

export const servicosPadrao: ServicosBackend = {
  // BACKEND: gerar código, enviar ao NOVO e-mail/telefone e guardá-lo com validade curta.
  async solicitarCodigoAlteracaoContato() {
    return { ok: false, naoConectado: true, mensagem: MENSAGEM_NAO_CONECTADO };
  },
  // BACKEND: comparar código, aplicar a troca de contato na conta do usuário autenticado.
  async confirmarAlteracaoContato() {
    return { ok: false, naoConectado: true, mensagem: MENSAGEM_NAO_CONECTADO };
  },
  // BACKEND: validar a senha atual, aplicar política de senha e gravar o hash da nova senha.
  async alterarSenha() {
    return { ok: false, naoConectado: true, mensagem: MENSAGEM_NAO_CONECTADO };
  },
  // BACKEND: enviar código de recuperação ao e-mail/telefone JÁ cadastrados na conta.
  async solicitarCodigoRecuperacao() {
    return { ok: false, naoConectado: true, mensagem: MENSAGEM_NAO_CONECTADO };
  },
  // BACKEND: validar o código recebido e redefinir a senha.
  async confirmarRecuperacaoSenha() {
    return { ok: false, naoConectado: true, mensagem: MENSAGEM_NAO_CONECTADO };
  },
  // BACKEND: invalidar token/sessão. Depois disso o app deve redirecionar para o login (onLogout).
  async encerrarSessao() {
    return { ok: false, naoConectado: true, mensagem: MENSAGEM_NAO_CONECTADO };
  },
};

/* =============================================================================
 * 6. FUNÇÕES AUXILIARES
 * ========================================================================== */

/** Gera um id único. Usa crypto.randomUUID quando disponível. */
function gerarId(prefixo: string): string {
  const c: any = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return `${prefixo}-${c.randomUUID()}`;
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "AAAA-MM-DD" no fuso local do usuário (NÃO use toISOString, que é UTC). */
function dataLocalISO(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** "AAAA-MM-DD" → "DD/MM/AAAA". Sem data, retorna o placeholder da referência. */
function formatarDataNascimento(iso: string | null): string {
  if (!iso) return '00/00/0000';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Data/hora amigável para notificações. Retorna '' quando não há data. */
function formatarDataNotificacao(iso?: string): string {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Escolhe a frase motivacional do dia (muda a cada dia, sem aleatoriedade). */
function fraseDoDia(hoje: Date = new Date()): string {
  const inicioAno = new Date(hoje.getFullYear(), 0, 0).getTime();
  const diaDoAno = Math.floor((hoje.getTime() - inicioAno) / 86400000);
  // A primeira frase é a da referência visual; ela abre a lista de rotação.
  return FRASES_MOTIVACIONAIS[diaDoAno % FRASES_MOTIVACIONAIS.length];
}

const GENEROS: ReadonlyArray<{ valor: Genero; rotulo: string }> = [
  { valor: 'homem', rotulo: 'Homem' },
  { valor: 'mulher', rotulo: 'Mulher' },
  { valor: 'outro', rotulo: 'Outro' },
  { valor: 'nao_informar', rotulo: 'Prefiro não informar' },
];

const rotuloGenero = (g: Genero): string => GENEROS.find((x) => x.valor === g)?.rotulo ?? 'Prefiro não informar';

const emailValido = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const telefoneValido = (v: string): boolean => {
  const digitos = v.replace(/\D/g, '');
  return digitos.length === 10 || digitos.length === 11;
};

const TIPOS_IMAGEM_ACEITOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TAMANHO_MAX_FOTO = 5 * 1024 * 1024; // 5 MB

/**
 * Lê uma imagem escolhida pelo usuário e devolve um data URL.
 * INTEGRAÇÃO: para persistir a foto, envie o `File` original ao storage do
 * backend em `onPerfilAtualizado` / upload próprio e troque `fotoUrl` pela URL final.
 */
function lerImagem(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!TIPOS_IMAGEM_ACEITOS.includes(arquivo.type)) {
      reject(new Error('Formato não aceito. Use PNG, JPG, WEBP ou GIF.'));
      return;
    }
    if (arquivo.size > TAMANHO_MAX_FOTO) {
      reject(new Error('A imagem é grande demais. O limite é 5 MB.'));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.readAsDataURL(arquivo);
  });
}

/* =============================================================================
 * 7. ÍCONES (SVG inline, herdam a cor via currentColor)
 * ========================================================================== */

const IconeEngrenagem = () => (
  <svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor" aria-hidden="true">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);

const IconeEnvelope = () => (
  <svg viewBox="0 0 48 36" width="46" height="36" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="3" width="44" height="30" rx="5" />
    <path d="M3 6l21 15L45 6M3 31l15-13M45 31L30 18" />
  </svg>
);

const IconeSeta = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

const IconeAvatarPadrao = ({ tamanho }: { tamanho: number }) => (
  <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} aria-hidden="true">
    <circle cx="50" cy="50" r="50" fill="#000" />
    <circle cx="50" cy="38" r="15" fill="#fff" />
    <path d="M18 88c4-20 18-28 32-28s28 8 32 28a50 50 0 0 1-64 0z" fill="#fff" />
  </svg>
);

/** Rostos do check-in. Cada rosto usa a cor da sua emoção (ver EMOCOES). */
const RostoEmocao = ({ chave, cor }: { chave: EmocaoChave; cor: string }) => {
  const tr = { stroke: CORES.azulMarinho, strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="39" fill={cor} />
      {chave === 'muito_feliz' && (
        <>
          <path d="M20 31q5-7 10 0M50 31q5-7 10 0" {...tr} />
          <path d="M20 46h40a20 18 0 0 1-40 0z" fill={CORES.azulMarinho} />
        </>
      )}
      {chave === 'feliz' && (
        <>
          <circle cx="29" cy="32" r="3.5" fill={CORES.azulMarinho} />
          <circle cx="51" cy="32" r="3.5" fill={CORES.azulMarinho} />
          <path d="M26 48q14 12 28 0" {...tr} />
        </>
      )}
      {chave === 'neutro' && (
        <>
          <circle cx="29" cy="32" r="3.5" fill={CORES.azulMarinho} />
          <circle cx="51" cy="32" r="3.5" fill={CORES.azulMarinho} />
          <path d="M27 52h26" {...tr} />
        </>
      )}
      {chave === 'triste' && (
        <>
          <circle cx="29" cy="32" r="3.5" fill={CORES.azulMarinho} />
          <circle cx="51" cy="32" r="3.5" fill={CORES.azulMarinho} />
          <path d="M26 56q14-12 28 0" {...tr} />
        </>
      )}
      {chave === 'muito_triste' && (
        <>
          <path d="M23 26l9 9M32 26l-9 9M48 26l9 9M57 26l-9 9" {...tr} strokeWidth={3.4} />
          <path d="M28 60a12 13 0 0 1 24 0z" fill={CORES.azulMarinho} />
        </>
      )}
    </svg>
  );
};

const IconeMenuHome = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3z" /></svg>);
const IconeMenuEvolua = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" /></svg>);
const IconeMenuChat = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 4h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-3 3v-3H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M17 8h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2v3l-4-3h-5a2 2 0 0 1-2-2v-1h6a3 3 0 0 0 3-3z" />
  </svg>
);
const IconeMenuProgresso = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="2" y="14" width="4" height="8" /><rect x="8" y="10" width="4" height="12" /><rect x="14" y="12" width="4" height="10" /><rect x="20" y="6" width="3" height="16" />
    <path d="M2 10l6-5 4 3 7-6 1.5 1.5-8.5 7.2-4-3L3.5 12z" />
  </svg>
);
const IconeMenuSaiba = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9z" />
    <path d="M2 15l10 2 10-2v6l-10-2-10 2z" />
  </svg>
);

/* =============================================================================
 * 8. COMPONENTES BASE
 * ========================================================================== */

/** Foto de perfil (ou avatar padrão). Lê a foto do estado compartilhado. */
function Avatar({ tamanho }: { tamanho: number }) {
  const { estado } = useEvolua();
  const { fotoUrl, apelido } = estado.perfil;
  return (
    <span className="ev-avatar" style={{ width: tamanho, height: tamanho }}>
      {fotoUrl ? <img src={fotoUrl} alt={`Foto de perfil de ${apelido}`} /> : <IconeAvatarPadrao tamanho={tamanho} />}
    </span>
  );
}

interface PropsCabecalho {
  titulo: string;
  subtitulo?: string;
  mostrarFoto?: boolean;          // foto à esquerda → abre Meu Perfil
  mostrarConfiguracoes?: boolean; // engrenagem → abre Configurações
  mostrarNotificacoes?: boolean;  // envelope → abre Notificações (com contador de não lidas)
}

/**
 * Cabeçalho reutilizado por todas as páginas. Título sempre centralizado.
 * Cada ícone leva à sua página conforme a especificação.
 */
function Cabecalho({ titulo, subtitulo, mostrarFoto, mostrarConfiguracoes = true, mostrarNotificacoes }: PropsCabecalho) {
  const { estado, acoes } = useEvolua();
  const naoLidas = estado.notificacoes.filter((n) => n.status === 'nao_lida').length;
  return (
    <header className="ev-cabecalho">
      <div className="ev-cabecalho__esq">
        {mostrarFoto && (
          <button className="ev-avatar-btn" onClick={() => acoes.irPara('perfil')} aria-label="Abrir Meu Perfil">
            <Avatar tamanho={74} />
          </button>
        )}
      </div>
      <div className="ev-cabecalho__centro">
        <h1 className="ev-titulo">{titulo}</h1>
        {subtitulo && <p className="ev-subtitulo">{subtitulo}</p>}
      </div>
      <div className="ev-cabecalho__dir">
        {mostrarConfiguracoes && (
          <button className="ev-btn-icone" onClick={() => acoes.irPara('configuracoes')} aria-label="Abrir Configurações">
            <IconeEngrenagem />
          </button>
        )}
        {mostrarNotificacoes && (
          <button
            className="ev-btn-icone"
            onClick={() => acoes.irPara('notificacoes')}
            aria-label={naoLidas > 0 ? `Abrir Notificações (${naoLidas} não lidas)` : 'Abrir Notificações'}
          >
            <IconeEnvelope />
            {naoLidas > 0 && <span className="ev-selo">{naoLidas}</span>}
          </button>
        )}
      </div>
    </header>
  );
}

/* ---- Menu de Navegação inferior ----
 * Cinco botões. Cada um corresponde a uma rota:
 *   Home      → 'home'      (implementada aqui)
 *   Evolua    → 'evolua'    (página de outro colaborador)
 *   Chat      → 'chat'      (página de outro colaborador)
 *   Progresso → 'progresso' (página de outro colaborador)
 *   Saiba +   → 'saibaMais' (página de outro colaborador)
 * Para conectar uma página externa: passe-a em `paginasExternas` com o id da
 * rota (ex.: paginasExternas={{ chat: PaginaChat }}). Enquanto não houver
 * página registrada, aparece um placeholder neutro (PaginaExternaPlaceholder).
 * O botão da seção atual recebe aria-current="page" e destaque visual.
 * Perfil, Configurações e Notificações não marcam nenhum botão (como no design).
 */
const ITENS_MENU: ReadonlyArray<{ rota: Rota; rotulo: string; Icone: () => JSX.Element }> = [
  { rota: 'home', rotulo: 'Home', Icone: IconeMenuHome },
  { rota: 'evolua', rotulo: 'Evolua', Icone: IconeMenuEvolua },
  { rota: 'chat', rotulo: 'Chat', Icone: IconeMenuChat },
  { rota: 'progresso', rotulo: 'Progresso', Icone: IconeMenuProgresso },
  { rota: 'saibaMais', rotulo: 'Saiba +', Icone: IconeMenuSaiba },
];

function MenuNavegacao() {
  const { estado, acoes } = useEvolua();
  return (
    <nav className="ev-menu" aria-label="Navegação principal">
      {ITENS_MENU.map(({ rota, rotulo, Icone }) => (
        <button
          key={rota}
          className="ev-menu__botao"
          aria-current={estado.rota === rota ? 'page' : undefined}
          onClick={() => acoes.irPara(rota)}
        >
          <Icone />
          <span>{rotulo}</span>
        </button>
      ))}
    </nav>
  );
}

/**
 * Placeholder exibido quando uma rota externa ainda não tem página registrada.
 * NÃO contém conteúdo de negócio: serve apenas para sinalizar o ponto de integração.
 */
function PaginaExternaPlaceholder({ rota }: { rota: RotaExterna }) {
  return (
    <div className="ev-externa" role="status">
      <p>
        Ponto de integração: a página <strong>{rota}</strong> será conectada aqui.
      </p>
    </div>
  );
}

/* =============================================================================
 * 9. PÁGINA HOME
 * ========================================================================== */

/** Cartões de atividades com rolagem horizontal, fade nas bordas e seta indicativa. */
function CarrosselAtividades() {
  const { acoes } = useEvolua();
  const trilhoRef = useRef<HTMLDivElement>(null);
  // posicao controla qual fade aparece: início (só direita), meio (ambos) ou fim (só esquerda).
  const [posicao, setPosicao] = useState<'inicio' | 'meio' | 'fim'>('inicio');

  const atualizarPosicao = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 4) setPosicao('fim'); // tudo cabe: não há mais opções à direita
    else if (el.scrollLeft <= 4) setPosicao('inicio');
    else if (el.scrollLeft >= max - 4) setPosicao('fim');
    else setPosicao('meio');
  }, []);

  useEffect(() => {
    atualizarPosicao();
    window.addEventListener('resize', atualizarPosicao);
    return () => window.removeEventListener('resize', atualizarPosicao);
  }, [atualizarPosicao]);

  const rolarParaDireita = () => trilhoRef.current?.scrollBy({ left: 190, behavior: 'smooth' });

  return (
    <div className={`ev-carrossel ev-carrossel--${posicao}`}>
      <div className="ev-carrossel__trilho" ref={trilhoRef} onScroll={atualizarPosicao} role="list">
        {ATIVIDADES_HOME.map((a) => (
          <button
            key={a.rota}
            role="listitem"
            className="ev-atividade"
            style={{ background: a.fundo, color: a.texto }}
            // PONTO DE INTEGRAÇÃO: abre a página do colega registrada em paginasExternas[a.rota].
            onClick={() => acoes.irPara(a.rota)}
          >
            {a.titulo}
          </button>
        ))}
      </div>
      <button className="ev-carrossel__seta" onClick={rolarParaDireita} aria-label="Ver mais atividades" tabIndex={posicao === 'fim' ? -1 : 0}>
        <IconeSeta />
      </button>
    </div>
  );
}

/** Página inicial: boas-vindas, atividades e check-in emocional. */
function PaginaHome() {
  const { estado } = useEvolua();
  const frase = useMemo(() => fraseDoDia(), []);
  return (
    <>
      <Cabecalho titulo="Home" mostrarFoto mostrarConfiguracoes mostrarNotificacoes />
      <section className="ev-cartao" aria-labelledby="ev-saudacao">
        {/* O apelido vem do estado compartilhado: mudou nas Configurações, muda aqui. */}
        <h2 className="ev-saudacao" id="ev-saudacao">Olá, {estado.perfil.apelido}!</h2>
        <p className="ev-frase">{frase}</p>
        <h3 className="ev-secao-titulo">Suas atividades:</h3>
        <CarrosselAtividades />
      </section>
      <CheckinEmocional />
    </>
  );
}

/* =============================================================================
 * 10. CHECK-IN EMOCIONAL
 * -----------------------------------------------------------------------------
 * Fluxo: o usuário escolhe uma emoção (clicando no rosto OU arrastando o
 * indicador), ajusta ansiedade, estresse e energia (1–10) e toca em
 * "Salvar o meu dia". Então acoes.salvarCheckin() cria um RegistroCheckin
 * (formato e guia de uso na seção 4) e chama `onCheckinSalvo` para o backend.
 * ========================================================================== */

/**
 * Indicador deslizante de emoção: barra com 5 segmentos coloridos e uma bolinha
 * que "encaixa" no segmento da emoção. Aceita arrastar (mouse/toque) e teclado
 * (setas). Índice 0 = muito feliz (lado "+") … 4 = muito triste (lado "−").
 */
function IndicadorEmocao({ indice, onChange }: { indice: number | null; onChange: (i: number) => void }) {
  const trilhaRef = useRef<HTMLDivElement>(null);
  const arrastando = useRef(false);

  const indiceDoPonteiro = (clientX: number): number => {
    const caixa = trilhaRef.current!.getBoundingClientRect();
    const proporcao = (clientX - caixa.left) / caixa.width;
    return Math.min(4, Math.max(0, Math.floor(proporcao * 5)));
  };

  const aoPressionar = (e: React.PointerEvent<HTMLDivElement>) => {
    arrastando.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(indiceDoPonteiro(e.clientX));
  };
  const aoMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (arrastando.current) onChange(indiceDoPonteiro(e.clientX));
  };
  const aoSoltar = () => { arrastando.current = false; };

  const aoTeclar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const atual = indice ?? 2;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.max(0, atual - 1)); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.min(4, atual + 1)); }
  };

  const posicaoPercentual = indice === null ? 50 : indice * 20 + 10; // centro do segmento

  return (
    <div className="ev-escala-emocao">
      <span className="ev-escala-emocao__sinal" style={{ color: CORES.roxoVibrante }} aria-hidden="true">+</span>
      <div
        className="ev-escala-emocao__trilha"
        ref={trilhaRef}
        role="slider"
        tabIndex={0}
        aria-label="Indicador de emoção"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={indice ?? undefined}
        aria-valuetext={indice === null ? 'Nenhuma emoção selecionada' : EMOCOES[indice].rotulo}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onKeyDown={aoTeclar}
      >
        <div className="ev-escala-emocao__faixa" aria-hidden="true">
          {EMOCOES.map((e) => (<span key={e.chave} style={{ background: e.cor }} />))}
        </div>
        <span className={`ev-polegar${indice === null ? ' ev-polegar--inativo' : ''}`} style={{ left: `${posicaoPercentual}%` }} />
      </div>
      <span className="ev-escala-emocao__sinal" style={{ color: CORES.turquesa }} aria-hidden="true">−</span>
    </div>
  );
}

/** Controle numérico 1–10 (ansiedade, estresse ou energia). `valor` null = ainda não escolhido ("- /10"). */
function EscalaNumerica({ id, rotulo, valor, onChange }: { id: string; rotulo: string; valor: number | null; onChange: (v: number) => void }) {
  // Confirma o valor também ao soltar/teclar, pois o usuário pode tocar na bolinha já no 5 sem "mudar" o valor.
  const confirmar = (e: React.SyntheticEvent<HTMLInputElement>) => onChange(Number(e.currentTarget.value));
  return (
    <div className="ev-escala-numerica">
      <div className="ev-escala-numerica__linha">
        <label className="ev-escala-numerica__rotulo" htmlFor={id}>{rotulo}</label>
        <span className="ev-escala-numerica__valor" aria-live="polite">{valor ?? '-'} /10</span>
      </div>
      <input
        id={id}
        className={`ev-range${valor === null ? ' ev-range--inativo' : ''}`}
        type="range"
        min={1}
        max={10}
        step={1}
        value={valor ?? 5}
        onChange={confirmar}
        onPointerUp={confirmar}
        onKeyUp={confirmar}
      />
    </div>
  );
}

/** Cartão "Como está se sentindo hoje?" da Home. */
function CheckinEmocional() {
  const { acoes } = useEvolua();
  const [indiceEmocao, setIndiceEmocao] = useState<number | null>(null);
  const [ansiedade, setAnsiedade] = useState<number | null>(null);
  const [estresse, setEstresse] = useState<number | null>(null);
  const [energia, setEnergia] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const salvar = () => {
    // Validação: todos os campos precisam ter sido escolhidos pelo usuário.
    const faltando: string[] = [];
    if (indiceEmocao === null) faltando.push('a emoção');
    if (ansiedade === null) faltando.push('a ansiedade');
    if (estresse === null) faltando.push('o estresse');
    if (energia === null) faltando.push('a energia');
    if (faltando.length > 0) {
      setAviso({ tipo: 'erro', texto: `Para salvar, escolha ${faltando.join(', ')}.` });
      return;
    }
    const registro = acoes.salvarCheckin({
      emocao: EMOCOES[indiceEmocao as number].chave,
      ansiedade: ansiedade as number,
      estresse: estresse as number,
      energia: energia as number,
    });
    setAviso({
      tipo: 'ok',
      texto: `Dia salvo em ${new Date(registro.criadoEmISO).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.`,
    });
    // Reinicia o formulário para um novo registro.
    setIndiceEmocao(null); setAnsiedade(null); setEstresse(null); setEnergia(null);
  };

  return (
    <section className="ev-cartao" aria-labelledby="ev-checkin-titulo">
      <h2 className="ev-secao-titulo" id="ev-checkin-titulo" style={{ fontSize: 28 }}>Como está se sentindo hoje?</h2>

      <div className="ev-emocoes" role="radiogroup" aria-label="Emoção de hoje">
        {EMOCOES.map((e, i) => (
          <button
            key={e.chave}
            className="ev-emocao"
            role="radio"
            aria-checked={indiceEmocao === i}
            aria-label={e.rotulo}
            title={e.rotulo}
            onClick={() => setIndiceEmocao(i)}
          >
            <RostoEmocao chave={e.chave} cor={e.cor} />
          </button>
        ))}
      </div>

      <IndicadorEmocao indice={indiceEmocao} onChange={setIndiceEmocao} />

      <EscalaNumerica id="ev-ansiedade" rotulo="Ansiedade" valor={ansiedade} onChange={setAnsiedade} />
      <EscalaNumerica id="ev-estresse" rotulo="Estresse" valor={estresse} onChange={setEstresse} />
      <EscalaNumerica id="ev-energia" rotulo="Energia" valor={energia} onChange={setEnergia} />

      <button className="ev-btn-primario" onClick={salvar}>Salvar o meu dia</button>
      {aviso && <p className={`ev-aviso ev-aviso--${aviso.tipo}`} role="status">{aviso.texto}</p>}
    </section>
  );
}

/* =============================================================================
 * 11. PÁGINA MEU PERFIL
 * Nome, sobrenome, apelido e foto vêm do estado compartilhado (mesma fonte das
 * Configurações). A biografia é editada aqui e gravada no mesmo estado.
 * ========================================================================== */

/** Cartões de atividades do Perfil. Cada `rota` é um ponto de integração com outro colaborador. */
const ATIVIDADES_PERFIL: ReadonlyArray<{ rota: RotaExterna; titulo: string; fundo: string }> = [
  { rota: 'historicoCheckin', titulo: 'Chek-in Emocional', fundo: CORES.rosaVibrante },
  { rota: 'evolucaoPessoal', titulo: 'Evolução Pessoal', fundo: CORES.azulProfundo },
  { rota: 'questionarios', titulo: 'Questionarios', fundo: CORES.turquesa },
  { rota: 'exercicios', titulo: 'Exercícios', fundo: CORES.laranja },
];

function PaginaPerfil() {
  const { estado, acoes } = useEvolua();
  const { perfil } = estado;
  return (
    <>
      <Cabecalho titulo="Meu Perfil" mostrarConfiguracoes mostrarNotificacoes />

      <section className="ev-cartao" aria-label="Dados do perfil">
        <div className="ev-perfil__topo">
          <Avatar tamanho={168} />
        </div>
        <h2 className="ev-perfil__nome">{perfil.nome} {perfil.sobrenome}</h2>
        <p className="ev-perfil__apelido">{perfil.apelido}</p>
        <label className="ev-perfil__bio-rotulo" htmlFor="ev-bio">Biografia:</label>
        <textarea
          id="ev-bio"
          className="ev-perfil__bio"
          placeholder="Apresente-se aqui!"
          maxLength={500}
          value={perfil.biografia}
          onChange={(e) => acoes.atualizarPerfil({ biografia: e.target.value })}
        />
      </section>

      <section className="ev-cartao" aria-labelledby="ev-ativ-perfil">
        <h2 className="ev-secao-titulo" id="ev-ativ-perfil" style={{ fontSize: 30 }}>Suas Atividades aparecerão aqui</h2>
        <div className="ev-grade-atividades">
          {ATIVIDADES_PERFIL.map((a) => (
            // PONTO DE INTEGRAÇÃO: cada cartão abre a página registrada em paginasExternas[a.rota].
            <button key={a.rota} style={{ background: a.fundo }} onClick={() => acoes.irPara(a.rota)}>
              {a.titulo}
            </button>
          ))}
          <button className="ev-metas" style={{ background: CORES.verdeMenta, color: '#fff' }} onClick={() => acoes.irPara('metas')}>
            <span>Metas</span>
            <span className="ev-metas__barras" aria-hidden="true">
              <span style={{ height: '45%' }} /><span style={{ height: '70%' }} /><span style={{ height: '100%' }} />
            </span>
          </button>
        </div>
        {/* Indicador "..." do design: apenas sinaliza que a seção é extensível. */}
        <span className="ev-mais" aria-hidden="true">. . .</span>
      </section>
    </>
  );
}

/* =============================================================================
 * 12. PÁGINA CONFIGURAÇÕES
 * Cada linha abre um painel (um por vez). Tudo que muda o perfil passa por
 * acoes.atualizarPerfil / acoes.atualizarContato, refletindo em todas as páginas.
 * Fluxos que dependem de servidor usam `servicos` (seção 5) e deixam isso
 * explícito na tela — nada de segurança simulada.
 * ========================================================================== */

type SecaoConfig = 'foto' | 'nome' | 'apelido' | 'nascimento' | 'genero' | 'telefone' | 'email' | 'senha';
type AvisoConfig = { tipo: 'ok' | 'erro' | 'info'; texto: string };

interface PropsLinha {
  id: SecaoConfig;
  rotulo: string;
  valor?: React.ReactNode;
  aberta: boolean;
  onAlternar: (id: SecaoConfig) => void;
  children: React.ReactNode;
}

/** Linha da lista de configurações com painel expansível. */
function LinhaConfig({ id, rotulo, valor, aberta, onAlternar, children }: PropsLinha) {
  return (
    <div className={`ev-linha${aberta ? ' ev-linha--aberta' : ''}`}>
      <button className="ev-linha__cabeca" aria-expanded={aberta} aria-controls={`ev-painel-${id}`} onClick={() => onAlternar(id)}>
        <span className="ev-linha__rotulo">{rotulo}</span>
        <span className={`ev-linha__valor${id === 'foto' ? ' ev-linha__valor--avatar' : ''}`}>{valor}</span>
        <span className="ev-seta"><IconeSeta /></span>
      </button>
      {aberta && <div className="ev-linha__painel" id={`ev-painel-${id}`}>{children}</div>}
    </div>
  );
}

/** Painel de foto: arquivos do dispositivo, galeria e arrastar-e-soltar. */
function PainelFoto({ onAviso }: { onAviso: (a: AvisoConfig) => void }) {
  const { acoes } = useEvolua();
  const [arrastando, setArrastando] = useState(false);
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const entradaGaleria = useRef<HTMLInputElement>(null);

  const processar = async (arquivo?: File | null) => {
    if (!arquivo) return;
    try {
      const url = await lerImagem(arquivo);
      acoes.atualizarPerfil({ fotoUrl: url }); // reflete em Home, Perfil e Notificações
      onAviso({ tipo: 'ok', texto: 'Foto de perfil atualizada.' });
    } catch (erro) {
      onAviso({ tipo: 'erro', texto: (erro as Error).message });
    }
  };

  return (
    <>
      <div
        className={`ev-zona${arrastando ? ' ev-zona--ativa' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); processar(e.dataTransfer.files?.[0]); }}
      >
        Arraste uma imagem para cá
      </div>
      {/* "Arquivos": seletor de arquivos do computador ou do celular. */}
      <input ref={entradaArquivo} className="ev-oculto" type="file" accept={TIPOS_IMAGEM_ACEITOS.join(',')} aria-label="Escolher imagem do dispositivo"
        onChange={(e) => { processar(e.target.files?.[0]); e.target.value = ''; }} />
      {/* "Galeria": em celulares, accept="image/*" abre a galeria de fotos. */}
      <input ref={entradaGaleria} className="ev-oculto" type="file" accept="image/*" aria-label="Escolher imagem da galeria"
        onChange={(e) => { processar(e.target.files?.[0]); e.target.value = ''; }} />
      <button className="ev-btn-secundario" onClick={() => entradaArquivo.current?.click()}>Escolher do dispositivo</button>
      <button className="ev-btn-secundario" onClick={() => entradaGaleria.current?.click()}>Escolher da galeria</button>
      {/* INTEGRAÇÃO: para guardar a foto no servidor, envie o arquivo ao storage e troque fotoUrl pela URL final. */}
    </>
  );
}

/** Painel de nome e sobrenome. */
function PainelNome({ onAviso }: { onAviso: (a: AvisoConfig) => void }) {
  const { estado, acoes } = useEvolua();
  const [nome, setNome] = useState(estado.perfil.nome);
  const [sobrenome, setSobrenome] = useState(estado.perfil.sobrenome);
  const salvar = () => {
    if (!nome.trim()) { onAviso({ tipo: 'erro', texto: 'Informe o nome.' }); return; }
    acoes.atualizarPerfil({ nome: nome.trim(), sobrenome: sobrenome.trim() });
    onAviso({ tipo: 'ok', texto: 'Nome atualizado.' });
  };
  return (
    <>
      <h3>Insira seus dados:</h3>
      <div className="ev-campos-duplos">
        <label className="ev-campo">Nome<input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" /></label>
        <label className="ev-campo">Sobrenome<input value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} autoComplete="family-name" /></label>
      </div>
      <button className="ev-btn-confirmar" onClick={salvar}>Salvar</button>
    </>
  );
}

/** Painel de apelido. */
function PainelApelido({ onAviso }: { onAviso: (a: AvisoConfig) => void }) {
  const { estado, acoes } = useEvolua();
  const [apelido, setApelido] = useState(estado.perfil.apelido);
  const salvar = () => {
    if (!apelido.trim()) { onAviso({ tipo: 'erro', texto: 'Informe um apelido.' }); return; }
    acoes.atualizarPerfil({ apelido: apelido.trim() }); // atualiza a saudação da Home
    onAviso({ tipo: 'ok', texto: 'Apelido atualizado.' });
  };
  return (
    <>
      <h3>Insira seu apelido:</h3>
      <label className="ev-campo">Apelido<input value={apelido} onChange={(e) => setApelido(e.target.value)} maxLength={30} autoComplete="nickname" /></label>
      <button className="ev-btn-confirmar" onClick={salvar}>Salvar</button>
    </>
  );
}

/** Painel de data de nascimento. */
function PainelNascimento({ onAviso }: { onAviso: (a: AvisoConfig) => void }) {
  const { estado, acoes } = useEvolua();
  const [data, setData] = useState(estado.perfil.dataNascimento ?? '');
  const salvar = () => {
    if (data && data > dataLocalISO(new Date())) { onAviso({ tipo: 'erro', texto: 'A data de nascimento não pode estar no futuro.' }); return; }
    acoes.atualizarPerfil({ dataNascimento: data || null });
    onAviso({ tipo: 'ok', texto: 'Data de nascimento atualizada.' });
  };
  return (
    <>
      <label className="ev-campo">Data de nascimento
        <input type="date" value={data} max={dataLocalISO(new Date())} onChange={(e) => setData(e.target.value)} autoComplete="bday" />
      </label>
      <button className="ev-btn-confirmar" onClick={salvar}>Salvar</button>
    </>
  );
}

/** Painel de gênero (grava ao escolher). */
function PainelGenero({ onAviso }: { onAviso: (a: AvisoConfig) => void }) {
  const { estado, acoes } = useEvolua();
  return (
    <div className="ev-opcoes" role="radiogroup" aria-label="Gênero">
      {GENEROS.map((g) => (
        <label key={g.valor} className="ev-opcao">
          <input
            type="radio"
            name="ev-genero"
            checked={estado.perfil.genero === g.valor}
            onChange={() => { acoes.atualizarPerfil({ genero: g.valor }); onAviso({ tipo: 'ok', texto: 'Gênero atualizado.' }); }}
          />
          {g.rotulo}
        </label>
      ))}
    </div>
  );
}

/**
 * Painel de alteração de e-mail ou telefone, em duas etapas:
 *  1) o usuário informa o novo valor e solicita um código;
 *  2) o usuário digita o código recebido e confirma.
 * As DUAS etapas dependem do backend (servicos.solicitarCodigoAlteracaoContato /
 * servicos.confirmarAlteracaoContato). O contato só é alterado localmente se o
 * serviço confirmar ok — nunca antes.
 */
function PainelContato({ tipo, onAviso }: { tipo: 'email' | 'telefone'; onAviso: (a: AvisoConfig) => void }) {
  const { acoes, servicos } = useEvolua();
  const [novoValor, setNovoValor] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'informar' | 'codigo'>('informar');
  const [ocupado, setOcupado] = useState(false);
  const nomeCampo = tipo === 'email' ? 'e-mail' : 'telefone';

  const solicitar = async () => {
    const valido = tipo === 'email' ? emailValido(novoValor) : telefoneValido(novoValor);
    if (!valido) { onAviso({ tipo: 'erro', texto: tipo === 'email' ? 'Informe um e-mail válido.' : 'Informe um telefone com DDD.' }); return; }
    setOcupado(true);
    const r = await servicos.solicitarCodigoAlteracaoContato({ tipo, novoValor: novoValor.trim() });
    setOcupado(false);
    if (r.ok) { setEtapa('codigo'); onAviso({ tipo: 'info', texto: r.mensagem ?? `Enviamos um código de verificação para o novo ${nomeCampo}.` }); }
    else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível solicitar o código.' });
  };

  const confirmar = async () => {
    if (!codigo.trim()) { onAviso({ tipo: 'erro', texto: 'Digite o código recebido.' }); return; }
    setOcupado(true);
    const r = await servicos.confirmarAlteracaoContato({ tipo, novoValor: novoValor.trim(), codigo: codigo.trim() });
    setOcupado(false);
    if (r.ok) {
      acoes.atualizarContato(tipo === 'email' ? { email: novoValor.trim() } : { telefone: novoValor.trim() });
      setNovoValor(''); setCodigo(''); setEtapa('informar');
      onAviso({ tipo: 'ok', texto: `${tipo === 'email' ? 'E-mail' : 'Telefone'} atualizado.` });
    } else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Código inválido.' });
  };

  return (
    <>
      <span className="ev-dependencia">Depende do backend: o envio e a validação do código são feitos pelo servidor.</span>
      <label className="ev-campo">
        Novo {nomeCampo}
        <input
          type={tipo === 'email' ? 'email' : 'tel'}
          value={novoValor}
          onChange={(e) => setNovoValor(e.target.value)}
          disabled={etapa === 'codigo'}
          autoComplete={tipo === 'email' ? 'email' : 'tel'}
        />
      </label>
      {etapa === 'informar' ? (
        <button className="ev-btn-confirmar" onClick={solicitar} disabled={ocupado}>Enviar código</button>
      ) : (
        <>
          <label className="ev-campo">Código de verificação
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} inputMode="numeric" autoComplete="one-time-code" />
          </label>
          <button className="ev-btn-confirmar" onClick={confirmar} disabled={ocupado}>Confirmar</button>
          <button className="ev-btn-secundario" onClick={() => { setEtapa('informar'); setCodigo(''); }}>Cancelar</button>
        </>
      )}
    </>
  );
}

/**
 * Painel de senha: alteração (senha atual + nova + confirmação) e recuperação
 * por e-mail ou telefone com código. Senhas ficam SOMENTE em estados locais do
 * componente e são enviadas ao backend; nunca vão para o estado compartilhado.
 * Todas as ações abaixo dependem de backend (servicos.*).
 */
function PainelSenha({ onAviso }: { onAviso: (a: AvisoConfig) => void }) {
  const { servicos } = useEvolua();
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
    else onAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível alterar a senha.' });
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
    <>
      <span className="ev-dependencia">Depende do backend: a validação de senha e o envio de códigos são feitos pelo servidor.</span>
      {modo === 'alterar' ? (
        <>
          <label className="ev-campo">Senha atual<input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} autoComplete="current-password" /></label>
          <label className="ev-campo">Nova senha<input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" /></label>
          <label className="ev-campo">Confirme a nova senha<input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="new-password" /></label>
          <button className="ev-btn-confirmar" onClick={alterar} disabled={ocupado}>Alterar senha</button>
          <button className="ev-btn-secundario" onClick={() => { limpar(); setModo('recuperar'); }}>Esqueci minha senha</button>
        </>
      ) : (
        <>
          <h3>Recuperar senha</h3>
          <div className="ev-opcoes" role="radiogroup" aria-label="Receber código por">
            <label className="ev-opcao"><input type="radio" name="ev-canal" checked={canal === 'email'} onChange={() => setCanal('email')} disabled={codigoEnviado} />Receber código por e-mail</label>
            <label className="ev-opcao"><input type="radio" name="ev-canal" checked={canal === 'telefone'} onChange={() => setCanal('telefone')} disabled={codigoEnviado} />Receber código por telefone</label>
          </div>
          {!codigoEnviado ? (
            <button className="ev-btn-confirmar" onClick={enviarCodigo} disabled={ocupado}>Enviar código</button>
          ) : (
            <>
              <label className="ev-campo">Código de verificação<input value={codigo} onChange={(e) => setCodigo(e.target.value)} inputMode="numeric" autoComplete="one-time-code" /></label>
              <label className="ev-campo">Nova senha<input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} autoComplete="new-password" /></label>
              <label className="ev-campo">Confirme a nova senha<input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="new-password" /></label>
              <button className="ev-btn-confirmar" onClick={redefinir} disabled={ocupado}>Redefinir senha</button>
            </>
          )}
          <button className="ev-btn-secundario" onClick={() => { limpar(); setModo('alterar'); }}>Voltar</button>
        </>
      )}
    </>
  );
}

function PaginaConfiguracoes() {
  const { estado, servicos, onLogout } = useEvolua();
  const { perfil } = estado;
  const [secaoAberta, setSecaoAberta] = useState<SecaoConfig | null>(null);
  const [aviso, setAviso] = useState<AvisoConfig | null>(null);

  const alternar = (id: SecaoConfig) => { setSecaoAberta((atual) => (atual === id ? null : id)); setAviso(null); };
  const propsLinha = (id: SecaoConfig) => ({ id, aberta: secaoAberta === id, onAlternar: alternar });

  /** Logout: depende do backend. Só chama onLogout se o serviço confirmar. */
  const sair = async () => {
    const r = await servicos.encerrarSessao();
    if (r.ok) onLogout?.();
    else setAviso({ tipo: 'erro', texto: r.mensagem ?? 'Não foi possível encerrar a sessão.' });
  };

  return (
    <>
      <Cabecalho titulo="Configurações" mostrarConfiguracoes mostrarNotificacoes />
      {aviso && <p className={`ev-aviso ev-aviso--${aviso.tipo}`} role="status" style={{ marginBottom: 12 }}>{aviso.texto}</p>}

      <LinhaConfig {...propsLinha('foto')} rotulo="Foto" valor={<Avatar tamanho={94} />}>
        <PainelFoto onAviso={setAviso} />
      </LinhaConfig>
      <LinhaConfig {...propsLinha('nome')} rotulo="Nome" valor={`${perfil.nome} ${perfil.sobrenome}`.trim()}>
        <PainelNome onAviso={setAviso} />
      </LinhaConfig>
      <LinhaConfig {...propsLinha('apelido')} rotulo="Apelido" valor={perfil.apelido}>
        <PainelApelido onAviso={setAviso} />
      </LinhaConfig>
      <LinhaConfig {...propsLinha('nascimento')} rotulo="Data de Nascimento" valor={formatarDataNascimento(perfil.dataNascimento)}>
        <PainelNascimento onAviso={setAviso} />
      </LinhaConfig>
      <LinhaConfig {...propsLinha('genero')} rotulo="Gênero" valor={rotuloGenero(perfil.genero)}>
        <PainelGenero onAviso={setAviso} />
      </LinhaConfig>
      <LinhaConfig {...propsLinha('telefone')} rotulo="Telefone" valor={perfil.contato.telefone}>
        <PainelContato tipo="telefone" onAviso={setAviso} />
      </LinhaConfig>
      <LinhaConfig {...propsLinha('email')} rotulo="E-MAIL" valor={perfil.contato.email}>
        <PainelContato tipo="email" onAviso={setAviso} />
      </LinhaConfig>
      <LinhaConfig {...propsLinha('senha')} rotulo="Senha" valor="Redefinir senha">
        <PainelSenha onAviso={setAviso} />
      </LinhaConfig>

      <button className="ev-btn-logout" onClick={sair}>Fazer logout</button>
    </>
  );
}

/* =============================================================================
 * 13. PÁGINA NOTIFICAÇÕES
 * -----------------------------------------------------------------------------
 * Regras:
 *  - Abre na aba "Não Lidas" (preferencias.abaNotificacoesInicial).
 *  - Só vira "lida" quando o usuário ABRE o conteúdo (toque no cartão).
 *  - Ao abrir, mostra a mensagem completa + "Marcar como não lida" e "Arquivar".
 *  - O cartão aberto permanece visível até ser fechado ou a aba ser trocada;
 *    depois disso ele aparece na aba do seu novo status.
 *
 * COMO CONECTAR AO BACKEND / FONTE DE DADOS:
 *  1. ENTRADA: carregue as notificações do servidor e passe em
 *     `notificacoesIniciais` (formato Notificacao). Para atualizar depois
 *     (ex.: push/polling), remonte o módulo com novos dados ou, se preferir, estenda
 *     o reducer com uma ação 'notificacao/substituirTodas'.
 *  2. SAÍDA: toda mudança de status (ler, marcar como não lida, arquivar) dispara
 *     `onNotificacoesAlteradas(lista)`. Persista no servidor lá (ex.: PATCH
 *     /notificacoes/:id { status }). A lista completa chega atualizada.
 *  3. Títulos, mensagens, datas e status ficam todos em `Notificacao`; editar
 *     NOTIFICACOES_EXEMPLO (seção 4) ou os dados vindos do backend basta.
 * ========================================================================== */

const ABAS_NOTIFICACAO: ReadonlyArray<{ id: AbaNotificacoes; rotulo: string; vazio: string }> = [
  { id: 'nao_lida', rotulo: 'Não Lidas', vazio: 'Você não tem notificações não lidas.' },
  { id: 'lida', rotulo: 'Lidas', vazio: 'Você ainda não tem notificações lidas.' },
  { id: 'arquivada', rotulo: 'Arquivadas', vazio: 'Você não tem notificações arquivadas.' },
];

function CartaoNotificacao({ notificacao, aberta, aoAlternar, aoMarcarNaoLida, aoArquivar }: {
  notificacao: Notificacao;
  aberta: boolean;
  aoAlternar: () => void;
  aoMarcarNaoLida: () => void;
  aoArquivar: () => void;
}) {
  const data = formatarDataNotificacao(notificacao.dataISO);
  return (
    <article className={`ev-notif${aberta ? ' ev-notif--aberta' : ''}`}>
      <button className="ev-notif__cabeca" aria-expanded={aberta} onClick={aoAlternar}>
        <span className="ev-notif__texto">
          <h3 className="ev-notif__titulo">{notificacao.titulo}</h3>
          {/* Prévia: uma linha com reticências (CSS). Aberta: mensagem completa. */}
          <p className={`ev-notif__msg ${aberta ? 'ev-notif__msg--completa' : 'ev-notif__msg--previa'}`}>{notificacao.mensagem}</p>
          {data && <p className="ev-notif__data">{data}</p>}
        </span>
        <span className="ev-seta"><IconeSeta /></span>
      </button>
      {aberta && (
        <div className="ev-notif__acoes">
          <button className="ev-btn-secundario" onClick={aoMarcarNaoLida}>Marcar como “não lida”</button>
          {notificacao.status !== 'arquivada' && <button className="ev-btn-secundario" onClick={aoArquivar}>Arquivar</button>}
        </div>
      )}
    </article>
  );
}

function PaginaNotificacoes() {
  const { estado, acoes } = useEvolua();
  const [aba, setAba] = useState<AbaNotificacoes>(estado.preferencias.abaNotificacoesInicial);
  const [abertaId, setAbertaId] = useState<string | null>(null);

  const trocarAba = (nova: AbaNotificacoes) => { setAba(nova); setAbertaId(null); };

  // Lista da aba atual. O cartão aberto é mantido na tela mesmo que seu status já tenha mudado.
  const visiveis = estado.notificacoes.filter((n) => n.status === aba || n.id === abertaId);

  const alternar = (n: Notificacao) => {
    if (abertaId === n.id) { setAbertaId(null); return; }
    setAbertaId(n.id);
    // Regra: só passa a "lida" ao abrir o conteúdo. Arquivadas continuam arquivadas.
    if (n.status === 'nao_lida') acoes.definirStatusNotificacao(n.id, 'lida');
  };
  const marcarNaoLida = (n: Notificacao) => { acoes.definirStatusNotificacao(n.id, 'nao_lida'); setAbertaId(null); };
  const arquivar = (n: Notificacao) => { acoes.definirStatusNotificacao(n.id, 'arquivada'); setAbertaId(null); };

  return (
    <>
      <Cabecalho titulo="Notificações" subtitulo="Suas notificações aparecerão aqui" mostrarFoto mostrarConfiguracoes />
      <div className="ev-abas" role="tablist" aria-label="Categorias de notificações">
        {ABAS_NOTIFICACAO.map((a) => (
          <button key={a.id} className="ev-aba" role="tab" aria-selected={aba === a.id} onClick={() => trocarAba(a.id)}>{a.rotulo}</button>
        ))}
      </div>
      <div role="tabpanel">
        {visiveis.length === 0 ? (
          <p className="ev-vazio">{ABAS_NOTIFICACAO.find((a) => a.id === aba)?.vazio}</p>
        ) : (
          visiveis.map((n) => (
            <CartaoNotificacao
              key={n.id}
              notificacao={n}
              aberta={abertaId === n.id}
              aoAlternar={() => alternar(n)}
              aoMarcarNaoLida={() => marcarNaoLida(n)}
              aoArquivar={() => arquivar(n)}
            />
          ))
        )}
      </div>
    </>
  );
}

/* =============================================================================
 * 14. COMPONENTE RAIZ DO MÓDULO
 * ========================================================================== */

/** Decide qual página mostrar com base em estado.rota. */
function Roteador() {
  const { estado, acoes, paginasExternas } = useEvolua();
  const { rota } = estado;
  switch (rota) {
    case 'home': return <PaginaHome />;
    case 'perfil': return <PaginaPerfil />;
    case 'configuracoes': return <PaginaConfiguracoes />;
    case 'notificacoes': return <PaginaNotificacoes />;
    default: {
      // Rota externa: usa a página do colega, se registrada; senão, o placeholder.
      const Externa = paginasExternas?.[rota as RotaExterna];
      return Externa ? <Externa rota={rota as RotaExterna} irPara={acoes.irPara} /> : <PaginaExternaPlaceholder rota={rota as RotaExterna} />;
    }
  }
}

/**
 * <ModuloHome />: monta o estado compartilhado, o roteamento interno e o menu.
 * Exemplo de uso pelo integrador:
 *
 *   <ModuloHome
 *     usuarioInicial={{ id: 'u1', nome: 'Ana', sobrenome: 'Lima', apelido: 'Aninha' }}
 *     paginasExternas={{ chat: PaginaChat, progresso: PaginaProgresso }}
 *     onCheckinSalvo={(r) => api.post('/checkins', r)}
 *     onPerfilAtualizado={(p) => api.put('/perfil', p)}
 *     servicos={servicosReais}
 *     onLogout={() => navegarParaLogin()}
 *   />
 */
export function ModuloHome(props: PropsModuloHome) {
  const {
    usuarioInicial, notificacoesIniciais, checkinsIniciais, preferenciasIniciais, paginasExternas, servicos,
    onCheckinSalvo, onPerfilAtualizado, onNotificacoesAlteradas, onNavegarExterno, onLogout, rotaInicial,
  } = props;

  const [estado, dispatch] = useReducer(reducerEvolua, undefined, (): EstadoEvolua => ({
    perfil: {
      ...PERFIL_PADRAO,
      ...usuarioInicial,
      contato: { ...PERFIL_PADRAO.contato, ...usuarioInicial?.contato },
    },
    checkins: checkinsIniciais ?? [],
    notificacoes: notificacoesIniciais ?? NOTIFICACOES_EXEMPLO,
    preferencias: { ...PREFERENCIAS_PADRAO, ...preferenciasIniciais },
    rota: rotaInicial ?? 'home',
  }));

  // Mantém o estado mais recente acessível às ações sem recriá-las a cada render.
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  const acoes = useMemo<AcoesEvolua>(() => ({
    irPara: (rota) => {
      dispatch({ tipo: 'navegacao/ir', rota });
      if ((ROTAS_EXTERNAS as ReadonlyArray<string>).includes(rota)) onNavegarExterno?.(rota as RotaExterna);
      window.scrollTo?.({ top: 0 });
    },
    atualizarPerfil: (parcial) => dispatch({ tipo: 'perfil/atualizar', parcial }),
    atualizarContato: (parcial) => dispatch({ tipo: 'perfil/atualizarContato', parcial }),
    salvarCheckin: (dados) => {
      const agora = new Date();
      const nivel = EMOCOES.find((e) => e.chave === dados.emocao)?.nivel ?? 3;
      const registro: RegistroCheckin = {
        id: gerarId('checkin'),
        usuarioId: estadoRef.current.perfil.id,
        criadoEmISO: agora.toISOString(),
        dataLocal: dataLocalISO(agora),
        emocao: dados.emocao,
        emocaoNivel: nivel,
        ansiedade: dados.ansiedade,
        estresse: dados.estresse,
        energia: dados.energia,
      };
      dispatch({ tipo: 'checkin/adicionar', registro });
      onCheckinSalvo?.(registro); // PONTO DE INTEGRAÇÃO: persistir no backend
      return registro;
    },
    definirStatusNotificacao: (id, status) => dispatch({ tipo: 'notificacao/definirStatus', id, status }),
  }), [onCheckinSalvo, onNavegarExterno]);

  // Avisa o app hospedeiro quando perfil/notificações mudam (ignora a primeira renderização).
  const primeiraRenderizacao = useRef(true);
  useEffect(() => {
    if (primeiraRenderizacao.current) { primeiraRenderizacao.current = false; return; }
    onPerfilAtualizado?.(estado.perfil);
  }, [estado.perfil]); // eslint-disable-line react-hooks/exhaustive-deps

  const primeiraNotificacao = useRef(true);
  useEffect(() => {
    if (primeiraNotificacao.current) { primeiraNotificacao.current = false; return; }
    onNotificacoesAlteradas?.(estado.notificacoes);
  }, [estado.notificacoes]); // eslint-disable-line react-hooks/exhaustive-deps

  const valor = useMemo<ValorContexto>(() => ({
    estado,
    acoes,
    servicos: servicos ?? servicosPadrao,
    paginasExternas,
    onLogout,
  }), [estado, acoes, servicos, paginasExternas, onLogout]);

  return (
    <EvoluaContext.Provider value={valor}>
      <style>{ESTILOS}</style>
      <div className="ev-app">
        <main className="ev-conteudo">
          <Roteador />
        </main>
        <MenuNavegacao />
      </div>
    </EvoluaContext.Provider>
  );
}

export default ModuloHome;