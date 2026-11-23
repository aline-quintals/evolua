import React from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../tema';
import { idYoutube, urlIncorporada } from './fonteConteudo';

type Props = { conteudo: { titulo: string; link?: string } | null; aoFechar: () => void };

export default function VisualizadorConteudo({ conteudo, aoFechar }: Props) {
  const insets = useSafeAreaInsets();
  if (!conteudo?.link) return null;
  const link = conteudo.link;
  const id = idYoutube(link);

  const source = id
    ? {
        html: `<html><body style="margin:0;background:#000"><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${id}?rel=0&playsinline=1" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></body></html>`,
        baseUrl: 'https://www.youtube.com',
      }
    : { uri: urlIncorporada(link) };

  return (
    <Modal visible animationType="slide" onRequestClose={aoFechar}>
      <View style={[local.raiz, { paddingTop: insets.top }]}>
        <View style={local.topo}>
          <Pressable onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar" style={local.fechar}>
            <Ionicons name="chevron-back" size={24} color={cores.azulMarinho} />
          </Pressable>
          <Text style={local.titulo} numberOfLines={1}>{conteudo.titulo}</Text>
        </View>

        <WebView
          source={source}
          style={{ flex: 1 }}
          javaScriptEnabled
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={cores.azulEvolua} />}
        />

        <View style={[local.rodape, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={local.dica}>Não carregou? O site de origem pode não permitir abrir aqui.</Text>
          <Pressable onPress={() => Linking.openURL(link)} accessibilityRole="button">
            <Text style={local.abrirFora}>Abrir no navegador</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const local = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.branco },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  fechar: { padding: 4 },
  titulo: { flex: 1, fontFamily: fontes.titulo, fontSize: 18, color: cores.azulMarinho },
  rodape: { paddingHorizontal: 16, paddingTop: 8, alignItems: 'center', gap: 4, backgroundColor: '#F7F9FC' },
  dica: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, textAlign: 'center' },
  abrirFora: { fontFamily: fontes.botao, fontSize: 13, color: cores.azulProfundo },
});