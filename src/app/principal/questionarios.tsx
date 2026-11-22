
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuInferior } from './compartilhado';

/* =========================================================
   1. CORES DA PÁGINA
========================================================= */

const CORES = {
  fundo: '#F5FAF8',
  branco: '#FFFFFF',
  verdeClaro: '#E5F3EF',
  verdeMenta: '#DFF2EF',
  verdeAgua: '#B9DED4',
  verde: '#25877E',
  verdeEscuro: '#294B49',
  verdeMedio: '#4D9C8D',
  texto: '#294B49',
  textoSecundario: '#718783',
  borda: '#DCEAE5',
};

/* =========================================================
   2. TIPOS
========================================================= */

type Pergunta = {
  titulo: string;
  descricao?: string;
  opcoes: string[];
};

type Questionario = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tempo: string;
  icone: keyof typeof Ionicons.glyphMap;
  perguntas: Pergunta[];
};

type Relatorio = {
  titulo: string;
  reflexao: string;
  atencao: string;
  sugestao: string;
};

/* =========================================================
   3. QUESTIONÁRIOS
========================================================= */

const QUESTIONARIOS: Questionario[] = [
  {
    id: 'emocional',
    titulo: 'Como estou hoje?',
    descricao: 'Entenda melhor suas emoções e como está se sentindo.',
    categoria: 'Autoconhecimento',
    tempo: '2 minutos',
    icone: 'heart-outline',
    perguntas: [
      {
        titulo: 'Como você descreveria seu estado emocional hoje?',
        opcoes: [
          'Tranquilo(a) e bem',
          'Um pouco preocupado(a)',
          'Ansioso(a) ou agitado(a)',
          'Triste ou desanimado(a)',
          'Sobrecarregado(a)',
        ],
      },
      {
        titulo: 'Como está sua disposição neste momento?',
        opcoes: [
          'Estou com bastante energia',
          'Estou com energia moderada',
          'Estou um pouco cansado(a)',
          'Estou sem energia',
        ],
      },
      {
        titulo: 'Quando uma emoção difícil aparece, como você reage?',
        opcoes: [
          'Consigo me acalmar',
          'Às vezes consigo lidar',
          'Tenho dificuldade para controlar',
          'Não sei muito bem como reagir',
        ],
      },
    ],
  },

  {
    id: 'vontade',
    titulo: 'Vontade de consumir',
    descricao: 'Observe como estão seus impulsos e sua capacidade de lidar com eles.',
    categoria: 'Prevenção de recaídas',
    tempo: '2 minutos',
    icone: 'shield-checkmark-outline',
    perguntas: [
      {
        titulo: 'Nos últimos dias, como esteve sua vontade de consumir?',
        opcoes: [
          'Não senti vontade',
          'Senti uma vontade leve',
          'Senti uma vontade moderada',
          'Senti uma vontade forte ou intensa',
        ],
      },
      {
        titulo: 'Quando essa vontade aparece, o que costuma acontecer?',
        opcoes: [
          'Consigo lidar com ela',
          'Procuro me distrair',
          'Fico pensando muito em consumir',
          'Tenho dificuldade para resistir',
          'Acabo consumindo',
        ],
      },
      {
        titulo: 'Você sente que tem recursos para lidar com esses momentos?',
        opcoes: [
          'Sim, tenho estratégias que funcionam',
          'Tenho algumas estratégias, mas nem sempre',
          'Ainda estou aprendendo a lidar',
          'Não sei o que fazer nesses momentos',
        ],
      },
    ],
  },

  {
    id: 'gatilhos',
    titulo: 'Meus gatilhos',
    descricao: 'Identifique situações e sentimentos que podem despertar impulsos.',
    categoria: 'Autoconhecimento',
    tempo: '2 minutos',
    icone: 'eye-outline',
    perguntas: [
      {
        titulo: 'O que costuma despertar emoções ou vontades difíceis para você?',
        opcoes: [
          'Estresse ou ansiedade',
          'Solidão ou tristeza',
          'Discussões ou conflitos',
          'Lugares ou pessoas específicas',
          'Tédio ou falta do que fazer',
          'Não consigo identificar',
        ],
      },
      {
        titulo: 'Quando você passa por uma situação difícil, como costuma reagir?',
        opcoes: [
          'Converso com alguém',
          'Procuro fazer alguma atividade',
          'Prefiro ficar sozinho(a)',
          'Tento ignorar o que estou sentindo',
          'Sinto vontade de consumir',
        ],
      },
      {
        titulo: 'Você consegue reconhecer os seus principais gatilhos?',
        opcoes: [
          'Sim, consigo identificar',
          'Reconheço alguns deles',
          'Às vezes percebo',
          'Ainda tenho dificuldade',
        ],
      },
    ],
  },

  {
    id: 'motivacao',
    titulo: 'Minha motivação',
    descricao: 'Reflita sobre sua confiança, seus objetivos e sua rede de apoio.',
    categoria: 'Desenvolvimento pessoal',
    tempo: '2 minutos',
    icone: 'trending-up-outline',
    perguntas: [
      {
        titulo: 'Como está sua motivação para continuar sua jornada?',
        opcoes: [
          'Estou muito motivado(a)',
          'Estou motivado(a), mas tenho oscilações',
          'Minha motivação está baixa',
          'Estou me sentindo desanimado(a)',
        ],
      },
      {
        titulo: 'Você acredita que consegue construir novos hábitos?',
        opcoes: [
          'Sim, acredito em mim',
          'Acredito, mas tenho algumas dúvidas',
          'Ainda não me sinto confiante',
          'Neste momento, parece muito difícil',
        ],
      },
      {
        titulo: 'Você sente que tem pessoas com quem pode contar?',
        opcoes: [
          'Sim, tenho uma boa rede de apoio',
          'Tenho algumas pessoas próximas',
          'Tenho pouco apoio',
          'Não sinto que tenho alguém para conversar',
        ],
      },
    ],
  },
];

