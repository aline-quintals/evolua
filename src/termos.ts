export const VERSAO_TERMOS = '1.0';
export const VIGENCIA_TERMOS = 'novembro de 2026';

/* Dados fictícios. Troque pelos dados reais antes de publicar. */
export const EMPRESA = {
  nomeFantasia: 'NUBYA TECH',
  razaoSocial: 'NUBYA TECH SOLUÇÕES DIGITAIS LTDA',
  cnpj: '12.345.678/0001-95',
  emailEncarregado: 'privacidade@nubyatech.com.br',
};

export type Secao = { titulo: string; paragrafos: string[] };

export const SECOES: Secao[] = [
  {
    titulo: 'Aceitação e objetivo',
    paragrafos: [
      `Estes Termos de Uso e a Política de Privacidade regulam o uso do aplicativo Evolua, desenvolvido pela ${EMPRESA.nomeFantasia} (${EMPRESA.razaoSocial}, CNPJ ${EMPRESA.cnpj}), doravante "Evolua", e explicam como seus dados pessoais são tratados.`,
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
      `O aplicativo, a marca Evolua, o design e os conteúdos produzidos pela ${EMPRESA.nomeFantasia} são protegidos pela legislação de propriedade intelectual. Os dados e registros que você insere continuam sendo seus.`,
    ],
  },
  {
    titulo: 'Alterações destes termos',
    paragrafos: [
      'Estes termos podem ser atualizados. Quando houver mudança relevante, você será avisado(a) pelo aplicativo e, se a mudança alterar a finalidade do tratamento dos seus dados, poderá ser solicitado um novo consentimento.',
      `Versão atual: ${VERSAO_TERMOS}, em vigor a partir de ${VIGENCIA_TERMOS}.`,
    ],
  },
  {
    titulo: 'Contato e legislação aplicável',
    paragrafos: [
      `Dúvidas, solicitações e pedidos relacionados aos seus dados podem ser enviados ao responsável pela proteção de dados (encarregado) da ${EMPRESA.nomeFantasia}: ${EMPRESA.emailEncarregado}.`,
      'Este documento é regido pelas leis brasileiras, em especial a LGPD (Lei nº 13.709/2018), o Marco Civil da Internet (Lei nº 12.965/2014) e o Código de Defesa do Consumidor. Fica eleito o foro do domicílio do usuário para resolver eventuais controvérsias.',
    ],
  },
];