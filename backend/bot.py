import random
import re
import unicodedata


# ==========================================
# 1. NORMALIZACAO DE TEXTO
# ==========================================

def normalizar(texto):
    texto = texto.lower().strip()
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return texto


# ==========================================
# 2. DETECCAO DE RISCO (dois niveis)
# ==========================================
# Esta parte NAO mudou. Os padroes ja estao sem acento, porque o texto e
# normalizado antes.

# NIVEL ALTO: fala direta sobre morrer, se matar ou se machucar
CRISE_ALTA = re.compile(
    r"\b("
    r"me matar|"
    r"suicid\w*|"
    r"acabar com tudo|"
    r"(acabar|terminar|encerrar|dar fim|por fim)\s+(com\s+|na\s+|a\s+)?(a\s+|minha\s+|propria\s+)*vida|"
    r"tirar\s+(a\s+|minha\s+|propria\s+)*vida|"
    r"nao quero\s+(mais\s+)?(viver|estar aqui)|"
    r"nao aguento mais\s+(viver|essa vida)|"
    r"nao vale\s+(mais\s+)?a pena viver|"
    r"(quero|queria|vou|vontade de|pensando em|penso em|pensei em)\s+morrer|"
    r"desistir de viver|"
    r"(melhor|mais facil)\s+(sem mim|se eu morresse|eu morrer)|"
    r"me machucar|me ferir|me cortar|automutil\w*|auto mutil\w*"
    r")\b"
)

# NIVEL MEDIO: sinais de alerta (desanimo profundo, desistir, sem saida)
CRISE_MEDIA = re.compile(
    r"\b("
    r"desistir de tudo|"
    r"desistir|"
    r"nao aguento mais|"
    r"sem esperanca|"
    r"sem saida|"
    r"nao vejo saida|"
    r"sem sentido|"
    r"nao tenho mais forcas|"
    r"estou no limite|"
    r"queria sumir|"
    r"queria desaparecer"
    r")\b"
)

MSG_CRISE = (
    "Sinto muito que você esteja passando por isso, e fico feliz que tenha me contado. "
    "Você importa.\n\n"
    "Quero entender melhor: você está pensando em se machucar ou em tirar a sua própria vida "
    "neste momento? Está em perigo imediato?\n\n"
    "Se houver risco agora, ligue para o SAMU (192) ou procure uma UPA ou pronto-socorro. "
    "Se possível, não fique sozinho(a): avise alguém de confiança e afaste-se de qualquer "
    "coisa que possa usar para se machucar.\n\n"
    "O CVV oferece apoio emocional gratuito, 24 horas, pelo 188."
)

MSG_APOIO = (
    "Sinto muito que esteja tão pesado. Obrigado por me contar.\n\n"
    "Quando você fala em desistir, está pensando em se machucar ou em acabar com a sua vida? "
    "Pode me dizer com sinceridade.\n\n"
    "Você não precisa passar por isso sozinho(a). O CVV atende 24 horas pelo 188 (ligação "
    "gratuita), e se sentir que corre risco agora, ligue para o SAMU (192)."
)

# Respostas de seguimento: quando a pessoa responde a pergunta de segurança
MSG_CRISE_CONFIRMADA = (
    "Obrigado por ser sincero(a) comigo. Isso foi importante de dizer.\n\n"
    "Agora o mais importante é a sua segurança. Por favor, ligue para o SAMU (192) "
    "ou vá a uma UPA ou pronto-socorro. Se puder, chame alguém de confiança para ficar "
    "com você e afaste-se de qualquer coisa que possa usar para se machucar.\n\n"
    "O CVV atende 24 horas pelo 188, e também por chat no site cvv.org.br.\n\n"
    "Você não precisa passar por isso sozinho(a). Eu continuo aqui conversando com você."
)

MSG_CRISE_ALIVIO = (
    "Fico aliviado por saber disso. Mesmo assim, o que você está sentindo é sério "
    "e merece cuidado. Se algum momento ficar pesado demais, o CVV atende pelo 188, "
    "24 horas.\n\n"
    "Quer me contar o que está pesando mais agora?"
)

