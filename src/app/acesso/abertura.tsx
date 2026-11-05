import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
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
  Mask,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/* ------------------------------------------------------------------ */
/* Configurações da animação (ajuste aqui se quiser mais rápido/lento) */
/* ------------------------------------------------------------------ */
const TEMPO_LUA = 3600; // lua passando pelas fases
const TEMPO_TITULO = 1100; // nome EVOLUA aparecendo
const PAUSA_ANTES_NUVENS = 900; // respiro antes das nuvens abrirem
const TEMPO_NUVENS = 1800; // nuvens se abrindo

const NATIVO = Platform.OS !== 'web';

const SERIF = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia, "Times New Roman", serif',
});

/* ------------------------------------------------------------------ */
/* Estrelas (posições fixas, para não dar diferença entre servidor e   */
/* navegador)                                                          */
/* ------------------------------------------------------------------ */
function gerarEstrelas() {
  let s = 12345;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const arred = (n: number) => Math.round(n * 10) / 10;

  return Array.from({ length: 36 }, (_, i) => ({
    id: i,
    x: arred(3 + rnd() * 94),
    y: arred(3 + rnd() * 58),
    tamanho: arred(1.5 + rnd() * 2.5),
    atraso: Math.floor(rnd() * 2500),
    duracao: 700 + Math.floor(rnd() * 1100),
  }));
}

const ESTRELAS = gerarEstrelas();

type EstrelaProps = {
  x: number;
  y: number;
  tamanho: number;
  atraso: number;
  duracao: number;
};

function Estrela({ x, y, tamanho, atraso, duracao }: EstrelaProps) {
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
        backgroundColor: '#FFFFFF',
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
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#C6D6EC" />
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
      <Circle cx="80" cy="80" r="74" fill="#FFFFFF" opacity={0.06} />
      <Circle cx="80" cy="80" r="60" fill="#FFFFFF" opacity={0.1} />

      {/* Parte iluminada */}
      <G mask="url(#sombra)">
        <Circle cx="80" cy="80" r="60" fill="url(#luaGrad)" />
        <Circle cx="62" cy="70" r="9" fill="#AFC2DD" opacity={0.35} />
        <Circle cx="95" cy="100" r="12" fill="#AFC2DD" opacity={0.3} />
        <Circle cx="80" cy="52" r="6" fill="#AFC2DD" opacity={0.3} />
        <Circle cx="102" cy="68" r="5" fill="#AFC2DD" opacity={0.3} />
        <Circle cx="66" cy="104" r="7" fill="#AFC2DD" opacity={0.3} />
      </G>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Nuvens: dois bancos que se abrem para os lados                       */
/* ------------------------------------------------------------------ */
type Bola = { cx: number; cy: number; r: number; o: number };

const NUVEM_ESQ: Bola[] = [
  { cx: 70, cy: 150, r: 110, o: 0.35 },
  { cx: 190, cy: 120, r: 80, o: 0.35 },
  { cx: 110, cy: 200, r: 100, o: 0.6 },
  { cx: 30, cy: 230, r: 90, o: 0.6 },
  { cx: 60, cy: 290, r: 80, o: 0.92 },
  { cx: 160, cy: 275, r: 95, o: 0.92 },
  { cx: 250, cy: 300, r: 75, o: 0.92 },
];

const NUVEM_DIR: Bola[] = [
  { cx: 230, cy: 140, r: 105, o: 0.35 },
  { cx: 110, cy: 115, r: 75, o: 0.35 },
  { cx: 190, cy: 205, r: 100, o: 0.6 },
  { cx: 275, cy: 240, r: 85, o: 0.6 },
  { cx: 240, cy: 290, r: 80, o: 0.92 },
  { cx: 140, cy: 280, r: 95, o: 0.92 },
  { cx: 50, cy: 305, r: 75, o: 0.92 },
];

function BancoNuvens({ lado }: { lado: 'esq' | 'dir' }) {
  const bolas = lado === 'esq' ? NUVEM_ESQ : NUVEM_DIR;
  const idGrad = `nuvemGrad-${lado}`;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 300 330"
      preserveAspectRatio="xMidYMax meet"
    >
      <Defs>
        <RadialGradient id={idGrad} cx="50%" cy="40%" r="65%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#D3E3F5" />
        </RadialGradient>
      </Defs>

      {bolas.map((b, i) => (
        <Circle
          key={i}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          fill={`url(#${idGrad})`}
          fillOpacity={b.o}
          stroke="#C5D9EE"
          strokeOpacity={0.5}
          strokeWidth={2}
        />
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
  const largura = Math.min(width, 480);

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
    outputRange: [0, -largura * 0.9],
  });
  const nuvemDirX = abrir.interpolate({
    inputRange: [0, 1],
    outputRange: [0, largura * 0.9],
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
      colors={['#4F7CBD', '#7FA6DC', '#A7C5EB', '#8CB1E2']}
      locations={[0, 0.35, 0.6, 1]}
      style={styles.fundo}
    >
      <StatusBar hidden />

      <View style={styles.palco}>
        {/* Estrelas piscando */}
        {ESTRELAS.map((e) => (
          <Estrela
            key={e.id}
            x={e.x}
            y={e.y}
            tamanho={e.tamanho}
            atraso={e.atraso}
            duracao={e.duracao}
          />
        ))}

        {/* Lua + nome */}
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

        {/* Nuvens (abrem para os lados no final) */}
        <Animated.View
          style={[
            styles.banco,
            styles.bancoEsq,
            {
              transform: [
                { translateX: nuvemEsqX },
                { translateY: nuvemY },
                { scale: nuvemEscala },
              ],
            },
          ]}
        >
          <BancoNuvens lado="esq" />
        </Animated.View>

        <Animated.View
          style={[
            styles.banco,
            styles.bancoDir,
            {
              transform: [
                { translateX: nuvemDirX },
                { translateY: nuvemY },
                { scale: nuvemEscala },
              ],
            },
          ]}
        >
          <BancoNuvens lado="dir" />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
  },

  palco: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    overflow: 'hidden',
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
    left: '36%',
    top: '44%',
    width: '62%',
    fontSize: 46,
    color: '#FFFFFF',
    fontFamily: SERIF,
    letterSpacing: 1,
    textShadowColor: 'rgba(40, 80, 140, 0.35)',
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
    backgroundColor: '#FFFFFF',
    marginRight: 3,
  },
  linhaAtraco: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#FFFFFF',
  },
  linhaB: {
    position: 'absolute',
    left: '52%',
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
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Nuvens
  banco: {
    position: 'absolute',
    bottom: -24,
    width: '75%',
    height: '42%',
  },
  bancoEsq: {
    left: '-10%',
  },
  bancoDir: {
    right: '-10%',
  },
});