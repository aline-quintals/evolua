import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../../tema';
import { SECOES, VERSAO_TERMOS, VIGENCIA_TERMOS } from '../../termos';

// Mantido aqui para não quebrar quem já importa VERSAO_TERMOS desta tela (ex.: cadastro).
export { VERSAO_TERMOS };

/* ------------------------------------------------------------------ */
/* Ponte com a tela de cadastro                                        */
/* Os dados ficam só na memória (nunca na URL) até o aceite.           */
/* ------------------------------------------------------------------ */
let cadastroPendente: Record<string, string> | null = null;

export function definirCadastroPendente(dados: Record<string, string> | null): void {
  cadastroPendente = dados;
}
export const lerCadastroPendente = () => cadastroPendente;

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* O texto dos termos e os dados da empresa ficam em src/termos.ts.    */
/*                                                                     */
/* Dois modos:                                                         */
/*  - cadastro (padrão): precisa rolar até o fim e aceitar ou recusar  */
/*  - consulta (?modo=consulta): só leitura, aberto pelas Configurações */
/* ------------------------------------------------------------------ */
export default function TermosDeUso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const consulta = modo === 'consulta';

  const [lido, setLido] = useState(consulta);
  const [recusou, setRecusou] = useState(false);

  const medidas = useRef({ visivel: 0, conteudo: 0 });

  const checarFim = (y: number) => {
    if (consulta) return;
    const { visivel, conteudo } = medidas.current;
    if (visivel > 0 && conteudo > 0 && y + visivel >= conteudo - 24) setLido(true);
  };

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentSize, contentOffset } = e.nativeEvent;
    medidas.current = { visivel: layoutMeasurement.height, conteudo: contentSize.height };
    checarFim(contentOffset.y);
  };

  const aoMedirCaixa = (e: LayoutChangeEvent) => {
    medidas.current.visivel = e.nativeEvent.layout.height;
    checarFim(0);
  };

  const voltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace(consulta ? '/principal/configuracoes' : '/acesso/cadastro');
  };

  const aceitar = () => {
    if (!lido || consulta) return;

    // TODO: aqui entram o envio do cadastro e o registro do aceite no servidor:
    //   dados: lerCadastroPendente()
    //   aceite: { versao: VERSAO_TERMOS, aceitoEmISO: new Date().toISOString() }
    definirCadastroPendente(null);
    // O aviso "Cadastro criado com sucesso" aparece na tela de login.
    router.replace({ pathname: '/acesso/login', params: { cadastro: 'ok' } });
  };

  return (
    <View style={styles.externo}>
      <KeyboardAvoidingView
        style={styles.coluna}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.conteudo, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          {/* Cabeçalho */}
          <Pressable
            onPress={voltar}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={consulta ? 'Voltar' : 'Voltar ao cadastro'}
            style={styles.voltar}
          >
            <Ionicons name="arrow-back" size={26} color={cores.azulMarinho} />
          </Pressable>

          <Text style={styles.marca}>EVOLUA</Text>
          <Text style={styles.titulo} accessibilityRole="header">Termos de Uso e Política de Privacidade</Text>
          <Text style={styles.versao}>Versão {VERSAO_TERMOS} · em vigor a partir de {VIGENCIA_TERMOS}</Text>
          <Text style={styles.instrucao}>
            {consulta
              ? 'Consulte aqui, quando quiser, o documento que você aceitou ao se cadastrar.'
              : 'Leia o documento até o final para poder aceitar e concluir o seu cadastro.'}
          </Text>

          {/* Texto */}
          <View style={styles.caixa} onLayout={aoMedirCaixa}>
            <ScrollView
              onScroll={aoRolar}
              scrollEventThrottle={16}
              onContentSizeChange={(_, h) => {
                medidas.current.conteudo = h;
                checarFim(0);
              }}
              showsVerticalScrollIndicator
              contentContainerStyle={styles.caixaConteudo}
            >
              {SECOES.map((s, i) => (
                <View key={s.titulo} style={styles.secao}>
                  <Text style={styles.secaoTitulo}>{i + 1}. {s.titulo}</Text>
                  {s.paragrafos.map((p, j) => (
                    <Text key={j} style={styles.paragrafo}>{p}</Text>
                  ))}
                </View>
              ))}
              <Text style={styles.fimTexto}>Fim do documento</Text>
            </ScrollView>
          </View>

          {/* Rodapé */}
          {consulta ? (
            <View style={styles.linhaBotoes}>
              <Pressable style={[styles.botao, styles.botaoCheio]} onPress={voltar} accessibilityRole="button">
                <Text style={styles.botaoCheioTexto}>Voltar</Text>
              </Pressable>
            </View>
          ) : recusou ? (
            <View style={styles.recusaCaixa}>
              <Text style={styles.recusaTexto}>
                Sem aceitar os Termos de Uso não é possível criar a conta no Evolua.
              </Text>
              <View style={styles.linhaBotoes}>
                <Pressable style={[styles.botao, styles.botaoContorno]} onPress={() => setRecusou(false)} accessibilityRole="button">
                  <Text style={styles.botaoContornoTexto}>Ler novamente</Text>
                </Pressable>
                <Pressable style={[styles.botao, styles.botaoCheio]} onPress={voltar} accessibilityRole="button">
                  <Text style={styles.botaoCheioTexto}>Voltar ao cadastro</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.dica}>
                {lido ? 'Leitura concluída.' : 'Role até o final do texto para poder aceitar.'}
              </Text>
              <View style={styles.linhaBotoes}>
                <Pressable style={[styles.botao, styles.botaoContorno]} onPress={() => setRecusou(true)} accessibilityRole="button">
                  <Text style={styles.botaoContornoTexto}>Recusar</Text>
                </Pressable>
                <Pressable
                  style={[styles.botao, styles.botaoCheio, !lido && { opacity: 0.45 }]}
                  onPress={aceitar}
                  disabled={!lido}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !lido }}
                >
                  <Text style={styles.botaoCheioTexto}>Aceitar e cadastrar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  externo: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: cores.brancoAzulado,
  },
  coluna: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },

  voltar: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  marca: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    letterSpacing: 3,
    color: cores.cinzaAzulado,
    marginBottom: 4,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 24,
    lineHeight: 30,
    color: cores.azulMarinho,
  },
  versao: {
    fontFamily: fontes.texto,
    fontSize: 13,
    color: cores.cinzaGrafite,
    marginTop: 4,
  },
  instrucao: {
    fontFamily: fontes.texto,
    fontSize: 14,
    lineHeight: 20,
    color: cores.cinzaGrafite,
    marginTop: 10,
    marginBottom: 12,
  },

  caixa: {
    flex: 1,
    minHeight: 180,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    borderRadius: 8,
    overflow: 'hidden',
  },
  caixaConteudo: {
    padding: 16,
  },
  secao: {
    marginBottom: 18,
  },
  secaoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 15,
    color: cores.azulMarinho,
    marginBottom: 6,
  },
  paragrafo: {
    fontFamily: fontes.texto,
    fontSize: 14,
    lineHeight: 21,
    color: cores.cinzaGrafite,
    marginBottom: 8,
  },
  fimTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: cores.cinzaAzulado,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  dica: {
    fontFamily: fontes.texto,
    fontSize: 13,
    color: cores.cinzaGrafite,
    textAlign: 'center',
    marginTop: 12,
  },

  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  botao: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  botaoCheio: {
    backgroundColor: cores.azulMarinho,
  },
  botaoCheioTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 15,
    color: cores.branco,
    textAlign: 'center',
  },
  botaoContorno: {
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.cinzaAzulado,
  },
  botaoContornoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 15,
    color: cores.cinzaGrafite,
    textAlign: 'center',
  },

  recusaCaixa: {
    marginTop: 14,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    backgroundColor: cores.branco,
  },
  recusaTexto: {
    fontFamily: fontes.texto,
    fontSize: 14,
    lineHeight: 20,
    color: cores.azulMarinho,
  },
});