MSG_CRISE_ABERTO = (
    "Obrigado por continuar comigo. Quero entender melhor o que você está sentindo. "
    "Se em algum momento achar que pode se machucar, ligue para o SAMU (192) ou para o "
    "CVV (188).\n\n"
    "Pode me contar mais?"
)

SEGURANCA = {MSG_CRISE, MSG_APOIO, MSG_CRISE_CONFIRMADA}


# ==========================================
# 3. TEMAS E ETAPAS DA CONVERSA
# ==========================================
# Cada tema tem etapas:
#   0 = acolher e abrir a conversa
#   1 = aprofundar (perguntas diferentes da etapa 0)
#   2 = um passo pequeno / sugestao
# As etapas 3 (checar como a pessoa esta) e 4 (ponte para ajuda profissional)
# sao compartilhadas por todos os temas.
# A etapa 5 em diante e "conversa livre".

LIVRE = 5

TEMAS = {
    "mal": {
        0: [
            "Sinto muito que você esteja assim. Obrigado por me contar. "
            "Quer me dizer o que está pesando mais agora?",
            "Estou aqui com você. O que aconteceu para você se sentir tão mal?",
        ],
        1: [
            "Isso começou hoje ou já vem de alguns dias?",
            "Dá para apontar uma coisa que mais contribuiu para você se sentir assim?",
        ],
        2: [
            "Quando está tudo pesado, ajuda fazer só uma coisa pequena: beber um copo "
            "de água, abrir a janela ou respirar fundo por um minuto. "
            "Quer tentar um exercício de respiração agora?",
            "Você não precisa resolver tudo hoje. Existe alguém com quem você poderia "
            "conversar sobre isso, mesmo que seja só por mensagem?",
        ],
    },
    "ansiedade": {
        0: [
            "Sinto muito que esteja passando por isso. "
            "Quer me contar o que está provocando essa ansiedade?",
            "Vamos com calma. Você consegue identificar "
            "o que está deixando você ansioso(a) neste momento?",
        ],
        1: [
            "A ansiedade costuma vir com sinais no corpo, como coração acelerado, "
            "aperto no peito ou pensamentos que não param. O que você sente mais?",
            "Tem alguma situação específica deixando você assim, ou é uma sensação "
            "difícil de explicar?",
        ],
        2: [
            "Uma coisa que costuma ajudar é trazer a atenção para o agora. "
            "Quer tentar um exercício de respiração comigo?",
            "Posso te guiar na técnica 5-4-3-2-1, que ajuda a trazer a mente para o "
            "presente. Quer tentar?",
        ],
    },
    "tristeza": {
        0: [
            "Sinto muito que esteja se sentindo assim. "
            "Quer conversar sobre o que aconteceu?",
            "Você não precisa esconder seus sentimentos. "
            "Há quanto tempo vem se sentindo dessa maneira?",
        ],
        1: [
            "Essa tristeza vem de algo que aconteceu ou aparece sem um motivo claro?",
            "Nos últimos dias, o que tem sido mais difícil para você?",
        ],
        2: [
            "Quando estamos tristes, às vezes ajuda cuidar do básico: comer algo, "
            "tomar água, tomar um banho ou pegar um pouco de sol. "
            "Algo disso parece possível hoje?",
            "Falar com alguém de confiança também alivia. Tem uma pessoa para quem "
            "você poderia mandar uma mensagem hoje?",
        ],
    },
    "vicio": {
        0: [
            "Obrigado por compartilhar isso comigo. "
            "Você sente que está perdendo o controle sobre esse hábito?",
            "Reconhecer essa dificuldade é um passo importante. "
            "Você já tentou procurar ajuda para lidar com isso?",
        ],
        1: [
            "Em que momentos a vontade costuma ser mais forte: quando você está "
            "estressado(a), sozinho(a) ou em certos lugares?",
            "O que você sente depois de ceder a esse hábito?",
        ],
        2: [
            "Um passo pequeno é anotar quando a vontade aparece e o que aconteceu "
            "antes dela. Isso ajuda a perceber padrões. Já tentou fazer isso?",
            "Você não precisa enfrentar isso sozinho(a). Tem alguém de confiança que "
            "poderia saber o que você está passando?",
        ],
    },
    "familia": {
        0: [
            "Problemas familiares podem ser muito desgastantes. "
            "Quer me contar o que está acontecendo?",
            "Estou aqui para ouvir sem julgamentos. "
            "Como essa situação tem afetado você?",
        ],
        1: [
            "Quem está envolvido nessa situação e o que aconteceu?",
            "O que mais machuca você nessa situação?",
        ],
        2: [
            "Quando a conversa esquenta, às vezes ajuda dar um tempo e retomar depois. "
            "Como você costuma reagir nesses momentos?",
            "Tem algo que você gostaria de dizer a essa pessoa e não conseguiu? "
            "Pode escrever aqui, se quiser.",
        ],
    },
    "relacionamento": {
        0: [
            "Relacionamentos podem despertar sentimentos muito intensos. "
            "Quer conversar sobre o que aconteceu?",
            "Entendo que isso possa estar sendo difícil. "
            "O que mais está incomodando você nessa situação?",
        ],
        1: [
            "Há quanto tempo isso vem acontecendo?",
            "O que você gostaria que fosse diferente nessa situação?",
        ],
        2: [
            "Sentimentos assim vão e vêm. Enquanto isso, cuidar de você ajuda. "
            "O que costuma te fazer bem?",
            "Escrever o que você sente, sem enviar para ninguém, pode aliviar. "
            "Quer colocar aqui o que gostaria de dizer?",
        ],
    },
    "solidao": {
        0: [
            "Sentir-se sozinho(a) pode ser muito difícil. "
            "Você tem alguém de confiança com quem possa conversar?",
            "Obrigado por compartilhar isso. "
            "Você sente falta de companhia ou de alguém que realmente compreenda você?",
        ],
        1: [
            "Essa sensação de solidão é recente ou já vem de um tempo?",
            "Tem alguém, mesmo distante, de quem você sente falta?",
        ],
        2: [
            "Um passo pequeno: mandar uma mensagem simples para alguém, como "
            "\"oi, lembrei de você\". Parece possível?",
            "Atividades com outras pessoas, como cursos, esportes ou voluntariado, "
            "ajudam a criar vínculos. Algo assim te interessa?",
        ],
    },
    "estresse": {
        0: [
            "Parece que você está enfrentando muitas coisas ao mesmo tempo. "
            "Qual delas está pesando mais neste momento?",
            "Vamos tentar organizar essas preocupações. "
            "Qual seria uma pequena coisa que você poderia resolver hoje?",
        ],
        1: [
            "Se você pudesse tirar uma coisa da sua lista agora, qual seria?",
            "Esse cansaço é mais do corpo, da cabeça ou dos dois?",
        ],
        2: [
            "Pausas curtas fazem diferença. Quer tentar relaxar os ombros em um "
            "exercício rápido?",
            "Vale separar o que precisa ser feito hoje do que pode esperar. "
            "Qual seria a única coisa que vale resolver hoje?",
        ],
    },
    "autoestima": {
        0: [
            "Sei que pode ser difícil lidar com inseguranças. "
            "O que tem feito você se sentir assim?",
            "Seu valor não depende da opinião das outras pessoas. "
            "Quer conversar sobre suas inseguranças?",
        ],
        1: [
            "Que pensamentos aparecem quando você se sente assim sobre você mesmo(a)?",
            "Isso aparece mais em algum momento ou lugar específico?",
        ],
        2: [
            "Se um amigo estivesse no seu lugar e dissesse isso sobre si, "
            "o que você falaria para ele?",
            "Tente lembrar de uma coisa que você fez bem nesta semana, por menor que "
            "seja. Qual foi?",
        ],
    },
    "trauma": {
        0: [
            "Sinto muito que esteja passando por isso. "
            "Você não precisa compartilhar detalhes se não quiser. "
            "O que está sentindo neste momento?",
            "Podemos conversar no seu ritmo. "
            "Você está se sentindo seguro(a) agora?",
        ],
        1: [
            "Quando essas lembranças ou esse medo aparecem, o que costuma ajudar você "
            "a se acalmar, mesmo que só um pouco?",
            "Isso acontece em algum momento ou lugar em especial?",
        ],
        2: [
            "Experiências difíceis como essa costumam ser mais bem cuidadas com apoio "
            "de um psicólogo. Quer que eu te explique como buscar ajuda profissional "
            "gratuita?",
            "Enquanto isso, podemos ir no seu ritmo. Quer tentar um exercício de "
            "respiração para acalmar o corpo?",
        ],
    },
    "financeiro": {
        0: [
            "Problemas financeiros podem afetar bastante nosso emocional. "
            "Qual é sua maior preocupação neste momento?",
            "Vamos por partes. Você gostaria de organizar suas preocupações "
            "financeiras e pensar em possíveis soluções?",
        ],
        1: [
            "O que mais preocupa você: dívidas, falta de renda ou as contas do mês?",
            "Essa preocupação tem afetado seu sono ou seu humor?",
        ],
        2: [
            "Anotar tudo o que você deve, e quanto, em um papel ajuda a enxergar o "
            "tamanho real do problema e a priorizar. Você já fez isso?",
            "Procurar renegociar com os credores e buscar orientação gratuita em "
            "órgãos como o Procon pode ajudar. Você já tentou?",
        ],
    },
    "sono": {
        0: [
            "Problemas com o sono podem afetar bastante o dia a dia. "
            "Há quanto tempo isso vem acontecendo?",
            "Dormir mal pesa em tudo. O que costuma acontecer: você demora para "
            "pegar no sono ou acorda durante a noite?",
        ],
        1: [
            "Isso costuma acontecer por causa de preocupações ou o corpo está sem "
            "sono mesmo?",
            "Como é a sua rotina antes de dormir?",
        ],
        2: [
            "Alguns hábitos ajudam: evitar telas e cafeína perto da hora de dormir e "
            "manter horários parecidos todos os dias. Algum desses você consegue ajustar?",
            "Se a mente não desliga, um exercício de respiração antes de dormir pode "
            "ajudar. Quer tentar agora?",
        ],
    },
    # Exercicios guiados: so a etapa 0 (as instrucoes). Depois vai para a etapa 3.
    "respiracao": {
        0: [
            "Vamos fazer juntos, sem pressa:\n"
            "1. Inspire pelo nariz contando até 4.\n"
            "2. Segure o ar contando até 4.\n"
            "3. Solte devagar pela boca contando até 6.\n"
            "Repita 5 vezes, sem forçar.\n\n"
            "Quando terminar, me diga como você está.",
            "Vamos respirar juntos. Se puder, sente-se com as costas apoiadas:\n"
            "1. Solte todo o ar pela boca.\n"
            "2. Inspire pelo nariz contando até 4.\n"
            "3. Expire devagar contando até 6.\n"
            "Faça isso 5 vezes, no seu ritmo.\n\n"
            "Me conta como você ficou depois.",
        ],
    },
    "cinco_sentidos": {
        0: [
            "Vamos trazer a atenção para o agora, olhando ao redor:\n"
            "5 coisas que você consegue ver\n"
            "4 coisas que consegue tocar\n"
            "3 sons que consegue ouvir\n"
            "2 cheiros que consegue sentir\n"
            "1 gosto que consegue perceber\n\n"
            "Faça com calma e me avise quando terminar.",
        ],
    },
    "ombros": {
        0: [
            "Vamos soltar a tensão do corpo:\n"
            "1. Levante os ombros em direção às orelhas e segure por 5 segundos.\n"
            "2. Solte de uma vez e sinta o alívio.\n"
            "3. Gire os ombros para trás 5 vezes, devagar.\n"
            "4. Incline a cabeça para um lado e depois para o outro, sem forçar.\n\n"
            "Me conta como o corpo ficou.",
        ],
    },
    # Temas leves
    "bem": {
        0: [
            "Que bom saber disso! O que aconteceu de positivo no seu dia?",
            "Fico feliz em ouvir isso! O que tem ajudado você a se sentir bem?",
        ],
        1: [
            "Que legal. Vale guardar esse momento. Tem algo que você quer fazer para "
            "continuar assim?",
        ],
        2: [
            "Manter o que faz bem é importante. Quer me contar mais sobre o seu dia?",
        ],
        3: [],
        4: [],
    },
    "saudacao": {
        0: [
            "Olá! Seja bem-vindo(a). Como posso ajudar você hoje?",
            "Oi! Fique à vontade para conversar. O que está acontecendo?",
        ],
    },
    "obrigado": {
        0: [
            "Fico feliz em poder conversar com você. "
            "Lembre-se de que buscar apoio também é importante.",
            "Eu que agradeço por confiar em mim. Estou por aqui quando precisar.",
        ],
    },
}

