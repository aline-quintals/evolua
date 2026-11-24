import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Platform,
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
import { MenuInferior, useLayoutInfo } from './compartilhado';
import { salvarExercicioConcluido } from './evolua';

/* =========================================================
   CORES (azul como tom principal + tons de apoio)
========================================================= */

const AZUL = {
  principal: '#3A7FB8',
  escuro: '#2C5F8A',
  claro: '#E3EFF9',
  apresentacao: '#E6F1FA',
  suave: '#EAF2F8',
  trilha: '#E3ECF3',
};

const C = {
  titulo: '#29465F',
  texto: '#536B80',
  suave: '#74879A',
  borda: '#E7EDF3',
};

type Fase = {
  texto: string;
  dica: string;
  segundos: number;
};

type Exercicio = {
  id: string;
  nome: string;
  descricao: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  tipo: 'respiracao' | 'sentidos' | 'corpo' | 'caminhada' | 'visualizacao';
  fases: Fase[];
  ciclos?: number;
};

type Categoria = {
  id: string;
  titulo: string;
  descricao: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  cor: string;
  corTexto: string;
  exercicios: Exercicio[];
};

const CATEGORIAS: Categoria[] = [
  {
    id: 'ansiedade',
    titulo: 'Ansiedade e agitação',
    descricao: 'Práticas para desacelerar e recuperar o equilíbrio.',
    icone: 'leaf-outline',
    cor: '#E1EFF9',
    corTexto: '#2877AE',
    exercicios: [
      {
        id: 'respiracao',
        nome: 'Respiração diafragmática',
        descricao: 'Respire profundamente, movimentando o abdômen de forma suave.',
        icone: 'leaf-outline',
        tipo: 'respiracao',
        ciclos: 5,
        fases: [
          { texto: 'Inspire', dica: 'Puxe o ar pelo nariz, sentindo o abdômen expandir.', segundos: 4 },
          { texto: 'Segure', dica: 'Faça uma pequena pausa, sem prender o ar com força.', segundos: 2 },
          { texto: 'Expire', dica: 'Solte o ar lentamente pela boca.', segundos: 6 },
        ],
      },
      {
        id: 'respiracao-prolongada',
        nome: 'Expiração prolongada',
        descricao: 'Pratique soltar o ar lentamente, respeitando seu próprio ritmo.',
        icone: 'cloud-outline',
        tipo: 'respiracao',
        ciclos: 5,
        fases: [
          { texto: 'Inspire', dica: 'Puxe o ar suavemente pelo nariz.', segundos: 3 },
          { texto: 'Expire devagar', dica: 'Solte o ar por mais tempo do que levou para inspirar.', segundos: 6 },
        ],
      },
      {
        id: 'relaxamento-muscular',
        nome: 'Relaxamento muscular progressivo',
        descricao: 'Alterne pequenos momentos de contração e relaxamento muscular.',
        icone: 'body-outline',
        tipo: 'corpo',
        ciclos: 1,
        fases: [
          { texto: 'Feche as mãos', dica: 'Contraia suavemente as mãos por alguns segundos.', segundos: 5 },
          { texto: 'Relaxe as mãos', dica: 'Solte os dedos e perceba a sensação de relaxamento.', segundos: 7 },
          { texto: 'Contraia os ombros', dica: 'Eleve os ombros sem provocar desconforto.', segundos: 5 },
          { texto: 'Relaxe os ombros', dica: 'Deixe os ombros descerem naturalmente.', segundos: 7 },
          { texto: 'Contraia as pernas', dica: 'Contraia levemente os músculos das pernas.', segundos: 5 },
          { texto: 'Relaxe as pernas', dica: 'Solte os músculos e respire tranquilamente.', segundos: 7 },
        ],
      },
    ],
  },
  {
    id: 'concentracao',
    titulo: 'Concentração e clareza mental',
    descricao: 'Exercícios para trazer a atenção ao momento presente.',
    icone: 'eye-outline',
    cor: '#E8E6F7',
    corTexto: '#7060A8',
    exercicios: [
      {
        id: 'meditacao',
        nome: 'Respiração consciente',
        descricao: 'Observe sua respiração sem tentar controlar cada movimento.',
        icone: 'flower-outline',
        tipo: 'respiracao',
        ciclos: 4,
        fases: [
          { texto: 'Observe o ar', dica: 'Perceba o ar entrando pelo nariz.', segundos: 8 },
          { texto: 'Observe a saída', dica: 'Acompanhe o ar saindo naturalmente.', segundos: 8 },
          { texto: 'Volte ao presente', dica: 'Se sua mente se distrair, volte gentilmente à respiração.', segundos: 8 },
        ],
      },
      {
        id: 'alongamento-pescoco',
        nome: 'Alongamento de pescoço e ombros',
        descricao: 'Movimente o pescoço e os ombros de maneira leve e confortável.',
        icone: 'body-outline',
        tipo: 'corpo',
        fases: [
          { texto: 'Incline para a direita', dica: 'Aproxime suavemente a orelha do ombro, sem forçar.', segundos: 10 },
          { texto: 'Volte ao centro', dica: 'Retorne lentamente à posição inicial.', segundos: 5 },
          { texto: 'Incline para a esquerda', dica: 'Repita o movimento do outro lado.', segundos: 10 },
          { texto: 'Relaxe os ombros', dica: 'Faça movimentos suaves com os ombros.', segundos: 10 },
        ],
      },
      {
        id: 'cinco-sentidos',
        nome: 'Técnica dos cinco sentidos',
        descricao: 'Use seus sentidos para perceber o ambiente ao seu redor.',
        icone: 'eye-outline',
        tipo: 'sentidos',
        fases: [
          { texto: '5 coisas que você vê', dica: 'Observe cinco objetos ou detalhes ao seu redor.', segundos: 15 },
          { texto: '4 coisas que você toca', dica: 'Perceba quatro texturas ou sensações de contato.', segundos: 15 },
          { texto: '3 sons que você ouve', dica: 'Identifique três sons próximos ou distantes.', segundos: 15 },
          { texto: '2 cheiros que você sente', dica: 'Perceba dois aromas do ambiente.', segundos: 12 },
          { texto: '1 gosto que você percebe', dica: 'Observe o gosto presente em sua boca.', segundos: 12 },
        ],
      },
    ],
  },
  {
    id: 'estresse',
    titulo: 'Estresse e tensão',
    descricao: 'Pequenas pausas para aliviar a tensão do corpo.',
    icone: 'heart-outline',
    cor: '#F9E9E9',
    corTexto: '#B66C78',
    exercicios: [
      {
        id: 'relaxamento-maos',
        nome: 'Relaxamento das mãos e braços',
        descricao: 'Alterne entre contrair e soltar as mãos e os braços.',
        icone: 'hand-left-outline',
        tipo: 'corpo',
        fases: [
          { texto: 'Feche as mãos', dica: 'Feche os dedos suavemente, sem apertar demais.', segundos: 5 },
          { texto: 'Solte os dedos', dica: 'Abra as mãos e relaxe.', segundos: 7 },
          { texto: 'Estique os braços', dica: 'Estenda os braços confortavelmente.', segundos: 8 },
          { texto: 'Relaxe os braços', dica: 'Deixe os braços descansarem ao lado do corpo.', segundos: 8 },
        ],
      },
      {
        id: 'alongamento-costas',
        nome: 'Alongamento de costas',
        descricao: 'Movimente a coluna com cuidado e respeite seus limites.',
        icone: 'accessibility-outline',
        tipo: 'corpo',
        fases: [
          { texto: 'Arredonde as costas', dica: 'Se estiver confortável, arredonde suavemente a coluna.', segundos: 8 },
          { texto: 'Volte à posição neutra', dica: 'Retorne devagar, sem movimentos bruscos.', segundos: 5 },
          { texto: 'Alongue suavemente', dica: 'Estique a coluna e respire tranquilamente.', segundos: 8 },
        ],
      },
      {
        id: 'visualizacao-guiada',
        nome: 'Visualização guiada',
        descricao: 'Imagine um lugar tranquilo e concentre-se nos detalhes.',
        icone: 'sunny-outline',
        tipo: 'visualizacao',
        fases: [
          { texto: 'Imagine um lugar tranquilo', dica: 'Pense em um ambiente onde você se sente confortável.', segundos: 12 },
          { texto: 'Observe os detalhes', dica: 'Imagine as cores, a luz e os elementos desse lugar.', segundos: 15 },
          { texto: 'Perceba a sensação', dica: 'Imagine os sons e a temperatura desse ambiente.', segundos: 15 },
          { texto: 'Retorne devagar', dica: 'Volte sua atenção ao lugar onde você está.', segundos: 8 },
        ],
      },
    ],
  },
  {
    id: 'impulsos',
    titulo: 'Impulsos e fissura',
    descricao: 'Práticas para criar uma pausa antes de agir por impulso.',
    icone: 'pause-circle-outline',
    cor: '#FCEEDC',
    corTexto: '#B78043',
    exercicios: [
      {
        id: 'respiracao-atenta',
        nome: 'Respiração com atenção plena',
        descricao: 'Observe o impulso sem precisar reagir imediatamente.',
        icone: 'flower-outline',
        tipo: 'respiracao',
        ciclos: 4,
        fases: [
          { texto: 'Faça uma pausa', dica: 'Pare por um instante e perceba como está se sentindo.', segundos: 5 },
          { texto: 'Inspire', dica: 'Puxe o ar com tranquilidade.', segundos: 4 },
          { texto: 'Expire', dica: 'Solte o ar lentamente.', segundos: 6 },
          { texto: 'Observe', dica: 'Perceba o que está sentindo sem se julgar.', segundos: 8 },
        ],
      },
      {
        id: 'caminhada-consciente',
        nome: 'Caminhada consciente',
        descricao: 'Caminhe devagar, percebendo cada passo e o contato dos pés com o chão.',
        icone: 'walk-outline',
        tipo: 'caminhada',
        fases: [
          { texto: 'Comece a caminhar', dica: 'Caminhe em um local seguro e confortável.', segundos: 20 },
          { texto: 'Observe seus passos', dica: 'Perceba o contato dos pés com o chão.', segundos: 20 },
          { texto: 'Observe o ambiente', dica: 'Note o que está ao seu redor enquanto caminha.', segundos: 20 },
        ],
      },
      {
        id: 'pausa-respiratoria',
        nome: 'Pausa respiratória',
        descricao: 'Faça uma pausa consciente antes de tomar uma decisão.',
        icone: 'pause-circle-outline',
        tipo: 'respiracao',
        ciclos: 3,
        fases: [
          { texto: 'Pare por um instante', dica: 'Interrompa a ação e perceba o momento presente.', segundos: 5 },
          { texto: 'Inspire suavemente', dica: 'Respire pelo nariz, sem pressa.', segundos: 4 },
          { texto: 'Solte o ar', dica: 'Expire devagar e relaxe os ombros.', segundos: 6 },
        ],
      },
    ],
  },
  {
    id: 'descanso',
    titulo: 'Descanso e relaxamento',
    descricao: 'Atividades leves para desacelerar e descansar.',
    icone: 'moon-outline',
    cor: '#ecf7ed',
    corTexto: '#569350',
    exercicios: [
      {
        id: 'respiracao-relaxante',
        nome: 'Respiração relaxante',
        descricao: 'Acompanhe um ritmo tranquilo de inspiração e expiração.',
        icone: 'cloud-outline',
        tipo: 'respiracao',
        ciclos: 5,
        fases: [
          { texto: 'Inspire', dica: 'Puxe o ar de maneira confortável.', segundos: 4 },
          { texto: 'Expire', dica: 'Solte o ar devagar, sem fazer esforço.', segundos: 6 },
        ],
      },
      {
        id: 'alongamento-pernas',
        nome: 'Alongamento suave de pernas',
        descricao: 'Faça movimentos leves para relaxar as pernas.',
        icone: 'fitness-outline',
        tipo: 'corpo',
        fases: [
          { texto: 'Estique uma perna', dica: 'Estenda uma perna confortavelmente.', segundos: 10 },
          { texto: 'Relaxe', dica: 'Volte à posição inicial.', segundos: 5 },
          { texto: 'Alterne a perna', dica: 'Repita o movimento do outro lado.', segundos: 10 },
          { texto: 'Descanse', dica: 'Relaxe as pernas e respire tranquilamente.', segundos: 8 },
        ],
      },
      {
        id: 'body-scan',
        nome: 'Escaneamento corporal',
        descricao: 'Direcione sua atenção para diferentes partes do corpo.',
        icone: 'body-outline',
        tipo: 'corpo',
        fases: [
          { texto: 'Perceba a cabeça', dica: 'Observe se existe tensão na região da cabeça e do rosto.', segundos: 8 },
          { texto: 'Perceba os ombros', dica: 'Note como seus ombros estão apoiados.', segundos: 8 },
          { texto: 'Perceba o tronco', dica: 'Observe as sensações na região do peito e abdômen.', segundos: 8 },
          { texto: 'Perceba as pernas', dica: 'Observe suas pernas e os pontos de apoio.', segundos: 8 },
          { texto: 'Perceba o corpo todo', dica: 'Faça uma pausa e observe suas sensações.', segundos: 10 },
        ],
      },
    ],
  },
];

