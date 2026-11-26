import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TelaInterna,
  useLayoutInfo,
  useTecladoVisivel,
  NavegacaoContext,
  MenuInferior,
  TelaHome,
  estilos,
} from './compartilhado';
import TelaConfiguracoes from './configuracoes';
import TelaNotificacoes from './notificacoes';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { desktop, larguraMax } = useLayoutInfo();
  const navigation = useNavigation();
  const tecladoVisivel = useTecladoVisivel();
  const [tela, setTela] = useState<TelaInterna>('home');
  const scrollRef = useRef<any>(null);

  // Esconde a barra padrão das Tabs: só vale o <MenuInferior /> deste arquivo (um único menu).
  useEffect(() => {
    (navigation as any)?.setOptions?.({ tabBarStyle: { display: 'none' }, headerShown: false });
  }, [navigation]);

  const irTela = useCallback((t: TelaInterna) => {
    setTela(t);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  // Botão "voltar" do Android: de Configurações/Notificações volta para a Home.
  useEffect(() => {
    if (tela === 'home') return;
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
          {tela === 'home' && <TelaHome />}
          {tela === 'configuracoes' && <TelaConfiguracoes />}
          {tela === 'notificacoes' && <TelaNotificacoes />}
        </ScrollView>
        {/* Configurações e Notificações não marcam nenhum botão (como no design). */}
        {!tecladoVisivel && <MenuInferior ativo={tela === 'home' ? 'home' : null} aoPressionarHome={() => irTela('home')} />}
      </KeyboardAvoidingView>
    </NavegacaoContext.Provider>
  );
}