# Temas que nao guardam o "ponto da conversa" (nao interrompem o assunto atual)
SEM_ESTADO = {"saudacao", "obrigado"}

EXERCICIOS = {"respiracao", "cinco_sentidos", "ombros"}

# Se a pessoa esta falando de um sintoma (ansiedade, tristeza...) e cita a causa
# (trabalho, familia...), seguimos para o tema da causa sem recomecar do zero.
SINTOMAS = {"mal", "ansiedade", "tristeza", "trauma", "sono"}
CAUSAS = {"estresse", "familia", "relacionamento", "solidao", "financeiro", "autoestima", "vicio"}

# Etapas compartilhadas por todos os temas
CHECAR = [
    "Como você está se sentindo agora, depois dessa conversa? "
    "Um pouco melhor, igual ou pior?",
    "Antes de seguir, quero saber: o que mudou em você desde o começo da nossa conversa?",
]

PONTE = [
    "Percebo que isso tem pesado em você. Conversar com um psicólogo pode ajudar a "
    "cuidar disso com mais profundidade. Quer que eu te explique como buscar ajuda "
    "profissional gratuita?",
    "Você tem se esforçado bastante para lidar com isso. Se esse sentimento continuar "
    "por vários dias, vale conversar com um profissional de saúde mental. Posso te "
    "contar como buscar ajuda profissional gratuita?",
]

