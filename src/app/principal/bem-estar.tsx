
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, fontes } from '../../tema';
import { MenuInferior, useLayoutInfo } from './compartilhado';

type Atividade = {
  id: string;
  nome: string;
  descricao: string;
  duracao: string;
  materiais: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  orientacao: string[];
  mensagem: string;
};

type Categoria = {
  id: string;
  titulo: string;
  descricao: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
  cor: string;
  corTexto: string;
  atividades: Atividade[];
};

const CATEGORIAS: Categoria[] = [
  {
    id: 'criatividade',
    titulo: 'Criatividade e expressão',
    descricao: 'Explore ideias e expresse o que sente.',
    icone: 'color-palette-outline',
    cor: '#EEE9F8',
    corTexto: '#7056A0',
    atividades: [
      {
        id: 'pintura-emocoes',
        nome: 'Pintura das emoções',
        descricao: 'Transforme sentimentos em cores.',
        duracao: '5 a 10 minutos',
        materiais: 'Papel, lápis de cor, canetinhas ou tinta.',
        icone: 'color-palette-outline',
        orientacao: [
          'Pense em como você está se sentindo neste momento.',
          'Escolha uma ou mais cores que representem esse sentimento.',
          'Faça uma pintura livre, sem se preocupar com o resultado.',
          'Observe sua criação e perceba o que ela representa para você.',
        ],
        mensagem: 'Não existe desenho certo ou errado. O importante é se permitir criar.',
      },
      {
        id: 'desenho-livre',
        nome: 'Desenho livre',
        descricao: 'Desenhe sem regras e sem julgamentos.',
        duracao: '10 minutos',
        materiais: 'Papel e lápis ou caneta.',
        icone: 'brush-outline',
        orientacao: [
          'Escolha um lugar confortável.',
          'Comece desenhando uma forma simples.',
          'Acrescente linhas, cores e detalhes livremente.',
          'Continue até sentir que terminou.',
        ],
        mensagem: 'Criar também é uma maneira de reservar um tempo para você.',
      },
      {
        id: 'historia',
        nome: 'Crie uma história',
        descricao: 'Use sua imaginação para inventar uma pequena história.',
        duracao: '5 minutos',
        materiais: 'Apenas sua imaginação ou papel para escrever.',
        icone: 'book-outline',
        orientacao: [
          'Imagine um personagem que encontra uma porta misteriosa.',
          'Pense no que existe do outro lado.',
          'Crie um desafio que esse personagem precisa enfrentar.',
          'Invente um final para essa aventura.',
        ],
        mensagem: 'Sua imaginação não precisa seguir nenhuma regra. Divirta-se!',
      },
    ],
  },
  {
    id: 'musica',
    titulo: 'Música e emoções',
    descricao: 'Explore sons, lembranças e sentimentos.',
    icone: 'musical-notes-outline',
    cor: '#FCE9EF',
    corTexto: '#A44F72',
    atividades: [
      {
        id: 'musica-momento',
        nome: 'Música do momento',
        descricao: 'Escolha uma música que combine com seu dia.',
        duracao: '5 minutos',
        materiais: 'Uma música de sua preferência.',
        icone: 'headset-outline',
        orientacao: [
          'Escolha uma música que faça sentido para você hoje.',
          'Escute com atenção, sem fazer outras tarefas ao mesmo tempo.',
          'Perceba quais sentimentos aparecem.',
          'Pense em uma palavra que represente o que sentiu.',
        ],
        mensagem: 'Você pode escolher outra música ou interromper a atividade se alguma lembrança causar desconforto.',
      },
      {
        id: 'playlist',
        nome: 'Minha playlist positiva',
        descricao: 'Monte uma seleção de músicas para momentos especiais.',
        duracao: '10 minutos',
        materiais: 'Aplicativo de música ou uma lista escrita.',
        icone: 'list-outline',
        orientacao: [
          'Pense em músicas que fazem você se sentir bem.',
          'Escolha algumas que transmitam tranquilidade ou alegria.',
          'Monte uma pequena playlist.',
          'Dê um nome especial para ela.',
        ],
        mensagem: 'Você pode atualizar sua playlist sempre que descobrir uma música nova.',
      },
      {
        id: 'som-imaginacao',
        nome: 'Imagine a cena',
        descricao: 'Use uma música instrumental para criar uma história.',
        duracao: '5 minutos',
        materiais: 'Uma música instrumental.',
        icone: 'musical-note-outline',
        orientacao: [
          'Escolha uma música instrumental que seja confortável para você.',
          'Feche os olhos apenas se isso for confortável.',
          'Imagine um lugar ou uma cena enquanto escuta.',
          'Se quiser, escreva ou desenhe o que imaginou.',
        ],
        mensagem: 'A experiência é sua. Escolha sons que transmitam segurança e bem-estar.',
      },
    ],
  },
  {
    id: 'sentidos',
    titulo: 'Descoberta dos sentidos',
    descricao: 'Observe o mundo com mais atenção.',
    icone: 'eye-outline',
    cor: '#E3F1F7',
    corTexto: '#39738E',
    atividades: [
      {
        id: 'caca-cores',
        nome: 'Caça às cores',
        descricao: 'Encontre objetos de diferentes cores ao seu redor.',
        duracao: '3 a 5 minutos',
        materiais: 'Apenas o ambiente ao seu redor.',
        icone: 'search-outline',
        orientacao: [
          'Escolha uma cor para começar.',
          'Observe o ambiente e encontre um objeto dessa cor.',
          'Repita com outras cores.',
          'Perceba os detalhes dos objetos encontrados.',
        ],
        mensagem: 'Pequenas descobertas podem transformar a maneira como percebemos o ambiente.',
      },
      {
        id: 'memoria-visual',
        nome: 'Desafio da memória visual',
        descricao: 'Observe alguns objetos e tente lembrar deles.',
        duracao: '3 minutos',
        materiais: 'Apenas atenção e memória.',
        icone: 'albums-outline',
        orientacao: [
          'Observe os objetos apresentados na atividade.',
          'Tente memorizar cada um deles.',
          'Depois, responda ao desafio sem consultar a lista.',
          'Confira quantos você conseguiu lembrar.',
        ],
        mensagem: 'O objetivo é exercitar a atenção, não acertar tudo.',
      },
      {
        id: 'adivinhacao',
        nome: 'Adivinhe o objeto',
        descricao: 'Use as pistas para descobrir o objeto misterioso.',
        duracao: '2 a 5 minutos',
        materiais: 'Nenhum.',
        icone: 'help-circle-outline',
        orientacao: [
          'Leia as pistas com atenção.',
          'Imagine qual objeto combina com as características.',
          'Escolha sua resposta.',
          'Confira a solução e tente novamente.',
        ],
        mensagem: 'A curiosidade também é uma forma de explorar o mundo.',
      },
    ],
  },
  {
    id: 'autocuidado',
    titulo: 'Autocuidado',
    descricao: 'Pequenos cuidados que fazem diferença.',
    icone: 'heart-outline',
    cor: '#E3F2EA',
    corTexto: '#477C60',
    atividades: [
      {
        id: 'receita',
        nome: 'Prepare algo especial',
        descricao: 'Escolha uma receita simples para fazer.',
        duracao: '15 a 30 minutos',
        materiais: 'Ingredientes e utensílios adequados à receita.',
        icone: 'restaurant-outline',
        orientacao: [
          'Escolha algo simples que você goste de comer.',
          'Separe os ingredientes e organize o espaço.',
          'Prepare a receita com calma e atenção.',
          'Aproveite o momento e sua preparação.',
        ],
        mensagem: 'Cozinhar pode ser uma oportunidade de aprender algo novo e cuidar de si.',
      },
      {
        id: 'plantinha',
        nome: 'Cuide de uma plantinha',
        descricao: 'Reserve alguns minutos para cuidar de uma planta.',
        duracao: '5 a 10 minutos',
        materiais: 'Uma planta, água e os materiais necessários para seu cuidado.',
        icone: 'leaf-outline',
        orientacao: [
          'Observe sua planta com atenção.',
          'Verifique se a terra precisa de água.',
          'Retire folhas secas, se necessário.',
          'Escolha um lugar adequado para ela.',
        ],
        mensagem: 'Cuidar de algo também pode ser um lembrete para cuidar de você.',
      },
      {
        id: 'cantinho',
        nome: 'Organize seu cantinho',
        descricao: 'Transforme um pequeno espaço em um lugar agradável.',
        duracao: '10 minutos',
        materiais: 'Itens de organização e objetos que você gosta.',
        icone: 'home-outline',
        orientacao: [
          'Escolha um pequeno espaço para organizar.',
          'Retire o que não precisa estar ali.',
          'Organize os objetos de que gosta.',
          'Acrescente algo que transmita conforto.',
        ],
        mensagem: 'Não precisa organizar tudo de uma vez. Um pequeno passo já conta.',
      },
    ],
  },
  {
    id: 'tranquilidade',
    titulo: 'Tranquilidade e conexão',
    descricao: 'Reserve um momento para olhar para si.',
    icone: 'sunny-outline',
    cor: '#F9F0DC',
    corTexto: '#9B773B',
    atividades: [
      {
        id: 'gratidao',
        nome: 'Diário de gratidão',
        descricao: 'Registre pequenas coisas boas do seu dia.',
        duracao: '5 minutos',
        materiais: 'Papel, bloco de notas ou o espaço abaixo.',
        icone: 'journal-outline',
        orientacao: [
          'Pense em algo simples que foi bom hoje.',
          'Lembre-se de uma pessoa, situação ou experiência pela qual sente gratidão.',
          'Registre suas ideias.',
          'Releia o que escreveu, se desejar.',
        ],
        mensagem: 'Não é preciso encontrar algo extraordinário. Pequenos momentos também importam.',
      },
      {
        id: 'lugar-seguro',
        nome: 'Crie seu lugar tranquilo',
        descricao: 'Imagine um lugar onde você se sente confortável.',
        duracao: '5 minutos',
        materiais: 'Apenas sua imaginação.',
        icone: 'cloud-outline',
        orientacao: [
          'Imagine um lugar em que você se sinta confortável.',
          'Pense nas cores, nos sons e nos detalhes desse ambiente.',
          'Imagine o que existe ao seu redor.',
          'Permaneça nessa imagem pelo tempo que desejar.',
        ],
        mensagem: 'Se imaginar esse lugar não for confortável, escolha outra atividade. Você está no controle.',
      },
      {
        id: 'carta-futuro',
        nome: 'Carta para o meu futuro',
        descricao: 'Escreva uma mensagem para você mesmo.',
        duracao: '10 minutos',
        materiais: 'Papel ou bloco de notas.',
        icone: 'mail-outline',
        orientacao: [
          'Imagine como gostaria de estar daqui a alguns meses.',
          'Escreva uma mensagem para seu eu do futuro.',
          'Conte sobre seus desejos e pequenas metas.',
          'Finalize com uma mensagem de incentivo.',
        ],
        mensagem: 'Você não precisa ter todas as respostas agora. Cada passo tem seu valor.',
      },
    ],
  },
];

