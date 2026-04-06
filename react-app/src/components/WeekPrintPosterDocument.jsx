import { Document, Page } from '@react-pdf/renderer';
import { WeekPrintA2Canvas, PosterQuadrant, A2_WIDTH, A2_HEIGHT, A4_WIDTH, A4_HEIGHT } from './WeekPrintA2Canvas';
import WeekPrintA2Content from './WeekPrintA2Content';

// Recibe las mismas props que WeekPrintA2Content
export default function WeekPrintPosterDocument(props) {
  // 4 cuadrantes: 0=TL, 1=TR, 2=BL, 3=BR
  return (
    <Document>
      {[0, 1, 2, 3].map((quadrant) => (
        <Page
          key={quadrant}
          size={{ width: A4_WIDTH, height: A4_HEIGHT }}
          orientation="landscape"
          style={{ padding: 0, margin: 0 }}
        >
          <PosterQuadrant quadrant={quadrant}>
            <WeekPrintA2Canvas>
              <WeekPrintA2Content {...props} />
            </WeekPrintA2Canvas>
          </PosterQuadrant>
        </Page>
      ))}
    </Document>
  );
}
