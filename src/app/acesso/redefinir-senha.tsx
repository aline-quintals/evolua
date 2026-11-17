
import { useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../../tema';

const COR_ERRO = '#B3261E';

// Regra da tela: 8 caracteres e pelo menos 1 caractere especial
function validar(senha: string, repetir: string): string {
  if (senha.length < 8) {
    return 'A senha precisa ter pelo menos 8 caracteres.';
  }

  if (!/[^A-Za-z0-9]/.test(senha)) {
    return 'A senha precisa ter pelo menos 1 caractere especial (por exemplo ! @ # $).';
  }

  if (senha !== repetir) {
    return 'As senhas não são iguais.';
  }

  return '';
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

type CampoSenhaProps = {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  inputRef?: (r: TextInput | null) => void;
  ultimo?: boolean;
  onSubmit: () => void;
  foco: boolean;
  onFocus: () => void;
  onBlur: () => void;
};

function CampoSenha({
  placeholder,
  value,
  onChangeText,
  inputRef,
  ultimo,
  onSubmit,
  foco,
  onFocus,
  onBlur,
}: CampoSenhaProps) {
  return (
    <View style={[styles.campo, foco && styles.campoFoco]}>
      <View style={styles.badge}>
<Ionicons
  name="lock-closed"
  size={24}
  color={cores.rosaVibrante}
/>
      </View>

      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={cores.cinzaAzulado}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={ultimo ? 'done' : 'next'}
        submitBehavior={ultimo ? 'blurAndSubmit' : 'submit'}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
}

export default function RedefinirSenha() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [erro, setErro] = useState('');
  const [focoSenha, setFocoSenha] = useState(false);
  const [focoRepetir, setFocoRepetir] = useState(false);

  const campoRepetir = useRef<TextInput | null>(null);

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/acesso/login');
    }
  };

  const alterar = () => {
    const mensagem = validar(senha, repetir);

    if (mensagem) {
      setErro(mensagem);
      return;
    }

    // TODO: enviar a nova senha ao servidor junto com o token do e-mail.
    router.replace('/acesso/login');
  };

  return (
    <View style={styles.externo}>
      <LinearGradient
        colors={[cores.azulEvolua, cores.azulCeu, cores.azulGelo]}
        locations={[0, 0.45, 1]}
        style={styles.coluna}
      >
        <Estrelinhas />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.conteudo,
              {
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.linhaVoltar}>
              <TouchableOpacity
                onPress={voltar}
                hitSlop={12}
                accessibilityLabel="Voltar"
              >
                <Ionicons
                  name="arrow-back"
                  size={36}
                  color={cores.branco}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.titulo}>
              Mude sua senha
            </Text>

            <Text style={styles.subtitulo}>
              Crie uma nova senha com pelo menos 8 caracteres e 1 caractere especial.
            </Text>

            <View style={styles.formulario}>
              <CampoSenha
                placeholder="NOVA SENHA"
                value={senha}
                onChangeText={(t) => {
                  setSenha(t);
                  setErro('');
                }}
                onSubmit={() => campoRepetir.current?.focus()}
                foco={focoSenha}
                onFocus={() => setFocoSenha(true)}
                onBlur={() => setFocoSenha(false)}
              />

              <CampoSenha
                placeholder="REPETIR SENHA"
                value={repetir}
                onChangeText={(t) => {
                  setRepetir(t);
                  setErro('');
                }}
                inputRef={(r) => {
                  campoRepetir.current = r;
                }}
                ultimo
                onSubmit={alterar}
                foco={focoRepetir}
                onFocus={() => setFocoRepetir(true)}
                onBlur={() => setFocoRepetir(false)}
              />
            </View>

            {erro ? (
              <View style={styles.erroCaixa}>
                <Text style={styles.erroTexto}>
                  {erro}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.botaoWrap}
              onPress={alterar}
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
                  Alterar senha
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.rodape}>
              Aplicativo criado por NubyTech • 2026
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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

  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 38,
    lineHeight: 46,
    color: cores.branco,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 12,
  },

  subtitulo: {
    fontFamily: fontes.texto,
    fontSize: 18,
    lineHeight: 26,
    color: cores.brancoAzulado,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 30,
  },

  formulario: {
    width: '100%',
    maxWidth: 340,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 54,
    backgroundColor: cores.branco,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 16,
  },

  campoFoco: {
    borderColor: cores.lilas,
  },

badge: {
  width: 46,
  height: 46,
  borderRadius: 23,
  marginLeft: 2,
  backgroundColor: cores.rosaPastel,
  alignItems: 'center',
  justifyContent: 'center',
},

  input: {
    flex: 1,
    height: 50,
    marginLeft: 12,
    paddingRight: 16,
    fontFamily: fontes.texto,
    fontSize: 15,
    color: cores.azulMarinho,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none' } as object)
      : {}),
  },

  erroCaixa: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 0,
  },

  erroTexto: {
    fontFamily: fontes.textoMedio,
    color: COR_ERRO,
    fontSize: 14,
    textAlign: 'center',
  },

  botaoWrap: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 14,
    backgroundColor: cores.amareloPastel,
    marginTop: 24,
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
    fontSize: 22,
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
