import { View, Text } from '@react-pdf/renderer';

// Dimensiones reales en puntos (1 pt = 1/72 in)
// A2: 594 x 420 mm = 1684 x 1190 pt (landscape)
export const A2_WIDTH = 1684;
export const A2_HEIGHT = 1190;
export const A4_WIDTH = 842;
export const A4_HEIGHT = 595;

// Recibe children y los posiciona en el canvas A2
export function WeekPrintA2Canvas({ children, style }) {
  return (
    <View
      style={{
        width: A2_WIDTH,
        height: A2_HEIGHT,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </View>
  );
}

// Recorte de cuadrante para poster
export function PosterQuadrant({ quadrant, children }) {
  // quadrant: 0=TL, 1=TR, 2=BL, 3=BR
  // Calcula desplazamiento
  const offsetX = (quadrant % 2) * A4_WIDTH;
  const offsetY = Math.floor(quadrant / 2) * A4_HEIGHT;
  return (
    <View
      style={{
        width: A4_WIDTH,
        height: A4_HEIGHT,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: -offsetX,
          top: -offsetY,
          width: A2_WIDTH,
          height: A2_HEIGHT,
        }}
      >
        {children}
      </View>
      {/* Marca discreta de cuadrante */}
      <Text
        style={{
          position: 'absolute',
          right: 12,
          bottom: 8,
          fontSize: 10,
          color: '#bbb',
        }}
      >
        {['A2 TL','A2 TR','A2 BL','A2 BR'][quadrant]}
      </Text>
    </View>
  );
}
