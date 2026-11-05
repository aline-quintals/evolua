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

const AZUL_BADGE = '#4D63E8';
const AZUL_BOTAO = '#4D63E8';

// Regra da tela: 8 caracteres e pelo menos 1 caractere especial
function validar(senha: string, repetir: string): string {
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (!/[^A-Za-z0-9]/.test(senha)) {
    return 'A senha precisa ter pelo menos 1 caractere especial (por exemplo ! @ # $).';
  }
  if (senha !== repetir) return 'As senhas não são iguais.';
  return '';
}

type CampoSenhaProps = {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  inputRef?: (r: TextInput | null) => void;
  ultimo?: boolean;
  onSubmit: () => void;
};

function CampoSenha({
  placeholder,
  value,
  onChangeText,
  inputRef,
  ultimo,
  onSubmit,
}: CampoSenhaProps) {
  return (
    <View style={styles.campo}>
      <View style={styles.badge}>
        <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
      </View>
      <TextInput
        ref={inputRef}
        style={[styles.input, { letterSpacing: value ? 0.5 : 2 }]}
        placeholder={placeholder}
        placeholderTextColor="#B5B5BE"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        returnKeyType={ultimo ? 'done' : 'next'}
        submitBehavior={ultimo ? 'blurAndSubmit' : 'submit'}
        onSubmitEditing={onSubmit}
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
  const campoRepetir = useRef<TextInput | null>(null);

  const voltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/acesso/login');
  };

  const alterar = () => {
    const mensagem = validar(senha, repetir);
    if (mensagem) {
      setErro(mensagem);
      return;
    }

    // TODO: aqui entra o envio da nova senha para o servidor
    // (junto com o código/token que vem no link do e-mail).
    // Por enquanto, só leva para o login.
    router.replace('/acesso/login');
  };

  return (
    <View style={styles.externo}>
      <LinearGradient
        colors={['#4A74B5', '#A7C4EB', '#4A74B5']}
        locations={[0, 0.5, 1]}
        style={styles.coluna}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.conteudo,
              { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 },
            ]}
          >
            {/* Voltar */}
            <View style={styles.linhaVoltar}>
              <TouchableOpacity
                onPress={voltar}
                hitSlop={12}
                accessibilityLabel="Voltar"
              >
                <Ionicons name="arrow-back" size={38} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.titulo}>Mude sua senha</Text>

            <Text style={styles.subtitulo}>
              Crie uma nova senha com 8 caracteres e pelo menos 1 caractere
              especial.
            </Text>

            {/* Campos */}
            <View style={styles.formulario}>
              <CampoSenha
                placeholder="NOVA SENHA"
                value={senha}
                onChangeText={(t) => {
                  setSenha(t);
                  setErro('');
                }}
                onSubmit={() => campoRepetir.current?.focus()}
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
              />
            </View>

            {/* Mensagem de erro */}
            {erro ? (
              <View style={styles.erroCaixa}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            {/* Botão */}
            <TouchableOpacity
              style={styles.botao}
              onPress={alterar}
              activeOpacity={0.85}
            >
              <Text style={styles.botaoTexto}>ALTERAR</Text>
            </TouchableOpacity>

            <Text style={styles.rodape}>Aplicativo criado por NubyTech • 2026</Text>
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

  titulo: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 56,
  },

  subtitulo: {
    fontSize: 20,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 36,
  },

  formulario: {
    width: '100%',
    maxWidth: 340,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    marginBottom: 16,
  },

  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: AZUL_BADGE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    height: 52,
    marginLeft: 14,
    paddingRight: 16,
    fontSize: 15,
    color: '#2B2F45',
    // remove o contorno azul do navegador ao focar (web)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },

  erroCaixa: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 2,
  },
  erroTexto: {
    color: '#B3261E',
    fontSize: 14,
    textAlign: 'center',
  },

  botao: {
    width: '100%',
    maxWidth: 340,
    height: 52,
    backgroundColor: AZUL_BOTAO,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 46,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  rodape: {
    marginTop: 'auto',
    paddingTop: 30,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});