/**
 * Cálculos da tela Progresso: filtro por período, séries dos gráficos,
 * frases-resumo, progresso de metas e relatório em PDF.
 * Tudo é calculado a partir do estado central (useEvolua).
 */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  EMOCOES,
  dataLocalISO,
  type EstadoEvolua,
  type MetaEvolua,
  type NivelAtencao,
  type QualidadeSono,
} from './app/principal/compartilhado';

/* =============================== PERÍODOS =============================== */

export type Periodo = 7 | 30 | 90;
export const PERIODOS: ReadonlyArray<Periodo> = [7, 30, 90];

export function inicioDoPeriodo(periodo: Periodo, agora: Date = new Date()): string {
  const d = new Date(agora);
  d.setDate(d.getDate() - (periodo - 1));
  return dataLocalISO(d);
}

/** Dias do período em ordem cronológica, "AAAA-MM-DD". */
export function diasDoPeriodo(periodo: Periodo, agora: Date = new Date()): string[] {
  const dias: string[] = [];
  for (let i = periodo - 1; i >= 0; i--) {
    const d = new Date(agora);
    d.setDate(d.getDate() - i);
    dias.push(dataLocalISO(d));
  }
  return dias;
}

export function noPeriodo<T extends { dataLocal: string }>(lista: ReadonlyArray<T>, periodo: Periodo): T[] {
  const inicio = inicioDoPeriodo(periodo);
  return lista.filter((r) => r.dataLocal >= inicio);
}

export const formatarDataCurta = (dataLocal: string): string => {
  const [, m, d] = dataLocal.split('-');
  return `${d}/${m}`;
};

export const formatarDataBR = (dataLocal: string): string => {
  const [a, m, d] = dataLocal.split('-');
  return `${d}/${m}/${a}`;
};

export const formatarDataHora = (iso: string): string =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export const numeroBR = (n: number, casas = 1): string => n.toFixed(casas).replace('.', ',');

/* ================================ TÓPICOS =============================== */

export type TopicoGrafico =
  | 'ansiedade' | 'estresse' | 'energia' | 'emocao' | 'sono'
  | 'exercicios' | 'bemEstar' | 'questionarios' | 'atencao';

export interface InfoTopico {
  chave: TopicoGrafico;
  rotulo: string;
  sujeito: string;           // usado na frase-resumo
  cor: string;
  max: number;               // topo da escala (médias)
  tipo: 'media' | 'contagem';
  menorEMelhor?: boolean;
  escala?: string;           // legenda da escala
}

export const TOPICOS: ReadonlyArray<InfoTopico> = [
  { chave: 'ansiedade', rotulo: 'Ansiedade', sujeito: 'Sua ansiedade', cor: '#8E73D9', max: 10, tipo: 'media', menorEMelhor: true, escala: 'Média de 0 a 10' },
  { chave: 'estresse', rotulo: 'Estresse', sujeito: 'Seu estresse', cor: '#E39A55', max: 10, tipo: 'media', menorEMelhor: true, escala: 'Média de 0 a 10' },
  { chave: 'energia', rotulo: 'Energia', sujeito: 'Sua energia', cor: '#5FA36A', max: 10, tipo: 'media', escala: 'Média de 0 a 10' },
  { chave: 'emocao', rotulo: 'Humor', sujeito: 'Seu humor', cor: '#4A7BD9', max: 5, tipo: 'media', escala: 'Média de 1 (muito triste) a 5 (muito feliz)' },
  { chave: 'sono', rotulo: 'Sono', sujeito: 'A qualidade do seu sono', cor: '#5B9BB5', max: 4, tipo: 'media', escala: 'Média de 1 (ruim) a 4 (ótimo)' },
  { chave: 'exercicios', rotulo: 'Exercícios', sujeito: 'Seus exercícios', cor: '#628A57', max: 0, tipo: 'contagem', escala: 'Quantidade por intervalo' },
  { chave: 'bemEstar', rotulo: 'Bem-estar', sujeito: 'Suas atividades de bem-estar', cor: '#C47A9B', max: 0, tipo: 'contagem', escala: 'Quantidade por intervalo' },
  { chave: 'questionarios', rotulo: 'Questionários', sujeito: 'Seus questionários', cor: '#25877E', max: 0, tipo: 'contagem', escala: 'Quantidade por intervalo' },
  { chave: 'atencao', rotulo: 'Nível de atenção', sujeito: 'O nível de atenção dos questionários', cor: '#C9A13B', max: 3, tipo: 'media', menorEMelhor: true, escala: 'Média de 1 (baixo) a 3 (alto)' },
];

