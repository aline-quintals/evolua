import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { router, useNavigation, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { cores, fontes } from '../../tema';

import {
  Genero,
  PerfilUsuario,
  EmocaoChave,
  RegistroCheckin,
  StatusNotificacao,
  Notificacao,
  EstadoEvolua,
  TelaInterna,
  IconeNome,
  PADDING_CARTAO,
  BP_DESKTOP,
  useLayoutInfo,
  SOMBRA,
  EMOCOES,
  FRASES_MOTIVACIONAIS,
  avisar,
  useTecladoVisivel,
  PERFIL_PADRAO,
  horasAtrasISO,
  NOTIFICACOES_EXEMPLO,
  estadoAtual,
  ouvintesEstado,
  ouvintesCheckin,
  ouvintesPerfil,
  ouvintesNotificacoes,
  definirEstado,
  lerEstadoEvolua,
  useEvolua,
  inicializarDadosEvolua,
  atualizarPerfil,
  definirStatusNotificacao,
  aoSalvarCheckin,
  aoMudarPerfil,
  aoMudarNotificacoes,
  salvarCheckin,
  FiltroCheckins,
  filtrarCheckins,
  useCheckins,
  senhaLocal,
  senhaAtualCorreta,
  definirSenhaLocal,
  excluirContaLocal,
  gerarId,
  dataLocalISO,
  formatarDataNascimento,
  mascararData,
  mascararTelefone,
  dataBRparaISO,
  formatarDataNotificacao,
  fraseDoDia,
  GENEROS,
  emailValido,
  telefoneValido,
  TAMANHO_MAX_FOTO,
  ChaveAtividade,
  ROTAS_ATIVIDADES,
  abrirAtividade,
  Avatar,
  BotaoDestaque,
  BotaoSalvarDia,
  BotaoSecundario,
  BotaoVoltar,
  PropsCabecalho,
  Cabecalho,
  ItemMenu,
  BotaoMenu,
  MenuInferior,
  PropsDeslizador,
  TAMANHO_BOLINHA,
  DeslizadorDiscreto,
  RostoEmocao,
  EscalaNumerica,
  CheckinEmocional,
  AtividadeHome,
  ATIVIDADES_HOME,
  CartaoAtividadeHome,
  GradeAtividades,
  CarrosselAtividades,
  TelaHome,
  CartaoAtividadePerfil,
  TelaPerfil,
  estilos
} from './compartilhado';

type AvisoConfig = { tipo: 'ok' | 'erro'; texto: string };

function Campo({ rotulo, meia, ...props }: { rotulo: string; meia?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={[{ marginBottom: 12 }, meia && { flex: 1 }]}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      <TextInput style={estilos.campo} placeholderTextColor={cores.cinzaAzulado} accessibilityLabel={rotulo} {...props} />
    </View>
  );
}

/**
 * Campo da FOTO: escolher imagem da galeria do celular ou, na web, do computador
 * (o mesmo seletor abre o explorador de arquivos) e ARRASTAR E SOLTAR (só web).
 * A foto só vale depois de "Salvar alterações".
 */
function CampoFoto({ uri, onChange, onErro }: { uri: string | null; onChange: (u: string | null) => void; onErro: (t: string) => void }) {
  const [arrastando, setArrastando] = useState(false);

  const aplicarUri = (u: string, tamanho?: number) => {
    if (tamanho && tamanho > TAMANHO_MAX_FOTO) { onErro('A imagem é grande demais. O limite é 5 MB.'); return; }
    onChange(u);
  };

  const escolher = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!r.canceled && r.assets[0]) aplicarUri(r.assets[0].uri, r.assets[0].fileSize);
    } catch {
      onErro('Não foi possível abrir a galeria.');
    }
  };

  // Arrastar e soltar: só existe na web. Usa um <div> do react-dom (disponível via react-native-web).
  const aoSoltarWeb = (ev: any) => {
    ev.preventDefault();
    setArrastando(false);
    const arquivo: File | undefined = ev.dataTransfer?.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) { onErro('Solte um arquivo de imagem.'); return; }
    aplicarUri(URL.createObjectURL(arquivo), arquivo.size);
  };

  return (
    <View style={estilos.fotoLinha}>
      <View style={estilos.fotoPrevia}><Avatar tamanho={84} uri={uri} /></View>
      <View style={{ flex: 1 }}>
        {Platform.OS === 'web' &&
          React.createElement(
            'div',
            {
              onDragOver: (ev: any) => { ev.preventDefault(); setArrastando(true); },
              onDragLeave: () => setArrastando(false),
              onDrop: aoSoltarWeb,
              style: {
                border: `2px dashed ${arrastando ? cores.azulEvolua : cores.cinzaAzulado}`,
                borderRadius: 14, padding: 12, textAlign: 'center', marginBottom: 4,
                background: arrastando ? cores.azulGelo : 'transparent', fontFamily: fontes.texto, fontSize: 14, color: cores.cinzaGrafite,
              },
            },
            'Arraste uma imagem para cá',
          )}
        <View style={estilos.linhaBotoes}>
          <BotaoSecundario texto={Platform.OS === 'web' ? 'Escolher do computador' : 'Escolher da galeria'} onPress={escolher} />
          {uri ? <BotaoSecundario texto="Remover foto" onPress={() => onChange(null)} /> : null}
        </View>
      </View>
    </View>
  );
}

