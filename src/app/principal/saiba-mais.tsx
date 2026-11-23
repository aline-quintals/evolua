import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Linking,
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
import VisualizadorConteudo from '../../componentes/VisualizadorConteudo';

import {
  IconeNome,
  MenuInferior,
  NavegacaoContext,
  TelaInterna,
  avisar,
  estilos,
  sairDaConta,
  useEvolua,
  useLayoutInfo,
  useNavegacao,
  useTecladoVisivel,
} from './compartilhado';
import TelaConfiguracoes from './configuracoes';
import TelaNotificacoes from './notificacoes';

type TipoConteudo = 'video' | 'palestra' | 'documentario' | 'noticia' | 'material';
type FiltroTipo = 'todos' | TipoConteudo;

type Conteudo = {
  id: string;
  tipo: TipoConteudo;
  tema: string;
  titulo: string;
  meta: string;
  link?: string;
};

type Tema = {
  id: string;
  titulo: string;
  fase: string;
  icone: IconeNome;
  fundo: string;
  corIcone: string;
  texto: string;
};

const FILTROS: ReadonlyArray<{ chave: FiltroTipo; rotulo: string }> = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'video', rotulo: 'Vídeos' },
  { chave: 'palestra', rotulo: 'Palestras' },
  { chave: 'documentario', rotulo: 'Documentários' },
  { chave: 'noticia', rotulo: 'Notícias' },
  { chave: 'material', rotulo: 'Materiais' },
];

const TIPOS: Record<TipoConteudo, { icone: IconeNome; fundo: string; cor: string }> = {
  video: { icone: 'play', fundo: '#E1EFF9', cor: '#2877AE' },
  palestra: { icone: 'mic', fundo: '#EEE9F8', cor: '#7A5CC0' },
  documentario: { icone: 'film', fundo: '#FCEBDD', cor: '#C47A3B' },
  noticia: { icone: 'newspaper', fundo: '#E8F1E5', cor: '#628A57' },
  material: { icone: 'document-text', fundo: '#DFF2EF', cor: '#25877E' },
};

const TEMAS: ReadonlyArray<Tema> = [
  {
    id: 'dependencia',
    titulo: 'Dependência de álcool e outras drogas',
    fase: 'Lua Nova',
    icone: 'medical',
    fundo: '#EEE9F8',
    corIcone: '#7A5CC0',
    texto: '#44395E',
  },
  {
    id: 'ansiedade',
    titulo: 'Ansiedade e depressão',
    fase: 'Lua Crescente',
    icone: 'cloud',
    fundo: '#E1EFF9',
    corIcone: '#2877AE',
    texto: '#29465F',
  },
  {
    id: 'saude',
    titulo: 'Saúde física e mental',
    fase: 'Quarto Crescente',
    icone: 'heart',
    fundo: '#DFF2EF',
    corIcone: '#25877E',
    texto: '#294B49',
  },
  {
    id: 'prevencao',
    titulo: 'Prevenção e qualidade de vida',
    fase: 'Lua Cheia',
    icone: 'shield-checkmark',
    fundo: '#FCEBDD',
    corIcone: '#C47A3B',
    texto: '#604936',
  },
];