COMPARTILHADO = {3: CHECAR, 4: PONTE}

FECHAR_POSITIVO = [
    "Fico feliz que tenha ajudado um pouco. Você pode voltar aqui quando precisar, "
    "e conversar com pessoas próximas também faz bem. Quer falar de mais alguma coisa?",
    "Que bom ouvir isso. Cuide de você com carinho. Se quiser, podemos conversar "
    "sobre outro assunto.",
]

# Conversa livre (depois que o roteiro de etapas acabou)
CONTINUAR = [
    "Estou ouvindo. O que mais está passando pela sua cabeça?",
    "E como isso tem mexido com você no dia a dia?",
    "Obrigado por continuar me contando. O que você acha que poderia ajudar agora?",
    "Faz sentido sentir isso. Tem algo que você gostaria de tentar ou mudar?",
    "Quer me contar mais, ou prefere fazer um exercício de respiração?",
    "Estou aqui. Pode falar do jeito que vier.",
]

# Quando a pessoa nao sabe responder
INDECISO_RESP = [
    "Tudo bem não saber. Podemos ir mais devagar. Quando quiser, me conta qualquer "
    "coisa que esteja passando pela sua cabeça, mesmo que pareça pequena.",
    "Sem pressa. Posso fazer uma pergunta mais simples: hoje o seu dia está sendo "
    "mais leve ou mais pesado?",
]

