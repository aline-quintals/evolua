import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AZUL_BOTAO = '#4D63E8';

// Envelope aberto com o "certo" verde
function EnvelopeOk() {
  return (
    <Svg width={150} height={123} viewBox="0 0 180 130">
      {/* aba aberta (fundo) */}
      <Polygon points="0,42 65,2 130,42" fill="#0B5CA8" />

      {/* papel */}
      <Rect x="25" y="12" width="80" height="70" rx="5" fill="#FDF1DC" />
      <Rect x="36" y="27" width="58" height="6" rx="3" fill="#1F6FD0" />
      <Rect x="36" y="41" width="58" height="6" rx="3" fill="#1F6FD0" />
      <Rect x="36" y="55" width="58" height="6" rx="3" fill="#1F6FD0" />

      {/* frente do envelope */}
      <Path
        d="M0 42 L65 84 L130 42 L130 108 Q130 116 122 116 L8 116 Q0 116 0 108 Z"
        fill="#6BBBF7"
      />
      <Polygon points="0,110 48,72 58,81 10,118" fill="#1976D2" />
      <Polygon points="130,110 82,72 72,81 120,118" fill="#1976D2" />

      {/* certo verde */}
      <Path
        d="M64 80 L86 103 L158 44"
        fill="none"
        stroke="#2F9A33"
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M64 80 L86 103 L158 44"
        fill="none"
        stroke="#4CC24A"
        strokeWidth={15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function LinkEnviado() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const irParaLogin = () => router.replace('/acesso/login');

  return (
    <View style={styles.externo}>
      <LinearGradient
        colors={['#4A74B5', '#A7C4EB', '#4A74B5']}
        locations={[0, 0.5, 1]}
        style={styles.coluna}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.conteudo,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* Seta: volta para o login */}
          <View style={styles.linhaVoltar}>
            <TouchableOpacity
              onPress={irParaLogin}
              hitSlop={12}
              accessibilityLabel="Voltar para o login"
            >
              <Ionicons name="arrow-back" size={38} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.centro}>
            <EnvelopeOk />

            <Text style={styles.titulo}>Link enviado!</Text>

            <Text style={styles.subtitulo}>
              Confira o seu e-mail para redefinir sua senha.
            </Text>

            <TouchableOpacity
              style={styles.botao}
              onPress={irParaLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.botaoTexto}>Voltar para o Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.rodape}>Aplicativo criado por NubyTech • 2026</Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  // Na web, em janela larga, vira uma coluna centralizada (como no celular)
  externo: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1F3558',
  },
  coluna: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },

  conteudo: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  linhaVoltar: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  centro: {
    width: '100%',
    alignItems: 'center',
    marginTop: 80,
  },

  titulo: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 24,
    marginBottom: 14,
  },

  subtitulo: {
    fontSize: 20,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 56,
  },

  botao: {
    width: '100%',
    maxWidth: 340,
    height: 52,
    backgroundColor: AZUL_BOTAO,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  rodape: {
    marginTop: 'auto',
    paddingTop: 30,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});