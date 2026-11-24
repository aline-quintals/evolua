import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontes } from '../../tema';
import {
  MenuInferior,
  registrarQuestionarioRespondido,
  useLayoutInfo,
  type NivelAtencao,
} from './compartilhado';

/* =========================================================
   1. CORES (verde como tom principal + tons de apoio)
========================================================= */

const VERDE = {
  principal: '#2F8A7A',
  escuro: '#25695D',
  medio: '#5BA593',
  claro: '#E2F3EE',
  apresentacao: '#E6F4EF',
  suave: '#EAF3ED',
  borda: '#E7EDF3',
  trilha: '#E3ECE8',
};

/* =========================================================
   2. TIPOS
========================================================= */

type Pergunta = {
  titulo: string;
  opcoes: string[];
};

type Questionario = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tempo: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  cor: string;
  corTexto: string;
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
    cor: '#FCE9EF',
    corTexto: '#A44F72',
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
    cor: '#E3F2EA',
    corTexto: '#477C60',
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
    cor: '#E3F1F7',
    corTexto: '#39738E',
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
    cor: '#F9F0DC',
    corTexto: '#9B773B',
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

const TOTAL_PERGUNTAS = QUESTIONARIOS.reduce((soma, q) => soma + q.perguntas.length, 0);

/* =========================================================
   4. RELATÓRIO PERSONALIZADO
========================================================= */