function formatarTempo(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
}

function VisualAtividade({
  exercicio,
  fase,
  faseIndex,
  segundos,
  passos,
  cor,
  executando,
}: {
  exercicio: Exercicio;
  fase: Fase;
  faseIndex: number;
  segundos: number;
  passos: number;
  cor: string;
  executando: boolean;
}) {
  const escala = useRef(new Animated.Value(1)).current;
  const nativo = Platform.OS !== 'web';

  useEffect(() => {
    escala.stopAnimation();
    escala.setValue(1);

    if (!executando) return;

    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: exercicio.tipo === 'respiracao' ? 1.35 : 1.12,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
        Animated.timing(escala, {
          toValue: 0.9,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: nativo,
        }),
      ]),
    );

    animacao.start();
    return () => animacao.stop();
  }, [executando, exercicio.id, faseIndex, escala, nativo]);

  if (exercicio.tipo === 'sentidos') {
    const numero = 5 - faseIndex;

    return (
      <View style={styles.visualBase}>
        <View style={[styles.numeroSentidos, { backgroundColor: cor + '20' }]}>
          <Text style={[styles.numeroGrande, { color: cor }]}>{numero}</Text>
        </View>
        <Text style={styles.visualLegenda}>sentido{numero > 1 ? 's' : ''} para observar</Text>
      </View>
    );
  }

  if (exercicio.tipo === 'caminhada') {
    return (
      <View style={styles.visualBase}>
        <View style={[styles.passoCirculo, { backgroundColor: cor + '20' }]}>
          <Ionicons name="footsteps-outline" size={48} color={cor} />
        </View>
        <Text style={[styles.numeroPassos, { color: cor }]}>{passos}</Text>
        <Text style={styles.visualLegenda}>passos simulados</Text>
        <View style={styles.trilhaPassos}>
          <View style={[styles.trilhaPreenchida, { width: `${Math.min(100, passos * 10)}%`, backgroundColor: cor }]} />
        </View>
        <Text style={styles.textoPequeno}>Meta demonstrativa: 10 passos</Text>
      </View>
    );
  }

  if (exercicio.tipo === 'visualizacao') {
    return (
      <View style={styles.visualBase}>
        <View style={[styles.visualPaisagem, { backgroundColor: cor + '18' }]}>
          <Ionicons name="sunny-outline" size={44} color={cor} />
          <View style={styles.montanhas}>
            <View style={[styles.montanha, { backgroundColor: cor + '65' }]} />
            <View style={[styles.montanha, styles.montanhaDois, { backgroundColor: cor + '90' }]} />
          </View>
        </View>
        <Text style={styles.visualLegenda}>Imagine seu lugar de tranquilidade</Text>
      </View>
    );
  }

  if (exercicio.tipo === 'corpo') {
    return (
      <View style={styles.visualBase}>
        <Animated.View style={[styles.visualCorpo, { transform: [{ scale: escala }] }]}>
          <Ionicons name={exercicio.icone} size={76} color={cor} />
        </Animated.View>
        <Text style={[styles.visualLegenda, { color: cor }]}>{fase.texto}</Text>
      </View>
    );
  }

  return (
    <View style={styles.visualBase}>
      <Animated.View
        style={[
          styles.anelRespiracao,
          {
            backgroundColor: cor + '25',
            borderColor: cor + '75',
            transform: [{ scale: escala }],
          },
        ]}
      >
        <View style={[styles.mioloRespiracao, { backgroundColor: cor }]}>
          <Ionicons name="leaf-outline" size={35} color="#FFFFFF" />
        </View>
      </Animated.View>
      <Text style={[styles.visualLegenda, { color: cor }]}>{fase.texto}</Text>
    </View>
  );
}

