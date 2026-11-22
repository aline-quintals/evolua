import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MenuInferior,
  useEvolua,
  useLayoutInfo,
  criarMeta,
  atualizarMeta,
  excluirMeta,
  avisar,
  type MetaEvolua,
} from './compartilhado';
import { fontes } from '../../tema';

/* =========================================================
   CORES (dourado como tom principal + tons de apoio)
========================================================= */

const DOURADO = {
  principal: '#B8862F',
  escuro: '#7C5F2C',
  claro: '#FBF0D9',
  apresentacao: '#FBF3E0',
  suave: '#F7EDD3',
  trilha: '#EFE8D8',
};

const C = {
  titulo: '#29465F',
  texto: '#536B80',
  suave: '#74879A',
  borda: '#E7EDF3',
};

// --------------------------------------------------
// TIPOS E CONFIGURAÇÕES
// --------------------------------------------------

type CategoriaMeta =
  | 'exercicio'
  | 'bem-estar'
  | 'questionario'
  | 'checkin'
  | 'pessoal';

const CATEGORIAS: {
  valor: CategoriaMeta;
  titulo: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  cor: string;
  fundo: string;
}[] = [
  {
    valor: 'exercicio',
    titulo: 'Exercícios',
    icone: 'fitness-outline',
    cor: '#628A57',
    fundo: '#E8F1E5',
  },
  {
    valor: 'bem-estar',
    titulo: 'Bem-estar',
    icone: 'leaf-outline',
    cor: '#25877E',
    fundo: '#DFF2EF',
  },
  {
    valor: 'questionario',
    titulo: 'Questionários',
    icone: 'clipboard-outline',
    cor: '#2877AE',
    fundo: '#E1EFF9',
  },
  {
    valor: 'checkin',
    titulo: 'Check-ins',
    icone: 'heart-outline',
    cor: '#C47A3B',
    fundo: '#FCEBDD',
  },
  {
    valor: 'pessoal',
    titulo: 'Meta pessoal',
    icone: 'flag-outline',
    cor: '#8064A2',
    fundo: '#EEE8F7',
  },
];

const SUGESTOES = [
  {
    titulo: 'Experimentar 3 exercícios',
    descricao: 'Reserve momentos para cuidar de você.',
    categoria: 'exercicio' as const,
    frequencia: 'semanal' as const,
    alvo: 3,
  },
  {
    titulo: 'Realizar 2 atividades de bem-estar',
    descricao: 'Inclua pequenas pausas na sua rotina.',
    categoria: 'bem-estar' as const,
    frequencia: 'semanal' as const,
    alvo: 2,
  },
  {
    titulo: 'Responder a um questionário',
    descricao: 'Conheça melhor suas emoções.',
    categoria: 'questionario' as const,
    frequencia: 'semanal' as const,
    alvo: 1,
  },
  {
    titulo: 'Fazer 5 check-ins emocionais',
    descricao: 'Observe como você se sente ao longo da semana.',
    categoria: 'checkin' as const,
    frequencia: 'semanal' as const,
    alvo: 5,
  },
];

// --------------------------------------------------
// FUNÇÕES AUXILIARES
// --------------------------------------------------

function inicioDaSemana(): string {
  const hoje = new Date();
  const dia = hoje.getDay();
  const diferenca = dia === 0 ? 6 : dia - 1;

  hoje.setDate(hoje.getDate() - diferenca);
  hoje.setHours(0, 0, 0, 0);

  return hoje.toISOString();
}

function contarAtividades(
  meta: MetaEvolua,
  registros: {
    exercicios: any[];
    bemEstar: any[];
    questionarios: any[];
    checkins: any[];
  }
): number {
  if (meta.tipo === 'manual' || !meta.categoria) return 0;

  const lista = {
    exercicio: registros.exercicios,
    'bem-estar': registros.bemEstar,
    questionario: registros.questionarios,
    checkin: registros.checkins,
  }[meta.categoria];

  if (!lista) return 0;

  const inicio = meta.frequencia === 'semanal'
    ? inicioDaSemana()
    : meta.criadaEmISO;

  return lista.filter((item) => {
    const data = item.criadoEmISO;
    return data >= inicio && data >= meta.criadaEmISO;
  }).length;
}