# Quando a conversa nao tem assunto ainda
GENERICAS = [
    "Entendi. Pode me contar um pouco mais sobre isso?",
    "Estou ouvindo. Como essa situação tem afetado seu dia?",
    "Obrigado por compartilhar seus sentimentos. "
    "O que você acha que poderia ajudar neste momento?",
    "Quero compreender melhor sua situação. Você poderia me explicar um pouco mais?",
    "Como você tem se sentido nos últimos dias, de forma geral?",
]

VALIDACOES = [
    "Entendo.",
    "Obrigado por me contar.",
    "Imagino que não seja fácil.",
    "Faz sentido você se sentir assim.",
]

TEXTO_PROFISSIONAL = (
    "Conversar com um psicólogo ou psiquiatra pode fazer muita diferença, e existem "
    "opções gratuitas: o CAPS e a UBS da sua cidade atendem pelo SUS, e muitas "
    "faculdades de Psicologia têm clínicas-escola com atendimento gratuito ou de "
    "baixo custo. O CVV (188) também ouve você 24 horas.\n\n"
    "Por aqui, eu ainda não consigo conectar você a um profissional, mas posso "
    "continuar te ouvindo. Como você está agora?"
)

# Se a ultima mensagem do bot ofereceu algo e a pessoa disse "sim"
OFERTAS = [
    ("exercicio de respiracao", "respiracao"),
    ("5-4-3-2-1", "cinco_sentidos"),
    ("relaxar os ombros", "ombros"),
    ("ajuda profissional gratuita", "profissional"),
]

