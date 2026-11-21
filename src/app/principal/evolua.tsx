import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../../tema';

import {
  BotaoDestaque,
  Cabecalho,
  IconeNome,
  MenuInferior,
  NavegacaoContext,
  TelaInterna,
  dataLocalISO,
  estilos,
  gerarId,
  useLayoutInfo,
  useTecladoVisivel,
} from './compartilhado';
import TelaConfiguracoes from './configuracoes';
import TelaNotificacoes from './notificacoes';

/* =============================================================================
 * 1. EXERCÍCIOS CONCLUÍDOS (MOCKUP, EM MEMÓRIA)
 * -----------------------------------------------------------------------------
 * Quando a pessoa termina um exercício e toca em "Salvar exercício", o registro
 * entra aqui. Quem fizer a página "Exercícios concluídos" (ou o Progresso) usa:
 *     import { useExerciciosConcluidos } from './evolua';
 *     const lista = useExerciciosConcluidos();   // mais recente primeiro
 * Nada é persistido: ao fechar o app os dados se perdem (igual ao resto do mockup).
 * Se preferir, mova este bloco para o compartilhado.tsx.
 * ========================================================================== */

export interface ExercicioConcluido {
  id: string;
  exercicioId: string;
  titulo: string;
  concluidoEmISO: string;
  dataLocal: string; // "AAAA-MM-DD" no fuso do usuário
}

let exerciciosConcluidos: ExercicioConcluido[] = [];
const ouvintesConcluidos = new Set<() => void>();

export function salvarExercicioConcluido(ex: { id: string; nome: string }): ExercicioConcluido {
  const agora = new Date();
  const registro: ExercicioConcluido = {
    id: gerarId('exercicio'),
    exercicioId: ex.id,
    titulo: ex.nome,
    concluidoEmISO: agora.toISOString(),
    dataLocal: dataLocalISO(agora),
  };
  exerciciosConcluidos = [registro, ...exerciciosConcluidos];
  ouvintesConcluidos.forEach((l) => l());
  return registro;
}

export function useExerciciosConcluidos(): ExercicioConcluido[] {
  const assinar = useCallback((l: () => void) => {
    ouvintesConcluidos.add(l);
    return () => { ouvintesConcluidos.delete(l); };
  }, []);
  return useSyncExternalStore(assinar, () => exerciciosConcluidos, () => exerciciosConcluidos);
}

/* =============================================================================
 * 2. EXERCÍCIOS E O "EXERCÍCIO DO DIA"
 * -----------------------------------------------------------------------------
 * Todo exercício é uma lista de FASES. Cada fase tem um texto (a instrução),
 * uma duração e um tamanho para a bolinha (escala): maior = inspirar/tensionar,
 * menor = soltar. Para criar um exercício novo, basta acrescentar um item em
 * EXERCICIOS (a ordem define o rodízio da semana).
 * ========================================================================== */

type Fase = { texto: string; segundos: number; escala: number; dica?: string };

export type Exercicio = {
  id: string;
  nome: string;        // usado ao salvar
  titulo: string;      // pergunta/convite do cartão
  descricao: string;
  icone: IconeNome;
  ciclos: number;      // quantas vezes as fases se repetem no modo "ativo"
  fases: Fase[];
};

