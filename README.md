# 🌙 Evolua

**Tecnologia, autocuidado e apoio para a saúde mental.**

> Projeto desenvolvido pela **NubyTech Company Technology**.

## Integrantes do Grupo

ALINE QUINTAL SABINO DE LIMA - 2026110350
ENZO VICTOR PEREIRA DE SOUZA SILVA - 2026115002
GIOVANA JERONIMO HISSA LEITE - 2026107753
RICARDO NASCIMENTO DA SILVA JUNIOR - 2026114670
RYAN TEOFILO DA COSTA - 2026105964
SOPHIA DIAS FREIRE VICENTE - 2026105286

---

## 📌 Sobre o projeto

O **Evolua** é uma aplicação digital voltada à promoção da saúde mental, prevenção dos impactos do uso abusivo de álcool e outras substâncias e incentivo ao autocuidado.

A plataforma reúne, em um único ambiente:

- 🧠 Acompanhamento emocional
- 🎯 Metas pessoais
- 📈 Registro e acompanhamento de progresso
- 📝 Notas pessoais
- 📚 Conteúdos educativos
- 🧩 Quizzes informativos
- 🤝 Informações sobre redes e serviços de apoio
- 📞 Contatos de confiança

O Evolua é uma **ferramenta de apoio e educação em saúde** e não substitui avaliação, diagnóstico ou tratamento realizado por profissionais habilitados.

---

## 🎯 Problema

O projeto busca facilitar o acesso à informação, ao acompanhamento do bem-estar emocional e à busca por ajuda relacionada à saúde mental e ao uso de álcool e outras substâncias.

Entre os principais desafios estão:

- Dificuldade de perceber mudanças no estado emocional;
- Falta de acompanhamento da própria evolução;
- Dificuldade para encontrar informações e serviços de apoio;
- Necessidade de maior acesso à prevenção e educação em saúde.

### 👥 Público-alvo

**Público prioritário:** pessoas do sexo feminino e masculino que enfrentam dificuldades relacionadas à saúde mental ou ao consumo de álcool e outras substâncias.

**Públicos complementares:**

- Pessoas interessadas em acompanhar o próprio bem-estar;
- Pessoas que desejam reduzir ou interromper o consumo de substâncias;
- Familiares e amigos que buscam informações para apoiar alguém;
- Pessoas interessadas em prevenção, autocuidado e educação em saúde.

---

## 💡 Solução

O Evolua propõe uma plataforma que permite ao usuário acompanhar seu bem-estar e sua evolução pessoal, além de encontrar informações confiáveis e caminhos para buscar ajuda.

A proposta inclui:

- Registro de sentimentos e observações;
- Definição de metas;
- Acompanhamento de períodos sem consumo;
- Relatórios pessoais;
- Conteúdos educativos;
- Quizzes;
- Informações sobre serviços de saúde e acolhimento;
- Cadastro opcional de contatos de confiança.

Recursos como teleatendimento e atendimento emergencial dependerão de implementação, validação técnica, jurídica, operacional e de segurança.

---

## 🛠️ Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Cadastro e login | Criação e acesso à conta |
| Registro emocional | Registro e acompanhamento dos sentimentos |
| Notas pessoais | Anotações e reflexões privadas |
| Metas pessoais | Definição de objetivos |
| Acompanhamento | Visualização da evolução ao longo do tempo |
| Períodos sem consumo | Registro de períodos informados pelo usuário |
| Quizzes | Questionários educativos |
| Conteúdo educativo | Informações baseadas em fontes confiáveis |
| Rede de apoio | Informações sobre serviços de saúde e acolhimento |
| Contatos de confiança | Cadastro opcional de contatos úteis |
| Relatórios | Resumo de registros, metas e progresso |
| Chat de apoio | Conversa de acolhimento, exercícios guiados e leitura das respostas em voz alta |

As funcionalidades poderão ser ajustadas durante o desenvolvimento e os testes com usuários.

