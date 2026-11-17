
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
import { cores, fontes } from '../../tema';

// Envelope aberto com confirmação verde
function EnvelopeOk() {
  return (
     <Svg width={150} height={123} viewBox="-15 0 180 130"   >
      {/* Aba aberta (fundo) */}
      <Polygon points="0,42 65,2 130,42" fill="#0B5CA8" />

      {/* Papel */}
      <Rect x="25" y="12" width="80" height="70" rx="5" fill="#FDF1DC" />
      <Rect x="36" y="27" width="58" height="6" rx="3" fill="#1F6FD0" />
      <Rect x="36" y="41" width="58" height="6" rx="3" fill="#1F6FD0" />
      <Rect x="36" y="55" width="58" height="6" rx="3" fill="#1F6FD0" />

      {/* Frente do envelope */}
      <Path
        d="M0 42 L65 84 L130 42 L130 108 Q130 116 122 116 L8 116 Q0 116 0 108 Z"
        fill="#6BBBF7"
      />
      <Polygon points="0,110 48,72 58,81 10,118" fill="#1976D2" />
      <Polygon points="130,110 82,72 72,81 120,118" fill="#1976D2" />

      {/* Confirmação verde */}
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

// Estrelinhas pastel decorativas
function Estrelinhas() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Text style={[styles.estrelinha, { top: 54, right: 24, fontSize: 14, color: cores.amareloPastel }]}>★</Text>
      <Text style={[styles.estrelinha, { top: 100, left: 20, fontSize: 11, color: cores.rosaPastel }]}>☆</Text>
      <Text style={[styles.estrelinha, { top: 170, right: 14, fontSize: 12, color: cores.lavanda }]}>☆</Text>
      <Text style={[styles.estrelinha, { bottom: 140, right: 12, fontSize: 12, color: cores.laranja }]}>☆</Text>
      <Text style={[styles.estrelinha, { bottom: 90, left: 14, fontSize: 13, color: cores.lilas }]}>★</Text>
      <Text style={[styles.estrelinha, { bottom: 40, right: 24, fontSize: 14, color: cores.verdeAgua }]}>★</Text>
    </View>
  );
}

export default function LinkEnviado() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const irParaLogin = () => router.replace('/acesso/login');

  return (
    <View style={styles.externo}>
      <LinearGradient
        colors={[cores.azulEvolua, cores.azulCeu, cores.azulGelo]}
        locations={[0, 0.45, 1]}
        style={styles.coluna}
      >
        <Estrelinhas />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.conteudo,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Voltar para o login */}
          <View style={styles.linhaVoltar}>
            <TouchableOpacity
              onPress={irParaLogin}
              hitSlop={12}
              accessibilityLabel="Voltar para o login"
            >
              <Ionicons
                name="arrow-back"
                size={36}
                color={cores.branco}
              />
            </TouchableOpacity>
          </View>

          {/* Conteúdo central */}
          <View style={styles.centro}>
            <View style={styles.envelopeContainer}>
               <EnvelopeOk />
            </View>

            <Text style={styles.titulo}>
              Link enviado!
            </Text>

            <Text style={styles.subtitulo}>
              Confira o seu e-mail para redefinir sua senha.
            </Text>

            {/* Botão */}
            <TouchableOpacity
              style={styles.botaoWrap}
              onPress={irParaLogin}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[
                  cores.amareloPastel,
                  cores.laranjaSuave,
                  cores.amareloPastel,
                ]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.botao}
              >
                <Text style={styles.botaoTexto}>
                  Voltar para o Login
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Rodapé */}
          <Text style={styles.rodape}>
            Aplicativo criado por NubyTech • 2026
          </Text>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  externo: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: cores.azulMarinho,
  },

  coluna: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
  },

  estrelinha: {
    position: 'absolute',
  },

  envelopeContainer: {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
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
    fontFamily: fontes.titulo,
    fontSize: 38,
    lineHeight: 46,
    color: cores.branco,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 24,
    marginBottom: 12,
  },

  subtitulo: {
    fontFamily: fontes.texto,
    fontSize: 18,
    lineHeight: 26,
    color: cores.brancoAzulado,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 36,
  },

  botaoWrap: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 14,
    backgroundColor: cores.amareloPastel,
    elevation: 5,
  },

  botao: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoTexto: {
    fontFamily: fontes.botao,
    color: cores.branco,
    fontSize: 20,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(196, 128, 26, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  rodape: {
    fontFamily: fontes.texto,
    marginTop: 'auto',
    paddingTop: 30,
    color: cores.branco,
    fontSize: 12,
    textAlign: 'center',
  },
});