/* =========================================================
   4. GERAÇÃO DO RELATÓRIO PERSONALIZADO
========================================================= */

function gerarRelatorio(
  questionario: Questionario,
  respostas: string[]
): Relatorio {
  const primeira = respostas[0] || '';
  const segunda = respostas[1] || '';
  const terceira = respostas[2] || '';

  if (questionario.id === 'emocional') {
    let reflexao =
      `Hoje você descreveu seu estado emocional como: "${primeira}". `;

    reflexao +=
      `Sua disposição foi registrada como "${segunda}". `;

    reflexao +=
      `Sobre lidar com emoções difíceis, você respondeu: "${terceira}".`;

    return {
      titulo: 'Seu momento emocional',
      reflexao,
      atencao:
        segunda.includes('sem energia') ||
        segunda.includes('cansado')
          ? 'Sua disposição merece atenção. Respeitar seus limites e observar sua rotina pode ajudar.'
          : 'Continue observando como suas emoções e sua disposição mudam ao longo dos dias.',
      sugestao:
        'Reserve alguns minutos para uma atividade tranquila. Respirar com calma, descansar ou conversar com alguém de confiança pode ser um bom começo.',
    };
  }

  if (questionario.id === 'vontade') {
    const vontadeIntensa =
      primeira.includes('forte') ||
      primeira.includes('intensa');

    const dificuldade =
      segunda.includes('dificuldade') ||
      segunda.includes('consumindo') ||
      terceira.includes('Não sei');

    return {
      titulo: 'Sua relação com os impulsos',
      reflexao:
        `Você relatou que sua vontade de consumir esteve assim: "${primeira}". ` +
        `Quando ela aparece, sua reação costuma ser: "${segunda}". ` +
        `Sobre suas estratégias para lidar com esses momentos, você respondeu: "${terceira}".`,
      atencao: vontadeIntensa || dificuldade
        ? 'É importante observar esses momentos com cuidado e buscar apoio quando sentir que está difícil lidar com a vontade.'
        : 'Continue identificando o que ajuda você a atravessar os momentos de vontade e quais estratégias funcionam melhor.',
      sugestao:
        'Quando perceber um impulso, tente se afastar de situações de risco, procurar alguém de confiança e utilizar uma estratégia de enfrentamento que já tenha funcionado para você.',
    };
  }

  if (questionario.id === 'gatilhos') {
    return {
      titulo: 'O que merece sua atenção',
      reflexao:
        `Você identificou como possíveis gatilhos: "${primeira}". ` +
        `Sua reação mais comum diante de situações difíceis é: "${segunda}". ` +
        `Sobre reconhecer esses gatilhos, você respondeu: "${terceira}".`,
      atencao:
        'Reconhecer situações que despertam emoções difíceis pode ajudar você a se preparar melhor para elas.',
      sugestao:
        'Experimente observar quando essas situações aparecem. Se puder, anote o que aconteceu, o que sentiu e o que fez em seguida.',
    };
  }

  return {
    titulo: 'Sua jornada de motivação',
    reflexao:
      `Sua motivação neste momento foi descrita como: "${primeira}". ` +
      `Sobre construir novos hábitos, você respondeu: "${segunda}". ` +
      `Em relação à sua rede de apoio, sua resposta foi: "${terceira}".`,
    atencao:
      'A motivação pode mudar ao longo do tempo. Momentos de dúvida ou desânimo não anulam os passos que você já deu.',
    sugestao:
      'Escolha um objetivo pequeno e possível para hoje. Se sentir necessidade, compartilhe como está se sentindo com alguém em quem confia.',
  };
}