export default function TelaConfiguracoes() {
  const perfil = useEvolua((e) => e.perfil);
  const { desktop } = useLayoutInfo();

  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);
  const [senhaAberta, setSenhaAberta] = useState(false);

  const [fotoUrl, setFotoUrl] = useState<string | null>(perfil.fotoUrl);
  const [nome, setNome] = useState(perfil.nome);
  const [sobrenome, setSobrenome] = useState(perfil.sobrenome);
  const [apelido, setApelido] = useState(perfil.apelido);
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [biografia, setBiografia] = useState(perfil.biografia ?? '');
  const [data, setData] = useState(formatarDataNascimento(perfil.dataNascimento));
  const [genero, setGenero] = useState<Genero>(perfil.genero);

  const [telefone, setTelefone] = useState(perfil.contato.telefone);
  const [email, setEmail] = useState(perfil.contato.email);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [aviso, setAviso] = useState<AvisoConfig | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const erro = (texto: string) => setAviso({ tipo: 'erro', texto });

  const salvarDados = () => {
    if (!nome.trim()) return erro('Informe o nome.');
    if (!apelido.trim()) return erro('Informe um apelido.');
    if (usuario.trim().length < 3 || /\s/.test(usuario)) {
      return erro('O usuário precisa ter pelo menos 3 caracteres, sem espaços.');
    }

    let nascimentoISO: string | null = null;
    if (data) {
      nascimentoISO = dataBRparaISO(data);
      if (!nascimentoISO) {
        return erro('Informe uma data de nascimento válida, que não esteja no futuro.');
      }
    }

    if (telefone !== perfil.contato.telefone && !telefoneValido(telefone)) {
      return erro('Informe um telefone com DDD.');
    }
    if (email !== perfil.contato.email && !emailValido(email)) {
      return erro('Informe um e-mail válido.');
    }

    atualizarPerfil({
      fotoUrl,
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      apelido: apelido.trim(),
      usuario: usuario.trim(),
      biografia: biografia.trim(),
      dataNascimento: nascimentoISO,
      genero,
      contato: { email: email.trim(), telefone: telefone.trim() },
    });

    setAviso({ tipo: 'ok', texto: 'Dados atualizados com sucesso.' });
  };

  const alterarSenha = () => {
    if (!senhaAtual) return erro('Informe sua senha atual.');
    if (!senhaAtualCorreta(senhaAtual)) return erro('A senha atual está incorreta.');
    if (novaSenha.length < 8 || !/[^A-Za-z0-9]/.test(novaSenha)) {
      return erro('A nova senha precisa ter pelo menos 8 caracteres e 1 caractere especial.');
    }
    if (novaSenha !== confirmacao) {
      return erro('A confirmação não corresponde à nova senha.');
    }

    definirSenhaLocal(novaSenha);
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmacao('');
    setSenhaAberta(false);
    setAviso({ tipo: 'ok', texto: 'Senha atualizada com sucesso.' });
  };

  const descartarDados = () => {
    setFotoUrl(perfil.fotoUrl);
    setNome(perfil.nome);
    setSobrenome(perfil.sobrenome);
    setApelido(perfil.apelido);
    setUsuario(perfil.usuario);
    setBiografia(perfil.biografia ?? '');
    setData(formatarDataNascimento(perfil.dataNascimento));
    setGenero(perfil.genero);
    setTelefone(perfil.contato.telefone);
    setEmail(perfil.contato.email);
    setAviso(null);
  };

  const limparCamposSenha = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmacao('');
    setAviso(null);
  };

  const secao = (id: string, titulo: string, conteudo: React.ReactNode, perigo = false) => {
    const aberta = secaoAberta === id;
    return (
      <View style={[estilos.cartao, perigo && estilos.cartaoPerigo, { padding: 0, overflow: 'hidden' }]}>
        <Pressable
          onPress={() => {
            setSecaoAberta(aberta ? null : id);
            setAviso(null);
          }}
          accessibilityRole="button"
          accessibilityState={{ expanded: aberta }}
          style={{
            minHeight: 66,
            paddingHorizontal: 18,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={[estilos.secaoTitulo, { marginBottom: 0, fontSize: 18 }]}>
            {titulo}
          </Text>
          <Ionicons
            name={aberta ? 'chevron-up' : 'chevron-down'}
            size={21}
            color={cores.azulEvolua}
          />
        </Pressable>
        {aberta && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
            <View style={{ height: 1, backgroundColor: cores.cinzaClaro, marginBottom: 16 }} />
            {conteudo}
          </View>
        )}
      </View>
    );
  };

  const conteudoDados = (
    <>
      <Text style={estilos.painelTexto}>
        Personalize as informações que identificam seu perfil no Evolua.
      </Text>
      <Text style={estilos.campoRotulo}>Foto de perfil</Text>
      <CampoFoto uri={fotoUrl} onChange={setFotoUrl} onErro={erro} />

      <View style={estilos.linhaCampos}>
        <Campo meia rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="name-given" />
        <Campo meia rotulo="Sobrenome" value={sobrenome} onChangeText={setSobrenome} autoComplete="name-family" />
      </View>

      <Campo rotulo="Apelido" value={apelido} onChangeText={setApelido} maxLength={30} />
      <Campo
        rotulo="Nome de usuário"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
      />
      <Campo
        rotulo="Data de nascimento (opcional)"
        value={data}
        onChangeText={(t) => setData(mascararData(t))}
        keyboardType="number-pad"
        placeholder="DD/MM/AAAA"
        maxLength={10}
      />

      <Text style={estilos.campoRotulo}>Gênero (opcional)</Text>
      <View style={estilos.chips} accessibilityRole="radiogroup">
        {GENEROS.map((g) => {
          const ativo = genero === g.valor;
          return (
            <Pressable
              key={g.valor}
              style={[estilos.chip, ativo && estilos.chipAtivo]}
              onPress={() => setGenero(g.valor)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
            >
              <Text style={[estilos.chipTexto, ativo && { color: cores.branco }]}>
                {g.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Campo
        rotulo="Biografia (opcional)"
        value={biografia}
        onChangeText={setBiografia}
        multiline
        numberOfLines={3}
        maxLength={160}
        placeholder="Conte um pouco sobre você..."
        style={[estilos.campo, { minHeight: 84, textAlignVertical: 'top' }]}
      />

      <View style={estilos.acoesForm}>
        <BotaoDestaque texto="Salvar alterações" onPress={salvarDados} />
        <BotaoSecundario texto="Descartar alterações" onPress={descartarDados} />
      </View>
    </>
  );

  const conteudoContato = (
    <>
      <Text style={estilos.painelTexto}>
        Mantenha seus dados de contato atualizados.
      </Text>
      <Campo
        rotulo="Telefone"
        value={telefone}
        onChangeText={(t) => setTelefone(mascararTelefone(t))}
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="(11) 90000-0000"
      />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        placeholder="voce@email.com"
      />
      <BotaoDestaque texto="Salvar alterações" onPress={salvarDados} />
    </>
  );

  const conteudoSeguranca = (
    <>
      <Text style={estilos.painelTexto}>
        Gerencie sua senha e consulte as informações sobre a privacidade dos seus dados.
      </Text>
      <Pressable
        onPress={() => setSenhaAberta((aberta) => !aberta)}
        accessibilityRole="button"
        accessibilityState={{ expanded: senhaAberta }}
        style={{
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={estilos.campoRotulo}>Alterar senha</Text>
          <Text style={[estilos.painelTexto, { marginBottom: 0 }]}>
            Atualize sua senha de acesso.
          </Text>
        </View>
        <Ionicons
          name={senhaAberta ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={cores.azulEvolua}
        />
      </Pressable>

      {senhaAberta && (
        <View style={{ marginTop: 10 }}>
          <Campo
            rotulo="Senha atual"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
          />
          <Campo
            rotulo="Nova senha"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <Text style={estilos.painelTexto}>
            Use pelo menos 8 caracteres e inclua ao menos 1 caractere especial.
          </Text>
          <Campo
            rotulo="Confirme a nova senha"
            value={confirmacao}
            onChangeText={setConfirmacao}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <View style={estilos.acoesForm}>
            <BotaoDestaque texto="Atualizar senha" onPress={alterarSenha} />
            <BotaoSecundario texto="Limpar campos" onPress={limparCamposSenha} />
          </View>
        </View>
      )}

      <View style={{ marginTop: 16 }}>
        <Text style={estilos.painelTexto}>
          Seus registros emocionais e demais informações pessoais devem ser tratados com privacidade.
          Consulte os Termos de Uso e a Política de Privacidade do Evolua para conhecer como os dados são utilizados.
        </Text>
      </View>
    </>
  );

  const conteudoConta = (
    <>
      <Text style={estilos.painelTexto}>
        Se desejar, você pode solicitar a exclusão da conta e dos dados armazenados neste protótipo.
      </Text>
      {!confirmandoExclusao ? (
        <Pressable
          style={estilos.btnPerigo}
          onPress={() => setConfirmandoExclusao(true)}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={20} color={cores.azulMarinho} />
          <Text style={estilos.btnPerigoTexto}>Excluir minha conta</Text>
        </Pressable>
      ) : (
        <View>
          <Text style={[estilos.painelTitulo, { marginTop: 4 }]}>
            Tem certeza que deseja excluir a conta?
          </Text>
          <Text style={estilos.painelTexto}>
            Essa ação apaga o perfil, os check-ins e as notificações armazenados localmente e não pode ser desfeita.
          </Text>
          <View style={estilos.linhaBotoes}>
            <Pressable
              style={estilos.btnPerigoConfirmar}
              onPress={excluirContaLocal}
              accessibilityRole="button"
            >
              <Text style={estilos.btnPerigoConfirmarTexto}>Sim, excluir</Text>
            </Pressable>
            <BotaoSecundario
              texto="Cancelar"
              onPress={() => setConfirmandoExclusao(false)}
            />
          </View>
        </View>
      )}
    </>
  );

  return (
    <>
      <Cabecalho titulo="Configurações" subtitulo="Gerencie seu perfil e sua conta" />

      {aviso && (
        <Text
          style={[
            estilos.aviso,
            aviso.tipo === 'ok' ? estilos.avisoOk : estilos.avisoErro,
            { marginTop: 0, marginBottom: 14 },
          ]}
          accessibilityLiveRegion="polite"
        >
          {aviso.texto}
        </Text>
      )}

      <View style={desktop ? { maxWidth: 760, width: '100%', alignSelf: 'center' } : undefined}>
        {secao('dados', 'Dados pessoais', conteudoDados)}
        {secao('contato', 'Contato', conteudoContato)}
        {secao('seguranca', 'Segurança e privacidade', conteudoSeguranca)}
        {secao('conta', 'Gerenciamento da conta', conteudoConta, true)}
      </View>

      <BotaoVoltar />
    </>
  );
}
