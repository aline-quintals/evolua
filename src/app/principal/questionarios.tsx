
import React from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ITENS = [
  {
    chave: 'criar',
    titulo: 'Criar uma meta',
    descricao: 'Defina um objetivo e o primeiro passo.',
    icone: 'flag-outline',
    fundo: '#FCEBDD',
    texto: '#604936',
    corIcone: '#C47A3B',
  },
  {
    chave: 'andamento',
    titulo: 'Metas em andamento',
    descricao: 'Acompanhe o que você já começou.',
    icone: 'trending-up-outline',
    fundo: '#E1EFF9',
    texto: '#29465F',
    corIcone: '#2877AE',
  },
  {
    chave: 'habitos',
    titulo: 'Hábitos diários',
    descricao: 'Pequenas ações que se repetem todo dia.',
    icone: 'checkmark-done-outline',
    fundo: '#E8F1E5',
    texto: '#3D5140',
    corIcone: '#628A57',
  },
  {
    chave: 'conquistas',
    titulo: 'Conquistas',
    descricao: 'Celebre tudo o que você já alcançou.',
    icone: 'trophy-outline',
    fundo: '#EEE9F8',
    texto: '#44395E',
    corIcone: '#7A5CC0',
  },
];

export default function Metas() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitulo}>SUA EVOLUÇÃO</Text>

      <Text style={styles.titulo}>Metas e conquistas</Text>

      <Text style={styles.descricao}>
        Crie objetivos e celebre cada conquista, uma de cada vez.
      </Text>

      <View style={styles.mensagem}>
        <Ionicons name="sparkles-outline" size={25} color="#2877AE" />

        <View style={styles.mensagemTexto}>
          <Text style={styles.mensagemTitulo}>
            Cada passo importa!
          </Text>

          <Text style={styles.mensagemDescricao}>
            Pequenas mudanças também fazem parte de grandes transformações.
          </Text>
        </View>
      </View>

      <Text style={styles.tituloLista}>O que deseja acompanhar?</Text>

      {ITENS.map((item) => (
        <Pressable
          key={item.chave}
          style={({ pressed }) => [
            styles.item,
            { backgroundColor: item.fundo },
            pressed && styles.itemPressionado,
          ]}
          onPress={() =>
            Alert.alert(
              item.titulo,
              'Esta funcionalidade estará disponível em breve!'
            )
          }
        >
          <View style={styles.icone}>
            <Ionicons
              name={item.icone as any}
              size={25}
              color={item.corIcone}
            />
          </View>

          <View style={styles.textos}>
            <Text style={[styles.nome, { color: item.texto }]}>
              {item.titulo}
            </Text>

            <Text style={styles.itemDescricao}>
              {item.descricao}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={21}
            color={item.corIcone}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  conteudo: {
    padding: 22,
    paddingBottom: 45,
  },
  subtitulo: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#7193AC',
    marginTop: 15,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#29465F',
    marginTop: 7,
  },
  descricao: {
    fontSize: 14,
    color: '#718394',
    lineHeight: 22,
    marginTop: 9,
    marginBottom: 22,
  },
  mensagem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF3F9',
    padding: 17,
    borderRadius: 17,
    gap: 13,
    marginBottom: 28,
  },
  mensagemTexto: {
    flex: 1,
  },
  mensagemTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#29465F',
    marginBottom: 4,
  },
  mensagemDescricao: {
    fontSize: 12,
    color: '#718394',
    lineHeight: 18,
  },
  tituloLista: {
    fontSize: 17,
    fontWeight: '700',
    color: '#29465F',
    marginBottom: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 17,
    marginBottom: 13,
    gap: 13,
  },
  itemPressionado: {
    opacity: 0.75,
  },
  icone: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: {
    flex: 1,
  },
  nome: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDescricao: {
    fontSize: 12,
    color: '#718394',
    lineHeight: 18,
  },
});