const CONTEUDOS: ReadonlyArray<Conteudo> = [
  // ---------- VÍDEOS ----------
  {
    id: 'v1',
    tipo: 'video',
    tema: 'dependencia',
    titulo: 'Como enfrentar a dependência do álcool e outras drogas',
    meta: 'Vídeo · Conversa com psiquiatra e infectologista',
    link: 'https://www.youtube.com/watch?v=m0H13zFFjT4',
  },
  {
    id: 'v2',
    tipo: 'video',
    tema: 'dependencia',
    titulo: 'Como identificar a dependência de álcool',
    meta: 'Vídeo · Dr. Ajuda · curto',
    link: 'https://www.youtube.com/shorts/EuXZ0gIGXa8',
  },
  {
    id: 'v3',
    tipo: 'video',
    tema: 'saude',
    titulo: 'Saúde com Ciência: álcool, drogas e internações',
    meta: 'Vídeo · Saúde com Ciência',
    link: 'https://www.youtube.com/watch?v=WQ1ruxdDC7Q',
  },

  // ---------- PALESTRAS ----------
  {
    id: 'p1',
    tipo: 'palestra',
    tema: 'dependencia',
    titulo: 'Alcoolismo: intoxicação aguda, uso abusivo e dependência',
    meta: 'Palestra · Aula sobre os prejuízos da dependência',
    link: 'https://www.youtube.com/watch?v=ANzDOqsY_6U',
  },
  {
    id: 'p2',
    tipo: 'palestra',
    tema: 'ansiedade',
    titulo: 'A tristeza transforma, a depressão paralisa',
    meta: 'Palestra · Canal Leda Nagle · 43 min',
    link: 'https://www.youtube.com/watch?v=Lp2YV36w98s',
  },

  // ---------- DOCUMENTÁRIOS ----------
  {
    id: 'd1',
    tipo: 'documentario',
    tema: 'dependencia',
    titulo: 'As Fronteiras do Álcool',
    meta: 'Documentário · Produção de Carolina Sanchez',
    link: 'https://www.youtube.com/watch?v=9p60DQSl378',
  },
  {
    id: 'd2',
    tipo: 'documentario',
    tema: 'dependencia',
    titulo: 'Drogas, uma ferida aberta na alma',
    meta: 'Documentário · A dependência pelo olhar do dependente',
    link: 'https://www.youtube.com/watch?v=Mb7m_M3HjcI',
  },

  // ---------- NOTÍCIAS ----------
  {
    id: 'n1',
    tipo: 'noticia',
    tema: 'dependencia',
    titulo: 'Dependência química é doença e tem tratamento',
    meta: 'Notícia · Agência Gov · fev/2024',
    link: 'https://agenciagov.ebc.com.br/noticias/202402/dependencia-quimica-e-doenca-e-tem-tratamento',
  },
  {
    id: 'n2',
    tipo: 'noticia',
    tema: 'dependencia',
    titulo: 'Veja onde buscar ajuda contra o alcoolismo',
    meta: 'Notícia · Gazeta SP · atendimento pelo SUS',
    link: 'https://www.gazetasp.com.br/brasil/veja-onde-buscar-ajuda-contra-o-alcoolismo/',
  },
  {
    id: 'n3',
    tipo: 'noticia',
    tema: 'ansiedade',
    titulo: 'Psiquiatra explica diferença entre depressão e ansiedade',
    meta: 'Notícia · CNN Brasil',
    link: 'https://www.cnnbrasil.com.br/saude/psiquiatra-explica-diferenca-entre-depressao-e-ansiedade/',
  },
  {
    id: 'n4',
    tipo: 'noticia',
    tema: 'prevencao',
    titulo: '“Eu não fumo, só uso vape”: nicotina e saúde mental dos adolescentes',
    meta: 'Notícia · O Tempo · ago/2026',
    link: 'https://www.otempo.com.br/saude-e-bem-estar/2026/8/2/eu-nao-fumo-so-uso-vape-consumo-de-nicotina-alerta-para-a-saude-mental-dos-adolescentes',
  },

  // ---------- MATERIAIS (PDF) ----------
  {
    id: 'm1',
    tipo: 'material',
    tema: 'dependencia',
    titulo: 'Alcoolismo: guia completo do CFM',
    meta: 'Material · PDF · Conselho Federal de Medicina',
    link: 'https://www.ufrgs.br/famed/wp-content/uploads/2024/12/CFM-Alcoolismo.pdf',
  },
  {
    id: 'm2',
    tipo: 'material',
    tema: 'prevencao',
    titulo: 'Cartilha: 12 práticas para proteger crianças e adolescentes do uso de drogas',
    meta: 'Material · PDF · Ministério da Cidadania (Senapred)',
    link: 'https://www.medicina.ufmg.br/sismid/wp-content/uploads/sites/107/2024/05/cartilha_12-praticas-de-como-pais-e-responsaveis-podem-no-dia-a-dia-proteger-o-futuro-das-criancas-e-adolescentes-relacao-uso-drogas.pdf',
  },
  {
    id: 'm3',
    tipo: 'material',
    tema: 'saude',
    titulo: 'Dependência química: álcool (UNA-SUS)',
    meta: 'Material · PDF · Universidade Aberta do SUS / UFMA',
    link: 'https://core.ac.uk/download/48119667.pdf',
  },
];

const TELEFONE_CVV = '188';

function ligarCVV() {
  Linking.openURL(`tel:${TELEFONE_CVV}`).catch(() =>
    avisar('Preciso de ajuda agora', `Ligue para o CVV no número ${TELEFONE_CVV}. A ligação é gratuita e o atendimento funciona 24 horas.`),
  );
}

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
            name="bulb"
            size={desktop ? 34 : estreito ? 26 : 30}
            color={cores.azulEvolua}
          />
          <Text
            style={[local.tituloPagina, { fontSize: desktop ? 36 : estreito ? 26 : 32 }]}
            numberOfLines={1}
          >
            Saiba +
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

