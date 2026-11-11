import { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Mask,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { cores, fontes } from '../../tema';

/* ------------------------------------------------------------------ */
/* Configurações da animação (ajuste aqui se quiser mais rápido/lento) */
/* ------------------------------------------------------------------ */
const TEMPO_LUA = 3600; // lua passando pelas fases
const TEMPO_TITULO = 1100; // nome EVOLUA aparecendo
const PAUSA_ANTES_NUVENS = 900; // respiro antes das nuvens abrirem
const TEMPO_NUVENS = 1800; // nuvens se abrindo

const NATIVO = Platform.OS !== 'web';

/* ------------------------------------------------------------------ */
/* Estrelas (posições fixas, para não dar diferença entre servidor e   */
/* navegador)                                                          */
/* ------------------------------------------------------------------ */
function corDaEstrela(i: number) {
  if (i % 4 === 0) return cores.amareloPastel;
  if (i % 5 === 0) return cores.rosaPastel;
  if (i % 7 === 0) return cores.verdeMenta;
  return cores.branco;
}

function gerarEstrelas() {
  let s = 12345;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const arred = (n: number) => Math.round(n * 10) / 10;

  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: arred(3 + rnd() * 94),
    y: arred(3 + rnd() * 58),
    tamanho: arred(1.5 + rnd() * 2.5),
    atraso: Math.floor(rnd() * 2500),
    duracao: 700 + Math.floor(rnd() * 1100),
    cor: corDaEstrela(i),
  }));
}

const ESTRELAS = gerarEstrelas();

type EstrelaProps = {
  x: number;
  y: number;
  tamanho: number;
  atraso: number;
  duracao: number;
  cor: string;
};

function Estrela({ x, y, tamanho, atraso, duracao, cor }: EstrelaProps) {
  const brilho = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 1,
          duration: duracao,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
        Animated.timing(brilho, {
          toValue: 0,
          duration: duracao,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
      ])
    );

    const t = setTimeout(() => animacao.start(), atraso);

    return () => {
      clearTimeout(t);
      animacao.stop();
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        backgroundColor: cor,
        opacity: brilho.interpolate({
          inputRange: [0, 1],
          outputRange: [0.15, 1],
        }),
        transform: [
          {
            scale: brilho.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1.4],
            }),
          },
        ],
      }}
    />
  );
}

// Estrela grande, com brilho pulsante, ao lado da lua
function Brilho() {
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
        Animated.timing(pulso, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVO,
        }),
      ])
    );
    animacao.start();
    return () => animacao.stop();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.brilho,
        {
          opacity: pulso.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 1],
          }),
          transform: [
            {
              scale: pulso.interpolate({
                inputRange: [0, 1],
                outputRange: [0.85, 1.25],
              }),
            },
          ],
        },
      ]}
    >
      ✦
    </Animated.Text>
  );
}

/* ------------------------------------------------------------------ */
/* Lua: passa pelas fases e para na minguante (iluminada à esquerda)   */
/* ------------------------------------------------------------------ */

// p vai de 0 a 1. Retorna o deslocamento da "sombra" sobre a lua.
//  0 → nova | cresce até cheia | diminui até a crescente final
const DESLOC_FINAL = 42; // quanto maior, mais gordinha a lua final

function deslocamento(p: number) {
  if (p < 0.38) {
    const t = p / 0.38;
    return -120 * t; // lua nova → cheia (lado direito se ilumina)
  }
  const t = (p - 0.38) / 0.62;
  return 120 + (DESLOC_FINAL - 120) * t; // cheia → crescente (lado esquerdo)
}

