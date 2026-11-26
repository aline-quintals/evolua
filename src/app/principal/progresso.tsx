import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../../tema';
import { semearDadosPedro } from '../../dadosPedro';
import {
  PERIODOS,
  ROTULO_ATENCAO,
  ROTULO_SONO,
  TOPICOS,
  baixarRelatorioPdf,
  formatarDataBR,
  formatarDataHora,
  inicioDoPeriodo,
  infoDoTopico,
  maximoDaSerie,
  noPeriodo,
  numeroBR,
  progressoDaMeta,
  resumoDoTopico,
  serieDoTopico,
  type Periodo,
  type PontoSerie,
  type TopicoGrafico,
} from '../../progressoDados';
import {
  EMOCOES,
  IconeNome,
  MenuInferior,
  NavegacaoContext,
  RostoEmocao,
  TelaInterna,
  type NivelAtencao,
  avisar,
  dataLocalISO,
  estilos,
  lerEstadoEvolua,
  sairDaConta,
  useEvolua,
  useLayoutInfo,
  useNavegacao,
  useTecladoVisivel,
} from './compartilhado';
import TelaConfiguracoes from './configuracoes';
import TelaNotificacoes from './notificacoes';

type ChaveDetalhe = 'historico' | 'evolucao' | 'metas' | 'exercicios' | 'questionarios' | 'relatorios';

type ItemProgresso = {
  chave: ChaveDetalhe;
  titulo: string;
  fundo: string;
  texto: string;
  corIcone: string;
  icone: IconeNome;
};

const ITENS: ReadonlyArray<ItemProgresso> = [
  { chave: 'historico', titulo: 'Histórico dos check-ins emocionais', fundo: '#E1EFF9', texto: '#29465F', corIcone: '#2877AE', icone: 'happy' },
  { chave: 'evolucao', titulo: 'Evolução pessoal', fundo: '#DFF2EF', texto: '#294B49', corIcone: '#25877E', icone: 'trending-up' },
  { chave: 'metas', titulo: 'Metas realizadas', fundo: '#FCEBDD', texto: '#604936', corIcone: '#C47A3B', icone: 'flag' },
  { chave: 'exercicios', titulo: 'Exercícios concluídos', fundo: '#E8F1E5', texto: '#3D5140', corIcone: '#628A57', icone: 'fitness' },
  { chave: 'questionarios', titulo: 'Questionários respondidos', fundo: '#EEE9F8', texto: '#44395E', corIcone: '#7A5CC0', icone: 'clipboard' },
  { chave: 'relatorios', titulo: 'Download de relatórios por período', fundo: '#E1EFF9', texto: '#29465F', corIcone: '#2877AE', icone: 'download' },
];

const COR_NIVEL: Record<NivelAtencao, { fundo: string; texto: string }> = {
  baixo: { fundo: '#E8F1E5', texto: '#3D5140' },
  moderado: { fundo: '#FFF1D0', texto: '#7A5A1E' },
  alto: { fundo: '#FCE3EC', texto: '#8C3A5C' },
};

/* ============================ LISTA DE ITENS ============================ */