# Palavras-chave de cada tema (ordem importa: o primeiro que casar vence)
PADROES = [
    ("cinco_sentidos", r"\b(5-4-3-2-1|5 4 3 2 1|cinco sentidos|grounding|ancoragem)\b"),
    ("ombros", r"\b(ombros?|tensao muscular|relaxamento muscular|musculos?)\b"),
    ("respiracao", r"\b(respiracao|respirar|relaxar|calma|exercicio)\b"),
    ("mal", r"\b(muito mal|nao estou bem|nao ando bem|nao ando passando bem|pessimo|horrivel|destruid\w*)\b"),
    ("ansiedade", r"\b(ansios\w*|ansiedade|nervos\w*|panico|agita\w*)\b"),
    ("tristeza", r"\b(trist\w*|deprim\w*|desanim\w*|vazio|chor\w*)\b"),
    ("vicio", r"\b(vici\w*|dependencia|fum\w*|cigarro|bebid\w*|beb\w*|drogas|maconha|apostas|apostar)\b"),
    ("familia", r"\b(familia|pais|mae|pai|irmao|briga\w*|conflito\w*)\b"),
    ("relacionamento", r"\b(namoro|namorad\w*|termin\w*|ex|relacionamento|ciumes|rejeicao)\b"),
    ("solidao", r"\b(solidao|sozinho|sozinha|isolado\w*|amigos)\b"),
    ("estresse", r"\b(estress\w*|sobrecarreg\w*|pressao|trabalho|cansad\w*)\b"),
    ("autoestima", r"\b(autoestima|aparencia|inferior|insegur\w*|julgad\w*)\b"),
    ("trauma", r"\b(trauma\w*|medo\w*|assustad\w*|lembranca\w*)\b"),
    ("financeiro", r"\b(divida\w*|dinheiro|financeir\w*|contas|falencia)\b"),
    ("sono", r"\b(dormir|sono|insonia|acordei|pesadelo\w*)\b"),
    ("saudacao", r"\b(oi|ola|bom dia|boa tarde|boa noite)\b"),
    ("obrigado", r"\b(obrigad\w*|valeu)\b"),
    ("bem", r"\b(estou feliz|estou animado|estou animada|estou otimo|estou otima|hoje estou bem|estou tranquilo|estou tranquila|estou bem)\b"),
]
PADROES = [(tema, re.compile(p)) for tema, p in PADROES]

PEDIR_PROFISSIONAL = re.compile(
    r"\b(psicolog\w*|psiquiatr\w*|terapeuta|terapia|ajuda profissional|"
    r"atendimento|falar com (um |uma )?(pessoa|humano|alguem|profissional))\b"
)

# Respostas curtas: sim / nao / nao sei / melhor / pior
_CLASSES = [
    ("indeciso", re.compile(r"\b(nao sei|talvez|mais ou menos|sei la|nao entendi|nao entendo|depende)\b")),
    ("negativo", re.compile(r"\b(pior|igual|continuo|continua|nada mudou|nao ajudou|nao melhorou|ainda mal|ainda estou mal)\b")),
    ("positivo", re.compile(r"\b(melhor|melhorou|melhorei|mais calm\w*|aliviad\w*|ajudou|mais leve)\b")),
    ("sim", re.compile(r"^(sim|s|claro|quero|aham|uhum|ok|certo|pode|pode ser|feito|pronto|terminei|consegui|vamos|bora|isso|com certeza)\b")),
    ("nao", re.compile(r"^(nao|n|nunca|nada|nenhum\w*|agora nao)\b")),
]


