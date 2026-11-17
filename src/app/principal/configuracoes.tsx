import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { cores, fontes } from '../../tema';
import { EMPRESA, VERSAO_TERMOS, VIGENCIA_TERMOS } from '../../termos';

import {
  Genero,
  IconeNome,
  useLayoutInfo,
  useEvolua,
  atualizarPerfil,
  senhaAtualCorreta,
  definirSenhaLocal,
  excluirContaLocal,
  formatarDataNascimento,
  mascararData,
  mascararTelefone,
  dataBRparaISO,
  GENEROS,
  emailValido,
  telefoneValido,
  TAMANHO_MAX_FOTO,
  Avatar,
  BotaoDestaque,
  BotaoSecundario,
  BotaoVoltar,
  Cabecalho,
  estilos,
} from './compartilhado';

type AvisoConfig = { tipo: 'ok' | 'erro'; texto: string };

// Lê a versão do app.json (campo "version"). Se não achar, usa 1.0.0.
const VERSAO_APP = Constants.expoConfig?.version ?? '1.0.0';

// Cada seção tem um fundo e um tom de destaque (borda e ícone), todos do tema.ts.
const TONS_SECAO: Record<string, { fundo: string; destaque: string; icone: IconeNome }> = {
  dados:     { fundo: cores.branco, destaque: cores.azulEvolua,   icone: 'person-outline' },
  contato:   { fundo: cores.branco, destaque: cores.feliz,        icone: 'call-outline' },
  seguranca: { fundo: cores.branco, destaque: cores.muitoTriste,  icone: 'shield-checkmark-outline' },
  termos:    { fundo: cores.branco, destaque: cores.muitoFeliz,   icone: 'document-text-outline' },
  sobre:     { fundo: cores.branco, destaque: cores.triste,       icone: 'information-circle-outline' },
  conta:     { fundo: cores.branco, destaque: cores.rosaVibrante, icone: 'settings-outline' },
};

function Campo({ rotulo, meia, ...props }: { rotulo: string; meia?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={[{ marginBottom: 12 }, meia && { flex: 1 }]}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      <TextInput style={estilos.campo} placeholderTextColor={cores.cinzaAzulado} accessibilityLabel={rotulo} {...props} />
    </View>
  );
}

/**
 * Pede permissão ao usuário (galeria ou câmera). Na web não precisa.
 * Se a pessoa negar, explica o motivo e oferece abrir as configurações do celular.
 */
async function pedirPermissao(tipo: 'galeria' | 'camera'): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  const r =
    tipo === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (r.granted) return true;

  Alert.alert(
    tipo === 'camera' ? 'Permissão da câmera' : 'Permissão da galeria',
    tipo === 'camera'
      ? 'Para tirar uma foto de perfil, o Evolua precisa de acesso à câmera. Você pode permitir nas configurações do aparelho.'
      : 'Para escolher uma foto de perfil, o Evolua precisa de acesso às suas fotos. Você pode permitir nas configurações do aparelho.',
    [
      { text: 'Agora não', style: 'cancel' },
      { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
    ],
  );
  return false;
}