export const EXERCICIOS: ReadonlyArray<Exercicio> = [
  {
    id: 'respiracao',
    nome: 'Respiração guiada',
    titulo: 'Vamos respirar juntos?',
    descricao: 'Acompanhe o movimento e respire no seu próprio ritmo.',
    icone: 'leaf-outline',
    ciclos: 10,
    fases: [
      { texto: 'Inspire...', segundos: 4, escala: 1.3, dica: 'Puxe o ar devagar pelo nariz.' },
      { texto: 'Segure...', segundos: 2, escala: 1.3, dica: 'Mantenha o ar sem forçar.' },
      { texto: 'Expire...', segundos: 6, escala: 0.85, dica: 'Solte o ar lentamente pela boca.' },
    ],
  },
  {
    id: 'ombros',
    nome: 'Alongamento de ombros',
    titulo: 'Hora de soltar os ombros',
    descricao: 'Um alongamento simples para aliviar a tensão do pescoço e dos ombros.',
    icone: 'body-outline',
    ciclos: 8,
    fases: [
      { texto: 'Eleve os ombros', segundos: 4, escala: 1.3, dica: 'Leve os ombros em direção às orelhas.' },
      { texto: 'Segure', segundos: 3, escala: 1.3, dica: 'Mantenha sem forçar o pescoço.' },
      { texto: 'Solte devagar', segundos: 5, escala: 0.85, dica: 'Deixe os ombros caírem e respire fundo.' },
    ],
  },
  {
    id: 'cinco-sentidos',
    nome: 'Técnica 5-4-3-2-1',
    titulo: 'Traga a atenção para o agora',
    descricao: 'Use os seus sentidos para se ancorar no momento presente.',
    icone: 'eye-outline',
    ciclos: 1,
    fases: [
      { texto: '5 coisas que você vê', segundos: 15, escala: 1.2, dica: 'Olhe ao redor e nomeie cada uma em pensamento.' },
      { texto: '4 coisas que você toca', segundos: 15, escala: 0.95, dica: 'Sinta texturas: roupa, cadeira, mãos.' },
      { texto: '3 sons que você ouve', segundos: 15, escala: 1.2, dica: 'Perceba os sons perto e longe.' },
      { texto: '2 cheiros que você sente', segundos: 12, escala: 0.95, dica: 'Respire e note os aromas ao redor.' },
      { texto: '1 gosto que você percebe', segundos: 12, escala: 1.2, dica: 'Repare no gosto que está na sua boca.' },
    ],
  },
  {
    id: 'relaxamento-muscular',
    nome: 'Relaxamento muscular',
    titulo: 'Tensione e solte',
    descricao: 'Contraia e relaxe cada parte do corpo para liberar o desconforto.',
    icone: 'fitness-outline',
    ciclos: 3,
    fases: [
      { texto: 'Feche as mãos com força', segundos: 5, escala: 0.8, dica: 'Aperte bem, sem machucar.' },
      { texto: 'Solte as mãos', segundos: 7, escala: 1.2, dica: 'Sinta o alívio se espalhar.' },
      { texto: 'Contraia os ombros e braços', segundos: 5, escala: 0.8, dica: 'Eleve os ombros e endureça os braços.' },
      { texto: 'Solte tudo', segundos: 7, escala: 1.2, dica: 'Deixe o peso dos braços descer.' },
      { texto: 'Contraia as pernas', segundos: 5, escala: 0.8, dica: 'Pressione os pés no chão.' },
      { texto: 'Solte as pernas', segundos: 7, escala: 1.2, dica: 'Sinta o corpo todo mais leve.' },
    ],
  },
  {
    id: 'meditacao',
    nome: 'Meditação guiada',
    titulo: 'Alguns minutos de calma',
    descricao: 'Uma pausa de atenção plena para acalmar a mente.',
    icone: 'flower-outline',
    ciclos: 4,
    fases: [
      { texto: 'Observe a sua respiração', segundos: 8, escala: 1.15, dica: 'Apenas note o ar entrando e saindo.' },
      { texto: 'Perceba os pensamentos', segundos: 8, escala: 1.0, dica: 'Sem julgar, deixe que eles apareçam.' },
      { texto: 'Deixe que eles passem', segundos: 8, escala: 1.15, dica: 'Como nuvens que seguem o seu caminho.' },
      { texto: 'Volte para o agora', segundos: 8, escala: 1.0, dica: 'Sinta os apoios do seu corpo.' },
    ],
  },
];

/**
 * Segunda a sexta seguem a ordem de EXERCICIOS (respiração, ombros, 5-4-3-2-1,
 * relaxamento, meditação); sábado e domingo recomeçam o rodízio.
 * `deslocamento` permite trocar a sugestão pelo botão "Outra sugestão".
 */