export const infoDoTopico = (chave: TopicoGrafico): InfoTopico =>
  TOPICOS.find((t) => t.chave === chave) ?? TOPICOS[0];

const VALOR_SONO: Record<QualidadeSono, number> = { ruim: 1, medio: 2, bom: 3, otimo: 4 };
const VALOR_ATENCAO: Record<NivelAtencao, number> = { baixo: 1, moderado: 2, alto: 3 };

export const ROTULO_SONO: Record<QualidadeSono, string> = { ruim: 'Ruim', medio: 'Médio', bom: 'Bom', otimo: 'Ótimo' };
export const ROTULO_ATENCAO: Record<NivelAtencao, string> = { baixo: 'Baixo', moderado: 'Moderado', alto: 'Alto' };

/* ================================ SÉRIES ================================ */

export interface PontoSerie {
  rotulo: string;
  valor: number | null;
}

const INICIAIS_DIA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function mediaOuNulo(valores: number[]): number | null {
  return valores.length === 0 ? null : valores.reduce((a, b) => a + b, 0) / valores.length;
}

/** Tamanho de cada barra do gráfico: 7 dias = 1 dia; 30 dias = 5 dias; 90 dias = 10 dias. */
const DIAS_POR_BARRA: Record<Periodo, number> = { 7: 1, 30: 5, 90: 10 };

export function serieDoTopico(topico: TopicoGrafico, periodo: Periodo, estado: EstadoEvolua): PontoSerie[] {
  const dias = diasDoPeriodo(periodo);
  const tamanho = DIAS_POR_BARRA[periodo];
  const pontos: PontoSerie[] = [];

  for (let i = 0; i < dias.length; i += tamanho) {
    const grupo = new Set(dias.slice(i, i + tamanho));
    const primeiro = dias[i];

    const rotulo = tamanho === 1
      ? INICIAIS_DIA[new Date(`${primeiro}T12:00:00`).getDay()]
      : formatarDataCurta(primeiro);

    let valor: number | null = null;

    switch (topico) {
      case 'ansiedade':
      case 'estresse':
      case 'energia':
        valor = mediaOuNulo(estado.checkins.filter((c) => grupo.has(c.dataLocal)).map((c) => c[topico]));
        break;
      case 'emocao':
        valor = mediaOuNulo(estado.checkins.filter((c) => grupo.has(c.dataLocal)).map((c) => c.emocaoNivel));
        break;
      case 'sono':
        valor = mediaOuNulo(estado.checkins.filter((c) => grupo.has(c.dataLocal)).map((c) => VALOR_SONO[c.sono]));
        break;
      case 'exercicios':
        valor = estado.exerciciosConcluidos.filter((r) => grupo.has(r.dataLocal)).length;
        break;
      case 'bemEstar':
        valor = estado.atividadesBemEstar.filter((r) => grupo.has(r.dataLocal)).length;
        break;
      case 'questionarios':
        valor = estado.questionariosRespondidos.filter((r) => grupo.has(r.dataLocal)).length;
        break;
      case 'atencao':
        valor = mediaOuNulo(
          estado.questionariosRespondidos
            .filter((r) => grupo.has(r.dataLocal) && r.nivelAtencao)
            .map((r) => VALOR_ATENCAO[r.nivelAtencao as NivelAtencao]),
        );
        break;
    }

    pontos.push({ rotulo, valor });
  }

  return pontos;
}

export function maximoDaSerie(topico: TopicoGrafico, serie: PontoSerie[]): number {
  const info = infoDoTopico(topico);
  if (info.tipo === 'media') return info.max;
  const maior = Math.max(0, ...serie.map((p) => p.valor ?? 0));
  return Math.max(3, maior);
}

