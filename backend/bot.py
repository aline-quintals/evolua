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
# Os padroes ja estao sem acento, porque o texto e normalizado antes.

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


# ==========================================
# 3. REGRAS DE CONVERSACAO
# ==========================================

REGRAS = [

    (r"\b(muito mal|nao estou bem|nao ando bem|nao ando passando bem|pessimo|horrivel|destruid\w*)\b", [
        "Sinto muito que você esteja assim. Obrigado por me contar. "
        "Quer me dizer o que está pesando mais agora?",

        "Estou aqui com você. O que aconteceu para você se sentir tão mal?"
    ]),

    (r"\b(ansios\w*|ansiedade|nervos\w*|panico|agita\w*)\b", [
        "Sinto muito que esteja passando por isso. "
        "Quer me contar o que está provocando essa ansiedade?",

        "Vamos com calma. Você consegue identificar "
        "o que está deixando você ansioso neste momento?"
    ]),

    (r"\b(trist\w*|deprim\w*|desanim\w*|vazio|chor\w*)\b", [
        "Sinto muito que esteja se sentindo assim. "
        "Quer conversar sobre o que aconteceu?",

        "Você não precisa esconder seus sentimentos. "
        "Há quanto tempo vem se sentindo dessa maneira?"
    ]),

    (r"\b(vici\w*|dependencia|fum\w*|cigarro|bebid\w*|beb\w*|drogas|maconha|apostas|apostar)\b", [
        "Obrigado por compartilhar isso comigo. "
        "Você sente que está perdendo o controle sobre esse hábito?",

        "Reconhecer essa dificuldade é um passo importante. "
        "Você já tentou procurar ajuda para lidar com isso?"
    ]),

    (r"\b(familia|pais|mae|pai|irmao|briga\w*|conflito\w*)\b", [
        "Problemas familiares podem ser muito desgastantes. "
        "Quer me contar o que está acontecendo?",

        "Estou aqui para ouvir sem julgamentos. "
        "Como essa situação tem afetado você?"
    ]),

    (r"\b(namoro|namorad\w*|termin\w*|ex|relacionamento|ciumes|rejeicao)\b", [
        "Relacionamentos podem despertar sentimentos muito intensos. "
        "Quer conversar sobre o que aconteceu?",

        "Entendo que isso possa estar sendo difícil. "
        "O que mais está incomodando você nessa situação?"
    ]),

    (r"\b(solidao|sozinho|sozinha|isolado\w*|amigos)\b", [
        "Sentir-se sozinho pode ser muito difícil. "
        "Você tem alguém de confiança com quem possa conversar?",

        "Obrigado por compartilhar isso. "
        "Você sente falta de companhia ou de alguém que realmente compreenda você?"
    ]),

    (r"\b(estress\w*|sobrecarreg\w*|pressao|trabalho|cansad\w*)\b", [
        "Parece que você está enfrentando muitas coisas ao mesmo tempo. "
        "Qual delas está pesando mais neste momento?",

        "Vamos tentar organizar essas preocupações. "
        "Qual seria uma pequena coisa que você poderia resolver hoje?"
    ]),

    (r"\b(autoestima|aparencia|inferior|insegur\w*|julgad\w*)\b", [
        "Sei que pode ser difícil lidar com inseguranças. "
        "O que tem feito você se sentir assim?",

        "Seu valor não depende da opinião das outras pessoas. "
        "Quer conversar sobre suas inseguranças?"
    ]),

    (r"\b(trauma\w*|medo\w*|assustad\w*|lembranca\w*)\b", [
        "Sinto muito que esteja passando por isso. "
        "Você não precisa compartilhar detalhes se não quiser. "
        "O que está sentindo neste momento?",

        "Podemos conversar no seu ritmo. "
        "Você está se sentindo seguro agora?"
    ]),

    (r"\b(divida\w*|dinheiro|financeir\w*|contas|falencia)\b", [
        "Problemas financeiros podem afetar bastante nosso emocional. "
        "Qual é sua maior preocupação neste momento?",

        "Vamos por partes. Você gostaria de organizar suas preocupações "
        "financeiras e pensar em possíveis soluções?"
    ]),

    (r"\b(dormir|sono|insonia|acordei|pesadelo\w*)\b", [
        "Problemas com o sono podem afetar bastante o dia a dia. "
        "Há quanto tempo isso vem acontecendo?"
    ]),

    (r"\b(respiracao|respirar|relaxar|calma|exercicio)\b", [
        "Vamos tentar um exercício simples:\n"
        "1. Inspire pelo nariz contando 4.\n"
        "2. Segure o ar contando 4.\n"
        "3. Solte devagar pela boca contando 6.\n"
        "Repita 5 vezes, sem forçar.\n\n"
        "Como você está se sentindo?"
    ]),

    (r"\b(oi|ola|bom dia|boa tarde|boa noite)\b", [
        "Olá! Seja bem-vindo. Como posso ajudar você hoje?",

        "Oi! Fique à vontade para conversar. "
        "O que está acontecendo?"
    ]),

    (r"\b(obrigad\w*|valeu)\b", [
        "Fico feliz em poder conversar com você. "
        "Lembre-se de que buscar apoio também é importante."
    ]),

    (r"\b(estou feliz|estou animado|estou animada|estou otimo|estou otima|hoje estou bem|estou tranquilo|estou tranquila|estou bem)\b", [
        "Que bom saber disso! O que aconteceu de positivo no seu dia?"
    ])
]


# ==========================================
# 4. RESPOSTAS GENERICAS
# ==========================================

GENERICAS = [
    "Entendi. Pode me contar um pouco mais sobre isso?",

    "Estou ouvindo. Como essa situação tem afetado seu dia?",

    "Obrigado por compartilhar seus sentimentos. "
    "O que você acha que poderia ajudar neste momento?",

    "Quero compreender melhor sua situação. "
    "Você poderia me explicar um pouco mais?"
]

_ultima = {"texto": None}


def _sortear(opcoes):
    """Sorteia uma resposta evitando repetir a anterior."""
    candidatas = [o for o in opcoes if o != _ultima["texto"]] or opcoes
    escolhida = random.choice(candidatas)
    _ultima["texto"] = escolhida
    return escolhida


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


# ==========================================
# 6. GERADOR DE RESPOSTAS
# ==========================================

def gerar_resposta(texto):
    # Seguranca sempre em primeiro lugar
    nivel = nivel_risco(texto)
    if nivel == "alto":
        return MSG_CRISE
    if nivel == "medio":
        return MSG_APOIO

    t = normalizar(texto)
    for padrao, respostas in REGRAS:
        if re.search(padrao, t):
            return _sortear(respostas)

    return _sortear(GENERICAS)


# ==========================================
# 7. TESTE NO TERMINAL (python bot.py)
# ==========================================

if __name__ == "__main__":
    print("Chatbot de Apoio Emocional")
    print("Digite 'sair' para encerrar.\n")

    while True:
        mensagem = input("Você: ")

        if normalizar(mensagem) == "sair":
            print("Bot: Obrigado pela conversa. Cuide-se!")
            break

        print("\nBot:", gerar_resposta(mensagem))
        print()