function Lua({ progresso }: { progresso: Animated.Value }) {
  const [dx, setDx] = useState(0);

  useEffect(() => {
    const id = progresso.addListener(({ value }) => setDx(deslocamento(value)));
    return () => progresso.removeListener(id);
  }, [progresso]);

  return (
    <Svg width={150} height={150} viewBox="0 0 160 160">
      <Defs>
        <RadialGradient id="luaGrad" cx="38%" cy="35%" r="75%">
          <Stop offset="0" stopColor={cores.branco} />
          <Stop offset="1" stopColor={cores.azulGelo} />
        </RadialGradient>
        <Mask
          id="sombra"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="160"
          height="160"
        >
          <Rect x="0" y="0" width="160" height="160" fill="#FFFFFF" />
          <Circle cx={80 + dx} cy="80" r="60" fill="#000000" />
        </Mask>
      </Defs>

      {/* Halo suave e contorno da lua apagada */}
      <Circle cx="80" cy="80" r="74" fill={cores.branco} opacity={0.06} />
      <Circle cx="80" cy="80" r="60" fill={cores.branco} opacity={0.1} />

      {/* Parte iluminada */}
      <G mask="url(#sombra)">
        <Circle cx="80" cy="80" r="60" fill="url(#luaGrad)" />
        <Circle cx="62" cy="70" r="9" fill={cores.azulCeu} opacity={0.35} />
        <Circle cx="95" cy="100" r="12" fill={cores.azulCeu} opacity={0.3} />
        <Circle cx="80" cy="52" r="6" fill={cores.azulCeu} opacity={0.3} />
        <Circle cx="102" cy="68" r="5" fill={cores.azulCeu} opacity={0.3} />
        <Circle cx="66" cy="104" r="7" fill={cores.azulCeu} opacity={0.3} />
      </G>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Nuvens: bancos fofos (3 camadas cada) que se abrem para os lados     */
/* ------------------------------------------------------------------ */
type Bola = { cx: number; cy: number; r: number };
type Camada = { opacidade: number; bolas: Bola[] };

const CAMADAS_ESQ: Camada[] = [
  {
    opacidade: 0.45,
    bolas: [
      { cx: 60, cy: 175, r: 72 },
      { cx: 150, cy: 150, r: 58 },
      { cx: 235, cy: 185, r: 62 },
      { cx: 15, cy: 215, r: 55 },
    ],
  },
  {
    opacidade: 0.75,
    bolas: [
      { cx: 35, cy: 245, r: 66 },
      { cx: 115, cy: 218, r: 60 },
      { cx: 195, cy: 238, r: 56 },
      { cx: 268, cy: 262, r: 48 },
    ],
  },
  {
    opacidade: 0.97,
    bolas: [
      { cx: 15, cy: 305, r: 62 },
      { cx: 85, cy: 282, r: 50 },
      { cx: 150, cy: 300, r: 58 },
      { cx: 222, cy: 292, r: 46 },
      { cx: 285, cy: 312, r: 44 },
      { cx: 55, cy: 262, r: 34 },
      { cx: 128, cy: 268, r: 32 },
      { cx: 190, cy: 268, r: 30 },
    ],
  },
];

const CAMADAS_DIR: Camada[] = [
  {
    opacidade: 0.45,
    bolas: [
      { cx: 240, cy: 170, r: 70 },
      { cx: 150, cy: 148, r: 60 },
      { cx: 65, cy: 190, r: 60 },
      { cx: 285, cy: 212, r: 55 },
    ],
  },
  {
    opacidade: 0.75,
    bolas: [
      { cx: 262, cy: 248, r: 64 },
      { cx: 182, cy: 220, r: 60 },
      { cx: 105, cy: 240, r: 56 },
      { cx: 32, cy: 265, r: 46 },
    ],
  },
  {
    opacidade: 0.97,
    bolas: [
      { cx: 285, cy: 305, r: 60 },
      { cx: 212, cy: 284, r: 52 },
      { cx: 148, cy: 302, r: 56 },
      { cx: 78, cy: 294, r: 48 },
      { cx: 15, cy: 312, r: 44 },
      { cx: 245, cy: 262, r: 34 },
      { cx: 172, cy: 270, r: 32 },
      { cx: 110, cy: 270, r: 30 },
    ],
  },
];

function BancoNuvens({ lado }: { lado: 'esq' | 'dir' }) {
  const camadas = lado === 'esq' ? CAMADAS_ESQ : CAMADAS_DIR;
  const idGrad = `nuvemGrad-${lado}`;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 300 330"
      preserveAspectRatio="xMidYMax meet"
    >
      <Defs>
        {/* Branco em cima, descendo para um azul-gelo (dá volume à nuvem) */}
        <SvgLinearGradient
          id={idGrad}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="110"
          x2="0"
          y2="330"
        >
          <Stop offset="0" stopColor={cores.branco} />
          <Stop offset="0.55" stopColor={cores.brancoAzulado} />
          <Stop offset="1" stopColor={cores.azulGelo} />
        </SvgLinearGradient>
      </Defs>

      {camadas.map((camada, i) => (
        <G key={i} opacity={camada.opacidade}>
          {camada.bolas.map((b, j) => (
            <Circle
              key={j}
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              fill={`url(#${idGrad})`}
            />
          ))}
        </G>
      ))}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Tela de abertura                                                     */
/* ------------------------------------------------------------------ */
export default function Abertura() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Coluna central (lua + nome): no celular ocupa a tela toda;
  // no navegador, em janela larga, fica centralizada com até 480 px.
  const largura = Math.min(width, 480);
  const margem = (width - largura) / 2;

  // Estrelas: mais estrelas quando a janela é larga
  const estrelas = width > 700 ? ESTRELAS : ESTRELAS.slice(0, 36);

  // Nuvens: cada pedaço tem tamanho fixo; em janela larga repetimos
  // os pedaços para cobrir o céu inteiro.
  const bancoLargura = largura * 0.75;
  const passo = bancoLargura * 0.88; // um pedaço entra um pouco no outro
  const copias = Math.max(1, Math.ceil((width * 0.55) / passo));
  const grupoLargura = bancoLargura + (copias - 1) * passo;
  const saida = grupoLargura * 1.4; // quanto cada lado anda para sair da tela

  const fase = useRef(new Animated.Value(0)).current; // lua
  const titulo = useRef(new Animated.Value(0)).current; // nome + linhas
  const abrir = useRef(new Animated.Value(0)).current; // nuvens abrindo

  useEffect(() => {
    const sequencia = Animated.sequence([
      Animated.delay(400),
      // 1) lua muda de fase até a crescente
      Animated.timing(fase, {
        toValue: 1,
        duration: TEMPO_LUA,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      // 2) nome EVOLUA aparece
      Animated.timing(titulo, {
        toValue: 1,
        duration: TEMPO_TITULO,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: NATIVO,
      }),
      Animated.delay(PAUSA_ANTES_NUVENS),
      // 3) nuvens se abrem
      Animated.timing(abrir, {
        toValue: 1,
        duration: TEMPO_NUVENS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: NATIVO,
      }),
    ]);

    // 4) vai para o login
    sequencia.start(({ finished }) => {
      if (finished) router.replace('/acesso/login');
    });

    return () => sequencia.stop();
  }, []);

  // Nuvens abrindo para os lados, chegando mais perto
  const nuvemEsqX = abrir.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -saida],
  });
  const nuvemDirX = abrir.interpolate({
    inputRange: [0, 1],
    outputRange: [0, saida],
  });
  const nuvemY = abrir.interpolate({
    inputRange: [0, 1],
    outputRange: [0, largura * 0.12],
  });
  const nuvemEscala = abrir.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  // Lua + nome se afastam (sensação de atravessar a nuvem)
  const centroEscala = abrir.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });
  const centroOpacidade = abrir.interpolate({
    inputRange: [0, 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const tituloY = titulo.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <LinearGradient
      colors={[cores.azulProfundo, cores.azulEvolua, cores.azulCeu, cores.lavanda]}
      locations={[0, 0.35, 0.65, 1]}
      style={styles.fundo}
    >
      <StatusBar hidden />

      <View style={styles.palco}>
        {/* Estrelas piscando (céu inteiro) */}
        {estrelas.map((e) => (
          <Estrela
            key={e.id}
            x={e.x}
            y={e.y}
            tamanho={e.tamanho}
            atraso={e.atraso}
            duracao={e.duracao}
            cor={e.cor}
          />
        ))}

        {/* Coluna central: lua + nome */}
        <View style={[styles.centro, { width: largura, left: margem }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: centroOpacidade,
                transform: [{ scale: centroEscala }],
              },
            ]}
          >
            <View style={styles.luaBox}>
              <Lua progresso={fase} />
            </View>

            <Animated.Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.titulo,
                { opacity: titulo, transform: [{ translateY: tituloY }] },
              ]}
            >
              EVOLUA
            </Animated.Text>

            <Animated.View
              style={[StyleSheet.absoluteFill, { opacity: titulo }]}
            >
              <View style={styles.linhaC} />
              <View style={styles.linhaB} />
              <View style={styles.linhaA}>
                <View style={[styles.ponto, { width: 7, height: 7 }]} />
                <View style={[styles.ponto, { width: 10, height: 10 }]} />
                <View style={[styles.ponto, { width: 10, height: 10 }]} />
                <View style={styles.linhaAtraco} />
              </View>
              <View style={styles.brilhoBox}>
                <Brilho />
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Nuvens da esquerda (abrem para a esquerda no final) */}
        <Animated.View
          style={[
            styles.grupoNuvens,
            {
              left: -bancoLargura * 0.1,
              width: grupoLargura,
              transform: [
                { translateX: nuvemEsqX },
                { translateY: nuvemY },
                { scale: nuvemEscala },
              ],
            },
          ]}
        >
          {Array.from({ length: copias }, (_, i) => (
            <View
              key={i}
              style={[
                styles.pedacoNuvem,
                { width: bancoLargura, left: i * passo },
              ]}
            >
              <BancoNuvens lado="esq" />
            </View>
          ))}
        </Animated.View>

        {/* Nuvens da direita (abrem para a direita no final) */}
        <Animated.View
          style={[
            styles.grupoNuvens,
            {
              right: -bancoLargura * 0.1,
              width: grupoLargura,
              transform: [
                { translateX: nuvemDirX },
                { translateY: nuvemY },
                { scale: nuvemEscala },
              ],
            },
          ]}
        >
          {Array.from({ length: copias }, (_, i) => (
            <View
              key={i}
              style={[
                styles.pedacoNuvem,
                { width: bancoLargura, right: i * passo },
              ]}
            >
              <BancoNuvens lado="dir" />
            </View>
          ))}
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },

  // Céu inteiro (sem limite de largura)
  palco: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },

  // Coluna central onde ficam a lua e o nome
  centro: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },

  luaBox: {
    position: 'absolute',
    left: '21%',
    top: '40.5%',
    width: 150,
    height: 150,
  },

  titulo: {
    position: 'absolute',
    left: '41%',
    top: '44%',
    width: '57%',
    fontSize: 44,
    color: cores.branco,
    fontFamily: fontes.titulo,
    letterSpacing: 2,
    textShadowColor: 'rgba(46, 91, 154, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Linhas decorativas (como na imagem)
  linhaA: {
    position: 'absolute',
    left: 8,
    top: '52.6%',
    width: '64%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ponto: {
    borderRadius: 10,
    backgroundColor: cores.branco,
    marginRight: 3,
  },
  linhaAtraco: {
    flex: 1,
    height: 1.5,
    backgroundColor: cores.branco,
  },
  linhaB: {
    position: 'absolute',
    left: '56%',
    right: '6%',
    top: '51.2%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  linhaC: {
    position: 'absolute',
    left: '19%',
    width: '50%',
    top: '50.3%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },

  brilhoBox: {
    position: 'absolute',
    left: '11%',
    top: '47.4%',
  },
  brilho: {
    fontSize: 34,
    color: cores.branco,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Nuvens
  grupoNuvens: {
    position: 'absolute',
    bottom: -24,
    height: '42%',
  },
  pedacoNuvem: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});