/**
 * Campo da FOTO: escolher imagem da galeria, tirar foto com a câmera (só celular)
 * ou, na web, escolher do computador e ARRASTAR E SOLTAR.
 * Antes de abrir a galeria/câmera, o app pede permissão.
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
      if (!(await pedirPermissao('galeria'))) return;
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

  const tirarFoto = async () => {
    try {
      if (!(await pedirPermissao('camera'))) return;
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!r.canceled && r.assets[0]) aplicarUri(r.assets[0].uri, r.assets[0].fileSize);
    } catch {
      onErro('Não foi possível abrir a câmera.');
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
          {Platform.OS !== 'web' && <BotaoSecundario texto="Tirar foto" onPress={tirarFoto} />}
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

  // Abre a tela de Termos (que fica em /acesso) em modo somente leitura.
  const abrirTermos = () =>
    router.push({ pathname: '/acesso/termos-de-uso', params: { modo: 'consulta' } } as Href);

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
    const tom = TONS_SECAO[id];
    return (
      <View
        style={[
          estilos.cartao,
          perigo && estilos.cartaoPerigo,
          {
            padding: 0,
            overflow: 'hidden',
            backgroundColor: tom.fundo,
            borderWidth: 1.5,
            borderColor: tom.destaque + '66',
          },
        ]}
      >
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
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              marginRight: 12,
              backgroundColor: cores.branco,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={tom.icone} size={20} color={tom.destaque} />
          </View>
          <Text style={[estilos.secaoTitulo, { marginBottom: 0, fontSize: 18, flex: 1 }]}>
            {titulo}
          </Text>
          <Ionicons name={aberta ? 'chevron-up' : 'chevron-down'} size={21} color={tom.destaque} />
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

  // Linha que não expande: leva direto para outra tela.
  const linkTela = (id: string, titulo: string, aoPressionar: () => void) => {
    const tom = TONS_SECAO[id];
    return (
      <Pressable
        onPress={aoPressionar}
        accessibilityRole="link"
        accessibilityLabel={titulo}
        style={[
          estilos.cartao,
          {
            padding: 0,
            minHeight: 66,
            paddingHorizontal: 18,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: tom.fundo,
            borderWidth: 1.5,
            borderColor: tom.destaque + '66',
          },
        ]}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            marginRight: 12,
            backgroundColor: cores.branco,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={tom.icone} size={20} color={tom.destaque} />
        </View>
        <Text style={[estilos.secaoTitulo, { marginBottom: 0, fontSize: 18, flex: 1 }]}>{titulo}</Text>
        <Ionicons name="chevron-forward" size={21} color={tom.destaque} />
      </Pressable>
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

      {/* Botão colorido: só esta parte fica rosa para indicar que é clicável. */}
      <Pressable
        onPress={() => setSenhaAberta((aberta) => !aberta)}
        accessibilityRole="button"
        accessibilityState={{ expanded: senhaAberta }}
        style={{
          minHeight: 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: cores.muitoTriste,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[estilos.campoRotulo, { color: cores.branco, marginBottom: 2 }]}>Alterar senha</Text>
          <Text style={[estilos.painelTexto, { marginBottom: 0, color: cores.branco }]}>
            Atualize sua senha de acesso.
          </Text>
        </View>
        <Ionicons
          name={senhaAberta ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={cores.branco}
        />
      </Pressable>

      {senhaAberta && (
        <View style={{ marginTop: 14 }}>
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

  const conteudoSobre = (
    <>
      <Text style={estilos.painelTexto}>
        O Evolua é um aplicativo de acompanhamento emocional e de bem-estar, para você registrar
        como se sente e acompanhar sua evolução ao longo do tempo. Ele não substitui o acompanhamento
        de um profissional de saúde.
      </Text>

      <Text style={estilos.campoRotulo}>Versão do app</Text>
      <Text style={estilos.painelTexto}>{VERSAO_APP}</Text>

      <Text style={estilos.campoRotulo}>Termos de Uso e Privacidade</Text>
      <Text style={estilos.painelTexto}>
        Versão {VERSAO_TERMOS} · em vigor desde {VIGENCIA_TERMOS}
      </Text>

      <Text style={estilos.campoRotulo}>Desenvolvido por</Text>
      <Text style={estilos.painelTexto}>
        {EMPRESA.nomeFantasia} ({EMPRESA.razaoSocial}){'\n'}CNPJ {EMPRESA.cnpj}
      </Text>

      <Text style={estilos.campoRotulo}>Contato sobre seus dados (LGPD)</Text>
      <Text style={[estilos.painelTexto, { marginBottom: 0 }]}>{EMPRESA.emailEncarregado}</Text>
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
        {linkTela('termos', 'Termos de uso', abrirTermos)}
        {secao('sobre', 'Sobre o app', conteudoSobre)}
        {secao('conta', 'Gerenciamento da conta', conteudoConta, true)}
      </View>

      <BotaoVoltar />
    </>
  );
}