function exercicioDoDia(deslocamento: number, hoje: Date = new Date()): Exercicio {
  const diaSemanaSegunda0 = (hoje.getDay() + 6) % 7; // segunda = 0 … domingo = 6
  return EXERCICIOS[(diaSemanaSegunda0 + deslocamento) % EXERCICIOS.length];
}

function duracaoTexto(ex: Exercicio): string {
  const total = ex.fases.reduce((soma, f) => soma + f.segundos, 0) * ex.ciclos;
  const min = Math.max(1, Math.round(total / 60));
  return `${min} ${min === 1 ? 'minuto' : 'minutos'}`;
}

/* =============================================================================
 * 3. MOTOR DA ANIMAÇÃO
 * -----------------------------------------------------------------------------
 *   previa    → repete as fases sem parar (o convite que aparece ao abrir a tela)
 *   ativo     → faz `ciclos` repetições e chama aoConcluir()
 *   concluido → bolinha volta ao tamanho normal
 * ========================================================================== */

type Modo = 'previa' | 'ativo' | 'concluido';

function useMotorExercicio(ex: Exercicio, modo: Modo, aoConcluir: () => void) {
  const escala = useRef(new Animated.Value(1)).current;
  const [pos, setPos] = useState({ fase: 0, ciclo: 1 });
  const aoConcluirRef = useRef(aoConcluir);
  aoConcluirRef.current = aoConcluir;
  const nativo = Platform.OS !== 'web';

  useEffect(() => {
    if (modo === 'concluido') {
      Animated.timing(escala, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: nativo }).start();
      return;
    }

    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    const passo = (f: number, c: number) => {
      if (cancelado) return;
      setPos({ fase: f, ciclo: c });
      const fase = ex.fases[f];
      Animated.timing(escala, {
        toValue: fase.escala,
        duration: fase.segundos * 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: nativo,
      }).start();

      timer = setTimeout(() => {
        if (f + 1 < ex.fases.length) passo(f + 1, c);
        else if (modo === 'ativo' && c >= ex.ciclos) aoConcluirRef.current();
        else passo(0, modo === 'ativo' ? c + 1 : 1);
      }, fase.segundos * 1000);
    };

    passo(0, 1);
    return () => {
      cancelado = true;
      clearTimeout(timer);
      escala.stopAnimation();
    };
  }, [ex, modo, escala, nativo]);

  return { escala, faseIdx: pos.fase, ciclo: pos.ciclo };
}

/* ---------- Botão de texto centralizado (ações secundárias) ---------- */
function BotaoLink({ texto, icone, onPress }: { texto: string; icone: IconeNome; onPress: () => void }) {
  return (
    <Pressable style={local.botaoLink} onPress={onPress} accessibilityRole="button" accessibilityLabel={texto}>
      <Ionicons name={icone} size={18} color={cores.azulProfundo} />
      <Text style={local.botaoLinkTexto}>{texto}</Text>
    </Pressable>
  );
}

/* =============================================================================
 * 4. CARTÃO "EXERCÍCIO DO MOMENTO"
 * ========================================================================== */