function obterProgresso(
  meta: MetaEvolua,
  registros: {
    exercicios: any[];
    bemEstar: any[];
    questionarios: any[];
    checkins: any[];
  }
) {
  if (meta.tipo === 'manual') {
    return {
      atual: meta.concluida ? 1 : 0,
      percentual: meta.concluida ? 100 : 0,
      concluida: meta.concluida,
    };
  }

  const atual = contarAtividades(meta, registros);
  const percentual = Math.min(100, (atual / Math.max(1, meta.alvo)) * 100);

  return {
    atual,
    percentual,
    concluida: atual >= meta.alvo,
  };
}

// --------------------------------------------------
// COMPONENTES
// --------------------------------------------------

function TituloSecao({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao?: string;
}) {
  return (
    <View style={styles.tituloSecaoBloco}>
      <Text style={styles.tituloSecao}>{titulo}</Text>
      {!!descricao && (
        <Text style={styles.descricaoSecao}>{descricao}</Text>
      )}
    </View>
  );
}

function BarraProgresso({
  percentual,
  cor,
}: {
  percentual: number;
  cor: string;
}) {
  return (
    <View style={styles.trilha}>
      <View
        style={[
          styles.preenchimento,
          {
            width: `${percentual}%`,
            backgroundColor: cor,
          },
        ]}
      />
    </View>
  );
}

function CartaoMeta({
  meta,
  registros,
  aoExcluir,
  aoAlternar,
}: {
  meta: MetaEvolua;
  registros: {
    exercicios: any[];
    bemEstar: any[];
    questionarios: any[];
    checkins: any[];
  };
  aoExcluir: () => void;
  aoAlternar: () => void;
}) {
  const categoria = CATEGORIAS.find(
    (item) => item.valor === (meta.categoria ?? 'pessoal')
  ) ?? CATEGORIAS[4];

  const progresso = obterProgresso(meta, registros);

  return (
    <View style={styles.cartaoMeta}>
      <View style={styles.metaTopo}>
        <View
          style={[
            styles.iconeCategoria,
            { backgroundColor: categoria.fundo },
          ]}
        >
          <Ionicons
            name={categoria.icone}
            size={23}
            color={categoria.cor}
          />
        </View>

        <View style={styles.metaTituloArea}>
          <Text style={styles.metaTitulo}>{meta.titulo}</Text>
          {!!meta.descricao && (
            <Text style={styles.metaDescricao}>{meta.descricao}</Text>
          )}
        </View>

        <Pressable onPress={aoExcluir} hitSlop={10}>
          <Ionicons
            name="ellipsis-vertical"
            size={21}
            color="#94A3B8"
          />
        </Pressable>
      </View>

      <View style={styles.metaInfo}>
        <Text
          style={[
            styles.metaCategoria,
            { color: categoria.cor, backgroundColor: categoria.fundo },
          ]}
        >
          {categoria.titulo}
        </Text>
        <Text style={styles.metaFrequencia}>
          {meta.frequencia === 'semanal' ? 'Semanal' : 'Única'}
        </Text>
      </View>

      {meta.tipo === 'automatica' ? (
        <>
          <View style={styles.progressoLinha}>
            <Text style={styles.progressoTexto}>
              {progresso.concluida
                ? 'Meta alcançada!'
                : `${progresso.atual} de ${meta.alvo} atividades`}
            </Text>
            <Text style={styles.progressoPercentual}>
              {Math.round(progresso.percentual)}%
            </Text>
          </View>

          <BarraProgresso
            percentual={progresso.percentual}
            cor={categoria.cor}
          />
        </>
      ) : (
        <Pressable
          style={[
            styles.botaoConcluir,
            progresso.concluida && styles.botaoConcluido,
          ]}
          onPress={aoAlternar}
        >
          <Ionicons
            name={progresso.concluida ? 'checkmark-circle' : 'ellipse-outline'}
            size={19}
            color={progresso.concluida ? '#628A57' : DOURADO.escuro}
          />
          <Text style={styles.botaoConcluirTexto}>
            {progresso.concluida
              ? 'Concluída — desfazer'
              : 'Marcar como concluída'}
          </Text>
        </Pressable>
      )}

      {progresso.concluida && (
        <View style={styles.metaConquista}>
          <Ionicons name="trophy" size={16} color="#C18B36" />
          <Text style={styles.metaConquistaTexto}>
            Parabéns! Você alcançou seu objetivo.
          </Text>
        </View>
      )}
    </View>
  );
}