/* =========================================================
   5. TELA PRINCIPAL
========================================================= */

export default function Questionarios() {
  const insets = useSafeAreaInsets();

  const [selecionado, setSelecionado] =
    useState<Questionario | null>(null);

  const [indice, setIndice] = useState(0);

  const [respostas, setRespostas] =
    useState<string[]>([]);

  const [concluido, setConcluido] =
    useState(false);

  const [historico, setHistorico] =
    useState(0);

  const voltar = () => {
    if (concluido) {
      setConcluido(false);
      setSelecionado(null);
      setRespostas([]);
      setIndice(0);
      return;
    }

    if (selecionado) {
      if (indice > 0) {
        setIndice(indice - 1);
      } else {
        setSelecionado(null);
        setRespostas([]);
      }
      return;
    }

    router.replace('/principal/evolua');
  };

  const iniciarQuestionario = (questionario: Questionario) => {
    setSelecionado(questionario);
    setIndice(0);
    setRespostas([]);
    setConcluido(false);
  };

  const selecionarResposta = (resposta: string) => {
    const novasRespostas = [...respostas];
    novasRespostas[indice] = resposta;
    setRespostas(novasRespostas);
  };

  const continuar = () => {
    if (!selecionado || !respostas[indice]) return;

    if (indice < selecionado.perguntas.length - 1) {
      setIndice(indice + 1);
    } else {
      setConcluido(true);
      setHistorico(historico + 1);
    }
  };

  const novoQuestionario = () => {
    setSelecionado(null);
    setIndice(0);
    setRespostas([]);
    setConcluido(false);
  };

  const relatorio =
    selecionado && concluido
      ? gerarRelatorio(selecionado, respostas)
      : null;

  const progresso = selecionado
    ? ((indice + (concluido ? 1 : 0)) /
        selecionado.perguntas.length) * 100
    : 0;

  /* =======================================================
     6. CABEÇALHO
  ======================================================= */

  const Cabecalho = () => (
    <View style={[estilos.cabecalho, { paddingTop: insets.top + 10 }]}>
      <Pressable
        onPress={voltar}
        style={estilos.botaoVoltar}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons
          name="arrow-back"
          size={23}
          color={CORES.verdeEscuro}
        />
      </Pressable>

      <View style={estilos.tituloCabecalho}>
        <Text style={estilos.tituloPrincipal}>
          Questionários
        </Text>
        <Text style={estilos.subtituloCabecalho}>
          Um espaço para se escutar
        </Text>
      </View>

      <View style={estilos.iconeCabecalho}>
        <Ionicons
          name="clipboard-outline"
          size={25}
          color={CORES.verde}
        />
      </View>
    </View>
  );

  /* =======================================================
     7. LISTA DE QUESTIONÁRIOS
  ======================================================= */

  const TelaLista = () => (
    <>
      <View style={estilos.apresentacao}>
        <View style={estilos.apresentacaoIcone}>
          <Ionicons
            name="leaf-outline"
            size={30}
            color={CORES.verde}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={estilos.apresentacaoTitulo}>
            Conhecer a si mesmo é um passo importante.
          </Text>
          <Text style={estilos.apresentacaoTexto}>
            Responda algumas perguntas simples para entender
            melhor suas emoções, seus desafios e suas conquistas.
          </Text>
        </View>
      </View>

      <View style={estilos.secaoCabecalho}>
        <Text style={estilos.secaoTitulo}>
          Escolha um questionário
        </Text>
        <Text style={estilos.secaoDescricao}>
          Respostas rápidas, feitas no seu tempo.
        </Text>
      </View>

      {QUESTIONARIOS.map((questionario, index) => (
        <Pressable
          key={questionario.id}
          style={estilos.cartaoQuestionario}
          onPress={() => iniciarQuestionario(questionario)}
        >
          <View style={estilos.cartaoLinha}>
            <View style={estilos.cartaoIcone}>
              <Ionicons
                name={questionario.icone}
                size={25}
                color={CORES.verde}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={estilos.cartaoCategoria}>
                {questionario.categoria}
              </Text>
              <Text style={estilos.cartaoTitulo}>
                {questionario.titulo}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={21}
              color={CORES.verdeMedio}
            />
          </View>

          <Text style={estilos.cartaoDescricao}>
            {questionario.descricao}
          </Text>

          <View style={estilos.cartaoRodape}>
            <View style={estilos.informacaoTempo}>
              <Ionicons
                name="time-outline"
                size={15}
                color={CORES.textoSecundario}
              />
              <Text style={estilos.tempoTexto}>
                {questionario.tempo}
              </Text>
            </View>

            <Text style={estilos.quantidadePerguntas}>
              {questionario.perguntas.length} perguntas
            </Text>
          </View>
        </Pressable>
      ))}

      <View style={estilos.aviso}>
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={CORES.verde}
        />
        <Text style={estilos.avisoTexto}>
          Não existem respostas certas ou erradas. Seja sincero(a)
          consigo mesmo(a). Suas respostas ajudam a organizar suas
          próprias percepções.
        </Text>
      </View>

      {historico > 0 && (
        <Text style={estilos.historico}>
          Você já concluiu {historico} questionário(s) nesta sessão.
        </Text>
      )}
    </>
  );

  /* =======================================================
     8. PERGUNTAS
  ======================================================= */

  const TelaPerguntas = () => {
    if (!selecionado) return null;

    const pergunta = selecionado.perguntas[indice];
    const respostaAtual = respostas[indice];

    return (
      <View style={estilos.areaPergunta}>
        <View style={estilos.progressoCabecalho}>
          <Text style={estilos.categoriaPergunta}>
            {selecionado.categoria}
          </Text>

          <Text style={estilos.contadorPergunta}>
            {indice + 1} de {selecionado.perguntas.length}
          </Text>
        </View>

        <View style={estilos.trilhaProgresso}>
          <View
            style={[
              estilos.progressoPreenchido,
              {
                width: `${
                  ((indice + 1) /
                    selecionado.perguntas.length) * 100
                }%`,
              },
            ]}
          />
        </View>

        <Text style={estilos.nomeQuestionario}>
          {selecionado.titulo}
        </Text>

        <Text style={estilos.perguntaTitulo}>
          {pergunta.titulo}
        </Text>

        <Text style={estilos.perguntaDescricao}>
          Escolha a alternativa que mais representa o que você sente.
        </Text>

        <View style={estilos.listaOpcoes}>
          {pergunta.opcoes.map((opcao, i) => {
            const ativa = respostaAtual === opcao;

            return (
              <Pressable
                key={`${opcao}-${i}`}
                style={[
                  estilos.opcao,
                  ativa && estilos.opcaoSelecionada,
                ]}
                onPress={() => selecionarResposta(opcao)}
              >
                <View
                  style={[
                    estilos.circuloOpcao,
                    ativa && estilos.circuloOpcaoAtivo,
                  ]}
                >
                  {ativa && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={CORES.branco}
                    />
                  )}
                </View>

                <Text
                  style={[
                    estilos.textoOpcao,
                    ativa && estilos.textoOpcaoAtivo,
                  ]}
                >
                  {opcao}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            estilos.botaoContinuar,
            !respostaAtual && estilos.botaoDesabilitado,
          ]}
          onPress={continuar}
          disabled={!respostaAtual}
        >
          <Text style={estilos.textoBotaoContinuar}>
            {indice === selecionado.perguntas.length - 1
              ? 'Finalizar questionário'
              : 'Continuar'}
          </Text>

          <Ionicons
            name={
              indice === selecionado.perguntas.length - 1
                ? 'checkmark-circle-outline'
                : 'arrow-forward'
            }
            size={20}
            color={CORES.branco}
          />
        </Pressable>

        <Pressable
          style={estilos.botaoAnterior}
          onPress={voltar}
        >
          <Ionicons
            name="arrow-back"
            size={17}
            color={CORES.verde}
          />
          <Text style={estilos.textoBotaoAnterior}>
            Pergunta anterior
          </Text>
        </Pressable>
      </View>
    );
  };

  /* =======================================================
     9. RESULTADO E RELATÓRIO
  ======================================================= */

  const TelaResultado = () => {
    if (!selecionado || !relatorio) return null;

    return (
      <View style={estilos.areaResultado}>
        <View style={estilos.sucessoIcone}>
          <Ionicons
            name="checkmark"
            size={34}
            color={CORES.branco}
          />
        </View>

        <Text style={estilos.tituloResultado}>
          Questionário concluído!
        </Text>

        <Text style={estilos.subtituloResultado}>
          Obrigado por reservar um momento para olhar para si.
        </Text>

        <View style={estilos.cartaoRelatorio}>
          <View style={estilos.relatorioCabecalho}>
            <View style={estilos.relatorioIcone}>
              <Ionicons
                name="document-text-outline"
                size={23}
                color={CORES.verde}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={estilos.relatorioPequeno}>
                SEU RELATÓRIO PESSOAL
              </Text>
              <Text style={estilos.relatorioTitulo}>
                {relatorio.titulo}
              </Text>
            </View>
          </View>

          <View style={estilos.linhaRelatorio} />

          <Text style={estilos.relatorioSecao}>
            O que suas respostas mostram
          </Text>
          <Text style={estilos.relatorioTexto}>
            {relatorio.reflexao}
          </Text>

          <View style={estilos.blocoAtencao}>
            <View style={estilos.blocoTituloLinha}>
              <Ionicons
                name="eye-outline"
                size={19}
                color={CORES.verde}
              />
              <Text style={estilos.blocoTitulo}>
                Ponto de atenção
              </Text>
            </View>

            <Text style={estilos.relatorioTexto}>
              {relatorio.atencao}
            </Text>
          </View>

          <View style={estilos.blocoSugestao}>
            <View style={estilos.blocoTituloLinha}>
              <Ionicons
                name="leaf-outline"
                size={19}
                color={CORES.verde}
              />
              <Text style={estilos.blocoTitulo}>
                Uma sugestão para você
              </Text>
            </View>

            <Text style={estilos.relatorioTexto}>
              {relatorio.sugestao}
            </Text>
          </View>
        </View>

        <View style={estilos.disclaimer}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={CORES.textoSecundario}
          />
          <Text style={estilos.disclaimerTexto}>
            Este é um resumo reflexivo baseado nas suas respostas.
            Ele não representa um diagnóstico ou uma avaliação
            clínica e não substitui o acompanhamento profissional.
          </Text>
        </View>

        <Pressable
          style={estilos.botaoContinuar}
          onPress={novoQuestionario}
        >
          <Text style={estilos.textoBotaoContinuar}>
            Voltar aos questionários
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={CORES.branco}
          />
        </Pressable>

        <Pressable
          style={estilos.botaoAnterior}
          onPress={() => router.replace('/principal/evolua')}
        >
          <Ionicons
            name="home-outline"
            size={18}
            color={CORES.verde}
          />
          <Text style={estilos.textoBotaoAnterior}>
            Voltar para Evolua
          </Text>
        </Pressable>
      </View>
    );
  };

  /* =======================================================
     10. RENDERIZAÇÃO
  ======================================================= */

  return (
    <View style={estilos.container}>
      <Cabecalho />

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={[
          estilos.conteudo,
          { paddingBottom: insets.bottom + 115 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!selecionado && <TelaLista />}

        {selecionado && !concluido && <TelaPerguntas />}

        {selecionado && concluido && <TelaResultado />}
      </ScrollView>

      <MenuInferior ativo="evolua" />
    </View>
  );
}

/* =========================================================
   11. ESTILOS
========================================================= */

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },

  cabecalho: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 14,
    backgroundColor: CORES.branco,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },

  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: CORES.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tituloCabecalho: {
    flex: 1,
    alignItems: 'center',
  },

  tituloPrincipal: {
    fontSize: 19,
    fontWeight: '700',
    color: CORES.verdeEscuro,
  },

  subtituloCabecalho: {
    fontSize: 11,
    color: CORES.textoSecundario,
    marginTop: 3,
  },

  iconeCabecalho: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: CORES.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },

  conteudo: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 22,
  },

  apresentacao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.verdeMenta,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    marginBottom: 28,
  },

  apresentacaoIcone: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: CORES.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },

  apresentacaoTitulo: {
    color: CORES.verdeEscuro,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 21,
  },

  apresentacaoTexto: {
    color: CORES.texto,
    fontSize: 12,
    lineHeight: 19,
  },

  secaoCabecalho: {
    marginBottom: 16,
  },

  secaoTitulo: {
    fontSize: 19,
    fontWeight: '700',
    color: CORES.verdeEscuro,
  },

  secaoDescricao: {
    color: CORES.textoSecundario,
    fontSize: 13,
    marginTop: 5,
  },

  cartaoQuestionario: {
    backgroundColor: CORES.branco,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 17,
    marginBottom: 13,
  },

  cartaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  cartaoIcone: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: CORES.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartaoCategoria: {
    color: CORES.verde,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  cartaoTitulo: {
    color: CORES.verdeEscuro,
    fontSize: 16,
    fontWeight: '700',
  },

  cartaoDescricao: {
    color: CORES.textoSecundario,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 13,
  },

  cartaoRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: CORES.borda,
  },

  informacaoTempo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  tempoTexto: {
    fontSize: 11,
    color: CORES.textoSecundario,
  },

  quantidadePerguntas: {
    fontSize: 11,
    color: CORES.verde,
    fontWeight: '600',
  },

  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 14,
    marginTop: 8,
    backgroundColor: CORES.verdeClaro,
    borderRadius: 14,
  },

  avisoTexto: {
    flex: 1,
    color: CORES.texto,
    fontSize: 11,
    lineHeight: 17,
  },

  historico: {
    color: CORES.textoSecundario,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },

  areaPergunta: {
    paddingTop: 8,
  },

  progressoCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  categoriaPergunta: {
    color: CORES.verde,
    fontSize: 12,
    fontWeight: '700',
  },

  contadorPergunta: {
    color: CORES.textoSecundario,
    fontSize: 12,
  },

  trilhaProgresso: {
    height: 7,
    borderRadius: 10,
    backgroundColor: CORES.verdeMenta,
    overflow: 'hidden',
    marginBottom: 28,
  },

  progressoPreenchido: {
    height: '100%',
    backgroundColor: CORES.verde,
    borderRadius: 10,
  },

  nomeQuestionario: {
    color: CORES.verde,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 13,
  },

  perguntaTitulo: {
    color: CORES.verdeEscuro,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },

  perguntaDescricao: {
    color: CORES.textoSecundario,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 23,
  },

  listaOpcoes: {
    gap: 11,
  },

  opcao: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.branco,
  },

  opcaoSelecionada: {
    borderColor: CORES.verde,
    backgroundColor: CORES.verdeMenta,
  },

  circuloOpcao: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: CORES.verdeAgua,
    alignItems: 'center',
    justifyContent: 'center',
  },

  circuloOpcaoAtivo: {
    backgroundColor: CORES.verde,
    borderColor: CORES.verde,
  },

  textoOpcao: {
    flex: 1,
    color: CORES.texto,
    fontSize: 13,
    lineHeight: 19,
  },

  textoOpcaoAtivo: {
    color: CORES.verdeEscuro,
    fontWeight: '600',
  },

  botaoContinuar: {
    minHeight: 54,
    backgroundColor: CORES.verde,
    borderRadius: 15,
    marginTop: 26,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  botaoDesabilitado: {
    opacity: 0.45,
  },

  textoBotaoContinuar: {
    color: CORES.branco,
    fontSize: 14,
    fontWeight: '700',
  },

  botaoAnterior: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 9,
  },

  textoBotaoAnterior: {
    color: CORES.verde,
    fontSize: 13,
    fontWeight: '600',
  },

  areaResultado: {
    alignItems: 'center',
    paddingTop: 12,
  },

  sucessoIcone: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: CORES.verde,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  tituloResultado: {
    color: CORES.verdeEscuro,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtituloResultado: {
    color: CORES.textoSecundario,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 23,
  },

  cartaoRelatorio: {
    width: '100%',
    backgroundColor: CORES.branco,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 18,
  },

  relatorioCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  relatorioIcone: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: CORES.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  relatorioPequeno: {
    color: CORES.verde,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 4,
  },

  relatorioTitulo: {
    color: CORES.verdeEscuro,
    fontSize: 16,
    fontWeight: '700',
  },

  linhaRelatorio: {
    height: 1,
    backgroundColor: CORES.borda,
    marginVertical: 18,
  },

  relatorioSecao: {
    color: CORES.verdeEscuro,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },

  relatorioTexto: {
    color: CORES.texto,
    fontSize: 12,
    lineHeight: 20,
  },

  blocoAtencao: {
    backgroundColor: CORES.verdeClaro,
    borderRadius: 13,
    padding: 14,
    marginTop: 17,
  },

  blocoSugestao: {
    backgroundColor: '#F1F7F4',
    borderRadius: 13,
    padding: 14,
    marginTop: 12,
  },

  blocoTituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  blocoTitulo: {
    color: CORES.verdeEscuro,
    fontSize: 13,
    fontWeight: '700',
  },

  disclaimer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 4,
  },

  disclaimerTexto: {
    flex: 1,
    color: CORES.textoSecundario,
    fontSize: 10,
    lineHeight: 16,
  },
});