function ExecucaoExercicio({
  exercicio,
  cor,
  aoFechar,
}: {
  exercicio: Exercicio;
  cor: string;
  aoFechar: () => void;
}) {
  const [executando, setExecutando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [faseIndex, setFaseIndex] = useState(0);
  const [segundos, setSegundos] = useState(exercicio.fases[0].segundos);
  const [ciclo, setCiclo] = useState(1);
  const [passos, setPassos] = useState(0);

  const fase = exercicio.fases[faseIndex];
  const ciclos = exercicio.ciclos ?? 1;

  useEffect(() => {
    setExecutando(false);
    setConcluido(false);
    setSalvo(false);
    setFaseIndex(0);
    setSegundos(exercicio.fases[0].segundos);
    setCiclo(1);
    setPassos(0);
  }, [exercicio.id]);

  useEffect(() => {
    if (!executando || concluido) return;

    const intervalo = setInterval(() => {
      setSegundos((atual) => {
        if (atual > 1) return atual - 1;

        setFaseIndex((indiceAtual) => {
          if (indiceAtual + 1 < exercicio.fases.length) {
            return indiceAtual + 1;
          }

          if (ciclo < ciclos) {
            setCiclo((c) => c + 1);
            return 0;
          }

          setExecutando(false);
          setConcluido(true);
          return indiceAtual;
        });

        return exercicio.fases[
          faseIndex + 1 < exercicio.fases.length ? faseIndex + 1 : 0
        ].segundos;
      });

      if (exercicio.tipo === 'caminhada') {
        setPassos((atual) => Math.min(10, atual + 1));
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [executando, concluido, exercicio, faseIndex, ciclo, ciclos]);

  const reiniciar = () => {
    setExecutando(false);
    setConcluido(false);
    setSalvo(false);
    setFaseIndex(0);
    setSegundos(exercicio.fases[0].segundos);
    setCiclo(1);
    setPassos(0);
  };

  const salvar = () => {
    const categoriaDoExercicio = CATEGORIAS.find((c) =>
      c.exercicios.some((e) => e.id === exercicio.id),
    );
    salvarExercicioConcluido({
      id: exercicio.id,
      nome: exercicio.nome,
      categoria: categoriaDoExercicio?.titulo,
    });
    setSalvo(true);
  };

  return (
    <View style={styles.execucao}>
      <View style={styles.execucaoTopo}>
        <View style={[styles.tagDuracao, { backgroundColor: cor + '20' }]}>
          <Ionicons name="time-outline" size={15} color={cor} />
          <Text style={[styles.tagDuracaoTexto, { color: cor }]}>Atividade guiada</Text>
        </View>

        <Pressable onPress={aoFechar} style={styles.fecharExecucao}>
          <Ionicons name="close" size={23} color={C.titulo} />
        </Pressable>
      </View>

      <Text style={styles.tituloExecucao}>{exercicio.nome}</Text>
      <Text style={styles.descricaoExecucao}>{exercicio.descricao}</Text>

      {!concluido ? (
        <>
          <VisualAtividade
            exercicio={exercicio}
            fase={fase}
            faseIndex={faseIndex}
            segundos={segundos}
            passos={passos}
            cor={cor}
            executando={executando}
          />

          <View style={styles.instrucaoCaixa}>
            <Text style={[styles.faseTitulo, { color: cor }]}>{fase.texto}</Text>
            <Text style={styles.faseDica}>{fase.dica}</Text>
            <Text style={styles.contadorTempo}>{formatarTempo(segundos)}</Text>
            {ciclos > 1 && (
              <Text style={styles.cicloTexto}>Ciclo {ciclo} de {ciclos}</Text>
            )}
          </View>

          <View style={styles.botoesExecucao}>
            <Pressable
              style={[styles.botaoPrincipal, { backgroundColor: cor }]}
              onPress={() => setExecutando((atual) => !atual)}
            >
              <Ionicons
                name={executando ? 'pause' : 'play'}
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.botaoPrincipalTexto}>
                {executando ? 'Pausar' : 'Começar'}
              </Text>
            </Pressable>

            <Pressable style={styles.botaoReiniciar} onPress={reiniciar}>
              <Ionicons name="refresh-outline" size={20} color={AZUL.escuro} />
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.conclusao}>
          <View style={[styles.iconeConclusao, { backgroundColor: cor + '20' }]}>
            <Ionicons name="checkmark-circle" size={58} color={cor} />
          </View>

          <Text style={styles.tituloConclusao}>Você conseguiu!</Text>
          <Text style={styles.textoConclusao}>
            Você concluiu esta atividade. Cada pequena pausa também é um passo
            importante no seu cuidado.
          </Text>

          {!salvo ? (
            <Pressable
              style={[styles.botaoPrincipal, { backgroundColor: cor, flex: 0, alignSelf: 'stretch' }]}
              onPress={salvar}
            >
              <Ionicons name="bookmark-outline" size={19} color="#FFFFFF" />
              <Text style={styles.botaoPrincipalTexto}>Salvar exercício</Text>
            </Pressable>
          ) : (
            <View style={styles.salvoMensagem}>
              <Ionicons name="checkmark-circle" size={20} color="#39866F" />
              <Text style={styles.salvoTexto}>Exercício salvo no histórico!</Text>
            </View>
          )}

          <Pressable style={styles.botaoRefazer} onPress={reiniciar}>
            <Ionicons name="refresh-outline" size={18} color={AZUL.escuro} />
            <Text style={styles.botaoRefazerTexto}>Fazer novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function Exercicios() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { larguraMax } = useLayoutInfo();

  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<{
    exercicio: Exercicio;
    cor: string;
  } | null>(null);

  useEffect(() => {
    (navigation as any)?.setOptions?.({
      headerShown: false,
      tabBarStyle: { display: 'none' },
    });
  }, [navigation]);

  const voltar = () => {
    router.replace('/principal/evolua');
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (exercicioSelecionado) {
        setExercicioSelecionado(null);
        return true;
      }

      voltar();
      return true;
    });

    return () => sub.remove();
  }, [exercicioSelecionado, navigation]);

  const totalExercicios = CATEGORIAS.reduce(
    (total, categoria) => total + categoria.exercicios.length,
    0,
  );

  return (
    <View style={styles.raiz}>
      <LinearGradient
        colors={['#FFFFFF', '#F7FAFD', '#EBF2F8']}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ paddingTop: insets.top + 8 }}>
        <View style={[styles.topo, { maxWidth: larguraMax, alignSelf: 'center' }]}>
          <Pressable
            onPress={exercicioSelecionado ? () => setExercicioSelecionado(null) : voltar}
            style={styles.botaoVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color={C.titulo} />
          </Pressable>

          <View style={styles.topoTitulo}>
            <Text style={styles.tituloPagina}>Exercícios</Text>
            <Text style={styles.subtituloPagina}>Um momento para cuidar de você</Text>
          </View>

          <View style={styles.iconeTopo}>
            <Ionicons name="fitness-outline" size={25} color={AZUL.principal} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { maxWidth: larguraMax, alignSelf: 'center', paddingBottom: 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.apresentacao}>
          <View style={styles.apresentacaoIcone}>
            <Ionicons name="heart-outline" size={27} color={AZUL.principal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.apresentacaoTitulo}>Seu momento de cuidado</Text>
            <Text style={styles.apresentacaoTexto}>
              Escolha uma atividade e siga as orientações no seu ritmo. Você não precisa fazer tudo de uma vez.
            </Text>
          </View>
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{totalExercicios}</Text>
            <Text style={styles.resumoLegenda}>atividades</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{CATEGORIAS.length}</Text>
            <Text style={styles.resumoLegenda}>categorias</Text>
          </View>
        </View>

        {exercicioSelecionado && (
          <ExecucaoExercicio
            key={exercicioSelecionado.exercicio.id}
            exercicio={exercicioSelecionado.exercicio}
            cor={exercicioSelecionado.cor}
            aoFechar={() => setExercicioSelecionado(null)}
          />
        )}

        <Text style={styles.tituloSecao}>Explore as atividades</Text>
        <Text style={styles.descricaoSecao}>
          Toque em uma categoria para conhecer os exercícios.
        </Text>

        {CATEGORIAS.map((categoria) => {
          const aberta = categoriaAberta === categoria.id;

          return (
            <View key={categoria.id} style={styles.categoriaBloco}>
              <Pressable
                style={styles.categoriaCabecalho}
                onPress={() => {
                  setCategoriaAberta(aberta ? null : categoria.id);
                  setExercicioSelecionado(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ expanded: aberta }}
              >
                <View style={[styles.categoriaIcone, { backgroundColor: categoria.cor }]}>
                  <Ionicons name={categoria.icone} size={25} color={categoria.corTexto} />
                </View>

                <View style={styles.categoriaInfo}>
                  <Text style={styles.categoriaTitulo}>{categoria.titulo}</Text>
                  <Text style={styles.categoriaDescricao}>{categoria.descricao}</Text>
                  <Text style={[styles.categoriaContagem, { color: categoria.corTexto }]}>
                    {categoria.exercicios.length} atividades
                  </Text>
                </View>

                <Ionicons
                  name={aberta ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color="#718096"
                />
              </Pressable>

              {aberta && (
                <View style={styles.listaExercicios}>
                  {categoria.exercicios.map((exercicio, indice) => {
                    const selecionado = exercicioSelecionado?.exercicio.id === exercicio.id;

                    return (
                      <Pressable
                        key={exercicio.id}
                        style={[
                          styles.itemLinha,
                          indice !== categoria.exercicios.length - 1 && styles.itemBorda,
                        ]}
                        onPress={() =>
                          setExercicioSelecionado({
                            exercicio,
                            cor: categoria.corTexto,
                          })
                        }
                      >
                        <View style={[styles.itemIcone, { backgroundColor: categoria.cor }]}>
                          <Ionicons name={exercicio.icone} size={22} color={categoria.corTexto} />
                        </View>

                        <View style={styles.itemInfo}>
                          <Text style={styles.itemNome}>{exercicio.nome}</Text>
                          <Text style={styles.itemDescricao}>{exercicio.descricao}</Text>
                        </View>

                        {selecionado ? (
                          <Ionicons name="checkmark-circle" size={23} color="#5A9A76" />
                        ) : (
                          <Ionicons name="arrow-forward-circle-outline" size={24} color="#7A8FA3" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.aviso}>
          <Ionicons name="information-circle-outline" size={20} color="#65819B" />
          <Text style={styles.avisoTexto}>
            Faça os movimentos sem forçar. Se sentir dor, tontura ou desconforto, interrompa a atividade. Estes exercícios são práticas de apoio e não substituem acompanhamento profissional.
          </Text>
        </View>
      </ScrollView>

      <MenuInferior ativo="evolua" />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: '#F7FAFD',
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
    color: C.titulo,
  },
  subtituloPagina: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: C.suave,
    marginTop: 2,
  },
  iconeTopo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: AZUL.claro,
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
    backgroundColor: AZUL.apresentacao,
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
    color: AZUL.escuro,
    marginBottom: 4,
  },
  apresentacaoTexto: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#55708A',
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
    color: AZUL.principal,
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
    color: C.titulo,
    marginTop: 5,
  },
  descricaoSecao: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8FA3',
    marginTop: -9,
  },

  /* categorias */
  categoriaBloco: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.borda,
    overflow: 'hidden',
  },
  categoriaCabecalho: {
    minHeight: 91,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoriaIcone: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriaInfo: {
    flex: 1,
    gap: 3,
  },
  categoriaTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: '#354F65',
  },
  categoriaDescricao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#7A8FA3',
  },
  categoriaContagem: {
    fontFamily: fontes.textoMedio,
    fontSize: 10,
    marginTop: 2,
  },
  listaExercicios: {
    paddingHorizontal: 13,
    paddingBottom: 4,
    backgroundColor: '#FCFDFE',
  },
  itemLinha: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
  },
  itemBorda: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F5',
  },
  itemIcone: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemNome: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#354F65',
  },
  itemDescricao: {
    fontFamily: fontes.texto,
    fontSize: 10,
    color: '#7A8FA3',
    lineHeight: 15,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: AZUL.suave,
    borderRadius: 15,
    marginTop: 2,
    marginBottom: 8,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#586B7D',
  },

  /* execução do exercício */
  execucao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.borda,
    padding: 17,
    gap: 4,
  },
  execucaoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagDuracao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tagDuracaoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
  },
  fecharExecucao: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F4F7',
  },
  tituloExecucao: {
    fontFamily: fontes.titulo,
    fontSize: 23,
    color: C.titulo,
    marginTop: 12,
  },
  descricaoExecucao: {
    fontFamily: fontes.texto,
    fontSize: 13,
    lineHeight: 19,
    color: '#71869A',
    marginTop: 4,
  },
  visualBase: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  anelRespiracao: {
    width: 145,
    height: 145,
    borderRadius: 100,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mioloRespiracao: {
    width: 75,
    height: 75,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualLegenda: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: C.titulo,
    marginTop: 13,
    textAlign: 'center',
  },
  visualCorpo: {
    width: 125,
    height: 125,
    borderRadius: 70,
    backgroundColor: '#F1F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroSentidos: {
    width: 110,
    height: 110,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroGrande: {
    fontFamily: fontes.titulo,
    fontSize: 58,
  },
  passoCirculo: {
    width: 105,
    height: 105,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroPassos: {
    fontFamily: fontes.titulo,
    fontSize: 35,
    marginTop: 7,
  },
  trilhaPassos: {
    width: '75%',
    height: 8,
    borderRadius: 10,
    backgroundColor: AZUL.trilha,
    overflow: 'hidden',
    marginTop: 13,
  },
  trilhaPreenchida: {
    height: 8,
    borderRadius: 10,
  },
  textoPequeno: {
    fontFamily: fontes.texto,
    fontSize: 10,
    color: '#74869A',
    marginTop: 6,
  },
  visualPaisagem: {
    width: 210,
    height: 135,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 15,
  },
  montanhas: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  montanha: {
    width: 130,
    height: 70,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    transform: [{ rotate: '-12deg' }],
  },
  montanhaDois: {
    marginLeft: -40,
    height: 52,
    transform: [{ rotate: '12deg' }],
  },
  instrucaoCaixa: {
    backgroundColor: '#F5F8FA',
    borderRadius: 16,
    padding: 15,
    alignItems: 'center',
  },
  faseTitulo: {
    fontFamily: fontes.titulo,
    fontSize: 19,
    textAlign: 'center',
  },
  faseDica: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#71869A',
    textAlign: 'center',
    marginTop: 5,
  },
  contadorTempo: {
    fontFamily: fontes.titulo,
    fontSize: 27,
    color: C.titulo,
    marginTop: 10,
  },
  cicloTexto: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#74869A',
    marginTop: 2,
  },
  botoesExecucao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  botaoPrincipal: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  botaoPrincipalTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#FFFFFF',
  },
  botaoReiniciar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conclusao: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconeConclusao: {
    width: 95,
    height: 95,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloConclusao: {
    fontFamily: fontes.titulo,
    fontSize: 23,
    color: C.titulo,
    marginTop: 15,
  },
  textoConclusao: {
    fontFamily: fontes.texto,
    fontSize: 13,
    lineHeight: 20,
    color: '#71869A',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 20,
  },
  salvoMensagem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#E9F5EF',
    borderRadius: 12,
    padding: 12,
  },
  salvoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#39866F',
  },
  botaoRefazer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 12,
    marginTop: 8,
  },
  botaoRefazerTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#71869A',
  },
});