---

## 📊 Fontes de dados

O projeto utiliza como referência fontes públicas e confiáveis:

- **DATASUS** — dados e indicadores de saúde;
- **OBID** — informações sobre drogas e políticas relacionadas;
- **IBGE** — dados demográficos e sociais;
- **OMS** — informações e estatísticas internacionais de saúde.

Antes da publicação de dados ou gráficos, devem ser registradas a fonte, publicação/tabela, período analisado, data de acesso e critérios utilizados.

---

## 💻 Tecnologias

### Front-end
- **HTML5** — estrutura das páginas
- **CSS3** — estilos, layout e responsividade
- **JavaScript** — interações e regras da aplicação

### Back-end
- **Node.js**
- **Express**
- **API REST**

### Banco de dados
- **MySQL**

### Segurança
- **bcrypt** — hash de senhas
- **JWT** — autenticação e autorização

### Ferramentas
- **Git**
- **GitHub**
- **Visual Studio Code**
- **Google Fonts**

A arquitetura foi planejada para permitir cadastro, autenticação, registros emocionais, metas, quizzes, acompanhamento de progresso e armazenamento dos dados.

### Chat de apoio (implementação atual)
- **App:** React Native com Expo (Expo Router) e TypeScript, funcionando na web e no celular
- **Servidor do chat:** Python com **FastAPI** e **Uvicorn** (pasta `backend`)
- **Banco do chat:** **SQLite** (arquivo local `evolua.db`, criado automaticamente)
- **Voz:** leitura das respostas com `expo-speech`

---

## ▶️ Como rodar o projeto

O Evolua tem **duas partes que rodam ao mesmo tempo**: o **app** e o **servidor do chat**. Para o chat funcionar, o servidor precisa ficar ligado em um terminal enquanto o app está aberto.

### 1. O que instalar antes

| Programa | Para quê | Onde baixar |
|---|---|---|
| **Git** | Baixar o projeto | https://git-scm.com |
| **Node.js** (versão LTS) | Rodar o app | https://nodejs.org |
| **Python 3.10 ou superior** | Rodar o servidor do chat | https://python.org (na instalação, marque **"Add Python to PATH"**) |
| **Visual Studio Code** | Editar e abrir os terminais (opcional) | https://code.visualstudio.com |
| **Expo Go** (opcional) | Testar no celular | App Store ou Google Play |

### 2. Baixar o projeto

```bash
git clone <link-do-repositório>
cd evolua
```

### 3. Instalar as dependências do app

Na pasta do projeto:

```bash
npm install
```

### 4. Instalar as dependências do servidor do chat

```bash
cd backend
python -m pip install -r requirements.txt
```

Isso instala o **FastAPI** e o **Uvicorn**. O banco de dados do chat (`evolua.db`) é criado sozinho na primeira vez que o servidor liga.

### 5. Ligar o servidor do chat (terminal 1)

Dentro da pasta `backend`:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Deixe esse terminal **aberto**. Se ele for fechado, o chat para de funcionar.
- Para conferir, abra `http://127.0.0.1:8000` no navegador. Deve aparecer `{"status":"Evolua no ar"}`.
- Para **parar** o servidor, clique no terminal e aperte `Ctrl + C`.

### 6. Ligar o app (terminal 2)

Em **outro terminal**, na pasta do projeto:

```bash
npx expo start
```

- Aperte **w** para abrir no navegador; ou
- Leia o **QR Code** com o app **Expo Go** no celular.

### 7. Testar no celular

1. O celular e o computador precisam estar **na mesma rede Wi-Fi**.
2. Descubra o IP do computador: no Windows, rode `ipconfig` e copie o **Endereço IPv4** do Wi-Fi.
3. No arquivo `src/config.ts`, atualize a linha:

   ```ts
   const IP_DO_PC = "SEU_IP_AQUI";
   ```

