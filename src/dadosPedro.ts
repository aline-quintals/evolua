/**
 * Dados de exemplo (mockup) do usuário de teste "Pedro".
 *
 * Eles seguem exatamente o formato do estado central (useEvolua) e são
 * carregados uma única vez, só quando o app ainda não tem nenhum registro.
 * Assim o Progresso funciona igual com dados de exemplo ou reais.
 *
 * Para desligar: mude USAR_DADOS_DE_EXEMPLO para false.
 */
import {
  dataLocalISO,
  definirEstado,
  lerEstadoEvolua,
  type EmocaoChave,
  type MetaEvolua,
  type NivelAtencao,
  type QualidadeSono,
  type RegistroBemEstar,
  type RegistroCheckin,
  type RegistroExercicio,
  type RegistroQuestionario,
} from './app/principal/compartilhado';

export const USAR_DADOS_DE_EXEMPLO = true;

const DIAS_HISTORICO = 90;

/** Gerador pseudoaleatório com semente fixa: os dados são sempre o mesmo "Pedro". */
function criarAleatorio(semente: number): () => number {
  let s = semente;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function momento(diasAtras: number, hora: number, minuto: number): { iso: string; dataLocal: string } {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  d.setHours(hora, minuto, 0, 0);
  return { iso: d.toISOString(), dataLocal: dataLocalISO(d) };
}

const limitar = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

const EMOCAO_POR_NIVEL: Record<1 | 2 | 3 | 4 | 5, EmocaoChave> = {
  5: 'muito_feliz',
  4: 'feliz',
  3: 'neutro',
  2: 'triste',
  1: 'muito_triste',
};

function sonoPorEnergia(energia: number): QualidadeSono {
  if (energia < 4) return 'ruim';
  if (energia < 6) return 'medio';
  if (energia < 8) return 'bom';
  return 'otimo';
}

/* ----------------------------- CHECK-INS ----------------------------- */

function gerarCheckins(usuarioId: string, rnd: () => number): RegistroCheckin[] {
  const lista: RegistroCheckin[] = [];
  const ruido = () => (rnd() - 0.5) * 3.2;
  let n = 0;

  // Do dia mais antigo ao mais recente. Hoje fica livre para o Pedro fazer o check-in de verdade.
  for (let dia = DIAS_HISTORICO; dia >= 1; dia--) {
    const t = 1 - dia / DIAS_HISTORICO; // 0 = há 90 dias, 1 = ontem
    if (rnd() > 0.5 + 0.35 * t) continue;

    const ansiedade = limitar(Math.round(7.2 - 3.6 * t + ruido()), 0, 10);
    const estresse = limitar(Math.round(7.0 - 3.0 * t + ruido()), 0, 10);
    const energia = limitar(Math.round(3.6 + 3.4 * t + ruido()), 0, 10);

    const humor = energia - (ansiedade + estresse) / 2;
    const nivel = limitar(Math.round(3 + humor / 2.2 + (rnd() - 0.5)), 1, 5) as 1 | 2 | 3 | 4 | 5;

    const quando = momento(dia, 8 + Math.floor(rnd() * 13), Math.floor(rnd() * 60));
    n += 1;

    lista.push({
      id: `demo-checkin-${n}`,
      usuarioId,
      criadoEmISO: quando.iso,
      dataLocal: quando.dataLocal,
      emocao: EMOCAO_POR_NIVEL[nivel],
      emocaoNivel: nivel,
      ansiedade,
      estresse,
      energia,
      sono: sonoPorEnergia(energia + (rnd() - 0.5) * 3),
    });
  }

  return lista.reverse(); // o store guarda o mais recente primeiro
}

/* ---------------------------- ATIVIDADES ----------------------------- */

type ModeloAtividade = { id: string; nome: string; categoria: string };

const MODELOS_EXERCICIO: ModeloAtividade[] = [
  { id: 'respiracao', nome: 'Respiração guiada', categoria: 'Exercício do dia' },
  { id: 'ombros', nome: 'Alongamento de ombros', categoria: 'Exercício do dia' },
  { id: 'cinco-sentidos', nome: 'Técnica 5-4-3-2-1', categoria: 'Exercício do dia' },
  { id: 'meditacao', nome: 'Meditação guiada', categoria: 'Exercício do dia' },
  { id: 'respiracao-prolongada', nome: 'Expiração prolongada', categoria: 'Ansiedade e agitação' },
  { id: 'relaxamento-muscular', nome: 'Relaxamento muscular progressivo', categoria: 'Ansiedade e agitação' },
  { id: 'alongamento-costas', nome: 'Alongamento de costas', categoria: 'Estresse e tensão' },
  { id: 'visualizacao-guiada', nome: 'Visualização guiada', categoria: 'Estresse e tensão' },
  { id: 'caminhada-consciente', nome: 'Caminhada consciente', categoria: 'Impulsos e fissura' },
  { id: 'pausa-respiratoria', nome: 'Pausa respiratória', categoria: 'Impulsos e fissura' },
  { id: 'body-scan', nome: 'Escaneamento corporal', categoria: 'Descanso e relaxamento' },
  { id: 'alongamento-pernas', nome: 'Alongamento suave de pernas', categoria: 'Descanso e relaxamento' },
];

const MODELOS_BEM_ESTAR: ModeloAtividade[] = [
  { id: 'pintura-emocoes', nome: 'Pintura das emoções', categoria: 'Criatividade e expressão' },
  { id: 'desenho-livre', nome: 'Desenho livre', categoria: 'Criatividade e expressão' },
  { id: 'musica-momento', nome: 'Música do momento', categoria: 'Música e emoções' },
  { id: 'playlist', nome: 'Minha playlist positiva', categoria: 'Música e emoções' },
  { id: 'caca-cores', nome: 'Caça às cores', categoria: 'Descoberta dos sentidos' },
  { id: 'plantinha', nome: 'Cuide de uma plantinha', categoria: 'Autocuidado' },
  { id: 'cantinho', nome: 'Organize seu cantinho', categoria: 'Autocuidado' },
  { id: 'gratidao', nome: 'Diário de gratidão', categoria: 'Tranquilidade e conexão' },
  { id: 'lugar-seguro', nome: 'Crie seu lugar tranquilo', categoria: 'Tranquilidade e conexão' },
];

function gerarAtividades<T extends RegistroExercicio | RegistroBemEstar>(
  prefixo: string,
  usuarioId: string,
  modelos: ModeloAtividade[],
  probabilidadeInicial: number,
  probabilidadeFinal: number,
  rnd: () => number,
): T[] {
  const lista: T[] = [];
  let n = 0;

  for (let dia = DIAS_HISTORICO; dia >= 1; dia--) {
    const t = 1 - dia / DIAS_HISTORICO;
    if (rnd() > probabilidadeInicial + (probabilidadeFinal - probabilidadeInicial) * t) continue;

    const modelo = modelos[Math.floor(rnd() * modelos.length)];
    const quando = momento(dia, 7 + Math.floor(rnd() * 15), Math.floor(rnd() * 60));
    n += 1;

    lista.push({
      id: `demo-${prefixo}-${n}`,
      usuarioId,
      atividadeId: modelo.id,
      nome: modelo.nome,
      categoria: modelo.categoria,
      criadoEmISO: quando.iso,
      dataLocal: quando.dataLocal,
    } as T);
  }

  return lista.reverse();
}

/* --------------------------- QUESTIONÁRIOS --------------------------- */

const RESUMOS_NIVEL: Record<NivelAtencao, string> = {
  baixo: 'Sem sinais de atenção neste momento.',
  moderado: 'Alguns pontos merecem observação.',
  alto: 'Pontos importantes merecem atenção e apoio.',
};

const MODELOS_QUESTIONARIO = [
  { id: 'emocional', nome: 'Como estou hoje?', categoria: 'Autoconhecimento', resultado: 'Seu momento emocional' },
  { id: 'vontade', nome: 'Vontade de consumir', categoria: 'Prevenção de recaídas', resultado: 'Sua relação com os impulsos' },
  { id: 'gatilhos', nome: 'Meus gatilhos', categoria: 'Autoconhecimento', resultado: 'O que merece sua atenção' },
  { id: 'motivacao', nome: 'Minha motivação', categoria: 'Desenvolvimento pessoal', resultado: 'Sua jornada de motivação' },
] as const;

// Há quantos dias foi respondido, qual questionário e o nível (melhorando ao longo do tempo).
const PLANO_QUESTIONARIOS: ReadonlyArray<{ dias: number; modelo: number; nivel: NivelAtencao }> = [
  { dias: 85, modelo: 0, nivel: 'alto' },
  { dias: 72, modelo: 1, nivel: 'alto' },
  { dias: 60, modelo: 2, nivel: 'moderado' },
  { dias: 49, modelo: 3, nivel: 'moderado' },
  { dias: 37, modelo: 0, nivel: 'moderado' },
  { dias: 26, modelo: 1, nivel: 'moderado' },
  { dias: 15, modelo: 3, nivel: 'baixo' },
  { dias: 6, modelo: 0, nivel: 'baixo' },
];

function gerarQuestionarios(usuarioId: string): RegistroQuestionario[] {
  return PLANO_QUESTIONARIOS.map((p, i) => {
    const modelo = MODELOS_QUESTIONARIO[p.modelo];
    const quando = momento(p.dias, 19, 10 + i);

    return {
      id: `demo-questionario-${i + 1}`,
      usuarioId,
      questionarioId: modelo.id,
      nome: modelo.nome,
      categoria: modelo.categoria,
      resultado: modelo.resultado,
      nivelAtencao: p.nivel,
      resumo: RESUMOS_NIVEL[p.nivel],
      criadoEmISO: quando.iso,
      dataLocal: quando.dataLocal,
    };
  }).reverse();
}

/* ------------------------------- METAS ------------------------------- */

function gerarMetas(): MetaEvolua[] {
  const em = (dias: number) => momento(dias, 9, 0).iso;

  return [
    {
      id: 'demo-meta-1', titulo: 'Fazer 10 check-ins emocionais', descricao: 'Observe como você se sente ao longo dos dias.',
      tipo: 'automatica', categoria: 'checkin', frequencia: 'unica', alvo: 10, concluida: false, criadaEmISO: em(80),
    },
    {
      id: 'demo-meta-2', titulo: 'Experimentar 15 exercícios', descricao: 'Reserve momentos para cuidar de você.',
      tipo: 'automatica', categoria: 'exercicio', frequencia: 'unica', alvo: 15, concluida: false, criadaEmISO: em(75),
    },
    {
      id: 'demo-meta-3', titulo: 'Responder a 3 questionários', descricao: 'Conheça melhor suas emoções.',
      tipo: 'automatica', categoria: 'questionario', frequencia: 'unica', alvo: 3, concluida: false, criadaEmISO: em(70),
    },
    {
      id: 'demo-meta-4', titulo: 'Conversar com um amigo sobre como estou me sentindo', descricao: 'Um passo pequeno, mas importante.',
      tipo: 'manual', frequencia: 'unica', alvo: 1, concluida: true, criadaEmISO: em(50),
    },
    {
      id: 'demo-meta-5', titulo: 'Realizar 20 atividades de bem-estar', descricao: 'Inclua pequenas pausas na sua rotina.',
      tipo: 'automatica', categoria: 'bem-estar', frequencia: 'unica', alvo: 20, concluida: false, criadaEmISO: em(60),
    },
    {
      id: 'demo-meta-6', titulo: 'Fazer 5 check-ins por semana', descricao: 'Mantenha a constância.',
      tipo: 'automatica', categoria: 'checkin', frequencia: 'semanal', alvo: 5, concluida: false, criadaEmISO: em(30),
    },
    {
      id: 'demo-meta-7', titulo: 'Voltar a caminhar três vezes por semana', descricao: 'Mexer o corpo ajuda a cabeça.',
      tipo: 'manual', frequencia: 'unica', alvo: 1, concluida: false, criadaEmISO: em(20),
    },
  ];
}

/* ------------------------------ PÚBLICO ------------------------------ */

export function gerarDadosPedro(usuarioId: string) {
  const rnd = criarAleatorio(20001020);

  return {
    checkins: gerarCheckins(usuarioId, rnd),
    exerciciosConcluidos: gerarAtividades<RegistroExercicio>('exercicio', usuarioId, MODELOS_EXERCICIO, 0.1, 0.5, rnd),
    atividadesBemEstar: gerarAtividades<RegistroBemEstar>('bem-estar', usuarioId, MODELOS_BEM_ESTAR, 0.06, 0.3, rnd),
    questionariosRespondidos: gerarQuestionarios(usuarioId),
    metas: gerarMetas(),
  };
}

/**
 * Carrega os dados de exemplo do Pedro, mas só se o app estiver totalmente vazio.
 * Se já existir qualquer registro (real ou de uma carga anterior), não mexe em nada.
 */
export function semearDadosPedro(): boolean {
  if (!USAR_DADOS_DE_EXEMPLO) return false;

  const atual = lerEstadoEvolua();
  const vazio =
    atual.checkins.length === 0 &&
    atual.exerciciosConcluidos.length === 0 &&
    atual.atividadesBemEstar.length === 0 &&
    atual.questionariosRespondidos.length === 0 &&
    atual.metas.length === 0;

  if (!vazio) return false;

  definirEstado({ ...atual, ...gerarDadosPedro(atual.perfil.id) });
  return true;
}