export function ExercicioDoMomento({ exercicio, onTrocar, rotuloTag = 'Exercício do momento' }: {
  exercicio: Exercicio;
  onTrocar?: () => void;   // sem isto, o botão "Outra sugestão" não aparece
  rotuloTag?: string;
}) {
  const [modo, setModo] = useState<Modo>('previa');
  const [salvo, setSalvo] = useState(false);
  const { escala, faseIdx, ciclo } = useMotorExercicio(exercicio, modo, () => setModo('concluido'));

  const fase = exercicio.fases[faseIdx];
  const escalaInterna = escala.interpolate({ inputRange: [0.75, 1.35], outputRange: [0.9, 1.15], extrapolate: 'clamp' });

  const totalFases = exercicio.ciclos * exercicio.fases.length;
  const feitas = (ciclo - 1) * exercicio.fases.length + faseIdx;
  const porcentagem = Math.min(100, (feitas / totalFases) * 100);

  const rotulo = modo === 'concluido' ? 'Muito bem!' : fase.texto;
  const subtexto =
    modo === 'previa'
      ? 'Acompanhe a animação por alguns ciclos.'
      : modo === 'ativo'
        ? fase.dica ?? ''
        : salvo
          ? 'Exercício salvo em “Exercícios concluídos”.'
          : `Você concluiu “${exercicio.nome}”. Quer salvar?`;

  const salvar = () => {
    salvarExercicioConcluido(exercicio);
    setSalvo(true);
  };

  return (
    <View style={estilos.cartao}>
      <View style={local.topoCartao}>
        <View style={local.tag}>
          <Text style={local.tagTexto}>{rotuloTag}</Text>
        </View>
        <Ionicons name={exercicio.icone} size={22} color={cores.azulEvolua} />
      </View>

      <Text style={local.tituloExercicio} accessibilityRole="header">{exercicio.titulo}</Text>
      <Text style={local.descricaoExercicio}>{exercicio.descricao}</Text>

      {/* Palco da animação: a bolinha cresce e diminui conforme a fase. */}
      <View style={local.palco} accessible accessibilityLabel={`${rotulo} ${subtexto}`}>
        <Animated.View style={[local.anelExterno, { transform: [{ scale: escala }] }]}>
          <Animated.View style={[local.anelInterno, { transform: [{ scale: escalaInterna }] }]}>
            <Ionicons name={modo === 'concluido' ? 'checkmark' : exercicio.icone} size={36} color={cores.branco} />
          </Animated.View>
        </Animated.View>
      </View>

      <Text style={local.instrucao} accessibilityLiveRegion="polite">{rotulo}</Text>
      <Text style={local.dicaTexto}>{subtexto}</Text>

      {modo === 'ativo' && (
        <View style={{ marginTop: 14 }}>
          <View style={local.progTrilha}>
            <View style={[local.progPreenchida, { width: `${porcentagem}%` }]} />
          </View>
          {exercicio.ciclos > 1 && (
            <Text style={local.cicloTexto}>Ciclo {ciclo} de {exercicio.ciclos}</Text>
          )}
        </View>
      )}

      {modo !== 'concluido' && (
        <View style={local.pilula}>
          <Text style={local.pilulaTexto}>Duração aproximada: {duracaoTexto(exercicio)}</Text>
        </View>
      )}

      {modo === 'previa' && (
        <>
          <BotaoDestaque texto="Começar exercício" onPress={() => setModo('ativo')} />
          {onTrocar && <BotaoLink texto="Outra sugestão" icone="refresh" onPress={onTrocar} />}
        </>
      )}

      {modo === 'ativo' && <BotaoLink texto="Parar" icone="stop-circle-outline" onPress={() => setModo('previa')} />}

      {modo === 'concluido' && (
        <>
          {!salvo && <BotaoDestaque texto="Salvar exercício" onPress={salvar} />}
          <BotaoLink
            texto="Fazer de novo"
            icone="refresh"
            onPress={() => { setSalvo(false); setModo('ativo'); }}
          />
        </>
      )}
    </View>
  );
}

/* =============================================================================
 * 5. CATEGORIAS
 * -----------------------------------------------------------------------------
 * Cada categoria abre a sua própria página, dentro de src/app/principal:
 * exercicios.tsx, bem-estar.tsx, questionarios.tsx e metas.tsx.
 * ========================================================================== */

const ROTAS_CATEGORIAS = {
  exercicios: '/principal/exercicios',
  bemEstar: '/principal/bem-estar',
  questionarios: '/principal/questionarios',
  metas: '/principal/metas',
} as const;

const abrirCategoria = (rota: string) => router.navigate(rota as Href);

type Categoria = {
  chave: string;
  titulo: string;
  descricao: string;
  icone: IconeNome;
  fundo: string;
  texto: string;
  corIcone: string;
  abrir: () => void;
};