4. Se o celular não conectar, libere a porta 8000 no firewall do Windows (PowerShell **como administrador**):

   ```powershell
   netsh advfirewall firewall add rule name="Evolua 8000" dir=in action=allow protocol=TCP localport=8000
   ```

> O IP do computador pode mudar ao trocar de rede. Se o chat voltar a falhar no celular, confira o `ipconfig` de novo e atualize o `config.ts`.

### Problemas comuns

| Problema | O que fazer |
|---|---|
| `uvicorn` não é reconhecido | Use `python -m uvicorn ...` (com `python -m` na frente) |
| `python` não é reconhecido | Reinstale o Python marcando **"Add Python to PATH"** ou use `py` no lugar de `python` |
| Chat mostra "Falha ao conectar" | O servidor está desligado ou o IP no `config.ts` está errado |
| Celular não conecta, mas o navegador do PC sim | Confira se estão no mesmo Wi-Fi, o IP no `config.ts` e o firewall (passo 7) |
| `Unable to resolve module ...` | Instale o pacote que faltou com `npx expo install nome-do-pacote` |
| O botão "Ouvir" não fala no iPhone | Baixe uma voz em português em **Ajustes > Acessibilidade > Conteúdo Falado > Vozes** |

### Sobre o chat

O chat de apoio é um **assistente baseado em regras**, e não uma inteligência artificial nem um profissional de saúde. Ele acolhe, faz perguntas, sugere exercícios simples (respiração, técnica 5-4-3-2-1 e relaxamento dos ombros) e **identifica mensagens de risco**, orientando a pessoa a procurar o **SAMU (192)** ou o **CVV (188)**. Ele **não substitui** acompanhamento profissional.

---

## 🎨 Identidade visual

### Conceito

O nome **Evolua** representa transformação, continuidade e desenvolvimento pessoal.

A identidade visual utiliza como conceito os **ciclos da lua e suas fases**, simbolizando mudanças graduais e evolução.

### Logo

Logo minimalista com **lua cheia central e fases lunares ao fundo**.

📁 `assets/logo-evolua.jpg`

### 🎨 Paleta de cores

####  Principais
- Azul Evolua — #4A7BD9
- Azul Céu — #A7C8FF
- Azul Gelo — #D7E6FF
- Lilás — #B79CFF
- Lavanda — #E7D9FF

#### Secundárias
- Verde Menta — #A7E8D4
- Verde Suave — #C8EBD8
- Turquesa — #7FD3D6
- Amarelo Pastel — #FFE7A3
- Pêssego — #FFB88C
- Rosa Pastel — #FFB6D9

#### ✨ Destaques
- Azul Profundo — #2E5B9A
- Roxo Vibrante — #7B61FF
- Roxo — #A855F7
- Rosa Vibrante — #FF7EB6
- Laranja — #FFB347
- Verde Água — #1BA7A7

#### Neutros e base
- Azul Marinho — #1E2A44
- Cinza Grafite — #4B5563
- Cinza Azulado — #94A3B8
- Cinza Claro — #E2E8F0
- Branco — #FFFFFF
- Branco Azulado — #F7F9FF

### 🔤 Tipografia

- **STIX Two Math** — principal
- **Average Sans** — secundária
- **Bebas Neue** — títulos
- **AXES** — textos e botões

> A disponibilidade, licença e forma de integração das fontes devem ser verificadas antes da implementação.

---

## 🏢 Equipe

**NubyTech Company Technology**

### Projeto

**Evolua — tecnologia, autocuidado e apoio para a saúde mental.**

---

## 🚀 Pitch

O **Evolua** é uma plataforma digital criada para promover a saúde mental, incentivar o autocuidado e prevenir os impactos do uso abusivo de álcool e outras substâncias.

A proposta reúne **acompanhamento emocional, metas, registro de progresso, conteúdos educativos e acesso a informações de apoio** em um único ambiente, tornando o cuidado mais acessível, organizado e acolhedor.