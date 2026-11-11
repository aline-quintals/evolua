import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, G, Mask, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../../tema';

// Estrelinhas pastel espalhadas pelo céu
function Estrelinhas() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Text style={[styles.estrelinha, { top: 70, left: 26, fontSize: 14, color: cores.amareloPastel }]}>★</Text>
      <Text style={[styles.estrelinha, { top: 110, right: 30, fontSize: 18, color: cores.rosaPastel }]}>★</Text>
      <Text style={[styles.estrelinha, { top: 165, left: 40, fontSize: 11, color: cores.verdeMenta }]}>☆</Text>
      <Text style={[styles.estrelinha, { top: 60, right: 70, fontSize: 11, color: cores.lavanda }]}>☆</Text>
      <Text style={[styles.estrelinha, { top: 205, right: 24, fontSize: 13, color: cores.amareloPastel }]}>★</Text>
      <Text style={[styles.estrelinha, { top: 95, left: 78, fontSize: 10, color: cores.rosaPastel }]}>☆</Text>
      <Text style={[styles.estrelinha, { top: 150, right: 64, fontSize: 12, color: cores.verdeMenta }]}>★</Text>

      {/* Estrelinhas de baixo (tons mais fortes, porque o fundo ali é claro) */}
      <Text style={[styles.estrelinha, { bottom: 38, left: 22, fontSize: 12, color: cores.lilas }]}>★</Text>
      <Text style={[styles.estrelinha, { bottom: 70, right: 26, fontSize: 16, color: cores.rosaPastel }]}>★</Text>
      <Text style={[styles.estrelinha, { bottom: 130, left: 30, fontSize: 11, color: cores.laranja }]}>☆</Text>
      <Text style={[styles.estrelinha, { bottom: 175, right: 40, fontSize: 12, color: cores.verdeAgua }]}>☆</Text>
    </View>
  );
}

