import random
import re
import unicodedata

#=========================================
#normalizacao de texto
#=========================================

def normalizar(texto):
    texto = texto.lower().strip()
    texto = unicodedata.normalize('NFKD', texto)
    texto = "".join(
        c for c in texto
        if unicodedata.category(c) != 'Mn'
    )
    return texto
# ==========================================
# 2. DETECCAO DE SITUACOES DE RISCO
# ==========================================

CRISE = re.compile(
    r"\b("
    r"me matar|"
    r"suicid\w*|"
    r"acabar com tudo|"
    r"nao quero mais viver|"
    r"quero morrer|"
    r"tirar minha vida|"
    r"me machucar|"
    r"me ferir|"
    r"automutil\w*|"
    r"me cortar|"
    r"nao aguento mais viver"
    r")\b",
    re.IGNORECASE
)

MSG_CRISE = (
    "Sinto muito que você esteja passando por isso. "
    "Obrigado por confiar em mim.\n\n"
    "Quero entender melhor: você está pensando em se "
    "machucar ou tirar sua própria vida neste momento? "
    "Está em perigo imediato?\n\n"
    "Se houver risco imediato, procure uma UPA ou pronto-socorro "
    "ou ligue para o SAMU (192). Se possível, não fique sozinho, "
    "avise alguém de confiança e afaste-se de qualquer coisa "
    "que possa utilizar para se machucar.\n\n"
    "O CVV também oferece apoio emocional gratuito pelo 188."
)


# ==========================================
# 3. REGRAS DE CONVERSACAO
# ==========================================

REGRAS = [

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

    (r"\b(vici\w*|dependencia|fumar|cigarro|bebida|drogas|apostas|apostar)\b", [
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

    (r"\b(respiracao|respirar|relaxar|calma)\b", [
        "Vamos tentar um exercício simples:\n"
        "1. Inspire suavemente pelo nariz.\n"
        "2. Solte o ar devagar.\n"
        "3. Repita algumas vezes, sem forçar.\n\n"
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

    (r"\b(estou feliz|estou animado|estou otimo|hoje estou bem|estou tranquilo)\b", [
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


# ==========================================
# 5. FUNCAO DE DETECCAO DE CRISE
# ==========================================

def em_crise(texto):
    texto = normalizar(texto)
    return bool(CRISE.search(texto))


# ==========================================
# 6. GERADOR DE RESPOSTAS
# ==========================================

def gerar_resposta(texto):

    texto = normalizar(texto)

    # Seguranca sempre em primeiro lugar
    if em_crise(texto):
        return MSG_CRISE

    # Procura uma regra correspondente
    for padrao, respostas in REGRAS:

        if re.search(padrao, texto):
            return random.choice(respostas)

    # Resposta padrao
    return random.choice(GENERICAS)


# ==========================================
# 7. INICIAR CHATBOT
# ==========================================

# ==========================================
# 7. INICIAR CHATBOT (só quando rodar python bot.py)
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