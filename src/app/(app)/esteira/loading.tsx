import { EsqueletoLista, Esqueletos, EsqueletoTopo } from '@/components/ui/esqueletos';

/** Só a busca no alto e a lista curta de operações em estruturação. */
export default function Carregando() {
  return (
    <Esqueletos>
      <EsqueletoTopo botoes={0} />
      <EsqueletoLista linhas={4} />
    </Esqueletos>
  );
}
