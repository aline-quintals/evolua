import { ComponentProps, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  TextInputProps,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AZUL_BADGE = '#4D63E8';
const AZUL_BOTAO = '#4D63E8';

/* ------------------------------------------------------------------ */
/* Máscaras e validações                                               */
/* ------------------------------------------------------------------ */
const mascaraTelefone = (v: string) => {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length === 0) return '';
  if (n.length <= 2) return `(${n}`;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};

const mascaraData = (v: string) => {
  const n = v.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
};

function dataValida(texto: string) {
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  const data = new Date(ano, mes - 1, dia);
  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia &&
    ano >= 1900 &&
    data <= new Date()
  );
}

type Dados = {
  nome: string;
  telefone: string;
  email: string;
  nascimento: string;
  usuario: string;
  senha: string;
  repetir: string;
};

function validar(d: Dados): string {
  if (d.nome.trim().split(/\s+/).length < 2) return 'Digite seu nome completo.';
  if (d.telefone.replace(/\D/g, '').length < 10) return 'Digite um telefone válido, com DDD.';
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return 'Digite um e-mail válido.';
  if (!dataValida(d.nascimento)) return 'Digite uma data de nascimento válida (dd/mm/aaaa).';
  if (d.usuario.trim().length < 3 || /\s/.test(d.usuario)) {
    return 'O usuário precisa ter pelo menos 3 letras, sem espaços.';
  }
  if (d.senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (d.senha !== d.repetir) return 'As senhas não são iguais.';
  return '';
}

/* ------------------------------------------------------------------ */
/* Campos da tela                                                      */
/* ------------------------------------------------------------------ */
type IconeNome = ComponentProps<typeof Ionicons>['name'];

type Config = {
  chave: keyof Dados;
  icone: IconeNome;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words';
  senha?: boolean;
  mascara?: (v: string) => string;
};

const CAMPOS: Config[] = [
  { chave: 'nome', icone: 'person', placeholder: 'NOME COMPLETO', autoCapitalize: 'words' },
  {
    chave: 'telefone',
    icone: 'phone-portrait',
    placeholder: '(11) 9XXXX-XXXX',
    keyboardType: 'phone-pad',
    mascara: mascaraTelefone,
  },
  {
    chave: 'email',
    icone: 'mail',
    placeholder: 'E-MAIL',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  {
    chave: 'nascimento',
    icone: 'calendar',
    placeholder: 'DATA DE NASCIMENTO',
    keyboardType: 'number-pad',
    mascara: mascaraData,
  },
  { chave: 'usuario', icone: 'id-card', placeholder: 'USUÁRIO', autoCapitalize: 'none' },
  { chave: 'senha', icone: 'lock-closed', placeholder: 'SENHA', senha: true },
  { chave: 'repetir', icone: 'lock-closed', placeholder: 'REPETIR SENHA', senha: true },
];

type CampoProps = TextInputProps & {
  icone: IconeNome;
  inputRef?: (r: TextInput | null) => void;
};

function Campo({ icone, inputRef, value, ...resto }: CampoProps) {
  return (
    <View style={styles.campo}>
      <View style={styles.badge}>
        <Ionicons name={icone} size={28} color="#FFFFFF" />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        placeholderTextColor="#B5B5BE"
        autoCorrect={false}
        style={[styles.input, { letterSpacing: value ? 0.5 : 2 }]}
        {...resto}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */
export default function Cadastro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [dados, setDados] = useState<Dados>({
    nome: '',
    telefone: '',
    email: '',
    nascimento: '',
    usuario: '',
    senha: '',
    repetir: '',
  });
  const [erro, setErro] = useState('');
  const refs = useRef<(TextInput | null)[]>([]);

  const atualizar = (chave: keyof Dados, valor: string) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    setErro('');
  };

  const voltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/acesso/login');
  };

  const cadastrar = () => {
    const mensagem = validar(dados);
    if (mensagem) {
      setErro(mensagem);
      return;
    }

    // TODO: aqui entra o envio dos dados para o servidor.
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

            <Text style={styles.titulo}>Criar nova conta</Text>
            <Text style={styles.subtitulo}>Preencha seus dados para continuar</Text>

            {/* Campos */}
            <View style={styles.formulario}>
              {CAMPOS.map((c, i) => {
                const ultimo = i === CAMPOS.length - 1;
                return (
                  <Campo
                    key={c.chave}
                    icone={c.icone}
                    placeholder={c.placeholder}
                    value={dados[c.chave]}
                    onChangeText={(t) =>
                      atualizar(c.chave, c.mascara ? c.mascara(t) : t)
                    }
                    keyboardType={c.keyboardType}
                    autoCapitalize={c.autoCapitalize ?? 'none'}
                    secureTextEntry={c.senha}
                    inputRef={(r) => {
                      refs.current[i] = r;
                    }}
                    returnKeyType={ultimo ? 'done' : 'next'}
                    submitBehavior={ultimo ? 'blurAndSubmit' : 'submit'}
                    onSubmitEditing={() =>
                      ultimo ? cadastrar() : refs.current[i + 1]?.focus()
                    }
                  />
                );
              })}
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
              onPress={cadastrar}
              activeOpacity={0.85}
            >
              <Text style={styles.botaoTexto}>Cadastrar</Text>
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
    maxWidth: 300,
    marginBottom: 14,
  },

  subtitulo: {
    fontSize: 20,
    lineHeight: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 22,
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
    marginBottom: 6,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  rodape: {
    marginTop: 'auto',
    paddingTop: 18,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
});