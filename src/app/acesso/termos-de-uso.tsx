import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, fontes } from '../../tema';

export const VERSAO_TERMOS = '1.0';

/* ------------------------------------------------------------------ */
/* Ponte com a tela de cadastro                                        */
/* Os dados ficam só na memória (nunca na URL) até o aceite.           */
/* ------------------------------------------------------------------ */
let cadastroPendente: Record<string, string> | null = null;

export function definirCadastroPendente(dados: Record<string, string> | null): void {
  cadastroPendente = dados;
}
export const lerCadastroPendente = () => cadastroPendente;

/* ------------------------------------------------------------------ */
/* Texto dos termos                                                    */
/* Para editar, mexa só aqui. Trechos [entre colchetes] devem ser      */
/* preenchidos com os dados reais da empresa antes de publicar.        */
/* ------------------------------------------------------------------ */
type Secao = { titulo: string; paragrafos: string[] };

const SECOES: Secao[] = [
  {
    titulo: 'Aceitação e objetivo',
    paragrafos: [
      'Estes Termos de Uso e a Política de Privacidade regulam o uso do aplicativo Evolua, desenvolvido pela NubyTech [razão social e CNPJ], doravante "Evolua", e explicam como seus dados pessoais são tratados.',
      'O Evolua é um aplicativo de acompanhamento emocional e de bem-estar, no qual você registra como se sente, acompanha sua evolução ao longo do tempo e pode gerar relatórios sobre o seu uso.',
      'Ao tocar em "Aceitar e cadastrar", você declara que leu e compreendeu este documento e aceita as condições aqui descritas. Sem esse aceite, não é possível criar uma conta.',
    ],
  },
  {
    titulo: 'O que o Evolua é e o que não é',
    paragrafos: [
      'O Evolua é uma ferramenta de apoio ao autoconhecimento. Ele não realiza diagnóstico, não prescreve tratamento e não substitui consulta, acompanhamento ou orientação de psicólogo, psiquiatra ou outro profissional de saúde.',
      'O Evolua não é um serviço de emergência. Se você estiver em sofrimento intenso, pensando em se machucar ou em risco, procure ajuda imediatamente: ligue para o CVV pelo número 188 (24 horas, gratuito), para o SAMU pelo 192, ou vá ao pronto-socorro mais próximo.',
    ],
  },
  {
    titulo: 'Cadastro e responsabilidade pela conta',
    paragrafos: [
      'Você se compromete a informar dados verdadeiros e atualizados no cadastro e a manter sua senha em sigilo. Tudo o que for feito com o seu usuário e senha será considerado de sua responsabilidade.',
      'O uso do Evolua é destinado a pessoas maiores de 18 anos. Menores de 18 anos só podem usar o aplicativo com o consentimento específico de pelo menos um dos pais ou do responsável legal, nos termos do art. 14 da Lei Geral de Proteção de Dados (LGPD).',
    ],
  },
  {
    titulo: 'Quais dados são tratados',
    paragrafos: [
      '• Dados de cadastro: nome completo, como deseja ser chamado(a), telefone, e-mail, data de nascimento e nome de usuário.',
      '• Dados que você registra no aplicativo: check-ins emocionais (emoção, ansiedade, estresse e energia, com data e hora), além de questionários, metas, exercícios e demais informações que você inserir nas funcionalidades do Evolua.',
      '• Imagem: a foto de perfil, que é opcional.',
      'Você só deve inserir no aplicativo informações suas. Não registre dados de outras pessoas sem a autorização delas.',
    ],
  },
  {
    titulo: 'Dados pessoais sensíveis',
    paragrafos: [
      'Informações sobre o seu estado emocional e a sua saúde mental são dados pessoais sensíveis, protegidos de forma reforçada pelos arts. 5º, II, e 11 da LGPD (Lei nº 13.709/2018).',
      'Esses dados são tratados somente com o seu consentimento específico e destacado, que você dá ao aceitar este documento, e apenas para as finalidades descritas abaixo.',
    ],
  },
  {
    titulo: 'Para que usamos seus dados',
    paragrafos: [
      '• Criar e manter a sua conta e permitir o acesso ao aplicativo.',
      '• Registrar seus check-ins e mostrar o seu histórico e a sua evolução.',
      '• Gerar relatórios sobre o seu uso do aplicativo, quando você solicitar.',
      '• Enviar notificações e comunicações relacionadas ao funcionamento do Evolua.',
      '• Manter a segurança da conta, prevenir fraudes e cumprir obrigações legais.',
      '• Melhorar o aplicativo, utilizando apenas dados anonimizados, que não identificam você.',
      'Não usamos seus dados para finalidades diferentes das informadas aqui sem pedir um novo consentimento.',
    ],
  },
  {
    titulo: 'Uso de imagem',
    paragrafos: [
      'Ao enviar uma foto de perfil, você autoriza o Evolua a exibi-la dentro do aplicativo, nas áreas ligadas à sua conta, como a Home, o perfil e as notificações.',
      'Sua imagem não será usada em publicidade, divulgação ou materiais de marketing, nem cedida a terceiros para esses fins, sem a sua autorização expressa e separada.',
      'Você pode trocar ou remover a foto a qualquer momento, e ela será apagada junto com a sua conta.',
    ],
  },
  {
    titulo: 'Relatórios para psicólogo ou psiquiatra',
    paragrafos: [
      'O Evolua permite que você gere um relatório com as informações que registrou, para levar ao seu psicólogo, psiquiatra ou outro profissional de saúde.',
      'A decisão de gerar o relatório e de compartilhá-lo é exclusivamente sua. O Evolua não envia relatórios a profissionais por conta própria.',
      'Ao compartilhar o relatório, você é responsável por escolher o profissional e o meio de envio. Recomendamos que o faça por canais seguros e apenas com profissionais de sua confiança.',
      'Depois que o relatório sai do aplicativo, o tratamento das informações passa a ser feito pelo profissional que o recebeu, que deve observar o seu próprio dever de sigilo e a legislação aplicável. O Evolua não se responsabiliza pelo uso feito fora do aplicativo.',
      'O relatório tem caráter informativo, reflete apenas o que você registrou e não constitui laudo, diagnóstico ou avaliação clínica.',
    ],
  },
  {
    titulo: 'Compartilhamento de dados',
    paragrafos: [
      'O Evolua não vende nem aluga seus dados pessoais.',
      'Os dados podem ser tratados por prestadores de serviço que ajudam a manter o aplicativo, como hospedagem e armazenamento, que atuam em nosso nome, sob contrato e com dever de confidencialidade.',
      'Também poderemos compartilhar dados quando houver obrigação legal ou ordem de autoridade competente.',
    ],
  },
  {
    titulo: 'Segurança e tempo de guarda',
    paragrafos: [
      'Adotamos medidas técnicas e administrativas para proteger seus dados contra acessos não autorizados, perda e alteração. Nenhum sistema é totalmente imune a falhas; em caso de incidente de segurança que possa lhe causar risco ou dano relevante, você e a Autoridade Nacional de Proteção de Dados (ANPD) serão comunicados, conforme a lei.',
      'Seus dados são mantidos enquanto a sua conta estiver ativa e, depois disso, apenas pelo prazo necessário para cumprir obrigações legais ou para o exercício regular de direitos. Superado esse prazo, são eliminados ou anonimizados.',
    ],
  },
  {
    titulo: 'Seus direitos',
    paragrafos: [
      'Conforme o art. 18 da LGPD, você pode, a qualquer momento e mediante solicitação: confirmar que tratamos seus dados; acessá-los; corrigir dados incompletos, inexatos ou desatualizados; pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desacordo com a lei; solicitar a portabilidade; saber com quem seus dados foram compartilhados; e ser informado(a) sobre a possibilidade de não consentir e sobre as consequências disso.',
      'Para exercer seus direitos, use o contato indicado no final deste documento.',
    ],
  },
  {
    titulo: 'Revogação do consentimento e exclusão da conta',
    paragrafos: [
      'Você pode revogar o seu consentimento e excluir a sua conta quando quiser, pelas Configurações do aplicativo ou pelo contato indicado abaixo.',
      'A revogação não afeta os tratamentos realizados antes dela. Depois da exclusão, as funcionalidades que dependem dos seus dados deixam de estar disponíveis e as informações são eliminadas, ressalvadas as hipóteses em que a lei exigir a guarda.',
    ],
  },
  {
    titulo: 'Uso adequado do aplicativo',
    paragrafos: [
      'Você se compromete a não usar o Evolua para fins ilícitos, a não tentar acessar contas ou dados de outras pessoas e a não interferir no funcionamento do aplicativo.',
      'O descumprimento destas regras pode levar à suspensão ou ao encerramento da conta, sem prejuízo das medidas legais cabíveis.',
    ],
  },
  {
    titulo: 'Propriedade intelectual',
    paragrafos: [
      'O aplicativo, a marca Evolua, o design e os conteúdos produzidos pela NubyTech são protegidos pela legislação de propriedade intelectual. Os dados e registros que você insere continuam sendo seus.',
    ],
  },
  {
    titulo: 'Alterações destes termos',
    paragrafos: [
      'Estes termos podem ser atualizados. Quando houver mudança relevante, você será avisado(a) pelo aplicativo e, se a mudança alterar a finalidade do tratamento dos seus dados, poderá ser solicitado um novo consentimento.',
      'Versão atual: 1.0, em vigor a partir de novembro de 2026.',
    ],
  },
  {
    titulo: 'Contato e legislação aplicável',
    paragrafos: [
      'Dúvidas, solicitações e pedidos relacionados aos seus dados podem ser enviados ao responsável pela proteção de dados (encarregado) da NubyTech: [e-mail do encarregado].',
      'Este documento é regido pelas leis brasileiras, em especial a LGPD (Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e o Código de Defesa do Consumidor. Fica eleito o foro do domicílio do usuário para resolver eventuais controvérsias.',
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Tela                                                                */
/* ------------------------------------------------------------------ */
export default function TermosDeUso() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [lido, setLido] = useState(false);
  const [recusou, setRecusou] = useState(false);

  const medidas = useRef({ visivel: 0, conteudo: 0 });

  const checarFim = (y: number) => {
    const { visivel, conteudo } = medidas.current;
    if (visivel > 0 && conteudo > 0 && y + visivel >= conteudo - 24) setLido(true);
  };

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentSize, contentOffset } = e.nativeEvent;
    medidas.current = { visivel: layoutMeasurement.height, conteudo: contentSize.height };
    checarFim(contentOffset.y);
  };

  const aoMedirCaixa = (e: LayoutChangeEvent) => {
    medidas.current.visivel = e.nativeEvent.layout.height;
    checarFim(0);
  };

  const voltarAoCadastro = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/acesso/cadastro');
  };

  const aceitar = () => {
    if (!lido) return;

    // TODO: aqui entram o envio do cadastro e o registro do aceite no servidor:
    //   dados: lerCadastroPendente()
    //   aceite: { versao: VERSAO_TERMOS, aceitoEmISO: new Date().toISOString() }
    definirCadastroPendente(null);
    // O aviso "Cadastro criado com sucesso" aparece na tela de login.
    router.replace({ pathname: '/acesso/login', params: { cadastro: 'ok' } });
  };

  return (
    <View style={styles.externo}>
      <KeyboardAvoidingView
        style={styles.coluna}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.conteudo, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          {/* Cabeçalho */}
          <Pressable onPress={voltarAoCadastro} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar ao cadastro" style={styles.voltar}>
            <Ionicons name="arrow-back" size={26} color={cores.azulMarinho} />
          </Pressable>

          <Text style={styles.marca}>EVOLUA</Text>
          <Text style={styles.titulo} accessibilityRole="header">Termos de Uso e Política de Privacidade</Text>
          <Text style={styles.versao}>Versão {VERSAO_TERMOS} · em vigor a partir de novembro de 2026</Text>
          <Text style={styles.instrucao}>
            Leia o documento até o final para poder aceitar e concluir o seu cadastro.
          </Text>

          {/* Texto */}
          <View style={styles.caixa} onLayout={aoMedirCaixa}>
            <ScrollView
              onScroll={aoRolar}
              scrollEventThrottle={16}
              onContentSizeChange={(_, h) => {
                medidas.current.conteudo = h;
                checarFim(0);
              }}
              showsVerticalScrollIndicator
              contentContainerStyle={styles.caixaConteudo}
            >
              {SECOES.map((s, i) => (
                <View key={s.titulo} style={styles.secao}>
                  <Text style={styles.secaoTitulo}>{i + 1}. {s.titulo}</Text>
                  {s.paragrafos.map((p, j) => (
                    <Text key={j} style={styles.paragrafo}>{p}</Text>
                  ))}
                </View>
              ))}
              <Text style={styles.fimTexto}>Fim do documento</Text>
            </ScrollView>
          </View>

          {/* Rodapé */}
          {recusou ? (
            <View style={styles.recusaCaixa}>
              <Text style={styles.recusaTexto}>
                Sem aceitar os Termos de Uso não é possível criar a conta no Evolua.
              </Text>
              <View style={styles.linhaBotoes}>
                <Pressable style={[styles.botao, styles.botaoContorno]} onPress={() => setRecusou(false)} accessibilityRole="button">
                  <Text style={styles.botaoContornoTexto}>Ler novamente</Text>
                </Pressable>
                <Pressable style={[styles.botao, styles.botaoCheio]} onPress={voltarAoCadastro} accessibilityRole="button">
                  <Text style={styles.botaoCheioTexto}>Voltar ao cadastro</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.dica}>
                {lido ? 'Leitura concluída.' : 'Role até o final do texto para poder aceitar.'}
              </Text>
              <View style={styles.linhaBotoes}>
                <Pressable style={[styles.botao, styles.botaoContorno]} onPress={() => setRecusou(true)} accessibilityRole="button">
                  <Text style={styles.botaoContornoTexto}>Recusar</Text>
                </Pressable>
                <Pressable
                  style={[styles.botao, styles.botaoCheio, !lido && { opacity: 0.45 }]}
                  onPress={aceitar}
                  disabled={!lido}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !lido }}
                >
                  <Text style={styles.botaoCheioTexto}>Aceitar e cadastrar</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  externo: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: cores.brancoAzulado,
  },
  coluna: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },

  voltar: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  marca: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    letterSpacing: 3,
    color: cores.cinzaAzulado,
    marginBottom: 4,
  },
  titulo: {
    fontFamily: fontes.titulo,
    fontSize: 24,
    lineHeight: 30,
    color: cores.azulMarinho,
  },
  versao: {
    fontFamily: fontes.texto,
    fontSize: 13,
    color: cores.cinzaGrafite,
    marginTop: 4,
  },
  instrucao: {
    fontFamily: fontes.texto,
    fontSize: 14,
    lineHeight: 20,
    color: cores.cinzaGrafite,
    marginTop: 10,
    marginBottom: 12,
  },

  caixa: {
    flex: 1,
    minHeight: 180,
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    borderRadius: 8,
    overflow: 'hidden',
  },
  caixaConteudo: {
    padding: 16,
  },
  secao: {
    marginBottom: 18,
  },
  secaoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 15,
    color: cores.azulMarinho,
    marginBottom: 6,
  },
  paragrafo: {
    fontFamily: fontes.texto,
    fontSize: 14,
    lineHeight: 21,
    color: cores.cinzaGrafite,
    marginBottom: 8,
  },
  fimTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: cores.cinzaAzulado,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },

  dica: {
    fontFamily: fontes.texto,
    fontSize: 13,
    color: cores.cinzaGrafite,
    textAlign: 'center',
    marginTop: 12,
  },

  linhaBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  botao: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  botaoCheio: {
    backgroundColor: cores.azulMarinho,
  },
  botaoCheioTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 15,
    color: cores.branco,
    textAlign: 'center',
  },
  botaoContorno: {
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.cinzaAzulado,
  },
  botaoContornoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 15,
    color: cores.cinzaGrafite,
    textAlign: 'center',
  },

  recusaCaixa: {
    marginTop: 14,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: cores.cinzaClaro,
    backgroundColor: cores.branco,
  },
  recusaTexto: {
    fontFamily: fontes.texto,
    fontSize: 14,
    lineHeight: 20,
    color: cores.azulMarinho,
  },
});