# ==========================================
# 4. INDICE: reconhece em que ponto da conversa o bot parou
# ==========================================

INDICE = {}
for _tema, _etapas in TEMAS.items():
    if _tema in SEM_ESTADO:
        continue
    for _etapa, _textos in _etapas.items():
        for _t in _textos:
            INDICE[_t] = (_tema, _etapa)
for _etapa, _textos in COMPARTILHADO.items():
    for _t in _textos:
        INDICE[_t] = ("_geral", _etapa)
for _t in FECHAR_POSITIVO + CONTINUAR:
    INDICE[_t] = ("_geral", LIVRE)


# ==========================================
# 5. DETECCAO DE CRISE
# ==========================================

def nivel_risco(texto):
    """Devolve 'alto', 'medio' ou None."""
    t = normalizar(texto)
    if CRISE_ALTA.search(t):
        return "alto"
    if CRISE_MEDIA.search(t):
        return "medio"
    return None


def em_crise(texto):
    return nivel_risco(texto) is not None


def resposta_de_seguranca(resposta):
    """True se a resposta for uma das mensagens de seguranca."""
    return resposta in SEGURANCA


# ==========================================
# 6. FUNCOES AUXILIARES DA CONVERSA
# ==========================================

def _classe(t):
    """Classifica respostas curtas (ate 6 palavras)."""
    if len(t.split()) > 6:
        return None
    for nome, padrao in _CLASSES:
        if padrao.search(t):
            return nome
    return None


def _detectar_tema(t):
    for tema, padrao in PADROES:
        if tema == "saudacao" and len(t.split()) > 4:
            continue
        if padrao.search(t):
            return tema
    return None


def _mensagens_bot(historico, limite):
    msgs = [h for h in historico if h.get("autor") == "bot"]
    return msgs[-limite:]


def _estado(historico):
    """Descobre (tema, etapa) da ultima fala do bot que fazia parte de um roteiro."""
    for item in reversed(_mensagens_bot(historico, 6)):
        achado = None
        for texto, info in INDICE.items():
            if texto in item["texto"] and (achado is None or len(texto) > len(achado[0])):
                achado = (texto, info)
        if achado:
            return achado[1]
    return None


def _pool(tema, etapa):
    if etapa >= LIVRE:
        return CONTINUAR
    if tema in TEMAS and etapa in TEMAS[tema]:
        return TEMAS[tema][etapa]
    return COMPARTILHADO.get(etapa, [])


def _foi_usada(texto, usados):
    return any(texto in m for m in usados)


def _montar(tema, inicio, usados):
    """Escolhe a proxima fala a partir da etapa 'inicio', sem repetir o que ja foi dito."""
    for etapa in range(inicio, LIVRE):
        livres = [t for t in _pool(tema, etapa) if not _foi_usada(t, usados)]
        if livres:
            return random.choice(livres), etapa
    livres = [t for t in CONTINUAR if not _foi_usada(t, usados)] or CONTINUAR
    return random.choice(livres), LIVRE


def _escolher(opcoes, usados):
    livres = [t for t in opcoes if not _foi_usada(t, usados)] or opcoes
    return random.choice(livres)


def _prefixo(texto_original, etapa, classe):
    """Espelha o que a pessoa disse (etapa 1) ou valida o sentimento (etapa 1 e 2)."""
    if classe is not None or etapa not in (1, 2):
        return ""
    limpo = texto_original.strip().rstrip(".!?… ")
    palavras = len(limpo.split())
    if etapa == 1 and 4 <= palavras <= 20 and len(limpo) <= 100:
        return f"Você escreveu: \u201c{limpo}\u201d.\n\n"
    if random.random() < 0.5:
        return random.choice(VALIDACOES) + "\n\n"
    return ""