// --------------------------------------------------
// PÁGINA PRINCIPAL
// --------------------------------------------------

export default function Metas() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { larguraMax } = useLayoutInfo();

  const metas = useEvolua((e) => e.metas);
  const exercicios = useEvolua((e) => e.exerciciosConcluidos);
  const bemEstar = useEvolua((e) => e.atividadesBemEstar);
  const questionarios = useEvolua((e) => e.questionariosRespondidos);
  const checkins = useEvolua((e) => e.checkins);

  const [modalAberto, setModalAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<CategoriaMeta>('exercicio');
  const [frequencia, setFrequencia] = useState<'unica' | 'semanal'>('semanal');
  const [alvo, setAlvo] = useState('3');

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      tabBarStyle: { display: 'none' },
    });
  }, [navigation]);

  const voltar = () => {
    router.replace('/principal/evolua');
  };

  const registros = useMemo(() => ({
    exercicios,
    bemEstar,
    questionarios,
    checkins,
  }), [exercicios, bemEstar, questionarios, checkins]);

  const metasAtivas = metas.filter((meta) => {
    if (meta.tipo === 'manual') return !meta.concluida;
    return !obterProgresso(meta, registros).concluida;
  });

  const metasConcluidas = metas.filter((meta) => {
    if (meta.tipo === 'manual') return meta.concluida;
    return obterProgresso(meta, registros).concluida;
  });

  const totalConcluido = metasConcluidas.length;

  const totalAtividades =
    exercicios.length +
    bemEstar.length +
    questionarios.length +
    checkins.length;

  const conquistas = [
    {
      titulo: 'Primeiro passo',
      descricao: 'Realizou sua primeira atividade.',
      icone: 'footsteps' as const,
      desbloqueada: totalAtividades >= 1,
    },
    {
      titulo: 'Em movimento',
      descricao: 'Concluiu 5 atividades.',
      icone: 'fitness' as const,
      desbloqueada: totalAtividades >= 5,
    },
    {
      titulo: 'Objetivo alcançado',
      descricao: 'Concluiu sua primeira meta.',
      icone: 'trophy' as const,
      desbloqueada: totalConcluido >= 1,
    },
    {
      titulo: 'Persistência',
      descricao: 'Concluiu 10 atividades.',
      icone: 'ribbon' as const,
      desbloqueada: totalAtividades >= 10,
    },
  ];

  function limparFormulario() {
    setTitulo('');
    setDescricao('');
    setCategoria('exercicio');
    setFrequencia('semanal');
    setAlvo('3');
  }

  function salvarNovaMeta() {
    const nome = titulo.trim();
    const quantidade = Number(alvo);

    if (!nome) {
      avisar('Atenção', 'Digite um título para sua meta.');
      return;
    }

    const pessoal = categoria === 'pessoal';

    if (!pessoal && (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 100)) {
      avisar('Atenção', 'Escolha uma quantidade entre 1 e 100.');
      return;
    }

    criarMeta({
      titulo: nome,
      descricao: descricao.trim(),
      tipo: pessoal ? 'manual' : 'automatica',
      categoria: pessoal ? undefined : categoria,
      frequencia: pessoal ? 'unica' : frequencia,
      alvo: pessoal ? 1 : quantidade,
      concluida: false,
    });

    setModalAberto(false);
    limparFormulario();
    avisar('Meta criada!', 'Seu novo objetivo já está na sua lista.');
  }

  function adicionarSugestao(sugestao: typeof SUGESTOES[number]) {
    criarMeta({
      titulo: sugestao.titulo,
      descricao: sugestao.descricao,
      tipo: 'automatica',
      categoria: sugestao.categoria,
      frequencia: sugestao.frequencia,
      alvo: sugestao.alvo,
      concluida: false,
    });

    avisar('Meta adicionada!', 'Seu objetivo já está sendo acompanhado.');
  }

  function confirmarExclusao(id: string) {
    if (Platform.OS === 'web') {
      excluirMeta(id);
      return;
    }

    Alert.alert(
      'Excluir meta',
      'Deseja realmente excluir este objetivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirMeta(id),
        },
      ]
    );
  }

  return (
    <View style={styles.raiz}>
      <LinearGradient
        colors={['#FFFFFF', '#FDFAF3', '#F6F0E2']}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ paddingTop: insets.top + 8 }}>
        <View style={[styles.topo, { maxWidth: larguraMax, alignSelf: 'center' }]}>
          <Pressable
            onPress={voltar}
            style={styles.botaoVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color={C.titulo} />
          </Pressable>

          <View style={styles.topoTitulo}>
            <Text style={styles.tituloPagina}>Metas e conquistas</Text>
            <Text style={styles.subtituloPagina}>
              Cada pequeno passo faz parte da sua evolução
            </Text>
          </View>

          <View style={styles.iconeTopo}>
            <Ionicons name="trophy-outline" size={25} color={DOURADO.principal} />
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
        {/* APRESENTAÇÃO E RESUMO */}

        <View style={styles.apresentacao}>
          <View style={styles.apresentacaoIcone}>
            <Ionicons name="flag-outline" size={27} color={DOURADO.principal} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.apresentacaoTitulo}>Sua jornada continua!</Text>
            <Text style={styles.apresentacaoTexto}>
              Acompanhe seus objetivos e valorize cada conquista.
            </Text>
          </View>
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{metasAtivas.length}</Text>
            <Text style={styles.resumoLegenda}>em andamento</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{totalConcluido}</Text>
            <Text style={styles.resumoLegenda}>concluídas</Text>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoItem}>
            <Text style={styles.resumoNumero}>{totalAtividades}</Text>
            <Text style={styles.resumoLegenda}>atividades</Text>
          </View>
        </View>

        {/* MINHAS METAS */}

        <View style={styles.linhaTitulo}>
          <View style={{ flex: 1 }}>
            <TituloSecao
              titulo="Minhas metas"
              descricao="Objetivos que acompanham sua evolução."
            />
          </View>

          <Pressable
            style={styles.botaoAdicionar}
            onPress={() => setModalAberto(true)}
          >
            <Ionicons name="add" size={21} color="#FFFFFF" />
            <Text style={styles.botaoAdicionarTexto}>Criar</Text>
          </Pressable>
        </View>

        {metasAtivas.length === 0 ? (
          <View style={styles.vazio}>
            <Ionicons name="flag-outline" size={38} color="#B9A478" />
            <Text style={styles.vazioTitulo}>
              Nenhuma meta ativa por enquanto
            </Text>
            <Text style={styles.vazioTexto}>
              Escolha uma sugestão ou crie um objetivo que faça sentido para você.
            </Text>
          </View>
        ) : (
          metasAtivas.map((meta) => (
            <CartaoMeta
              key={meta.id}
              meta={meta}
              registros={registros}
              aoExcluir={() => confirmarExclusao(meta.id)}
              aoAlternar={() =>
                atualizarMeta(meta.id, { concluida: !meta.concluida })
              }
            />
          ))
        )}

        {/* SUGESTÕES */}

        <TituloSecao
          titulo="Metas sugeridas"
          descricao="Pequenos objetivos para incluir na sua rotina."
        />

        {SUGESTOES.map((sugestao, index) => {
          const cor = CATEGORIAS.find(
            (item) => item.valor === sugestao.categoria
          )!;

          return (
            <View key={index} style={styles.sugestao}>
              <View
                style={[
                  styles.iconeCategoria,
                  { backgroundColor: cor.fundo },
                ]}
              >
                <Ionicons name={cor.icone} size={22} color={cor.cor} />
              </View>

              <View style={styles.sugestaoTexto}>
                <Text style={styles.sugestaoTitulo}>
                  {sugestao.titulo}
                </Text>
                <Text style={styles.sugestaoDescricao}>
                  {sugestao.descricao}
                </Text>
              </View>

              <Pressable
                style={styles.botaoMais}
                onPress={() => adicionarSugestao(sugestao)}
              >
                <Ionicons name="add" size={23} color={DOURADO.principal} />
              </Pressable>
            </View>
          );
        })}

        {/* CONQUISTAS */}

        <TituloSecao
          titulo="Conquistas"
          descricao="Cada etapa merece ser reconhecida."
        />

        <View style={styles.gradeConquistas}>
          {conquistas.map((conquista) => (
            <View
              key={conquista.titulo}
              style={[
                styles.cartaoConquista,
                !conquista.desbloqueada && styles.conquistaBloqueada,
              ]}
            >
              <View
                style={[
                  styles.iconeConquista,
                  conquista.desbloqueada
                    ? styles.conquistaAtiva
                    : styles.conquistaInativa,
                ]}
              >
                <Ionicons
                  name={conquista.icone}
                  size={27}
                  color={conquista.desbloqueada ? '#C18B36' : '#A8B2BD'}
                />
              </View>

              <Text style={styles.conquistaTitulo}>
                {conquista.titulo}
              </Text>
              <Text style={styles.conquistaDescricao}>
                {conquista.descricao}
              </Text>

              <Text
                style={[
                  styles.conquistaStatus,
                  conquista.desbloqueada && styles.conquistaStatusAtiva,
                ]}
              >
                {conquista.desbloqueada ? 'Desbloqueada' : 'Bloqueada'}
              </Text>
            </View>
          ))}
        </View>

        {/* METAS CONCLUÍDAS */}

        <TituloSecao
          titulo="Metas concluídas"
          descricao="Olhe para trás e reconheça o quanto já avançou."
        />

        {metasConcluidas.length === 0 ? (
          <Text style={styles.textoHistorico}>
            Suas metas concluídas aparecerão aqui. Continue no seu ritmo!
          </Text>
        ) : (
          metasConcluidas.map((meta) => (
            <View key={meta.id} style={styles.metaHistorico}>
              <Ionicons
                name="checkmark-circle"
                size={23}
                color="#5A9A76"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaHistoricoTitulo}>
                  {meta.titulo}
                </Text>
                <Text style={styles.metaHistoricoDescricao}>
                  Objetivo alcançado!
                </Text>
              </View>
              <Ionicons name="trophy-outline" size={21} color="#C18B36" />
            </View>
          ))
        )}

        <View style={styles.mensagemFinal}>
          <Ionicons name="heart-outline" size={20} color="#638B79" />
          <Text style={styles.mensagemFinalTexto}>
            Sua evolução não precisa ser perfeita. Cada passo conta, inclusive os recomeços.
          </Text>
        </View>
      </ScrollView>

      <MenuInferior ativo="evolua" />

      {/* MODAL DE CRIAÇÃO */}

      <Modal
        visible={modalAberto}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAberto(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalFundo}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalConteudo}>
            <View style={styles.modalTopo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo}>Criar minha meta</Text>
                <Text style={styles.modalSubtitulo}>
                  Escolha um objetivo possível para você.
                </Text>
              </View>

              <Pressable onPress={() => setModalAberto(false)}>
                <Ionicons name="close" size={26} color={C.titulo} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.rotuloCampo}>Título da meta</Text>
              <TextInput
                style={styles.campo}
                placeholder="Ex.: Cuidar mais de mim"
                placeholderTextColor="#91A0AF"
                value={titulo}
                onChangeText={setTitulo}
                maxLength={70}
              />

              <Text style={styles.rotuloCampo}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.campo, styles.campoDescricao]}
                placeholder="Escreva um pouco sobre seu objetivo..."
                placeholderTextColor="#91A0AF"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                maxLength={180}
              />

              <Text style={styles.rotuloCampo}>Tipo de meta</Text>
              <View style={styles.opcoesCategoria}>
                {CATEGORIAS.map((item) => {
                  const selecionada = categoria === item.valor;

                  return (
                    <Pressable
                      key={item.valor}
                      onPress={() => setCategoria(item.valor)}
                      style={[
                        styles.opcaoCategoria,
                        selecionada && styles.opcaoCategoriaAtiva,
                      ]}
                    >
                      <Ionicons
                        name={item.icone}
                        size={19}
                        color={selecionada ? DOURADO.principal : item.cor}
                      />
                      <Text
                        style={[
                          styles.opcaoCategoriaTexto,
                          selecionada && styles.opcaoCategoriaTextoAtivo,
                        ]}
                      >
                        {item.titulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {categoria !== 'pessoal' && (
                <>
                  <Text style={styles.rotuloCampo}>Frequência</Text>
                  <View style={styles.opcoesLinha}>
                    {(['semanal', 'unica'] as const).map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => setFrequencia(item)}
                        style={[
                          styles.opcaoFrequencia,
                          frequencia === item && styles.opcaoFrequenciaAtiva,
                        ]}
                      >
                        <Text
                          style={[
                            styles.opcaoFrequenciaTexto,
                            frequencia === item && styles.opcaoFrequenciaTextoAtivo,
                          ]}
                        >
                          {item === 'semanal' ? 'Semanal' : 'Uma vez'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.rotuloCampo}>
                    Quantidade de atividades
                  </Text>
                  <TextInput
                    style={styles.campo}
                    value={alvo}
                    onChangeText={setAlvo}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="Ex.: 3"
                    placeholderTextColor="#91A0AF"
                  />
                </>
              )}

              {categoria === 'pessoal' && (
                <Text style={styles.avisoPessoal}>
                  Essa meta será concluída quando você marcar manualmente que alcançou seu objetivo.
                </Text>
              )}

              <Pressable
                style={styles.botaoSalvar}
                onPress={salvarNovaMeta}
              >
                <Text style={styles.botaoSalvarTexto}>Salvar minha meta</Text>
              </Pressable>

              <Pressable
                style={styles.botaoCancelar}
                onPress={() => {
                  setModalAberto(false);
                  limparFormulario();
                }}
              >
                <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// --------------------------------------------------
// ESTILOS
// --------------------------------------------------

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: '#FDFAF3',
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
    backgroundColor: DOURADO.claro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },

  /* apresentação e resumo */
  apresentacao: {
    backgroundColor: DOURADO.apresentacao,
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
    color: DOURADO.escuro,
    marginBottom: 4,
  },
  apresentacaoTexto: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#85703F',
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
    color: DOURADO.principal,
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

  /* títulos de seção */
  tituloSecaoBloco: {
    marginTop: 5,
  },
  tituloSecao: {
    fontFamily: fontes.textoMedio,
    fontSize: 17,
    color: C.titulo,
  },
  descricaoSecao: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8FA3',
    marginTop: 3,
  },
  linhaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botaoAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DOURADO.principal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  botaoAdicionarTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#FFFFFF',
  },

  /* metas */
  cartaoMeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borda,
  },
  metaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconeCategoria: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTituloArea: {
    flex: 1,
  },
  metaTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: '#354F65',
  },
  metaDescricao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 16,
    color: '#7A8FA3',
    marginTop: 3,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
    marginBottom: 12,
  },
  metaCategoria: {
    fontFamily: fontes.textoMedio,
    fontSize: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  metaFrequencia: {
    fontFamily: fontes.texto,
    fontSize: 10,
    color: '#74869A',
    backgroundColor: '#F1F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    color: '#74869A',
  },
  progressoPercentual: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    color: C.titulo,
  },
  trilha: {
    height: 8,
    backgroundColor: DOURADO.trilha,
    borderRadius: 8,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: 8,
  },
  metaConquista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  metaConquistaTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    color: '#8C692E',
  },
  botaoConcluir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: DOURADO.claro,
    alignSelf: 'flex-start',
  },
  botaoConcluido: {
    backgroundColor: '#E8F1E5',
  },
  botaoConcluirTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: DOURADO.escuro,
  },
  vazio: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.borda,
  },
  vazioTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: '#354F65',
    marginTop: 10,
  },
  vazioTexto: {
    fontFamily: fontes.texto,
    fontSize: 12,
    color: '#74869A',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
  },

  /* sugestões */
  sugestao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.borda,
  },
  sugestaoTexto: {
    flex: 1,
  },
  sugestaoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#354F65',
  },
  sugestaoDescricao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#7A8FA3',
    marginTop: 3,
    lineHeight: 16,
  },
  botaoMais: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: DOURADO.claro,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* conquistas */
  gradeConquistas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cartaoConquista: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 13,
    borderWidth: 1,
    borderColor: C.borda,
  },
  conquistaBloqueada: {
    opacity: 0.65,
    backgroundColor: '#F5F7F8',
  },
  iconeConquista: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  conquistaAtiva: {
    backgroundColor: '#FFF1D6',
  },
  conquistaInativa: {
    backgroundColor: '#E9EDF0',
  },
  conquistaTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#354F65',
  },
  conquistaDescricao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 16,
    color: '#7A8FA3',
    marginTop: 4,
    minHeight: 32,
  },
  conquistaStatus: {
    fontFamily: fontes.textoMedio,
    fontSize: 10,
    color: '#8B969F',
    marginTop: 8,
  },
  conquistaStatusAtiva: {
    color: '#5A9A76',
  },

  /* histórico */
  textoHistorico: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 19,
    color: '#74869A',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.borda,
    overflow: 'hidden',
  },
  metaHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.borda,
  },
  metaHistoricoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#354F65',
  },
  metaHistoricoDescricao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#7A8FA3',
    marginTop: 3,
  },
  mensagemFinal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#EAF3ED',
    borderRadius: 15,
    marginTop: 2,
    marginBottom: 8,
  },
  mensagemFinalTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#557765',
  },

  /* modal */
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(25, 42, 58, 0.48)',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    paddingHorizontal: 21,
    paddingTop: 22,
    paddingBottom: 25,
    maxHeight: '92%',
  },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalTitulo: {
    fontFamily: fontes.titulo,
    fontSize: 22,
    color: C.titulo,
  },
  modalSubtitulo: {
    fontFamily: fontes.texto,
    fontSize: 12,
    color: '#74869A',
    marginTop: 4,
  },
  rotuloCampo: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: C.titulo,
    marginBottom: 7,
    marginTop: 12,
  },
  campo: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#E4E9EE',
    borderRadius: 12,
    paddingHorizontal: 13,
    fontFamily: fontes.texto,
    fontSize: 13,
    color: '#354F65',
    backgroundColor: '#FAFBFC',
  },
  campoDescricao: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  opcoesCategoria: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  opcaoCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E4E9EE',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  opcaoCategoriaAtiva: {
    borderColor: '#E3CB98',
    backgroundColor: DOURADO.claro,
  },
  opcaoCategoriaTexto: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#74869A',
  },
  opcaoCategoriaTextoAtivo: {
    fontFamily: fontes.textoMedio,
    color: DOURADO.escuro,
  },
  opcoesLinha: {
    flexDirection: 'row',
    gap: 9,
  },
  opcaoFrequencia: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F4F6F8',
    borderWidth: 1,
    borderColor: '#F4F6F8',
  },
  opcaoFrequenciaAtiva: {
    backgroundColor: DOURADO.claro,
    borderColor: '#E3CB98',
  },
  opcaoFrequenciaTexto: {
    fontFamily: fontes.texto,
    fontSize: 12,
    color: '#74869A',
  },
  opcaoFrequenciaTextoAtivo: {
    fontFamily: fontes.textoMedio,
    color: DOURADO.escuro,
  },
  avisoPessoal: {
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#85703F',
    backgroundColor: DOURADO.apresentacao,
    padding: 12,
    borderRadius: 12,
    marginTop: 13,
    overflow: 'hidden',
  },
  botaoSalvar: {
    minHeight: 48,
    backgroundColor: DOURADO.principal,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  botaoSalvarTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#FFFFFF',
  },
  botaoCancelar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  botaoCancelarTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#71869A',
  },
});