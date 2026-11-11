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
import { cores, fontes } from '../../tema';

const COR_ERRO = '#B3261E';

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

// Caractere especial = qualquer coisa que não seja letra, número ou espaço
const TEM_ESPECIAL = /[^A-Za-z0-9À-ÿ\s]/;

type Dados = {
  nome: string;
  apelido: string;
  telefone: string;
  email: string;
  nascimento: string;
  usuario: string;
  senha: string;
  repetir: string;
};

function validar(d: Dados): string {
  if (d.nome.trim().split(/\s+/).length < 2) return 'Digite seu nome completo.';
  if (d.apelido.trim().length < 2) return 'Diga como você gostaria de ser chamado(a).';
  if (d.telefone.replace(/\D/g, '').length < 10) return 'Digite um telefone válido, com DDD.';
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return 'Digite um e-mail válido.';
  if (!dataValida(d.nascimento)) return 'Digite uma data de nascimento válida (dd/mm/aaaa).';
  if (d.usuario.trim().length < 3 || /\s/.test(d.usuario)) {
    return 'O usuário precisa ter pelo menos 3 letras, sem espaços.';
  }
  if (d.senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (!TEM_ESPECIAL.test(d.senha)) {
    return 'A senha precisa ter pelo menos 1 caractere especial (ex.: ! @ # $ %).';
  }
  if (d.senha !== d.repetir) return 'As senhas não são iguais.';
  return '';
}

/* ------------------------------------------------------------------ */
/* Verificação de usuário (SIMULADA)                                   */
/* ------------------------------------------------------------------ */
type StatusUsuario = 'nenhum' | 'verificando' | 'disponivel' | 'existe' | 'erro';

// Por enquanto não há servidor: usamos uma lista de teste.
// Quando houver, troque o corpo desta função por uma chamada ao servidor, por exemplo:
//   const r = await fetch(`https://SEU-SERVIDOR/usuarios/existe?usuario=${usuario}`);
//   const json = await r.json();
//   return json.existe;
const USUARIOS_EXISTENTES = ['admin', 'evolua', 'teste', 'nubytech'];

async function usuarioJaExiste(usuario: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return USUARIOS_EXISTENTES.includes(usuario.trim().toLowerCase());
}

/* ------------------------------------------------------------------ */
/* Campos da tela                                                      */
/* ------------------------------------------------------------------ */
type IconeNome = ComponentProps<typeof Ionicons>['name'];

type Config = {
  chave: keyof Dados;
  icone: IconeNome;
  fundoIcone: string;
  corIcone: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words';
  senha?: boolean;
  maxLength?: number;
  mascara?: (v: string) => string;
};

const CAMPOS: Config[] = [
  {
    chave: 'nome',
    icone: 'person',
    fundoIcone: cores.azulCeu,
    corIcone: cores.azulProfundo,
    placeholder: 'NOME COMPLETO',
    autoCapitalize: 'words',
  },
  {
    chave: 'apelido',
    icone: 'happy',
    fundoIcone: cores.amareloPastel,
    corIcone: cores.laranja,
    placeholder: 'COMO QUER SER CHAMADO(A)?',
    autoCapitalize: 'words',
    maxLength: 20,
  },
  {
    chave: 'telefone',
    icone: 'phone-portrait',
    fundoIcone: cores.lavanda,
    corIcone: cores.roxo,
    placeholder: '(11) 9XXXX-XXXX',
    keyboardType: 'phone-pad',
    mascara: mascaraTelefone,
  },
  {
    chave: 'email',
    icone: 'mail',
    fundoIcone: cores.verdeMenta,
    corIcone: cores.verdeAgua,
    placeholder: 'E-MAIL',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
  },
  {
    chave: 'nascimento',
    icone: 'calendar',
    fundoIcone: cores.azulGelo,
    corIcone: cores.azulEvolua,
    placeholder: 'DATA DE NASCIMENTO',
    keyboardType: 'number-pad',
    mascara: mascaraData,
  },
  {
    chave: 'usuario',
    icone: 'id-card',
    fundoIcone: cores.azulCeu,
    corIcone: cores.azulProfundo,
    placeholder: 'USUÁRIO',
    autoCapitalize: 'none',
  },
  {
    chave: 'senha',
    icone: 'lock-closed',
    fundoIcone: cores.rosaPastel,
    corIcone: cores.rosaVibrante,
    placeholder: 'SENHA',
    senha: true,
  },
  {
    chave: 'repetir',
    icone: 'lock-closed',
    fundoIcone: cores.rosaPastel,
    corIcone: cores.rosaVibrante,
    placeholder: 'REPETIR SENHA',
    senha: true,
  },
];

type CampoProps = TextInputProps & {
  icone: IconeNome;
  fundoIcone: string;
  corIcone: string;
  inputRef?: (r: TextInput | null) => void;
};

function Campo({
  icone,
  fundoIcone,
  corIcone,
  inputRef,
  value,
  onFocus,
  onBlur,
  ...resto
}: CampoProps) {
  const [foco, setFoco] = useState(false);

  return (
    <View style={[styles.campo, foco && styles.campoFoco]}>
      <View style={[styles.badge, { backgroundColor: fundoIcone }]}>
        <Ionicons name={icone} size={24} color={corIcone} />
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        placeholderTextColor={cores.cinzaAzulado}
        autoCorrect={false}
        style={[styles.input, { letterSpacing: value ? 0.3 : 1 }]}
        onFocus={(e) => {
          setFoco(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFoco(false);
          onBlur?.(e);
        }}
        {...resto}
      />
    </View>
  );
}

// Uma regra da senha, com marcação quando cumprida
function RegraSenha({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <View style={styles.regra}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={ok ? cores.verdeAgua : cores.cinzaAzulado}
      />
      <Text style={[styles.regraTexto, ok && { color: cores.verdeAgua }]}>{texto}</Text>
    </View>
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

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */
export default function Cadastro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [dados, setDados] = useState<Dados>({
    nome: '',
    apelido: '',
    telefone: '',
    email: '',
    nascimento: '',
    usuario: '',
    senha: '',
    repetir: '',
  });
  const [erro, setErro] = useState('');
  const [statusUsuario, setStatusUsuario] = useState<StatusUsuario>('nenhum');
  const [enviando, setEnviando] = useState(false);

  const refs = useRef<(TextInput | null)[]>([]);
  const ultimoVerificado = useRef('');

  const senhaTem8 = dados.senha.length >= 8;
  const senhaTemEspecial = TEM_ESPECIAL.test(dados.senha);

  const atualizar = (chave: keyof Dados, valor: string) => {
    setDados((d) => ({ ...d, [chave]: valor }));
    setErro('');

    // Mudou o usuário: a verificação anterior não vale mais
    if (chave === 'usuario') {
      ultimoVerificado.current = '';
      setStatusUsuario('nenhum');
    }
  };

  const voltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/acesso/login');
  };

  // Verifica se o usuário já existe
  const verificarUsuario = async (): Promise<StatusUsuario> => {
    const nome = dados.usuario.trim();
    if (nome.length < 3 || /\s/.test(nome)) return 'nenhum';

    ultimoVerificado.current = nome;
    setStatusUsuario('verificando');

    try {
      const existe = await usuarioJaExiste(nome);
      // Se a pessoa mudou o texto enquanto verificava, ignora este resultado
      if (ultimoVerificado.current !== nome) return 'nenhum';
      const novo: StatusUsuario = existe ? 'existe' : 'disponivel';
      setStatusUsuario(novo);
      return novo;
    } catch {
      setStatusUsuario('erro');
      return 'erro';
    }
  };

  const cadastrar = async () => {
    if (enviando) return;

    const mensagem = validar(dados);
    if (mensagem) {
      setErro(mensagem);
      return;
    }

    setEnviando(true);

    let status = statusUsuario;
    if (status !== 'disponivel') status = await verificarUsuario();

    if (status === 'existe') {
      setErro('Esse usuário já existe. Escolha outro.');
      setEnviando(false);
      return;
    }
    if (status !== 'disponivel') {
      setErro('Não foi possível verificar o usuário agora. Tente novamente.');
      setEnviando(false);
      return;
    }

    // TODO: aqui entra o envio dos dados para o servidor.
    // Por enquanto, só leva para o login.
    setEnviando(false);
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
                <Ionicons name="arrow-back" size={36} color={cores.branco} />
              </TouchableOpacity>
            </View>

            <Text style={styles.titulo}>Criar nova conta</Text>
            <Text style={styles.subtitulo}>Preencha seus dados para continuar</Text>

            {/* Campos */}
            <View style={styles.formulario}>
              {CAMPOS.map((c, i) => {
                const ultimo = i === CAMPOS.length - 1;
                return (
                  <View key={c.chave}>
                    <Campo
                      icone={c.icone}
                      fundoIcone={c.fundoIcone}
                      corIcone={c.corIcone}
                      placeholder={c.placeholder}
                      value={dados[c.chave]}
                      onChangeText={(t) =>
                        atualizar(c.chave, c.mascara ? c.mascara(t) : t)
                      }
                      keyboardType={c.keyboardType}
                      autoCapitalize={c.autoCapitalize ?? 'none'}
                      secureTextEntry={c.senha}
                      maxLength={c.maxLength}
                      inputRef={(r) => {
                        refs.current[i] = r;
                      }}
                      returnKeyType={ultimo ? 'done' : 'next'}
                      submitBehavior={ultimo ? 'blurAndSubmit' : 'submit'}
                      onSubmitEditing={() =>
                        ultimo ? cadastrar() : refs.current[i + 1]?.focus()
                      }
                      onBlur={
                        c.chave === 'usuario' && statusUsuario === 'nenhum'
                          ? () => {
                              verificarUsuario();
                            }
                          : undefined
                      }
                    />

                    {/* Resultado da verificação do usuário */}
                    {c.chave === 'usuario' && statusUsuario !== 'nenhum' ? (
                      <View style={styles.aviso}>
                        {statusUsuario === 'verificando' && (
                          <Text style={[styles.avisoTexto, { color: cores.cinzaGrafite }]}>
                            Verificando usuário...
                          </Text>
                        )}
                        {statusUsuario === 'disponivel' && (
                          <Text style={[styles.avisoTexto, { color: cores.verdeAgua }]}>
                            ✓ Usuário disponível
                          </Text>
                        )}
                        {statusUsuario === 'existe' && (
                          <Text style={[styles.avisoTexto, { color: COR_ERRO }]}>
                            Esse usuário já existe. Escolha outro.
                          </Text>
                        )}
                        {statusUsuario === 'erro' && (
                          <Text style={[styles.avisoTexto, { color: cores.cinzaGrafite }]}>
                            Não foi possível verificar agora. Tente de novo.
                          </Text>
                        )}
                      </View>
                    ) : null}

                    {/* Regras da senha */}
                    {c.chave === 'senha' ? (
                      <View style={styles.aviso}>
                        <RegraSenha ok={senhaTem8} texto="Pelo menos 8 caracteres" />
                        <RegraSenha
                          ok={senhaTemEspecial}
                          texto="Pelo menos 1 caractere especial (! @ # $ %)"
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* Mensagem de erro */}
            {erro ? (
              <View style={styles.erroCaixa}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            {/* Botão amarelo: tom mais forte no meio */}
            <TouchableOpacity
              style={[styles.botaoWrap, enviando && { opacity: 0.7 }]}
              onPress={cadastrar}
              activeOpacity={0.85}
              disabled={enviando}
            >
              <LinearGradient
                colors={[cores.amareloPastel, cores.laranjaSuave, cores.amareloPastel]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.botao}
              >
                <Text style={styles.botaoTexto}>
                  {enviando ? 'Verificando...' : 'Cadastrar'}
                </Text>
              </LinearGradient>
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
    marginBottom: 22,
  },

  formulario: {
    width: '100%',
    maxWidth: 340,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    // remove o contorno do navegador ao focar (web)
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },

  // Quadrinho de aviso embaixo de um campo (usuário e regras da senha)
  aviso: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: -6,
    marginBottom: 14,
  },
  avisoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
  },

  regra: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  regraTexto: {
    fontFamily: fontes.texto,
    fontSize: 13,
    color: cores.cinzaGrafite,
    marginLeft: 8,
  },

  erroCaixa: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 2,
    marginBottom: 6,
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
    marginTop: 14,
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
    // sombrinha dourada leve para a letra branca aparecer no amarelo
    textShadowColor: 'rgba(196, 128, 26, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  rodape: {
    fontFamily: fontes.texto,
    marginTop: 'auto',
    paddingTop: 18,
    color: cores.roxoVibrante,
    fontSize: 12,
    textAlign: 'center',
  },
});