def _seguimento_crise(t):
    """A pessoa respondeu a pergunta de seguranca feita pelo bot."""
    classe = _classe(t)
    if classe in ("sim", "indeciso"):
        return MSG_CRISE_CONFIRMADA
    if classe == "nao":
        return MSG_CRISE_ALIVIO
    return MSG_CRISE_ABERTO


# ==========================================
# 7. GERADOR DE RESPOSTAS
# ==========================================

def gerar_resposta(texto, historico=None):
    """
    texto: mensagem atual da pessoa.
    historico: lista de {"autor": "eu"|"bot", "texto": str, "alerta": bool}
               com as mensagens anteriores (sem a atual).
    """
    historico = historico or []

    # Seguranca sempre em primeiro lugar
    nivel = nivel_risco(texto)
    if nivel == "alto":
        return MSG_CRISE
    if nivel == "medio":
        return MSG_APOIO

    t = normalizar(texto)
    bots = _mensagens_bot(historico, 20)
    usados = [b["texto"] for b in bots]
    ultimo_bot = bots[-1] if bots else None

    # A pessoa esta respondendo a pergunta de seguranca
    if ultimo_bot and ultimo_bot.get("alerta"):
        return _seguimento_crise(t)

    # Pediu ajuda de um profissional
    if PEDIR_PROFISSIONAL.search(t):
        return TEXTO_PROFISSIONAL

    classe = _classe(t)
    estado = _estado(historico)

    # Disse "sim" para algo que o bot ofereceu
    if ultimo_bot and classe == "sim":
        anterior = normalizar(ultimo_bot["texto"])
        for chave, tema in OFERTAS:
            if chave in anterior:
                if tema == "profissional":
                    return TEXTO_PROFISSIONAL
                fala, _ = _montar(tema, 0, usados)
                return fala

    tema = _detectar_tema(t)

    # Saudacao e agradecimento nao interrompem o assunto
    if tema in SEM_ESTADO:
        return _escolher(TEMAS[tema][0], usados)

    # Comeco de conversa
    if estado is None:
        if tema:
            fala, _ = _montar(tema, 0, usados)
            return fala
        return _escolher(GENERICAS, usados)

    tema_atual, etapa_atual = estado

    # Respostas curtas que mudam o rumo
    if classe == "positivo" and (etapa_atual >= 3 or tema_atual in EXERCICIOS):
        return _escolher(FECHAR_POSITIVO, usados)
    if classe == "negativo" and (etapa_atual >= 3 or tema_atual in EXERCICIOS):
        fala, _ = _montar("_geral", 4, usados)
        return fala
    if classe == "indeciso":
        return _escolher(INDECISO_RESP, usados)

    # Mudou de assunto
    if tema and tema != tema_atual:
        if tema in CAUSAS and tema_atual in SINTOMAS and etapa_atual <= 2:
            inicio = 1  # a conversa ja esta aberta: pula o acolhimento
        else:
            inicio = 0
        fala, etapa = _montar(tema, inicio, usados)
        return _prefixo(texto, etapa, classe) + fala

    # Segue o roteiro do assunto atual
    recuo = ""
    if classe == "nao" and etapa_atual == 2:
        inicio = etapa_atual  # tenta a outra sugestao da mesma etapa
        recuo = "Tudo bem. "
    else:
        inicio = etapa_atual + 1

    fala, etapa = _montar(tema_atual, inicio, usados)
    return recuo + _prefixo(texto, etapa, classe) + fala


# ==========================================
# 8. TESTE NO TERMINAL (python bot.py)
# ==========================================

if __name__ == "__main__":
    print("Chatbot de Apoio Emocional")
    print("Digite 'sair' para encerrar.\n")

    conversa = []

    while True:
        mensagem = input("Você: ")

        if normalizar(mensagem) == "sair":
            print("Bot: Obrigado pela conversa. Cuide-se!")
            break

        resposta = gerar_resposta(mensagem, conversa)
        alerta = em_crise(mensagem) or resposta_de_seguranca(resposta)

        conversa.append({"autor": "eu", "texto": mensagem, "alerta": False})
        conversa.append({"autor": "bot", "texto": resposta, "alerta": alerta})

        print("\nBot:", resposta)
        print()