/** Frase curta comparando a primeira com a segunda metade do período. */
export function resumoDoTopico(topico: TopicoGrafico, serie: PontoSerie[], periodo: Periodo): string {
  const info = infoDoTopico(topico);
  const valores = serie.map((p) => p.valor);

  if (info.tipo === 'contagem') {
    const total = valores.reduce<number>((soma, v) => soma + (v ?? 0), 0);
    if (total === 0) return `Nenhum registro de ${info.rotulo.toLowerCase()} nos últimos ${periodo} dias.`;
    const meio = Math.floor(valores.length / 2);
    const antes = valores.slice(0, meio).reduce<number>((s, v) => s + (v ?? 0), 0);
    const depois = valores.slice(meio).reduce<number>((s, v) => s + (v ?? 0), 0);
    const base = `${info.sujeito} somaram ${total} ${total === 1 ? 'registro' : 'registros'} nos últimos ${periodo} dias.`;
    if (periodo === 7 || depois === antes) return base;
    return depois > antes
      ? `${base} A segunda metade do período teve mais registros que a primeira (${depois} contra ${antes}).`
      : `${base} A primeira metade do período teve mais registros que a segunda (${antes} contra ${depois}).`;
  }

  const preenchidos = valores.filter((v): v is number => v !== null);
  if (preenchidos.length < 2) return 'Ainda há poucos registros neste período para mostrar uma tendência.';

  const meio = Math.ceil(preenchidos.length / 2);
  const inicio = mediaOuNulo(preenchidos.slice(0, meio)) ?? 0;
  const fim = mediaOuNulo(preenchidos.slice(meio)) ?? 0;
  const delta = fim - inicio;
  const limite = info.max * 0.03;

  if (Math.abs(delta) < limite) return `${info.sujeito} ficou estável nos últimos ${periodo} dias.`;

  const subiu = delta > 0;
  const absoluto = Math.abs(delta);
  const pontos = `${numeroBR(absoluto)} ${numeroBR(absoluto) === '1,0' ? 'ponto' : 'pontos'}`;
  const melhorou = info.menorEMelhor ? !subiu : subiu;

  return `${info.sujeito} ${subiu ? 'subiu' : 'caiu'} ${pontos} nos últimos ${periodo} dias.${melhorou ? ' É um bom sinal.' : ''}`;
}

/* ================================== METAS =============================== */

function inicioDaSemanaISO(): string {
  const hoje = new Date();
  const dia = hoje.getDay();
  hoje.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1));
  hoje.setHours(0, 0, 0, 0);
  return hoje.toISOString();
}

/** Mesma regra da tela de Metas, para os números baterem entre as duas telas. */
export function progressoDaMeta(meta: MetaEvolua, estado: EstadoEvolua): { atual: number; percentual: number; concluida: boolean } {
  if (meta.tipo === 'manual') {
    return { atual: meta.concluida ? 1 : 0, percentual: meta.concluida ? 100 : 0, concluida: meta.concluida };
  }

  const lista = (
    {
      exercicio: estado.exerciciosConcluidos,
      'bem-estar': estado.atividadesBemEstar,
      questionario: estado.questionariosRespondidos,
      checkin: estado.checkins,
    } as Record<string, ReadonlyArray<{ criadoEmISO: string }>>
  )[meta.categoria ?? ''] ?? [];

  const inicio = meta.frequencia === 'semanal' ? inicioDaSemanaISO() : meta.criadaEmISO;
  const atual = lista.filter((r) => r.criadoEmISO >= inicio && r.criadoEmISO >= meta.criadaEmISO).length;

  return {
    atual,
    percentual: Math.min(100, (atual / Math.max(1, meta.alvo)) * 100),
    concluida: atual >= meta.alvo,
  };
}

/* ================================ RELATÓRIO ============================= */

