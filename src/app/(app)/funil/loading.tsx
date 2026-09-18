import { EsqueletoQuadro, Esqueletos, EsqueletoTopo } from '@/components/ui/esqueletos';

/** "FUNIL COMERCIAL" com as três ações, e o quadro de colunas. */
export default function Carregando() {
  return (
    <Esqueletos>
      <EsqueletoTopo titulo botoes={3} />
      <EsqueletoQuadro colunas={5} cartoes={3} />
    </Esqueletos>
  );
}