const CORES_PINTURA = [
  '#E9A3B5',
  '#EFCB82',
  '#8CB9D6',
  '#A7CBA7',
  '#B6A2D8',
  '#E9A477',
];

function BemEstar() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { desktop, estreito, larguraMax } = useLayoutInfo();

  const [categoriaAberta, setCategoriaAberta] = useState<string | null>('criatividade');
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<Atividade | null>(null);
  const [concluidas, setConcluidas] = useState<string[]>([]);

  const [corSelecionada, setCorSelecionada] = useState<string | null>(null);
  const [resposta, setResposta] = useState<string | null>(null);
  const [mostrarObjetos, setMostrarObjetos] = useState(true);
  const [lembrancas, setLembrancas] = useState<string[]>([]);
  const [textoPessoal, setTextoPessoal] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      tabBarStyle: { display: 'none' },
    });
  }, [navigation]);

  const voltar = () => {
    router.replace('/principal/evolua');
  };

  const abrirAtividade = (atividade: Atividade) => {
    setAtividadeSelecionada(atividade);
    setCorSelecionada(null);
    setResposta(null);
    setMostrarObjetos(true);
    setLembrancas([]);
    setTextoPessoal('');
  };

  const concluirAtividade = () => {
    if (!atividadeSelecionada) return;

    setConcluidas((atual) =>
      atual.includes(atividadeSelecionada.id)
        ? atual
        : [...atual, atividadeSelecionada.id],
    );

    setAtividadeSelecionada(null);
  };

  const alternarCategoria = (id: string) => {
    setCategoriaAberta((atual) => (atual === id ? null : id));
  };

  const atividadeConcluida = (id: string) => concluidas.includes(id);

  const renderizarInteracao = () => {
    if (!atividadeSelecionada) return null;

    switch (atividadeSelecionada.id) {
      case 'pintura-emocoes':
        return (
          <View style={local.interacao}>
            <Text style={local.interacaoTitulo}>Escolha uma cor para representar seu momento</Text>
            <View style={local.coresLinha}>
              {CORES_PINTURA.map((cor) => (
                <Pressable
                  key={cor}
                  onPress={() => setCorSelecionada(cor)}
                  style={[
                    local.corBolinha,
                    { backgroundColor: cor },
                    corSelecionada === cor && local.corSelecionada,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar cor ${cor}`}
                />
              ))}
            </View>

            {corSelecionada && (
              <View style={[local.pinturaResultado, { backgroundColor: corSelecionada }]}>
                <Text style={local.pinturaTexto}>Sua cor escolhida</Text>
              </View>
            )}
            <Text style={local.ajudaInteracao}>
              Você pode usar essa cor em um desenho ou pintura fora do aplicativo.
            </Text>
          </View>
        );

      case 'caca-cores':
        return (
          <View style={local.interacao}>
            <Text style={local.interacaoTitulo}>Encontre algo destas cores:</Text>
            <View style={local.coresLinha}>
              {CORES_PINTURA.slice(0, 5).map((cor) => (
                <View key={cor} style={[local.corBolinha, { backgroundColor: cor }]} />
              ))}
            </View>
            <Text style={local.ajudaInteracao}>
              Observe seu ambiente e tente encontrar um objeto para cada cor.
            </Text>
          </View>
        );

      case 'memoria-visual':
        return (
          <View style={local.interacao}>
            <Text style={local.interacaoTitulo}>
              {mostrarObjetos ? 'Observe e memorize os objetos' : 'Quais objetos você lembra?'}
            </Text>

            {mostrarObjetos ? (
              <>
                <View style={local.objetosGrade}>
                  {['🍎 Maçã', '🔑 Chave', '⭐ Estrela', '🌼 Flor', '📘 Livro'].map((item) => (
                    <View key={item} style={local.objeto}>
                      <Text style={local.objetoTexto}>{item}</Text>
                    </View>
                  ))}
                </View>
                <Pressable style={local.botaoInteracao} onPress={() => setMostrarObjetos(false)}>
                  <Text style={local.botaoInteracaoTexto}>Esconder objetos</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={local.ajudaInteracao}>
                  Quais itens estavam na lista? Selecione os que lembrar.
                </Text>
                {['🍎 Maçã', '🔑 Chave', '⭐ Estrela', '🌼 Flor', '📘 Livro', '⚽ Bola', '☂️ Guarda-chuva'].map((item) => {
                  const selecionado = lembrancas.includes(item);
                  return (
                    <Pressable
                      key={item}
                      style={[local.opcaoMemoria, selecionado && local.opcaoMemoriaAtiva]}
                      onPress={() =>
                        setLembrancas((atual) =>
                          selecionado ? atual.filter((i) => i !== item) : [...atual, item],
                        )
                      }
                    >
                      <Ionicons
                        name={selecionado ? 'checkbox' : 'square-outline'}
                        size={21}
                        color={selecionado ? '#477C60' : '#718096'}
                      />
                      <Text style={local.opcaoMemoriaTexto}>{item}</Text>
                    </Pressable>
                  );
                })}
                <Text style={local.ajudaInteracao}>
                  Você selecionou {lembrancas.length} item(ns). O objetivo é exercitar a memória, sem cobrança.
                </Text>
              </>
            )}
          </View>
        );

      case 'adivinhacao':
        return (
          <View style={local.interacao}>
            <Text style={local.interacaoTitulo}>Quem sou eu?</Text>
            <Text style={local.enigma}>
              Tenho páginas, posso contar histórias e fico feliz quando alguém me abre.
              O que sou?
            </Text>
            {['Um livro', 'Uma janela', 'Um relógio'].map((opcao) => (
              <Pressable
                key={opcao}
                onPress={() => setResposta(opcao)}
                style={[local.opcaoResposta, resposta === opcao && local.opcaoRespostaAtiva]}
              >
                <Text style={local.opcaoRespostaTexto}>{opcao}</Text>
              </Pressable>
            ))}
            {resposta && (
              <Text style={local.resultadoResposta}>
                {resposta === 'Um livro'
                  ? 'Isso mesmo! Você acertou!'
                  : 'Boa tentativa! A resposta era: um livro.'}
              </Text>
            )}
          </View>
        );

      case 'gratidao':
      case 'carta-futuro':
        return (
          <View style={local.interacao}>
            <Text style={local.interacaoTitulo}>
              {atividadeSelecionada.id === 'gratidao'
                ? 'O que fez bem para você hoje?'
                : 'O que gostaria de dizer ao seu eu do futuro?'}
            </Text>
            <TextInput
              value={textoPessoal}
              onChangeText={setTextoPessoal}
              placeholder="Escreva aqui, no seu próprio ritmo..."
              placeholderTextColor="#8A9AA9"
              multiline
              textAlignVertical="top"
              style={local.campoTexto}
            />
            <Text style={local.ajudaInteracao}>
              Este texto fica apenas nesta tela durante esta demonstração. Ele não é enviado nem salvo.
            </Text>
          </View>
        );

      default:
        return (
          <View style={local.interacao}>
            <Ionicons name="sparkles-outline" size={30} color="#7A5CC0" />
            <Text style={local.interacaoTitulo}>Seu momento começa agora</Text>
            <Text style={local.ajudaInteracao}>
              Siga as etapas acima no seu próprio ritmo. Você pode adaptar ou interromper a atividade quando quiser.
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={local.raiz}>
      <LinearGradient
        colors={['#FFFFFF', '#F7F9FC', '#EEF2F6']}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={{ paddingTop: insets.top + 8 }}>
        <View style={[local.topo, { maxWidth: larguraMax, alignSelf: 'center' }]}>
          <Pressable
            onPress={atividadeSelecionada ? () => setAtividadeSelecionada(null) : voltar}
            style={local.botaoVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color="#29465F" />
          </Pressable>

          <View style={local.topoTitulo}>
            <Text style={local.tituloPagina}>Bem-estar</Text>
            <Text style={local.subtituloPagina}>Criatividade, autocuidado e tranquilidade</Text>
          </View>

          <View style={local.iconeTopo}>
            <Ionicons name="flower-outline" size={25} color="#7A5CC0" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          local.conteudo,
          { maxWidth: larguraMax, alignSelf: 'center', paddingBottom: 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!atividadeSelecionada ? (
          <>
            <View style={local.apresentacao}>
              <View style={local.apresentacaoIcone}>
                <Ionicons name="sparkles-outline" size={27} color="#7A5CC0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={local.apresentacaoTitulo}>Um tempo para você</Text>
                <Text style={local.apresentacaoTexto}>
                  Descubra atividades leves, criativas e prazerosas. Escolha o que combina com seu momento.
                </Text>
              </View>
            </View>

            <View style={local.resumoAtividades}>
              <View style={local.resumoItem}>
                <Text style={local.resumoNumero}>15</Text>
                <Text style={local.resumoLegenda}>atividades</Text>
              </View>
              <View style={local.resumoDivisor} />
              <View style={local.resumoItem}>
                <Text style={local.resumoNumero}>5</Text>
                <Text style={local.resumoLegenda}>categorias</Text>
              </View>
              <View style={local.resumoDivisor} />
              <View style={local.resumoItem}>
                <Text style={local.resumoNumero}>{concluidas.length}</Text>
                <Text style={local.resumoLegenda}>concluídas</Text>
              </View>
            </View>

            <Text style={local.tituloSecao}>Escolha uma experiência</Text>
            <Text style={local.descricaoSecao}>
              Explore as categorias e encontre uma atividade para fazer hoje.
            </Text>

            {CATEGORIAS.map((categoria) => {
              const aberta = categoriaAberta === categoria.id;
              const totalConcluidas = categoria.atividades.filter((a) =>
                atividadeConcluida(a.id),
              ).length;

              return (
                <View key={categoria.id} style={local.categoriaBloco}>
                  <Pressable
                    onPress={() => alternarCategoria(categoria.id)}
                    style={[
                      local.categoriaCabecalho,
                      aberta && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
                    ]}
                  >
                    <View style={[local.categoriaIcone, { backgroundColor: categoria.cor }]}>
                      <Ionicons name={categoria.icone} size={25} color={categoria.corTexto} />
                    </View>

                    <View style={local.categoriaInfo}>
                      <Text style={local.categoriaTitulo}>{categoria.titulo}</Text>
                      <Text style={local.categoriaDescricao}>{categoria.descricao}</Text>
                      <Text style={local.categoriaContagem}>
                        {totalConcluidas} de {categoria.atividades.length} concluídas
                      </Text>
                    </View>

                    <Ionicons
                      name={aberta ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#718096"
                    />
                  </Pressable>

                  {aberta && (
                    <View style={local.listaAtividades}>
                      {categoria.atividades.map((atividade, indice) => {
                        const concluida = atividadeConcluida(atividade.id);

                        return (
                          <Pressable
                            key={atividade.id}
                            onPress={() => abrirAtividade(atividade)}
                            style={[
                              local.atividadeLinha,
                              indice !== categoria.atividades.length - 1 && local.atividadeBorda,
                            ]}
                          >
                            <View style={local.atividadeIcone}>
                              <Ionicons
                                name={atividade.icone}
                                size={22}
                                color={categoria.corTexto}
                              />
                            </View>

                            <View style={local.atividadeInfo}>
                              <Text style={local.atividadeNome}>{atividade.nome}</Text>
                              <Text style={local.atividadeDescricao}>{atividade.descricao}</Text>
                              <Text style={local.atividadeDuracao}>{atividade.duracao}</Text>
                            </View>

                            {concluida ? (
                              <Ionicons name="checkmark-circle" size={23} color="#5A9A76" />
                            ) : (
                              <Ionicons name="arrow-forward-circle-outline" size={24} color="#7A8FA3" />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            <View style={local.aviso}>
              <Ionicons name="heart-outline" size={20} color="#638B79" />
              <Text style={local.avisoTexto}>
                Faça no seu ritmo. Você pode escolher outra atividade ou parar sempre que desejar.
              </Text>
            </View>
          </>
        ) : (
          <View style={local.detalheAtividade}>
            <View style={local.detalheTopo}>
              <View style={local.detalheIcone}>
                <Ionicons name={atividadeSelecionada.icone} size={28} color="#7A5CC0" />
              </View>
              <Text style={local.detalheDuracao}>{atividadeSelecionada.duracao}</Text>
            </View>

            <Text style={local.detalheTitulo}>{atividadeSelecionada.nome}</Text>
            <Text style={local.detalheDescricao}>{atividadeSelecionada.descricao}</Text>

            <View style={local.materiais}>
              <Ionicons name="briefcase-outline" size={19} color="#6B7F91" />
              <View style={{ flex: 1 }}>
                <Text style={local.materiaisTitulo}>O que você vai precisar</Text>
                <Text style={local.materiaisTexto}>{atividadeSelecionada.materiais}</Text>
              </View>
            </View>

            <Text style={local.tituloSecao}>Vamos começar?</Text>

            {atividadeSelecionada.orientacao.map((passo, indice) => (
              <View key={indice} style={local.passoLinha}>
                <View style={local.passoNumero}>
                  <Text style={local.passoNumeroTexto}>{indice + 1}</Text>
                </View>
                <Text style={local.passoTexto}>{passo}</Text>
              </View>
            ))}

            {renderizarInteracao()}

            <View style={local.mensagemFinal}>
              <Ionicons name="sparkles-outline" size={20} color="#7A5CC0" />
              <Text style={local.mensagemFinalTexto}>{atividadeSelecionada.mensagem}</Text>
            </View>

            <Pressable style={local.botaoConcluir} onPress={concluirAtividade}>
              <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
              <Text style={local.botaoConcluirTexto}>Concluir atividade</Text>
            </Pressable>

            <Pressable
              style={local.botaoVoltarLista}
              onPress={() => setAtividadeSelecionada(null)}
            >
              <Text style={local.botaoVoltarListaTexto}>Voltar para as atividades</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <MenuInferior ativo="evolua" />
    </View>
  );
}

const local = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  topo: {
    width: '100%',
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topoTitulo: {
    flex: 1,
  },
  tituloPagina: {
    fontFamily: fontes.titulo,
    fontSize: 25,
    color: '#29465F',
  },
  subtituloPagina: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#74879A',
    marginTop: 2,
  },
  iconeTopo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEE9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  apresentacao: {
    backgroundColor: '#F0EBF8',
    borderRadius: 20,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  apresentacaoIcone: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apresentacaoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 16,
    color: '#51416E',
    marginBottom: 4,
  },
  apresentacaoTexto: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#665B7A',
  },
  resumoAtividades: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E8EDF2',
  },
  resumoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  resumoNumero: {
    fontFamily: fontes.titulo,
    fontSize: 21,
    color: '#416A88',
  },
  resumoLegenda: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#7A8FA3',
  },
  resumoDivisor: {
    width: 1,
    height: 32,
    backgroundColor: '#E7ECF1',
  },
  tituloSecao: {
    fontFamily: fontes.textoMedio,
    fontSize: 17,
    color: '#29465F',
    marginTop: 5,
  },
  descricaoSecao: {
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 18,
    color: '#7A8FA3',
    marginTop: -9,
  },
  categoriaBloco: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E7EDF3',
    overflow: 'hidden',
  },
  categoriaCabecalho: {
    minHeight: 91,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoriaIcone: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriaInfo: {
    flex: 1,
    gap: 3,
  },
  categoriaTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 14,
    color: '#354F65',
  },
  categoriaDescricao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    color: '#7A8FA3',
  },
  categoriaContagem: {
    fontFamily: fontes.textoMedio,
    fontSize: 10,
    color: '#7A5CC0',
    marginTop: 2,
  },
  listaAtividades: {
    paddingHorizontal: 13,
    paddingBottom: 4,
    backgroundColor: '#FCFDFE',
  },
  atividadeLinha: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
  },
  atividadeBorda: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F5',
  },
  atividadeIcone: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#F0EBF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atividadeInfo: {
    flex: 1,
    gap: 3,
  },
  atividadeNome: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#354F65',
  },
  atividadeDescricao: {
    fontFamily: fontes.texto,
    fontSize: 10,
    color: '#7A8FA3',
    lineHeight: 15,
  },
  atividadeDuracao: {
    fontFamily: fontes.textoMedio,
    fontSize: 10,
    color: '#8B78AD',
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#EAF3ED',
    borderRadius: 15,
    marginTop: 2,
    marginBottom: 8,
  },
  avisoTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#557765',
  },
  detalheAtividade: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7EDF3',
    padding: 17,
    gap: 14,
    marginBottom: 12,
  },
  detalheTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detalheIcone: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: '#F0EBF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detalheDuracao: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    color: '#7A5CC0',
    backgroundColor: '#F3EFF9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    overflow: 'hidden',
  },
  detalheTitulo: {
    fontFamily: fontes.titulo,
    fontSize: 23,
    color: '#29465F',
    marginBottom: -9,
  },
  detalheDescricao: {
    fontFamily: fontes.texto,
    fontSize: 13,
    lineHeight: 19,
    color: '#71869A',
  },
  materiais: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#F5F8FA',
    padding: 13,
    borderRadius: 14,
  },
  materiaisTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 11,
    color: '#526C82',
    marginBottom: 3,
  },
  materiaisTexto: {
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 16,
    color: '#71869A',
  },
  passoLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  passoNumero: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: '#EEE9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoNumeroTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#7056A0',
  },
  passoTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 12,
    lineHeight: 19,
    color: '#536B80',
    paddingTop: 3,
  },
  interacao: {
    backgroundColor: '#F8F6FB',
    borderRadius: 16,
    padding: 14,
    gap: 11,
  },
  interacaoTitulo: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#51416E',
  },
  coresLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  corBolinha: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  corSelecionada: {
    borderWidth: 3,
    borderColor: '#51416E',
  },
  pinturaResultado: {
    height: 75,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinturaTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#FFFFFF',
  },
  ajudaInteracao: {
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#74869A',
  },
  objetosGrade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  objeto: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E8E3F0',
  },
  objetoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#536B80',
  },
  botaoInteracao: {
    backgroundColor: '#7A5CC0',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  botaoInteracaoTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#FFFFFF',
  },
  opcaoMemoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E8EDF2',
  },
  opcaoMemoriaAtiva: {
    backgroundColor: '#EAF3ED',
    borderColor: '#B9D8C4',
  },
  opcaoMemoriaTexto: {
    fontFamily: fontes.texto,
    fontSize: 12,
    color: '#536B80',
  },
  enigma: {
    fontFamily: fontes.texto,
    fontSize: 13,
    lineHeight: 21,
    color: '#536B80',
    backgroundColor: '#FFFFFF',
    padding: 13,
    borderRadius: 12,
  },
  opcaoResposta: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1EF',
  },
  opcaoRespostaAtiva: {
    backgroundColor: '#EEE9F8',
    borderColor: '#B9A9D6',
  },
  opcaoRespostaTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#536B80',
  },
  resultadoResposta: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#477C60',
  },
  campoTexto: {
    minHeight: 110,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DFEC',
    borderRadius: 12,
    padding: 12,
    fontFamily: fontes.texto,
    fontSize: 12,
    color: '#354F65',
  },
  mensagemFinal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#F2EFF8',
    padding: 13,
    borderRadius: 13,
  },
  mensagemFinalTexto: {
    flex: 1,
    fontFamily: fontes.texto,
    fontSize: 11,
    lineHeight: 17,
    color: '#665B7A',
  },
  botaoConcluir: {
    minHeight: 48,
    backgroundColor: '#477C60',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  botaoConcluirTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 13,
    color: '#FFFFFF',
  },
  botaoVoltarLista: {
    alignItems: 'center',
    paddingVertical: 9,
  },
  botaoVoltarListaTexto: {
    fontFamily: fontes.textoMedio,
    fontSize: 12,
    color: '#71869A',
  },
});

export default BemEstar;