const CATEGORIAS: ReadonlyArray<Categoria> = [
  {
    chave: 'exercicios', titulo: 'Exercícios',
    descricao: 'Respiração, alongamento e relaxamento.',
    icone: 'pulse-outline', fundo: '#E1EFF9', texto: '#29465F', corIcone: '#2877AE',
    abrir: () => abrirCategoria(ROTAS_CATEGORIAS.exercicios),
  },
  {
    chave: 'bem-estar', titulo: 'Bem-estar',
    descricao: 'Criatividade, autocuidado e tranquilidade.',
    icone: 'color-palette-outline', fundo: '#EEE9F8', texto: '#44395E', corIcone: '#7A5CC0',
    abrir: () => abrirCategoria(ROTAS_CATEGORIAS.bemEstar),
  },
  {
    chave: 'questionarios', titulo: 'Questionários',
    descricao: 'Descubra mais sobre suas emoções.',
    icone: 'clipboard-outline', fundo: '#DFF2EF', texto: '#294B49', corIcone: '#25877E',
    abrir: () => abrirCategoria(ROTAS_CATEGORIAS.questionarios),
  },
  {
    chave: 'metas', titulo: 'Metas e conquistas',
    descricao: 'Crie objetivos e celebre suas conquistas.',
    icone: 'trophy-outline', fundo: '#FCEBDD', texto: '#604936', corIcone: '#C47A3B',
    abrir: () => abrirCategoria(ROTAS_CATEGORIAS.metas),
  },
];

function CartaoCategoria({ c }: { c: Categoria }) {
  return (
    <Pressable
      style={[local.categoria, { backgroundColor: c.fundo }]}
      onPress={c.abrir}
      accessibilityRole="button"
      accessibilityLabel={`${c.titulo}. ${c.descricao}`}
    >
      <Ionicons name={c.icone} size={26} color={c.corIcone} />
      <Text style={[local.categoriaTitulo, { color: c.texto }]}>{c.titulo}</Text>
      <Text style={[local.categoriaDescricao, { color: c.texto }]}>{c.descricao}</Text>
      <Text style={[local.categoriaLink, { color: c.corIcone }]}>Explorar →</Text>
    </Pressable>
  );
}

function Categorias() {
  return (
    <View>
      <Text style={estilos.secaoTitulo} accessibilityRole="header">Explore o Evolua</Text>
      <Text style={estilos.painelTexto}>Escolha uma categoria para descobrir novas atividades.</Text>
      <View style={local.gradeCategorias}>
        {CATEGORIAS.map((c) => (
          <CartaoCategoria key={c.chave} c={c} />
        ))}
      </View>
    </View>
  );
}

/* =============================================================================
 * 6. TELA E PÁGINA
 * ========================================================================== */

function TelaEvolua() {
  const { desktop } = useLayoutInfo();
  const [deslocamento, setDeslocamento] = useState(0);
  const exercicio = useMemo(() => exercicioDoDia(deslocamento), [deslocamento]);

  const cartaoExercicio = (
    // key: ao trocar de exercício, o cartão recomeça do zero.
    <ExercicioDoMomento key={exercicio.id} exercicio={exercicio} onTrocar={() => setDeslocamento((d) => d + 1)} />
  );

  return (
    <>
      <Cabecalho titulo="Evolua" mostrarFoto />

      <Text style={estilos.tituloSaudacao}>Um momento para você.</Text>
      <Text style={[estilos.frase, desktop && { fontSize: 17, lineHeight: 24 }]}>
        Pequenos passos também são evolução. Escolha como deseja cuidar de si hoje.
      </Text>

      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1.1 }}>{cartaoExercicio}</View>
          <View style={{ flex: 1 }}>
            <Categorias />
          </View>
        </View>
      ) : (
        <>
          {cartaoExercicio}
          <Categorias />
        </>
      )}
    </>
  );
}

type TelaAtual = 'evolua' | 'configuracoes' | 'notificacoes';

