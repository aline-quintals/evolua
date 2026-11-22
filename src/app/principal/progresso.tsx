import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
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
  EMOCOES,
  IconeNome,
  MenuInferior,
  NavegacaoContext,
  RostoEmocao,
  TelaInterna,
  abrirAtividade,
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

const ROTA_RELATORIOS: Href | null = null;

type ItemProgresso = {
  chave: string;
  titulo: string;
  fundo: string;
  texto: string;
  corIcone: string;
  icone: IconeNome;
  abrir: () => void;
};

const ITENS: ReadonlyArray<ItemProgresso> = [
  {
    chave: 'historico', titulo: 'Histórico dos check-ins emocionais',
    fundo: '#E1EFF9', texto: '#29465F', corIcone: '#2877AE', icone: 'happy',
    abrir: () => abrirAtividade('checkinEmocional'),
  },
  {
    chave: 'evolucao', titulo: 'Evolução pessoal',
    fundo: '#DFF2EF', texto: '#294B49', corIcone: '#25877E', icone: 'trending-up',
    abrir: () => abrirAtividade('evolucaoPessoal'),
  },
  {
    chave: 'metas', titulo: 'Metas realizadas',
    fundo: '#FCEBDD', texto: '#604936', corIcone: '#C47A3B', icone: 'flag',
    abrir: () => abrirAtividade('metas'),
  },
  {
    chave: 'exercicios', titulo: 'Exercícios concluídos',
    fundo: '#E8F1E5', texto: '#3D5140', corIcone: '#628A57', icone: 'fitness',
    abrir: () => abrirAtividade('exercicios'),
  },
  {
    chave: 'questionarios', titulo: 'Questionários respondidos',
    fundo: '#EEE9F8', texto: '#44395E', corIcone: '#7A5CC0', icone: 'clipboard',
    abrir: () => abrirAtividade('questionarios'),
  },
  {
    chave: 'relatorios', titulo: 'Download de relatórios por período',
    fundo: '#E1EFF9', texto: '#29465F', corIcone: '#2877AE', icone: 'download',
    abrir: () => {
      if (ROTA_RELATORIOS) {
        router.navigate(ROTA_RELATORIOS);
      } else {
        avisar('Em breve', 'Esta página ainda não foi conectada.');
      }
    },
  },
];

function CartaoProgresso({ item }: { item: ItemProgresso }) {
  return (
    <Pressable
      style={[estilos.atividade, local.cartaoItem, { backgroundColor: item.fundo }]}
      onPress={item.abrir}
      accessibilityRole="button"
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

function CartaoHistoricoExercicios() {
  const exercicios = useEvolua((e) => e.exerciciosConcluidos);

  const recentes = exercicios.slice(0, 5);

  return (
    <View style={estilos.cartao}>
      <View style={local.historicoTopo}>
        <Text style={estilos.secaoTitulo}>
          Exercícios concluídos
        </Text>
        <View style={local.contadorExercicios}>
          <Text style={local.contadorTexto}>
            {exercicios.length}
          </Text>
        </View>
      </View>

      {recentes.length === 0 ? (
        <Text style={estilos.painelTexto}>
          Você ainda não concluiu nenhum exercício.
          Quando finalizar uma atividade e tocar em "Salvar exercício",
          ela aparecerá aqui.
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {recentes.map((exercicio) => (
            <View key={exercicio.id} style={local.exercicioHistorico}>
              <View style={local.iconeHistorico}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#628A57"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={local.nomeHistorico}>
                  {exercicio.nome}
                </Text>
                <Text style={local.dataHistorico}>
                  {new Date(exercicio.criadoEmISO).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {exercicios.length > 5 && (
        <Text style={local.maisHistorico}>
          Mostrando os 5 exercícios mais recentes.
        </Text>
      )}
    </View>
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

function TelaProgresso() {
  const { desktop } = useLayoutInfo();

  const lista = (
    <View>
      <Text style={estilos.secaoTitulo}>Explore seu progresso:</Text>
      <View style={local.lista}>
        {ITENS.map((item) => (
          <CartaoProgresso key={item.chave} item={item} />
        ))}
      </View>
    </View>
  );

  return (
    <>
      <Text style={[estilos.frase, desktop && { fontSize: 17, lineHeight: 24 }]}>
        Veja como você tem evoluído, um passo de cada vez.
      </Text>

      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1 }}>{lista}</View>
          <View style={{ flex: 1.1 }}>
            <CartaoResumo />
            <CartaoHistoricoExercicios />
          </View>
        </View>
      ) : (
        <>
          <CartaoResumo />
          <CartaoHistoricoExercicios />
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
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  const irTela = useCallback((t: TelaInterna) => {
    setTela(t === 'home' ? 'progresso' : t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  useEffect(() => {
    if (tela === 'progresso') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { irTela('home'); return true; });
    return () => sub.remove();
  }, [tela, irTela]);

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
          {tela === 'progresso' && <TelaProgresso />}
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
  historicoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contadorExercicios: {
    backgroundColor: '#E8F1E5',
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: {
    fontFamily: fontes.titulo,
    fontSize: 15,
    color: '#3D5140',
  },
  exercicioHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconeHistorico: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F1E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomeHistorico: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: cores.azulMarinho,
  },
  dataHistorico: {
    fontFamily: fontes.texto,
    fontSize: 12,
    color: cores.cinzaGrafite,
    marginTop: 3,
  },
  maisHistorico: {
    fontFamily: fontes.texto,
    fontSize: 12,
    color: cores.cinzaGrafite,
    marginTop: 12,
  },
});