const esc = (t: string | number): string =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function maisFrequente<T extends string>(itens: T[]): T | null {
  if (itens.length === 0) return null;
  const contagem = new Map<T, number>();
  itens.forEach((i) => contagem.set(i, (contagem.get(i) ?? 0) + 1));
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function contarPorNome(lista: ReadonlyArray<{ nome: string }>): Array<[string, number]> {
  const mapa = new Map<string, number>();
  lista.forEach((i) => mapa.set(i.nome, (mapa.get(i.nome) ?? 0) + 1));
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
}

const barraHtml = (valor: number, max: number, cor: string): string =>
  `<div class="trilha"><div class="barra" style="width:${Math.min(100, (valor / max) * 100).toFixed(0)}%;background:${cor}"></div></div>`;

function tabelaHtml(cabecalho: string[], linhas: string[][]): string {
  if (linhas.length === 0) return '<p class="vazio">Sem registros neste período.</p>';
  return `<table><thead><tr>${cabecalho.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${linhas
    .map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

export function gerarHtmlRelatorio(estado: EstadoEvolua, periodo: Periodo): string {
  const checkins = noPeriodo(estado.checkins, periodo);
  const exercicios = noPeriodo(estado.exerciciosConcluidos, periodo);
  const bemEstar = noPeriodo(estado.atividadesBemEstar, periodo);
  const questionarios = noPeriodo(estado.questionariosRespondidos, periodo);

  const inicio = inicioDoPeriodo(periodo);
  const fim = dataLocalISO(new Date());
  const nomeCompleto = `${estado.perfil.nome} ${estado.perfil.sobrenome}`.trim();

  const media = (campo: 'ansiedade' | 'estresse' | 'energia'): number | null =>
    mediaOuNulo(checkins.map((c) => c[campo]));

  const medias = (
    [
      ['Ansiedade', media('ansiedade'), '#8E73D9'],
      ['Estresse', media('estresse'), '#E39A55'],
      ['Energia', media('energia'), '#5FA36A'],
    ] as Array<[string, number | null, string]>
  )
    .map(([rotulo, valor, cor]) =>
      valor === null
        ? ''
        : `<div class="linha-media"><span>${rotulo}</span><span>${numeroBR(valor)} / 10</span></div>${barraHtml(valor, 10, cor)}`,
    )
    .join('');

  const emocaoTop = maisFrequente(checkins.map((c) => c.emocao));
  const sonoTop = maisFrequente(checkins.map((c) => c.sono));
  const diasComCheckin = new Set(checkins.map((c) => c.dataLocal)).size;

  const evolucao = ['ansiedade', 'estresse', 'energia'] as const;
  const series = evolucao.map((t) => serieDoTopico(t, periodo, estado));
  const linhasEvolucao = series[0].map((ponto, i) => [
    ponto.rotulo.length === 1 ? `Dia ${i + 1}` : `A partir de ${ponto.rotulo}`,
    ...series.map((s) => (s[i].valor === null ? '–' : numeroBR(s[i].valor as number))),
  ]);

  const metas = estado.metas.map((m) => ({ meta: m, p: progressoDaMeta(m, estado) }));
  const metasFeitas = metas.filter((m) => m.p.concluida);
  const metasAndamento = metas.filter((m) => !m.p.concluida);

  const emocaoRotulo = (chave: string) => EMOCOES.find((e) => e.chave === chave)?.rotulo ?? chave;

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Relatório EVOLUA - ${periodo} dias</title>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1E2A44; font-size: 12px; line-height: 1.45; }
  h1 { font-size: 22px; margin: 0 0 2px; color: #2E5B9A; }
  h2 { font-size: 15px; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #D7E6FF; color: #2E5B9A; }
  .sub { color: #4B5563; margin: 0; }
  .cabecalho { border-bottom: 3px solid #4A7BD9; padding-bottom: 10px; margin-bottom: 14px; }
  .grade { display: flex; gap: 8px; }
  .caixa { flex: 1; background: #F0F5FF; border-radius: 10px; padding: 10px; text-align: center; }
  .caixa b { display: block; font-size: 22px; color: #2E5B9A; }
  .linha-media { display: flex; justify-content: space-between; margin-top: 8px; }
  .trilha { height: 8px; background: #E2E8F0; border-radius: 4px; margin-top: 3px; }
  .barra { height: 8px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; background: #F0F5FF; font-size: 11px; }
  th, td { padding: 5px 6px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
  .vazio { color: #94A3B8; font-style: italic; }
  .nota { margin-top: 24px; padding: 10px; background: #F7F9FF; border-radius: 8px; color: #4B5563; font-size: 11px; }
  tr, .caixa { page-break-inside: avoid; }
</style></head><body>

<div class="cabecalho">
  <h1>EVOLUA · Relatório de acompanhamento</h1>
  <p class="sub"><b>${esc(nomeCompleto)}</b></p>
  <p class="sub">Período: últimos ${periodo} dias (${formatarDataBR(inicio)} a ${formatarDataBR(fim)}) · Gerado em ${esc(formatarDataHora(new Date().toISOString()))}</p>
</div>

<h2>Resumo do período</h2>
<div class="grade">
  <div class="caixa"><b>${checkins.length}</b>check-ins em ${diasComCheckin} ${diasComCheckin === 1 ? 'dia' : 'dias'}</div>
  <div class="caixa"><b>${exercicios.length}</b>exercícios</div>
  <div class="caixa"><b>${bemEstar.length}</b>atividades de bem-estar</div>
  <div class="caixa"><b>${questionarios.length}</b>questionários</div>
</div>

<h2>Check-ins emocionais</h2>
${checkins.length === 0 ? '<p class="vazio">Sem check-ins neste período.</p>' : `
${medias}
<p>Emoção mais frequente: <b>${esc(emocaoTop ? emocaoRotulo(emocaoTop) : '–')}</b> · Sono mais frequente: <b>${esc(sonoTop ? ROTULO_SONO[sonoTop] : '–')}</b></p>
<p class="sub">Evolução por intervalo (médias de 0 a 10)</p>
${tabelaHtml(['Intervalo', 'Ansiedade', 'Estresse', 'Energia'], linhasEvolucao)}
<p class="sub" style="margin-top:12px">Registros</p>
${tabelaHtml(
    ['Data', 'Emoção', 'Ansiedade', 'Estresse', 'Energia', 'Sono'],
    checkins.map((c) => [formatarDataBR(c.dataLocal), emocaoRotulo(c.emocao), String(c.ansiedade), String(c.estresse), String(c.energia), ROTULO_SONO[c.sono]]),
  )}`}

<h2>Exercícios concluídos</h2>
${tabelaHtml(['Exercício', 'Vezes'], contarPorNome(exercicios).map(([n, q]) => [n, String(q)]))}

<h2>Atividades de bem-estar</h2>
${tabelaHtml(['Atividade', 'Vezes'], contarPorNome(bemEstar).map(([n, q]) => [n, String(q)]))}

<h2>Questionários respondidos</h2>
${tabelaHtml(
    ['Data', 'Questionário', 'Resultado', 'Nível de atenção', 'Resumo'],
    questionarios.map((q) => [formatarDataBR(q.dataLocal), q.nome, q.resultado ?? '–', q.nivelAtencao ? ROTULO_ATENCAO[q.nivelAtencao] : '–', q.resumo ?? '']),
  )}

<h2>Metas</h2>
<p><b>Realizadas (${metasFeitas.length})</b></p>
${tabelaHtml(['Meta', 'Resultado'], metasFeitas.map(({ meta, p }) => [meta.titulo, meta.tipo === 'manual' ? 'Concluída' : `${p.atual} de ${meta.alvo}`]))}
<p style="margin-top:10px"><b>Em andamento (${metasAndamento.length})</b></p>
${tabelaHtml(['Meta', 'Progresso'], metasAndamento.map(({ meta, p }) => [meta.titulo, meta.tipo === 'manual' ? 'Em andamento' : `${p.atual} de ${meta.alvo}`]))}

<div class="nota">
  Este relatório é um registro pessoal de acompanhamento feito no aplicativo EVOLUA e não substitui avaliação, diagnóstico ou orientação de profissionais de saúde.
  Os questionários aparecem apenas com resultado e nível de atenção; as respostas individuais não são guardadas nem incluídas.
</div>
</body></html>`;
}

/**
 * Baixa o relatório em PDF.
 * - Celular: gera o arquivo e abre o compartilhamento (salvar, enviar etc.).
 * - Web: abre a janela de impressão do navegador, onde dá para escolher "Salvar como PDF".
 */
export async function baixarRelatorioPdf(estado: EstadoEvolua, periodo: Periodo): Promise<'arquivo' | 'impressao'> {
  const html = gerarHtmlRelatorio(estado, periodo);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return 'impressao';
  }

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Relatório EVOLUA · ${periodo} dias`,
    });
  }

  return 'arquivo';
}