function Filtros({ filtro, aoEscolher }: { filtro: FiltroTipo; aoEscolher: (f: FiltroTipo) => void }) {
  return (
    <View style={local.filtros} accessibilityRole="radiogroup">
      {FILTROS.map((f) => {
        const ativo = filtro === f.chave;
        return (
          <Pressable
            key={f.chave}
            style={[local.filtro, ativo && local.filtroAtivo]}
            onPress={() => aoEscolher(f.chave)}
            accessibilityRole="radio"
            accessibilityState={{ checked: ativo }}
            accessibilityLabel={f.rotulo}
          >
            <Text style={[local.filtroTexto, ativo && local.filtroTextoAtivo]}>{f.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CartaoTema({ tema, selecionado, aoPressionar }: { tema: Tema; selecionado: boolean; aoPressionar: () => void }) {
  return (
    <Pressable
      style={[
        local.tema,
        { backgroundColor: tema.fundo },
        selecionado && { borderColor: tema.corIcone, borderWidth: 2 },
      ]}
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={`${tema.titulo}. ${tema.fase}`}
    >
      <View style={local.temaIcone}>
        <Ionicons name={tema.icone} size={22} color={tema.corIcone} />
      </View>
      <Text style={[local.temaTitulo, { color: tema.texto }]} numberOfLines={3}>{tema.titulo}</Text>
      <Text style={[local.temaFase, { color: tema.corIcone }]}>{tema.fase}</Text>
    </Pressable>
  );
}

function CartaoConteudo({ c, aoAbrir }: { c: Conteudo; aoAbrir: (c: Conteudo) => void }) {
  const t = TIPOS[c.tipo];
  return (
    <Pressable
      style={local.conteudoCartao}
      onPress={() => aoAbrir(c)}
      accessibilityRole="button"
      accessibilityLabel={`${c.titulo}. ${c.meta}`}
    >
      <View style={[local.conteudoIcone, { backgroundColor: t.fundo }]}>
        <Ionicons name={t.icone} size={22} color={t.cor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={local.conteudoTitulo} numberOfLines={2}>{c.titulo}</Text>
        <Text style={local.conteudoMeta} numberOfLines={1}>{c.meta}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.cor} />
    </Pressable>
  );
}

function TelaSaibaMais() {
  const { desktop } = useLayoutInfo();
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');
  const [temaId, setTemaId] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Conteudo | null>(null);

  const abrir = (c: Conteudo) => {
    if (c.link) setAberto(c);
    else avisar('Em breve', 'Este conteúdo ainda não foi conectado.');
  };

  const temaAtual = TEMAS.find((t) => t.id === temaId) ?? null;

  const lista = useMemo(
    () =>
      CONTEUDOS.filter(
        (c) => (filtro === 'todos' || c.tipo === filtro) && (!temaId || c.tema === temaId),
      ),
    [filtro, temaId],
  );

  const temas = (
    <View style={local.gradeTemas}>
      {TEMAS.map((t) => (
        <CartaoTema
          key={t.id}
          tema={t}
          selecionado={temaId === t.id}
          aoPressionar={() => setTemaId((atual) => (atual === t.id ? null : t.id))}
        />
      ))}
    </View>
  );

  const conteudos = (
    <View>
      <View style={local.listaTopo}>
        <Text style={[estilos.secaoTitulo, { flex: 1, marginBottom: 0 }]} numberOfLines={2}>
          {temaAtual ? temaAtual.titulo : 'Para começar'}
        </Text>
        {temaAtual && (
          <Pressable
            style={local.limpar}
            onPress={() => setTemaId(null)}
            accessibilityRole="button"
            accessibilityLabel="Limpar tema"
          >
            <Ionicons name="close" size={15} color={cores.azulProfundo} />
            <Text style={local.limparTexto}>Limpar</Text>
          </Pressable>
        )}
      </View>

      {lista.length === 0 ? (
        <View style={local.vazio}>
          <Ionicons name="hourglass-outline" size={26} color="#7A8FA3" />
          <Text style={local.vazioTexto}>
            Em breve teremos novos conteúdos por aqui. Experimente outro filtro ou tema.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {lista.map((c) => (
            <CartaoConteudo key={c.id} c={c} aoAbrir={abrir} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <>
      <Text style={[estilos.frase, desktop && { fontSize: 17, lineHeight: 24 }]}>
        Informação também é cuidado. Escolha por onde começar.
      </Text>

      <Filtros filtro={filtro} aoEscolher={setFiltro} />

      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1 }}>{temas}</View>
          <View style={{ flex: 1 }}>{conteudos}</View>
        </View>
      ) : (
        <>
          {temas}
          {conteudos}
        </>
      )}

      <Text style={local.rodape}>Aplicativo criado por NubyTech · 2026</Text>

      <VisualizadorConteudo conteudo={aberto} aoFechar={() => setAberto(null)} />
    </>
  );
}

function BotaoAjuda() {
  const { larguraMax } = useLayoutInfo();
  return (
    <View style={local.ajudaFundo}>
      <Pressable
        style={[local.ajuda, { maxWidth: Math.min(larguraMax, 560) }]}
        onPress={ligarCVV}
        accessibilityRole="button"
        accessibilityLabel={`Preciso de ajuda agora. Ligar para o CVV, ${TELEFONE_CVV}`}
      >
        <Ionicons name="call" size={18} color={cores.branco} />
        <Text style={local.ajudaTexto}>Preciso de ajuda agora · CVV {TELEFONE_CVV}</Text>
      </Pressable>
    </View>
  );
}

type TelaAtual = 'saibaMais' | 'configuracoes' | 'notificacoes';

export default function SaibaMais() {
  const insets = useSafeAreaInsets();
  const { desktop, larguraMax } = useLayoutInfo();
  const navigation = useNavigation();
  const tecladoVisivel = useTecladoVisivel();
  const [tela, setTela] = useState<TelaAtual>('saibaMais');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  const irTela = useCallback((t: TelaInterna) => {
    setTela(t === 'home' ? 'saibaMais' : t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  useEffect(() => {
    if (tela === 'saibaMais') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { irTela('home'); return true; });
    return () => sub.remove();
  }, [tela, irTela]);

  const naTela = tela === 'saibaMais';

  return (
    <NavegacaoContext.Provider value={{ irTela }}>
      <KeyboardAvoidingView style={estilos.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LinearGradient
          colors={['#FFFFFF', '#F7F9FC', '#EEF2F6']}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />

        {naTela && <FaixaTopo />}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[
            estilos.conteudo,
            {
              maxWidth: larguraMax,
              paddingHorizontal: desktop ? 32 : 14,
              paddingTop: naTela ? ESPACO_APOS_FAIXA : insets.top + (desktop ? 24 : 8),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tela === 'saibaMais' && <TelaSaibaMais />}
          {tela === 'configuracoes' && <TelaConfiguracoes />}
          {tela === 'notificacoes' && <TelaNotificacoes />}
        </ScrollView>

        {naTela && <BotaoAjuda />}
        {!tecladoVisivel && <MenuInferior ativo={naTela ? 'saibaMais' : null} />}
      </KeyboardAvoidingView>
    </NavegacaoContext.Provider>
  );
}

const FAIXA_ESPACO_CIMA = 24;
const FAIXA_ESPACO_BAIXO = 26;
const ESPACO_APOS_FAIXA = 30;

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

  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  filtro: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: cores.azulGelo,
  },
  filtroAtivo: { backgroundColor: cores.azulEvolua },
  filtroTexto: { fontFamily: fontes.botao, fontSize: 14, color: cores.azulProfundo },
  filtroTextoAtivo: { color: cores.branco },

  gradeTemas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  tema: {
    width: '48.5%',
    minHeight: 140,
    borderRadius: 18,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(85, 125, 155, 0.10)',
  },
  temaIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  temaTitulo: { fontFamily: fontes.textoMedio, fontSize: 14, lineHeight: 19, flex: 1, marginTop: 4 },
  temaFase: { fontFamily: fontes.textoMedio, fontSize: 11 },

  listaTopo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  limpar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: cores.azulGelo,
  },
  limparTexto: { fontFamily: fontes.botao, fontSize: 13, color: cores.azulProfundo },

  conteudoCartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E7EDF3',
  },
  conteudoIcone: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudoTitulo: { fontFamily: fontes.textoMedio, fontSize: 15, color: cores.azulMarinho },
  conteudoMeta: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, marginTop: 3 },

  vazio: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.branco,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7EDF3',
    padding: 22,
  },
  vazioTexto: {
    fontFamily: fontes.texto,
    fontSize: 13,
    lineHeight: 19,
    color: cores.cinzaGrafite,
    textAlign: 'center',
  },

  rodape: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: cores.cinzaAzulado,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 6,
  },

  ajudaFundo: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ajuda: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: cores.laranja,
  },
  ajudaTexto: { fontFamily: fontes.botao, fontSize: 15, color: cores.branco },
});