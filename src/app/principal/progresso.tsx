// src/app/principal/progresso.tsx
//
// Tela "Progresso" no mesmo padrão da Home: mesmo fundo, mesmo cabeçalho
// (foto + configurações + notificações + sair), mesmo menu inferior e
// cartões no estilo das atividades. Tudo vem de ./compartilhado.

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
  Cabecalho,
  EMOCOES,
  IconeNome,
  MenuInferior,
  NavegacaoContext,
  RostoEmocao,
  TelaInterna,
  abrirAtividade,
  avisar,
  estilos,
  useEvolua,
  useLayoutInfo,
  useTecladoVisivel,
} from './compartilhado';
import TelaConfiguracoes from './configuracoes';
import TelaNotificacoes from './notificacoes';

/* =============================================================================
 * ROTAS DESTA TELA — PONTO DE INTEGRAÇÃO
 * Os cinco primeiros itens reaproveitam ROTAS_ATIVIDADES (compartilhado.tsx),
 * então ligar a rota lá já funciona aqui e na Home. Só "Relatórios" é daqui:
 * troque null pelo caminho da página quando ela existir (ex.: '/principal/relatorios').
 * ========================================================================== */
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

/* ---------- Cartão de item (mesmo visual dos cartões de atividade da Home) ---------- */
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

/* ---------- Barra de média (0 a 10) ---------- */
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

/* ---------- Cartão "Seu resumo" (usa os check-ins salvos na Home) ---------- */
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
      ultimo: checkins[0], // mais recente primeiro
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

/* ---------- Conteúdo principal ---------- */
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
      <Cabecalho titulo="Progresso" mostrarFoto />

      <Text style={[estilos.frase, desktop && { fontSize: 17, lineHeight: 24 }]}>
        Veja como você tem evoluído, um passo de cada vez.
      </Text>

      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1 }}>{lista}</View>
          <View style={{ flex: 1.1 }}>
            <CartaoResumo />
          </View>
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

/* ---------- Página (mesma estrutura da Home) ---------- */
type TelaAtual = 'progresso' | 'configuracoes' | 'notificacoes';

export default function Progresso() {
  const insets = useSafeAreaInsets();
  const { desktop, larguraMax } = useLayoutInfo();
  const navigation = useNavigation();
  const tecladoVisivel = useTecladoVisivel();
  const [tela, setTela] = useState<TelaAtual>('progresso');
  const scrollRef = useRef<ScrollView>(null);

  // Esconde a barra padrão das Tabs: só vale o <MenuInferior /> (um único menu).
  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  // Configurações e Notificações abrem aqui dentro; "voltar" retorna ao Progresso.
  const irTela = useCallback((t: TelaInterna) => {
    setTela(t === 'home' ? 'progresso' : t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  // Botão "voltar" do Android: de Configurações/Notificações volta ao Progresso.
  useEffect(() => {
    if (tela === 'progresso') return;
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
          {tela === 'progresso' && <TelaProgresso />}
          {tela === 'configuracoes' && <TelaConfiguracoes />}
          {tela === 'notificacoes' && <TelaNotificacoes />}
        </ScrollView>
        {!tecladoVisivel && <MenuInferior ativo={tela === 'progresso' ? 'progresso' : null} />}
      </KeyboardAvoidingView>
    </NavegacaoContext.Provider>
  );
}

/* ---------- Estilos só desta tela (o resto vem de `estilos`) ---------- */
const local = StyleSheet.create({
  lista: { gap: 10, marginBottom: 18 },
  cartaoItem: { width: '100%', minHeight: 72 },
  estatLinha: { flexDirection: 'row', gap: 12 },
  estatBox: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 16, backgroundColor: cores.azulGelo },
  estatNumero: { fontFamily: fontes.titulo, fontSize: 28, lineHeight: 34, color: cores.azulMarinho },
  estatRotulo: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, textAlign: 'center' },
  ultimoLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  barraTrilha: { height: 10, borderRadius: 5, backgroundColor: cores.cinzaClaro, overflow: 'hidden', marginTop: 6 },
  barraPreenchida: { height: 10, borderRadius: 5 },
});