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
  sairDaConta,
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
  NavegacaoContext,
  useNavegacao,
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

  // Rascunho do formulário (só vale ao salvar).
  const [fotoUrl, setFotoUrl] = useState<string | null>(perfil.fotoUrl);
  const [nome, setNome] = useState(perfil.nome);
  const [sobrenome, setSobrenome] = useState(perfil.sobrenome);
  const [apelido, setApelido] = useState(perfil.apelido);
  const [usuario, setUsuario] = useState(perfil.usuario);
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

  const salvar = () => {
    if (!nome.trim()) return erro('Informe o nome.');
    if (!apelido.trim()) return erro('Informe um apelido.');
    if (usuario.trim().length < 3 || /\s/.test(usuario)) {
      return erro('O usuário precisa ter pelo menos 3 caracteres, sem espaços.');
    }
    let nascimentoISO: string | null = null;
    if (data) {
      nascimentoISO = dataBRparaISO(data);
      if (!nascimentoISO) return erro('Informe uma data de nascimento válida, que não esteja no futuro.');
    }
    if (telefone !== perfil.contato.telefone && !telefoneValido(telefone)) return erro('Informe um telefone com DDD.');
    if (email !== perfil.contato.email && !emailValido(email)) return erro('Informe um e-mail válido.');

    const querTrocarSenha = Boolean(senhaAtual || novaSenha || confirmacao);
    if (querTrocarSenha) {
      if (!senhaAtual) return erro('Para trocar a senha, informe a senha atual.');
      if (!senhaAtualCorreta(senhaAtual)) return erro('A senha atual está incorreta.');
      if (novaSenha.length < 8 || !/[^A-Za-z0-9]/.test(novaSenha)) return erro('A nova senha precisa ter 8 caracteres e pelo menos 1 caractere especial.');
      if (novaSenha !== confirmacao) return erro('A confirmação não é igual à nova senha.');
    }

    atualizarPerfil({
      fotoUrl,
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      apelido: apelido.trim(), // atualiza a saudação da Home
      usuario: usuario.trim(),
      dataNascimento: nascimentoISO,
      genero,
      contato: { email: email.trim(), telefone: telefone.trim() },
    });
    if (querTrocarSenha) {
      definirSenhaLocal(novaSenha);
      setSenhaAtual(''); setNovaSenha(''); setConfirmacao('');
    }
    setAviso({ tipo: 'ok', texto: querTrocarSenha ? 'Alterações salvas e senha atualizada.' : 'Alterações salvas.' });
  };

  const descartar = () => {
    setFotoUrl(perfil.fotoUrl); setNome(perfil.nome); setSobrenome(perfil.sobrenome); setApelido(perfil.apelido);
    setUsuario(perfil.usuario);
    setData(formatarDataNascimento(perfil.dataNascimento)); setGenero(perfil.genero);
    setTelefone(perfil.contato.telefone); setEmail(perfil.contato.email);
    setSenhaAtual(''); setNovaSenha(''); setConfirmacao('');
    setAviso(null);
  };

  const cartaoDados = (
    <View style={estilos.cartao}>
      <Text style={estilos.secaoTitulo}>Dados pessoais</Text>
      <Text style={estilos.campoRotulo}>Foto</Text>
      <CampoFoto uri={fotoUrl} onChange={setFotoUrl} onErro={erro} />
      <View style={estilos.linhaCampos}>
        <Campo meia rotulo="Nome" value={nome} onChangeText={setNome} autoComplete="name-given" />
        <Campo meia rotulo="Sobrenome" value={sobrenome} onChangeText={setSobrenome} autoComplete="name-family" />
      </View>
      <Campo rotulo="Apelido" value={apelido} onChangeText={setApelido} maxLength={30} />
      <Campo rotulo="Usuário" value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false} maxLength={30} />
      <Campo rotulo="Data de nascimento" value={data} onChangeText={(t) => setData(mascararData(t))} keyboardType="number-pad" placeholder="DD/MM/AAAA" maxLength={10} />
      <Text style={estilos.campoRotulo}>Gênero</Text>
      <View style={estilos.chips} accessibilityRole="radiogroup">
        {GENEROS.map((g) => {
          const ativo = genero === g.valor;
          return (
            <Pressable key={g.valor} style={[estilos.chip, ativo && estilos.chipAtivo]} onPress={() => setGenero(g.valor)} accessibilityRole="radio" accessibilityState={{ checked: ativo }}>
              <Text style={[estilos.chipTexto, ativo && { color: cores.branco }]}>{g.rotulo}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const cartaoContato = (
    <View style={estilos.cartao}>
      <Text style={estilos.secaoTitulo}>Contato</Text>
      <Campo rotulo="Telefone" value={telefone} onChangeText={(t) => setTelefone(mascararTelefone(t))} keyboardType="phone-pad" autoComplete="tel" placeholder="(11) 90000-0000" />
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="voce@email.com" />
    </View>
  );

  const cartaoSenha = (
    <View style={estilos.cartao}>
      <Text style={estilos.secaoTitulo}>Senha</Text>
      <Text style={estilos.painelTexto}>Deixe em branco para manter a senha atual.</Text>
      <Campo rotulo="Senha atual" value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry autoCapitalize="none" autoComplete="current-password" />
      <Campo rotulo="Nova senha" value={novaSenha} onChangeText={setNovaSenha} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
      <Campo rotulo="Confirme a nova senha" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry autoCapitalize="none" autoComplete="new-password" />
    </View>
  );

  const cartaoExcluir = (
    <View style={[estilos.cartao, estilos.cartaoPerigo]}>
      <Text style={estilos.secaoTitulo}>Excluir conta</Text>
      <Text style={estilos.painelTexto}>Ao excluir a conta, seu perfil, seus check-ins e suas notificações são apagados e você volta para a tela de login. Essa ação não pode ser desfeita.</Text>
      {!confirmandoExclusao ? (
        <Pressable style={estilos.btnPerigo} onPress={() => setConfirmandoExclusao(true)} accessibilityRole="button">
          <Ionicons name="trash-outline" size={20} color={cores.azulMarinho} />
          <Text style={estilos.btnPerigoTexto}>Excluir minha conta</Text>
        </Pressable>
      ) : (
        <View>
          <Text style={[estilos.painelTitulo, { marginTop: 4 }]}>Tem certeza que quer excluir a conta?</Text>
          <View style={estilos.linhaBotoes}>
            <Pressable style={estilos.btnPerigoConfirmar} onPress={excluirContaLocal} accessibilityRole="button">
              <Text style={estilos.btnPerigoConfirmarTexto}>Sim, excluir</Text>
            </Pressable>
            <BotaoSecundario texto="Cancelar" onPress={() => setConfirmandoExclusao(false)} />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Cabecalho titulo="Configurações" />
      {desktop ? (
        <View style={estilos.duasColunas}>
          <View style={{ flex: 1 }}>{cartaoDados}</View>
          <View style={{ flex: 1 }}>{cartaoContato}{cartaoSenha}</View>
        </View>
      ) : (
        <>
          {cartaoDados}
          {cartaoContato}
          {cartaoSenha}
        </>
      )}

      {aviso && (
        <Text style={[estilos.aviso, aviso.tipo === 'ok' ? estilos.avisoOk : estilos.avisoErro, { marginTop: 0, marginBottom: 14 }]} accessibilityLiveRegion="polite">
          {aviso.texto}
        </Text>
      )}
      <View style={estilos.acoesForm}>
        <BotaoDestaque texto="Salvar alterações" onPress={salvar} />
        <BotaoSecundario texto="Descartar alterações" onPress={descartar} />
      </View>

      {cartaoExcluir}
      <BotaoVoltar />
    </>
  );
}