// Uma nuvem branca bem redondinha (arredondada em cima e embaixo)
function Nuvem({
  x,
  y,
  escala,
  opacidade = 0.3,
}: {
  x: number;
  y: number;
  escala: number;
  opacidade?: number;
}) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${escala})`} opacity={opacidade}>
      <Circle cx={0} cy={-3} r={17} fill={cores.branco} />
      <Circle cx={-19} cy={2} r={13} fill={cores.branco} />
      <Circle cx={19} cy={2} r={13} fill={cores.branco} />
      <Circle cx={-9} cy={-13} r={12} fill={cores.branco} />
      <Circle cx={10} cy={-14} r={13} fill={cores.branco} />
      <Circle cx={-9} cy={9} r={9} fill={cores.branco} />
      <Circle cx={9} cy={9} r={9} fill={cores.branco} />
    </G>
  );
}

// Lua crescente no meio das nuvens (nuvens atrás da lua) e estrelas
function LuaNuvens() {
  return (
    <View style={styles.luaBox}>
      <Svg width={300} height={150} viewBox="0 0 300 150">
        <Defs>
          <Mask id="corte">
            <Rect x="0" y="0" width="300" height="150" fill="#ffffff" />
            <Circle cx="171" cy="46" r="46" fill="#000000" />
          </Mask>
        </Defs>

        {/* Nuvens atrás da lua */}
        <Nuvem x={70} y={80} escala={1.2} />
        <Nuvem x={150} y={85} escala={1.9} />
        <Nuvem x={230} y={80} escala={1.2} />

        {/* Lua na frente */}
        <Circle cx="150" cy="62" r="50" fill={cores.brancoAzulado} mask="url(#corte)" />
      </Svg>

      {/* Estrelas */}
      <Text style={[styles.estrela, { left: 103, top: 6, fontSize: 11, color: cores.rosaPastel }]}>☆</Text>
      <Text style={[styles.estrela, { left: 151, top: 12, fontSize: 18, color: cores.amareloPastel }]}>★</Text>
      <Text style={[styles.estrela, { left: 193, top: 24, fontSize: 15, color: cores.verdeMenta }]}>☆</Text>
      <Text style={[styles.estrela, { left: 181, top: 46, fontSize: 10, color: cores.branco }]}>★</Text>
      <Text style={[styles.estrela, { left: 222, top: 8, fontSize: 12, color: cores.lavanda }]}>★</Text>
      <Text style={[styles.estrela, { left: 212, top: 44, fontSize: 11, color: cores.amareloPastel }]}>☆</Text>
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [foco, setFoco] = useState<'usuario' | 'senha' | null>(null);

  const entrar = () => {
    // Por enquanto sem validação: só leva para a tela principal
    router.replace('/principal/home');
  };

  return (
    <LinearGradient
      colors={[cores.azulEvolua, cores.azulCeu, cores.azulGelo]}
      locations={[0, 0.45, 1]}
      style={styles.fundo}
    >
      <Estrelinhas />

      <KeyboardAvoidingView
        style={styles.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.conteudo,
            { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <LuaNuvens />

          <Text style={styles.titulo}>Bem vindo(a)!</Text>
          <Text style={styles.subtitulo}>Acesse sua conta</Text>

          {/* Usuário */}
          <View style={[styles.campo, foco === 'usuario' && styles.campoFoco]}>
            <View style={[styles.iconeBolha, { backgroundColor: cores.lavanda }]}>
              <Ionicons name="person" size={22} color={cores.roxoVibrante} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="E-mail ou usuário"
              placeholderTextColor={cores.cinzaAzulado}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={usuario}
              onChangeText={setUsuario}
              onFocus={() => setFoco('usuario')}
              onBlur={() => setFoco(null)}
            />
          </View>

          {/* Senha */}
          <View style={[styles.campo, foco === 'senha' && styles.campoFoco]}>
            <TouchableOpacity
              onPress={() => setMostrarSenha(!mostrarSenha)}
              hitSlop={10}
              accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <View style={[styles.iconeBolha, { backgroundColor: cores.verdeMenta }]}>
                <Ionicons
                  name={mostrarSenha ? 'eye' : 'eye-off'}
                  size={22}
                  color={cores.verdeAgua}
                />
              </View>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="********"
              placeholderTextColor={cores.cinzaAzulado}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              value={senha}
              onChangeText={setSenha}
              onSubmitEditing={entrar}
              onFocus={() => setFoco('senha')}
              onBlur={() => setFoco(null)}
            />
          </View>

          {/* Botão amarelo: tom mais forte no meio */}
          <TouchableOpacity style={styles.botaoWrap} onPress={entrar} activeOpacity={0.85}>
            <LinearGradient
              colors={[cores.amareloPastel, cores.laranjaSuave, cores.amareloPastel]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.botao}
            >
              <Text style={styles.botaoTexto}>Entrar</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Links */}
          <TouchableOpacity onPress={() => router.push('/acesso/recuperar-senha')}>
            <Text style={styles.link}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/acesso/cadastro')}>
            <Text style={styles.link}>Criar conta</Text>
          </TouchableOpacity>

          <Text style={styles.rodape}>Aplicativo criado por NubyTech • 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },

  estrelinha: {
    position: 'absolute',
  },

  conteudo: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  luaBox: {
    width: 300,
    height: 150,
    marginBottom: 20,
  },

  estrela: {
    position: 'absolute',
  },

  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 34,
    color: cores.branco,
    marginBottom: 10,
  },

  subtitulo: {
    fontFamily: fontes.texto,
    fontSize: 20,
    color: cores.brancoAzulado,
    marginBottom: 30,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    height: 62,
    backgroundColor: cores.branco,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    marginBottom: 26,
  },

  campoFoco: {
    borderColor: cores.lilas,
  },

  iconeBolha: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontFamily: fontes.texto,
    fontSize: 20,
    color: cores.azulMarinho,
    // remove o contorno do navegador ao focar (web)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },

  botaoWrap: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    backgroundColor: cores.amareloPastel,
    marginBottom: 32,
    elevation: 5,
  },

  botao: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  botaoTexto: {
    fontFamily: fontes.botao,
    color: cores.branco,
    fontSize: 22,
    letterSpacing: 0.5,
    // sombrinha dourada leve para a letra branca aparecer no amarelo
    textShadowColor: 'rgba(196, 128, 26, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  link: {
    fontFamily: fontes.textoMedio,
    color: cores.roxoVibrante,
    fontSize: 18,
    marginBottom: 18,
  },

  rodape: {
    fontFamily: fontes.texto,
    marginTop: 'auto',
    paddingTop: 30,
    color: cores.roxoVibrante,
    fontSize: 12,
    textAlign: 'center',
  },
});