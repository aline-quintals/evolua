import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cores, fontes } from '../tema';
import { urlIncorporada } from './fonteConteudo';

type Props = { conteudo: { titulo: string; link?: string } | null; aoFechar: () => void };

export default function VisualizadorConteudo({ conteudo, aoFechar }: Props) {
  if (!conteudo?.link) return null;
  const link = conteudo.link;

  return (
    <Modal visible animationType="slide" onRequestClose={aoFechar}>
      <View style={local.raiz}>
        <View style={local.topo}>
          <Pressable onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar" style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={24} color={cores.azulMarinho} />
          </Pressable>
          <Text style={local.titulo} numberOfLines={1}>{conteudo.titulo}</Text>
        </View>

        {React.createElement('iframe', {
          src: urlIncorporada(link),
          title: conteudo.titulo,
          allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
          allowFullScreen: true,
          style: { flex: 1, width: '100%', border: 0 },
        })}

        <View style={local.rodape}>
          <Text style={local.dica}>Não carregou? O site de origem pode não permitir abrir aqui.</Text>
          <Pressable onPress={() => window.open(link, '_blank')} accessibilityRole="button">
            <Text style={local.abrirFora}>Abrir em nova aba</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const local = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.branco },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  titulo: { flex: 1, fontFamily: fontes.titulo, fontSize: 18, color: cores.azulMarinho },
  rodape: { padding: 10, alignItems: 'center', gap: 4, backgroundColor: '#F7F9FC' },
  dica: { fontFamily: fontes.texto, fontSize: 12, color: cores.cinzaGrafite, textAlign: 'center' },
  abrirFora: { fontFamily: fontes.botao, fontSize: 13, color: cores.azulProfundo },
});