function CartaoProgresso({ item, selecionado, onPress }: { item: ItemProgresso; selecionado: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[
        estilos.atividade,
        local.cartaoItem,
        { backgroundColor: item.fundo },
        selecionado && { borderWidth: 2, borderColor: item.corIcone },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={item.titulo}
    >
      <View style={[estilos.atividadeIconeBox, { backgroundColor: 'rgba(255,255,255,0.72)' }]}>
        <Ionicons name={item.icone} size={21} color={item.corIcone} />
      </View>
      <Text style={[estilos.atividadeTexto, { color: item.texto, fontSize: 16, lineHeight: 20 }]} numberOfLines={2}>
        {item.titulo}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={item.corIcone} />
    </Pressable>
  );
}

/* ============================== RESUMO GERAL ============================ */

function BarraMedia({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <View
      style={{ marginTop: 10 }}
      accessible
      accessibilityLabel={`Média de ${rotulo}: ${valor.toFixed(1).replace('.', ',')} de 10`}
    >
      <View style={estilos.escalaNumLinha}>
        <Text style={estilos.escalaNumRotulo}>{rotulo}</Text>
        <Text style={estilos.escalaNumValor}>{valor.toFixed(1).replace('.', ',')} /10</Text>
      </View>
      <View style={local.barraTrilha}>
        <View style={[local.barraPreenchida, { width: `${Math.min(100, (valor / 10) * 100)}%`, backgroundColor: cor }]} />
      </View>
    </View>
  );
}

function CartaoResumo() {
  const checkins = useEvolua((e) => e.checkins);

  const resumo = useMemo(() => {
    const total = checkins.length;
    if (total === 0) return null;
    const media = (campo: 'ansiedade' | 'estresse' | 'energia') =>
      checkins.reduce((soma, c) => soma + c[campo], 0) / total;
    return {
      total,
      dias: new Set(checkins.map((c) => c.dataLocal)).size,
      ansiedade: media('ansiedade'),
      estresse: media('estresse'),
      energia: media('energia'),
      ultimo: checkins[0],
    };
  }, [checkins]);

  const emocaoUltimo = resumo ? EMOCOES.find((e) => e.chave === resumo.ultimo.emocao) : undefined;

  return (
    <View style={estilos.cartao}>
      <Text style={estilos.secaoTitulo} accessibilityRole="header">Seu resumo</Text>

      {!resumo ? (
        <Text style={estilos.painelTexto}>
          Você ainda não registrou nenhum check-in. Faça o primeiro na Home e acompanhe sua evolução por aqui.
        </Text>
      ) : (
        <>
          <View style={local.estatLinha}>
            <View style={local.estatBox}>
              <Text style={local.estatNumero}>{resumo.total}</Text>
              <Text style={local.estatRotulo}>{resumo.total === 1 ? 'check-in' : 'check-ins'}</Text>
            </View>
            <View style={local.estatBox}>
              <Text style={local.estatNumero}>{resumo.dias}</Text>
              <Text style={local.estatRotulo}>{resumo.dias === 1 ? 'dia registrado' : 'dias registrados'}</Text>
            </View>
          </View>

          {emocaoUltimo && (
            <View style={local.ultimoLinha} accessible accessibilityLabel={`Último check-in: ${emocaoUltimo.rotulo}`}>
              <RostoEmocao chave={emocaoUltimo.chave} cor={emocaoUltimo.cor} tamanho={44} />
              <View style={{ flex: 1 }}>
                <Text style={estilos.escalaNumRotulo}>Último check-in: {emocaoUltimo.rotulo}</Text>
                <Text style={estilos.notifData}>
                  {new Date(resumo.ultimo.criadoEmISO).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}

          <Text style={[estilos.painelTitulo, { marginTop: 16, marginBottom: 0 }]}>Médias gerais</Text>
          <BarraMedia rotulo="Ansiedade" valor={resumo.ansiedade} cor={cores.lilas} />
          <BarraMedia rotulo="Estresse" valor={resumo.estresse} cor={cores.laranjaSuave} />
          <BarraMedia rotulo="Energia" valor={resumo.energia} cor={cores.verdeMenta} />
        </>
      )}
    </View>
  );
}

/* =========================== PEÇAS DOS DETALHES ========================= */

function SeletorPeriodo({ periodo, onChange }: { periodo: Periodo; onChange: (p: Periodo) => void }) {
  return (
    <View style={local.chipsLinha} accessibilityRole="radiogroup">
      {PERIODOS.map((p) => {
        const ativo = p === periodo;
        return (
          <Pressable
            key={p}
            style={[local.chip, ativo && local.chipAtivo]}
            onPress={() => onChange(p)}
            accessibilityRole="radio"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`Últimos ${p} dias`}
          >
            <Text style={[local.chipTexto, ativo && local.chipTextoAtivo]}>{p} dias</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SemRegistros({ texto }: { texto: string }) {
  return <Text style={[estilos.painelTexto, { marginTop: 4 }]}>{texto}</Text>;
}

function BotaoMostrarMais({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={local.botaoMais} onPress={onPress} accessibilityRole="button" accessibilityLabel="Mostrar mais registros">
      <Text style={local.botaoMaisTexto}>Mostrar mais</Text>
    </Pressable>
  );
}

function GraficoBarras({ serie, cor, max, inteiro }: { serie: PontoSerie[]; cor: string; max: number; inteiro: boolean }) {
  return (
    <View style={local.grafico}>
      {serie.map((p, i) => {
        const altura = p.valor === null ? 0 : Math.max(p.valor > 0 ? 4 : 0, (p.valor / max) * ALTURA_GRAFICO);
        const texto = p.valor === null ? '–' : inteiro ? String(p.valor) : numeroBR(p.valor);
        return (
          <View key={`${p.rotulo}-${i}`} style={local.colunaGrafico} accessible accessibilityLabel={`${p.rotulo}: ${texto}`}>
            <Text style={local.valorBarra}>{texto}</Text>
            <View style={local.trilhaGrafico}>
              <View style={[local.barraGrafico, { height: altura, backgroundColor: cor }]} />
            </View>
            <Text style={local.rotuloBarra} numberOfLines={1}>{p.rotulo}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ================================ DETALHES ============================== */

function DetalheHistorico({ periodo }: { periodo: Periodo }) {
  const checkins = useEvolua((e) => e.checkins);
  const lista = useMemo(() => noPeriodo(checkins, periodo), [checkins, periodo]);
  const [limite, setLimite] = useState(12);

  useEffect(() => setLimite(12), [periodo]);

  if (lista.length === 0) return <SemRegistros texto="Nenhum check-in neste período." />;

  return (
    <View>
      <Text style={estilos.painelTexto}>
        {lista.length} {lista.length === 1 ? 'check-in' : 'check-ins'} nos últimos {periodo} dias.
      </Text>

      <View style={{ gap: 12, marginTop: 12 }}>
        {lista.slice(0, limite).map((c) => {
          const emocao = EMOCOES.find((e) => e.chave === c.emocao);
          return (
            <View
              key={c.id}
              style={local.registroLinha}
              accessible
              accessibilityLabel={`${emocao?.rotulo ?? ''}, ${formatarDataHora(c.criadoEmISO)}. Ansiedade ${c.ansiedade}, estresse ${c.estresse}, energia ${c.energia}, sono ${ROTULO_SONO[c.sono]}`}
            >
              {emocao && <RostoEmocao chave={emocao.chave} cor={emocao.cor} tamanho={40} />}
              <View style={{ flex: 1 }}>
                <Text style={local.registroTitulo}>{emocao?.rotulo}</Text>
                <Text style={local.registroData}>{formatarDataHora(c.criadoEmISO)}</Text>
                <View style={local.miniChips}>
                  <Text style={[local.miniChip, { backgroundColor: '#EEE9F8', color: '#44395E' }]}>Ansiedade {c.ansiedade}</Text>
                  <Text style={[local.miniChip, { backgroundColor: '#FCEBDD', color: '#604936' }]}>Estresse {c.estresse}</Text>
                  <Text style={[local.miniChip, { backgroundColor: '#E8F1E5', color: '#3D5140' }]}>Energia {c.energia}</Text>
                  <Text style={[local.miniChip, { backgroundColor: '#E1EFF9', color: '#29465F' }]}>Sono {ROTULO_SONO[c.sono]}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {lista.length > limite && <BotaoMostrarMais onPress={() => setLimite((l) => l + 12)} />}
    </View>
  );
}

function DetalheEvolucao({ periodo }: { periodo: Periodo }) {
  const estado = useEvolua((e) => e);
  const [topico, setTopico] = useState<TopicoGrafico>('ansiedade');

  const info = infoDoTopico(topico);
  const serie = useMemo(() => serieDoTopico(topico, periodo, estado), [topico, periodo, estado]);
  const max = maximoDaSerie(topico, serie);
  const resumo = resumoDoTopico(topico, serie, periodo);

  return (
    <View>
      <Text style={estilos.painelTitulo}>Escolha um tópico</Text>
      <View style={local.chipsLinha}>
        {TOPICOS.map((t) => {
          const ativo = t.chave === topico;
          return (
            <Pressable
              key={t.chave}
              style={[local.chip, ativo && { backgroundColor: t.cor, borderColor: t.cor }]}
              onPress={() => setTopico(t.chave)}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={t.rotulo}
            >
              <Text style={[local.chipTexto, ativo && local.chipTextoAtivo]}>{t.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[estilos.painelTitulo, { marginTop: 18, marginBottom: 2 }]}>{info.rotulo}</Text>
      {!!info.escala && <Text style={local.legendaGrafico}>{info.escala}</Text>}

      <GraficoBarras serie={serie} cor={info.cor} max={max} inteiro={info.tipo === 'contagem'} />

      <View style={[local.caixaResumo, { borderLeftColor: info.cor }]}>
        <Text style={local.caixaResumoTexto}>{resumo}</Text>
      </View>
    </View>
  );
}

function DetalheMetas() {
  const estado = useEvolua((e) => e);

  const itens = useMemo(
    () => estado.metas.map((meta) => ({ meta, p: progressoDaMeta(meta, estado) })),
    [estado],
  );
  const feitas = itens.filter((i) => i.p.concluida);
  const andamento = itens.filter((i) => !i.p.concluida);

  if (itens.length === 0) {
    return <SemRegistros texto="Você ainda não criou metas. Crie a primeira em Evolua > Metas e conquistas." />;
  }

  return (
    <View>
      <Text style={estilos.painelTitulo}>Realizadas ({feitas.length})</Text>
      {feitas.length === 0 ? (
        <SemRegistros texto="Nenhuma meta concluída ainda. Um passo de cada vez." />
      ) : (
        <View style={{ gap: 10 }}>
          {feitas.map(({ meta, p }) => (
            <View key={meta.id} style={local.registroLinha} accessible accessibilityLabel={`Meta concluída: ${meta.titulo}`}>
              <View style={[local.iconeRegistro, { backgroundColor: '#FCEBDD' }]}>
                <Ionicons name="trophy" size={20} color="#C47A3B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={local.registroTitulo}>{meta.titulo}</Text>
                <Text style={local.registroData}>
                  {meta.tipo === 'manual' ? 'Meta pessoal concluída' : `${p.atual} de ${meta.alvo} ${meta.frequencia === 'semanal' ? 'nesta semana' : 'desde a criação'}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={[estilos.painelTitulo, { marginTop: 18 }]}>Em andamento ({andamento.length})</Text>
      {andamento.length === 0 ? (
        <SemRegistros texto="Nenhuma meta em andamento." />
      ) : (
        <View style={{ gap: 12 }}>
          {andamento.map(({ meta, p }) => (
            <View key={meta.id} accessible accessibilityLabel={`${meta.titulo}: ${meta.tipo === 'manual' ? 'em andamento' : `${p.atual} de ${meta.alvo}`}`}>
              <View style={estilos.escalaNumLinha}>
                <Text style={[estilos.escalaNumRotulo, { flex: 1 }]} numberOfLines={2}>{meta.titulo}</Text>
                {meta.tipo !== 'manual' && <Text style={estilos.escalaNumValor}>{p.atual}/{meta.alvo}</Text>}
              </View>
              <View style={local.barraTrilha}>
                <View style={[local.barraPreenchida, { width: `${p.percentual}%`, backgroundColor: '#C47A3B' }]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function DetalheExercicios({ periodo }: { periodo: Periodo }) {
  const exercicios = useEvolua((e) => e.exerciciosConcluidos);
  const lista = useMemo(() => noPeriodo(exercicios, periodo), [exercicios, periodo]);
  const [limite, setLimite] = useState(10);

  useEffect(() => setLimite(10), [periodo]);

  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    lista.forEach((e) => mapa.set(e.categoria ?? 'Sem categoria', (mapa.get(e.categoria ?? 'Sem categoria') ?? 0) + 1));
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
  }, [lista]);

  if (lista.length === 0) return <SemRegistros texto="Nenhum exercício concluído neste período." />;

  const maior = Math.max(...porCategoria.map(([, q]) => q));

  return (
    <View>
      <View style={local.estatLinha}>
        <View style={local.estatBox}>
          <Text style={local.estatNumero}>{lista.length}</Text>
          <Text style={local.estatRotulo}>{lista.length === 1 ? 'exercício' : 'exercícios'}</Text>
        </View>
        <View style={local.estatBox}>
          <Text style={local.estatNumero}>{new Set(lista.map((e) => e.dataLocal)).size}</Text>
          <Text style={local.estatRotulo}>dias com prática</Text>
        </View>
      </View>

      <Text style={[estilos.painelTitulo, { marginTop: 16, marginBottom: 0 }]}>Por categoria</Text>
      {porCategoria.map(([nome, qtd]) => (
        <View key={nome} style={{ marginTop: 10 }} accessible accessibilityLabel={`${nome}: ${qtd}`}>
          <View style={estilos.escalaNumLinha}>
            <Text style={[estilos.escalaNumRotulo, { flex: 1 }]} numberOfLines={1}>{nome}</Text>
            <Text style={estilos.escalaNumValor}>{qtd}</Text>
          </View>
          <View style={local.barraTrilha}>
            <View style={[local.barraPreenchida, { width: `${(qtd / maior) * 100}%`, backgroundColor: '#628A57' }]} />
          </View>
        </View>
      ))}

      <Text style={[estilos.painelTitulo, { marginTop: 18 }]}>Mais recentes</Text>
      <View style={{ gap: 12 }}>
        {lista.slice(0, limite).map((ex) => (
          <View key={ex.id} style={local.registroLinha}>
            <View style={[local.iconeRegistro, { backgroundColor: '#E8F1E5' }]}>
              <Ionicons name="checkmark-circle" size={22} color="#628A57" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={local.registroTitulo}>{ex.nome}</Text>
              <Text style={local.registroData}>{formatarDataHora(ex.criadoEmISO)}{ex.categoria ? ` · ${ex.categoria}` : ''}</Text>
            </View>
          </View>
        ))}
      </View>
      {lista.length > limite && <BotaoMostrarMais onPress={() => setLimite((l) => l + 10)} />}
    </View>
  );
}

function DetalheQuestionarios({ periodo }: { periodo: Periodo }) {
  const questionarios = useEvolua((e) => e.questionariosRespondidos);
  const lista = useMemo(() => noPeriodo(questionarios, periodo), [questionarios, periodo]);

  if (lista.length === 0) return <SemRegistros texto="Nenhum questionário respondido neste período." />;

  return (
    <View style={{ gap: 14 }}>
      {lista.map((q) => {
        const nivel = q.nivelAtencao ? COR_NIVEL[q.nivelAtencao] : null;
        return (
          <View key={q.id} style={local.registroLinha} accessible accessibilityLabel={`${q.nome}, ${formatarDataHora(q.criadoEmISO)}${q.nivelAtencao ? `, nível de atenção ${ROTULO_ATENCAO[q.nivelAtencao]}` : ''}`}>
            <View style={[local.iconeRegistro, { backgroundColor: '#EEE9F8' }]}>
              <Ionicons name="clipboard" size={20} color="#7A5CC0" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={local.registroTitulo}>{q.nome}</Text>
              <Text style={local.registroData}>{formatarDataHora(q.criadoEmISO)}{q.categoria ? ` · ${q.categoria}` : ''}</Text>
              {!!q.resultado && <Text style={local.registroResultado}>{q.resultado}</Text>}
              {!!q.resumo && <Text style={local.registroData}>{q.resumo}</Text>}
              {nivel && q.nivelAtencao && (
                <Text style={[local.miniChip, { backgroundColor: nivel.fundo, color: nivel.texto, alignSelf: 'flex-start', marginTop: 6 }]}>
                  Nível de atenção: {ROTULO_ATENCAO[q.nivelAtencao]}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function DetalheRelatorios() {
  const estado = useEvolua((e) => e);
  const [baixando, setBaixando] = useState<Periodo | null>(null);

  const baixar = async (periodo: Periodo) => {
    if (baixando) return;
    setBaixando(periodo);
    try {
      const resultado = await baixarRelatorioPdf(lerEstadoEvolua(), periodo);
      if (resultado === 'impressao') {
        avisar('Relatório pronto', 'Na janela que abriu, escolha "Salvar como PDF" como destino.');
      }
    } catch {
      avisar('Não foi possível gerar o PDF', 'Tente novamente em instantes.');
    } finally {
      setBaixando(null);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={estilos.painelTexto}>
        Escolha o período para gerar um relatório em PDF com seus check-ins, exercícios, bem-estar, questionários e metas.
      </Text>

      {PERIODOS.map((p) => {
        const nCheckins = noPeriodo(estado.checkins, p).length;
        const nExercicios = noPeriodo(estado.exerciciosConcluidos, p).length;
        const nBemEstar = noPeriodo(estado.atividadesBemEstar, p).length;
        const nQuestionarios = noPeriodo(estado.questionariosRespondidos, p).length;
        const ocupado = baixando === p;

        return (
          <View key={p} style={local.cartaoRelatorio}>
            <View style={{ flex: 1 }}>
              <Text style={local.registroTitulo}>Últimos {p} dias</Text>
              <Text style={local.registroData}>
                {formatarDataBR(inicioDoPeriodo(p))} a {formatarDataBR(dataLocalISO(new Date()))}
              </Text>
              <Text style={[local.registroData, { marginTop: 4 }]}>
                {nCheckins} check-ins · {nExercicios} exercícios · {nBemEstar} bem-estar · {nQuestionarios} questionários
              </Text>
            </View>

            <Pressable
              style={[local.botaoBaixar, !!baixando && !ocupado && { opacity: 0.5 }]}
              onPress={() => baixar(p)}
              disabled={!!baixando}
              accessibilityRole="button"
              accessibilityLabel={`Baixar relatório em PDF dos últimos ${p} dias`}
            >
              {ocupado ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text style={local.botaoBaixarTexto}>PDF</Text>
                </>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function PainelDetalhe({
  chave, periodo, onPeriodo, onVoltar, desktop,
}: { chave: ChaveDetalhe; periodo: Periodo; onPeriodo: (p: Periodo) => void; onVoltar: () => void; desktop: boolean }) {
  const item = ITENS.find((i) => i.chave === chave) ?? ITENS[0];

  return (
    <View style={estilos.cartao}>
      <Pressable
        style={local.voltarLinha}
        onPress={onVoltar}
        accessibilityRole="button"
        accessibilityLabel={desktop ? 'Fechar detalhe' : 'Voltar para Progresso'}
      >
        <Ionicons name={desktop ? 'close' : 'chevron-back'} size={20} color={cores.azulEvolua} />
        <Text style={local.voltarTexto}>{desktop ? 'Fechar' : 'Voltar para Progresso'}</Text>
      </Pressable>

      <View style={local.detalheTitulo} accessibilityRole="header">
        <View style={[local.iconeRegistro, { backgroundColor: item.fundo }]}>
          <Ionicons name={item.icone} size={22} color={item.corIcone} />
        </View>
        <Text style={local.detalheTituloTexto}>{item.titulo}</Text>
      </View>

      {chave !== 'metas' && chave !== 'relatorios' && <SeletorPeriodo periodo={periodo} onChange={onPeriodo} />}

      <View style={{ marginTop: 14 }}>
        {chave === 'historico' && <DetalheHistorico periodo={periodo} />}
        {chave === 'evolucao' && <DetalheEvolucao periodo={periodo} />}
        {chave === 'metas' && <DetalheMetas />}
        {chave === 'exercicios' && <DetalheExercicios periodo={periodo} />}
        {chave === 'questionarios' && <DetalheQuestionarios periodo={periodo} />}
        {chave === 'relatorios' && <DetalheRelatorios />}
      </View>
    </View>
  );
}

/* ================================== TELA ================================ */

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
            name="stats-chart"
            size={desktop ? 34 : estreito ? 26 : 30}
            color={cores.azulEvolua}
          />
          <Text
            style={[local.tituloPagina, { fontSize: desktop ? 36 : estreito ? 26 : 32 }]}
            numberOfLines={1}
          >
            Progresso
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

function TelaProgresso({
  detalhe, periodo, onAbrir, onFechar, onPeriodo,
}: {
  detalhe: ChaveDetalhe | null;
  periodo: Periodo;
  onAbrir: (c: ChaveDetalhe) => void;
  onFechar: () => void;
  onPeriodo: (p: Periodo) => void;
}) {
  const { desktop } = useLayoutInfo();

  const lista = (
    <View>
      <Text style={estilos.secaoTitulo}>Explore seu progresso:</Text>
      <View style={local.lista}>
        {ITENS.map((item) => (
          <CartaoProgresso
            key={item.chave}
            item={item}
            selecionado={desktop && detalhe === item.chave}
            onPress={() => onAbrir(item.chave)}
          />
        ))}
      </View>
    </View>
  );

  const painel = detalhe ? (
    <PainelDetalhe chave={detalhe} periodo={periodo} onPeriodo={onPeriodo} onVoltar={onFechar} desktop={desktop} />
  ) : null;

  // Celular: o detalhe ocupa a tela, com botão de voltar.
  if (!desktop && painel) return painel;

  return (
    <>
      <Text style={[estilos.frase, desktop && { fontSize: 17, lineHeight: 24 }]}>
        Veja como você tem evoluído, um passo de cada vez.
      </Text>

      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1 }}>{lista}</View>
          <View style={{ flex: 1.1 }}>{painel ?? <CartaoResumo />}</View>
        </View>
      ) : (
        <>
          <CartaoResumo />
          {lista}
        </>
      )}
    </>
  );
}

type TelaAtual = 'progresso' | 'configuracoes' | 'notificacoes';

export default function Progresso() {
  const insets = useSafeAreaInsets();
  const { desktop, larguraMax } = useLayoutInfo();
  const navigation = useNavigation();
  const tecladoVisivel = useTecladoVisivel();
  const [tela, setTela] = useState<TelaAtual>('progresso');
  const [detalhe, setDetalhe] = useState<ChaveDetalhe | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  // Dados de exemplo do Pedro (só entram se o app estiver vazio).
  useEffect(() => {
    semearDadosPedro();
  }, []);

  const irTela = useCallback((t: TelaInterna) => {
    setTela(t === 'home' ? 'progresso' : t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const abrirDetalhe = useCallback((chave: ChaveDetalhe) => {
    setDetalhe(chave);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  const fecharDetalhe = useCallback(() => {
    setDetalhe(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  useEffect(() => {
    if (tela === 'progresso' && !detalhe) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tela !== 'progresso') irTela('home');
      else fecharDetalhe();
      return true;
    });
    return () => sub.remove();
  }, [tela, detalhe, irTela, fecharDetalhe]);

  const noProgresso = tela === 'progresso';

  return (
    <NavegacaoContext.Provider value={{ irTela }}>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient
          colors={['#FFFFFF', '#F7F9FC', '#EEF2F6']}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />

        {noProgresso && <FaixaTopo />}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[
            estilos.conteudo,
            {
              maxWidth: larguraMax,
              paddingHorizontal: desktop ? 32 : 14,
              paddingTop: noProgresso ? ESPACO_APOS_FAIXA : insets.top + (desktop ? 24 : 8),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tela === 'progresso' && (
            <TelaProgresso
              detalhe={detalhe}
              periodo={periodo}
              onAbrir={abrirDetalhe}
              onFechar={fecharDetalhe}
              onPeriodo={setPeriodo}
            />
          )}
          {tela === 'configuracoes' && <TelaConfiguracoes />}
          {tela === 'notificacoes' && <TelaNotificacoes />}
        </ScrollView>
        {!tecladoVisivel && <MenuInferior ativo={noProgresso ? 'progresso' : null} />}
      </KeyboardAvoidingView>
    </NavegacaoContext.Provider>
  );
}

const FAIXA_ESPACO_CIMA = 24;
const FAIXA_ESPACO_BAIXO = 26;
const ESPACO_APOS_FAIXA = 30;
const ALTURA_GRAFICO = 140;

const local = StyleSheet.create({
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
  lista: { gap: 10, marginBottom: 18 },
  cartaoItem: { width: '100%', minHeight: 72 },
  estatLinha: { flexDirection: 'row', gap: 12 },
  estatBox: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16, backgroundColor: cores.azulGelo },
  estatNumero: { fontFamily: fontes.titulo, fontSize: 28, lineHeight: 34, color: cores.azulMarinho },
  estatRotulo: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, textAlign: 'center' },
  ultimoLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  barraTrilha: { height: 10, borderRadius: 5, backgroundColor: cores.cinzaClaro, overflow: 'hidden', marginTop: 6 },
  barraPreenchida: { height: 10, borderRadius: 5 },

  voltarLinha: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 8 },
  voltarTexto: { fontFamily: fontes.textoMedio, fontSize: 14, color: cores.azulEvolua },
  detalheTitulo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detalheTituloTexto: { flex: 1, fontFamily: fontes.titulo, fontSize: 20, lineHeight: 26, color: cores.azulMarinho },

  chipsLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: cores.azulGelo,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipAtivo: { backgroundColor: cores.azulEvolua, borderColor: cores.azulEvolua },
  chipTexto: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.azulMarinho },
  chipTextoAtivo: { color: '#FFFFFF' },

  registroLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconeRegistro: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  registroTitulo: { fontFamily: fontes.textoMedio, fontSize: 15, color: cores.azulMarinho },
  registroResultado: { fontFamily: fontes.textoMedio, fontSize: 13, color: '#44395E', marginTop: 4 },
  registroData: { fontFamily: fontes.texto, fontSize: 12, lineHeight: 17, color: cores.cinzaGrafite, marginTop: 2 },
  miniChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  miniChip: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  botaoMais: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: cores.azulGelo },
  botaoMaisTexto: { fontFamily: fontes.textoMedio, fontSize: 13, color: cores.azulEvolua },

  legendaGrafico: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, marginBottom: 6 },
  grafico: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 10 },
  colunaGrafico: { flex: 1, alignItems: 'center' },
  valorBarra: { fontFamily: fontes.textoMedio, fontSize: 10, color: cores.cinzaGrafite, marginBottom: 4 },
  trilhaGrafico: {
    height: ALTURA_GRAFICO,
    width: '100%',
    maxWidth: 34,
    justifyContent: 'flex-end',
    backgroundColor: cores.azulGelo,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barraGrafico: { width: '100%', borderRadius: 8 },
  rotuloBarra: { fontFamily: fontes.texto, fontSize: 10, color: cores.cinzaGrafite, marginTop: 6 },
  caixaResumo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F7F9FF',
    borderLeftWidth: 4,
  },
  caixaResumoTexto: { fontFamily: fontes.texto, fontSize: 14, lineHeight: 20, color: cores.azulMarinho },

  cartaoRelatorio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F7F9FF',
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
  },
  botaoBaixar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 84,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: cores.azulEvolua,
  },
  botaoBaixarTexto: { fontFamily: fontes.textoMedio, fontSize: 14, color: '#FFFFFF' },
});