function gerarRelatorio(questionario: Questionario, respostas: string[]): Relatorio {
  const primeira = respostas[0] || '';
  const segunda = respostas[1] || '';
  const terceira = respostas[2] || '';

  if (questionario.id === 'emocional') {
    return {
      titulo: 'Seu momento emocional',
      reflexao:
        `Hoje você descreveu seu estado emocional como: "${primeira}". ` +
        `Sua disposição foi registrada como "${segunda}". ` +
        `Sobre lidar com emoções difíceis, você respondeu: "${terceira}".`,
      atencao:
        segunda.includes('sem energia') || segunda.includes('cansado')
          ? 'Sua disposição merece atenção. Respeitar seus limites e observar sua rotina pode ajudar.'
          : 'Continue observando como suas emoções e sua disposição mudam ao longo dos dias.',
      sugestao:
        'Reserve alguns minutos para uma atividade tranquila. Respirar com calma, descansar ou conversar com alguém de confiança pode ser um bom começo.',
    };
  }

  if (questionario.id === 'vontade') {
    const vontadeIntensa = primeira.includes('forte') || primeira.includes('intensa');
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
      atencao:
        vontadeIntensa || dificuldade
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
   4.1 RESUMO PARA O HISTÓRICO (sem guardar as respostas)
========================================================= */

// Perguntas cujas opções vão da mais tranquila para a que mais pede atenção.
const PERGUNTAS_ORDENADAS: Record<string, number[]> = {
  emocional: [0, 1, 2],
  vontade: [0, 1, 2],
  gatilhos: [1, 2],
  motivacao: [0, 1, 2],
};

const RESUMOS_NIVEL: Record<NivelAtencao, string> = {
  baixo: 'Sem sinais de atenção neste momento.',
  moderado: 'Alguns pontos merecem observação.',
  alto: 'Pontos importantes merecem atenção e apoio.',
};

function resumirQuestionario(
  questionario: Questionario,
  respostas: string[],
): { nivelAtencao: NivelAtencao; resumo: string } {
  const indices = PERGUNTAS_ORDENADAS[questionario.id] ?? questionario.perguntas.map((_, i) => i);

  let soma = 0;
  let contadas = 0;

  indices.forEach((i) => {
    const pergunta = questionario.perguntas[i];
    const posicao = pergunta ? pergunta.opcoes.indexOf(respostas[i]) : -1;
    if (!pergunta || posicao < 0 || pergunta.opcoes.length < 2) return;
    soma += posicao / (pergunta.opcoes.length - 1);
    contadas += 1;
  });

  const proporcao = contadas > 0 ? soma / contadas : 0;
  const nivelAtencao: NivelAtencao = proporcao < 0.34 ? 'baixo' : proporcao < 0.67 ? 'moderado' : 'alto';

  return { nivelAtencao, resumo: RESUMOS_NIVEL[nivelAtencao] };
}

/* =========================================================
   5. TELA
========================================================= */

function Questionarios() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { larguraMax } = useLayoutInfo();

  const [selecionado, setSelecionado] = useState<Questionario | null>(null);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<string[]>([]);
  const [concluido, setConcluido] = useState(false);
  const [concluidos, setConcluidos] = useState<string[]>([]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      tabBarStyle: { display: 'none' },
    });
  }, [navigation]);

  const reiniciar = () => {
    setSelecionado(null);
    setRespostas([]);
    setIndice(0);
    setConcluido(false);
  };

  const voltar = () => {
    if (concluido) {
      reiniciar();
      return;
    }

    if (selecionado) {
      if (indice > 0) {
        setIndice(indice - 1);
      } else {
        reiniciar();
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
    const novas = [...respostas];
    novas[indice] = resposta;
    setRespostas(novas);
  };

  const continuar = () => {
    if (!selecionado || !respostas[indice]) return;

    if (indice < selecionado.perguntas.length - 1) {
      setIndice(indice + 1);
    } else {
      const { nivelAtencao, resumo } = resumirQuestionario(selecionado, respostas);

      registrarQuestionarioRespondido({
        questionarioId: selecionado.id,
        nome: selecionado.titulo,
        categoria: selecionado.categoria,
        resultado: gerarRelatorio(selecionado, respostas).titulo,
        nivelAtencao,
        resumo,
      });

      setConcluido(true);
      setConcluidos((atual) =>
        atual.includes(selecionado.id) ? atual : [...atual, selecionado.id],
      );
    }
  };

  const relatorio = selecionado && concluido ? gerarRelatorio(selecionado, respostas) : null;

  /* ------------------------ LISTA ------------------------ */

  const renderLista = () => (
    <>
      <View style={local.apresentacao}>
        <View style={local.apresentacaoIcone}>
          <Ionicons name="leaf-outline" size={27} color={VERDE.principal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={local.apresentacaoTitulo}>Conhecer a si mesmo é um passo importante</Text>
          <Text style={local.apresentacaoTexto}>
            Responda algumas perguntas simples para entender melhor suas emoções, seus desafios e suas conquistas.
          </Text>
        </View>
      </View>

      <View style={local.resumo}>
        <View style={local.resumoItem}>
          <Text style={local.resumoNumero}>{QUESTIONARIOS.length}</Text>
          <Text style={local.resumoLegenda}>questionários</Text>
        </View>
        <View style={local.resumoDivisor} />
        <View style={local.resumoItem}>
          <Text style={local.resumoNumero}>{TOTAL_PERGUNTAS}</Text>
          <Text style={local.resumoLegenda}>perguntas</Text>
        </View>
        <View style={local.resumoDivisor} />
        <View style={local.resumoItem}>
          <Text style={local.resumoNumero}>{concluidos.length}</Text>
          <Text style={local.resumoLegenda}>concluídos</Text>
        </View>
      </View>

      <Text style={local.tituloSecao}>Escolha um questionário</Text>
      <Text style={local.descricaoSecao}>Respostas rápidas, feitas no seu tempo.</Text>

      {QUESTIONARIOS.map((q) => {
        const feito = concluidos.includes(q.id);

        return (
          <Pressable
            key={q.id}
            onPress={() => iniciarQuestionario(q)}
            style={local.cartao}
            accessibilityRole="button"
            accessibilityLabel={q.titulo}
          >
            <View style={local.cartaoLinha}>
              <View style={[local.cartaoIcone, { backgroundColor: q.cor }]}>
                <Ionicons name={q.icone} size={25} color={q.corTexto} />
              </View>

              <View style={local.cartaoInfo}>
                <Text style={[local.cartaoCategoria, { color: q.corTexto }]}>{q.categoria}</Text>
                <Text style={local.cartaoTitulo}>{q.titulo}</Text>
                <Text style={local.cartaoDescricao}>{q.descricao}</Text>
                <Text style={local.cartaoMeta}>
                  {q.tempo} · {q.perguntas.length} perguntas
                </Text>
              </View>

              {feito ? (
                <Ionicons name="checkmark-circle" size={23} color="#5A9A76" />
              ) : (
                <Ionicons name="arrow-forward-circle-outline" size={24} color="#7A8FA3" />
              )}
            </View>
          </Pressable>
        );
      })}

      <View style={local.aviso}>
        <Ionicons name="heart-outline" size={20} color="#638B79" />
        <Text style={local.avisoTexto}>
          Não existem respostas certas ou erradas. Seja sincero(a) consigo mesmo(a). Suas respostas ajudam a organizar suas próprias percepções.
        </Text>
      </View>
    </>
  );

  /* ---------------------- PERGUNTAS ---------------------- */

  const renderPerguntas = () => {
    if (!selecionado) return null;

    const pergunta = selecionado.perguntas[indice];
    const respostaAtual = respostas[indice];
    const ultima = indice === selecionado.perguntas.length - 1;

    return (
      <View style={local.detalhe}>
        <View style={local.detalheTopo}>
          <View style={[local.detalheIcone, { backgroundColor: selecionado.cor }]}>
            <Ionicons name={selecionado.icone} size={28} color={selecionado.corTexto} />
          </View>
          <Text style={local.detalheContador}>
            {indice + 1} de {selecionado.perguntas.length}
          </Text>
        </View>

        <View style={local.trilha}>
          <View
            style={[
              local.trilhaPreenchida,
              { width: `${((indice + 1) / selecionado.perguntas.length) * 100}%` },
            ]}
          />
        </View>

        <Text style={local.detalheCategoria}>{selecionado.titulo}</Text>
        <Text style={local.perguntaTitulo}>{pergunta.titulo}</Text>
        <Text style={local.ajuda}>Escolha a alternativa que mais representa o que você sente.</Text>

        {pergunta.opcoes.map((opcao, i) => {
          const ativa = respostaAtual === opcao;

          return (
            <Pressable
              key={`${opcao}-${i}`}
              onPress={() => selecionarResposta(opcao)}
              style={[local.opcao, ativa && local.opcaoAtiva]}
            >
              <View style={[local.opcaoCirculo, ativa && local.opcaoCirculoAtivo]}>
                {ativa && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
              </View>
              <Text style={[local.opcaoTexto, ativa && local.opcaoTextoAtivo]}>{opcao}</Text>
            </Pressable>
          );
        })}

        <Pressable
          style={[local.botaoPrincipal, !respostaAtual && local.botaoDesabilitado]}
          onPress={continuar}
          disabled={!respostaAtual}
        >
          <Ionicons
            name={ultima ? 'checkmark-circle-outline' : 'arrow-forward-circle-outline'}
            size={21}
            color="#FFFFFF"
          />
          <Text style={local.botaoPrincipalTexto}>
            {ultima ? 'Finalizar questionário' : 'Continuar'}
          </Text>
        </Pressable>

        <Pressable style={local.botaoSecundario} onPress={voltar}>
          <Text style={local.botaoSecundarioTexto}>
            {indice > 0 ? 'Pergunta anterior' : 'Voltar para os questionários'}
          </Text>
        </Pressable>
      </View>
    );
  };

  /* ---------------------- RESULTADO ---------------------- */

  const renderResultado = () => {
    if (!selecionado || !relatorio) return null;

    return (
      <View style={local.detalhe}>
        <View style={local.detalheTopo}>
          <View style={local.detalheIcone}>
            <Ionicons name="document-text-outline" size={28} color={VERDE.principal} />
          </View>
          <Text style={local.detalheContador}>Questionário concluído</Text>
        </View>

        <Text style={local.detalheTitulo}>{relatorio.titulo}</Text>
        <Text style={local.ajuda}>Obrigado por reservar um momento para olhar para si.</Text>

        <View style={local.materiais}>
          <Ionicons name="reader-outline" size={19} color="#6B7F91" />
          <View style={{ flex: 1 }}>
            <Text style={local.materiaisTitulo}>O que suas respostas mostram</Text>
            <Text style={local.materiaisTexto}>{relatorio.reflexao}</Text>
          </View>
        </View>

        <View style={local.blocoAtencao}>
          <Ionicons name="eye-outline" size={20} color="#9B773B" />
          <View style={{ flex: 1 }}>
            <Text style={[local.materiaisTitulo, { color: '#7C5F2C' }]}>Ponto de atenção</Text>
            <Text style={[local.materiaisTexto, { color: '#85703F' }]}>{relatorio.atencao}</Text>
          </View>
        </View>

        <View style={local.blocoSugestao}>
          <Ionicons name="leaf-outline" size={20} color={VERDE.principal} />
          <View style={{ flex: 1 }}>
            <Text style={[local.materiaisTitulo, { color: VERDE.escuro }]}>Uma sugestão para você</Text>
            <Text style={[local.materiaisTexto, { color: '#557765' }]}>{relatorio.sugestao}</Text>
          </View>
        </View>

        <View style={local.mensagemFinal}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7F91" />
          <Text style={local.mensagemFinalTexto}>
            Este é um resumo reflexivo baseado nas suas respostas. Ele não representa um diagnóstico ou uma avaliação clínica e não substitui o acompanhamento profissional.
          </Text>
        </View>

        <Pressable style={local.botaoPrincipal} onPress={reiniciar}>
          <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
          <Text style={local.botaoPrincipalTexto}>Voltar aos questionários</Text>
        </Pressable>

        <Pressable
          style={local.botaoSecundario}
          onPress={() => router.replace('/principal/evolua')}
        >
          <Text style={local.botaoSecundarioTexto}>Voltar para Evolua</Text>
        </Pressable>
      </View>
    );
  };

  /* ---------------------- RENDERIZAÇÃO ---------------------- */

  return (
    <View style={local.raiz}>
      <LinearGradient
        colors={['#FFFFFF', '#F7FBF9', '#EAF3EF']}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ paddingTop: insets.top + 8 }}>
        <View style={[local.topo, { maxWidth: larguraMax, alignSelf: 'center' }]}>
          <Pressable
            onPress={voltar}
            style={local.botaoVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color="#29465F" />
          </Pressable>

          <View style={local.topoTitulo}>
            <Text style={local.tituloPagina}>Questionários</Text>
            <Text style={local.subtituloPagina}>Um espaço para se escutar</Text>
          </View>

          <View style={local.iconeTopo}>
            <Ionicons name="clipboard-outline" size={25} color={VERDE.principal} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          local.conteudo,
          { maxWidth: larguraMax, alignSelf: 'center', paddingBottom: 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!selecionado && renderLista()}
        {selecionado && !concluido && renderPerguntas()}
        {selecionado && concluido && renderResultado()}
      </ScrollView>

      <MenuInferior ativo="evolua" />
    </View>
  );
}

/* =========================================================
   6. ESTILOS (mesma estrutura do Bem-estar)
========================================================= */

const local = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: '#F7FBF9',
  },
  topo: {
    width: '100%',
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topoTitulo: {
    flex: 1,
  },
  tituloPagina: {
    fontFamily: fontes.titulo,
    fontSize: 25,
    color: '#29465F',
  },
  subtituloPagina: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#74879A',
    marginTop: 2,
  },
  iconeTopo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: VERDE.claro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },

  /* apresentação e resumo */
  apresentacao: {
    backgroundColor: VERDE.apresentacao,
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  apresentacaoIcone: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apresentacaoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 16,
    color: VERDE.escuro,
    marginBottom: 4,
  },
  apresentacaoTexto: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#4F6F66',
  },
  resumo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E8EDF2',
  },
  resumoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  resumoNumero: {
    fontFamily: fontes.titulo,
    fontSize: 21,
    color: VERDE.principal,
  },
  resumoLegenda: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#7A8FA3',
  },
  resumoDivisor: {
    width: 1,
    height: 32,
    backgroundColor: '#E7ECF1',
  },
  tituloSecao: {
    fontFamily: fontes.textoMedio,
    fontSize: 17,
    color: '#29465F',
    marginTop: 5,
  },
  descricaoSecao: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8FA3',
    marginTop: -9,
  },

  /* cartões da lista */
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: VERDE.borda,
    padding: 13,
  },
  cartaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartaoIcone: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaoInfo: {
    flex: 1,
    gap: 3,
  },
  cartaoCategoria: {
    fontFamily: fontes.textoMedio,
    fontSize: 10,
  },
  cartaoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: '#354F65',
  },
  cartaoDescricao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 16,
    color: '#7A8FA3',
  },
  cartaoMeta: {
    fontFamily: fontes.textoMedio,
    fontSize: 10,
    color: VERDE.principal,
    marginTop: 2,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: VERDE.suave,
    borderRadius: 15,
    marginTop: 2,
    marginBottom: 8,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#557765',
  },

  /* detalhe (perguntas e resultado) */
  detalhe: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: VERDE.borda,
    padding: 17,
    gap: 14,
    marginBottom: 12,
  },
  detalheTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detalheIcone: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: VERDE.claro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detalheContador: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    color: VERDE.principal,
    backgroundColor: VERDE.claro,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    overflow: 'hidden',
  },
  detalheTitulo: {
    fontFamily: fontes.titulo,
    fontSize: 23,
    color: '#29465F',
  },
  detalheCategoria: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: VERDE.principal,
  },
  trilha: {
    height: 7,
    borderRadius: 10,
    backgroundColor: VERDE.trilha,
    overflow: 'hidden',
  },
  trilhaPreenchida: {
    height: '100%',
    backgroundColor: VERDE.principal,
    borderRadius: 10,
  },
  perguntaTitulo: {
    fontFamily: fontes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: '#29465F',
  },
  ajuda: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#74869A',
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3ECE8',
  },
  opcaoAtiva: {
    backgroundColor: VERDE.claro,
    borderColor: '#A9D5C8',
  },
  opcaoCirculo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#B9DED4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoCirculoAtivo: {
    backgroundColor: VERDE.principal,
    borderColor: VERDE.principal,
  },
  opcaoTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#536B80',
  },
  opcaoTextoAtivo: {
    fontFamily: fontes.textoMedio,
    color: VERDE.escuro,
  },

  /* resultado */
  materiais: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#F5F8FA',
    padding: 13,
    borderRadius: 14,
  },
  materiaisTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    color: '#526C82',
    marginBottom: 3,
  },
  materiaisTexto: {
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#71869A',
  },
  blocoAtencao: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#F9F0DC',
    padding: 13,
    borderRadius: 14,
  },
  blocoSugestao: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: VERDE.suave,
    padding: 13,
    borderRadius: 14,
  },
  mensagemFinal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#F1F5F8',
    padding: 13,
    borderRadius: 13,
  },
  mensagemFinalTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#6B7F91',
  },

  /* botões */
  botaoPrincipal: {
    minHeight: 48,
    backgroundColor: VERDE.principal,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  botaoDesabilitado: {
    opacity: 0.45,
  },
  botaoPrincipalTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#FFFFFF',
  },
  botaoSecundario: {
    alignItems: 'center',
    paddingVertical: 9,
  },
  botaoSecundarioTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#71869A',
  },
});

export default Questionarios;