export default function Evolua() {
  const insets = useSafeAreaInsets();
  const { desktop, larguraMax } = useLayoutInfo();
  const navigation = useNavigation();
  const tecladoVisivel = useTecladoVisivel();
  const [tela, setTela] = useState<TelaAtual>('evolua');
  const scrollRef = useRef<ScrollView>(null);

  // Esconde a barra padrão das Tabs: só vale o <MenuInferior /> (um único menu).
  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  // Configurações e Notificações abrem aqui dentro; "voltar" retorna ao Evolua.
  const irTela = useCallback((t: TelaInterna) => {
    setTela(t === 'home' ? 'evolua' : t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  // Botão "voltar" do Android: de Configurações/Notificações volta ao Evolua.
  useEffect(() => {
    if (tela === 'evolua') return;
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
          {tela === 'evolua' && <TelaEvolua />}
          {tela === 'configuracoes' && <TelaConfiguracoes />}
          {tela === 'notificacoes' && <TelaNotificacoes />}
        </ScrollView>
        {!tecladoVisivel && <MenuInferior ativo={tela === 'evolua' ? 'evolua' : null} />}
      </KeyboardAvoidingView>
    </NavegacaoContext.Provider>
  );
}

/* ---------- Estilos só desta tela (o resto vem de `estilos`) ---------- */
const TAMANHO_ANEL = 160;
const TAMANHO_MIOLO = 96;

const local = StyleSheet.create({
  topoCartao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  tag: { backgroundColor: cores.verdeSuave, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  tagTexto: { fontFamily: fontes.textoMedio, fontSize: 12, color: cores.azulMarinho },
  tituloExercicio: { fontFamily: fontes.titulo, fontSize: 20, lineHeight: 26, color: cores.azulMarinho, marginBottom: 6 },
  descricaoExercicio: { fontFamily: fontes.texto, fontSize: 14, lineHeight: 20, color: cores.cinzaGrafite },

  /* Animação: o palco é maior que a bolinha para a escala máxima não ser cortada. */
  palco: { height: TAMANHO_ANEL * 1.45, alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  anelExterno: {
    width: TAMANHO_ANEL, height: TAMANHO_ANEL, borderRadius: TAMANHO_ANEL / 2,
    backgroundColor: '#D6E8F5', alignItems: 'center', justifyContent: 'center',
  },
  anelInterno: {
    width: TAMANHO_MIOLO, height: TAMANHO_MIOLO, borderRadius: TAMANHO_MIOLO / 2,
    backgroundColor: '#9CC0DE', alignItems: 'center', justifyContent: 'center',
  },
  instrucao: { fontFamily: fontes.titulo, fontSize: 22, lineHeight: 28, color: cores.azulEvolua, textAlign: 'center' },
  dicaTexto: { fontFamily: fontes.texto, fontSize: 13, lineHeight: 18, color: cores.cinzaGrafite, textAlign: 'center', marginTop: 4, minHeight: 36 },
  progTrilha: { height: 8, borderRadius: 4, backgroundColor: cores.cinzaClaro, overflow: 'hidden' },
  progPreenchida: { height: 8, borderRadius: 4, backgroundColor: cores.azulEvolua },
  cicloTexto: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, textAlign: 'center', marginTop: 6 },
  pilula: { backgroundColor: '#E8F1FA', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', marginTop: 14 },
  pilulaTexto: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite },
  botaoLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 14, marginTop: 4 },
  botaoLinkTexto: { fontFamily: fontes.botao, fontSize: 15, color: cores.azulProfundo },

  /* Categorias */
  gradeCategorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  categoria: {
    width: '48.5%', minHeight: 150, borderRadius: 18, padding: 16, gap: 6,
    borderWidth: 1, borderColor: 'rgba(85, 125, 155, 0.10)',
  },
  categoriaTitulo: { fontFamily: fontes.titulo, fontSize: 17, lineHeight: 22, marginTop: 6 },
  categoriaDescricao: { fontFamily: fontes.texto, fontSize: 12, lineHeight: 17, flex: 1 },
  categoriaLink: { fontFamily: fontes.textoMedio, fontSize: 13, marginTop: 4 },
});