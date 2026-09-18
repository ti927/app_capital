import { EsqueletoAbas, EsqueletoLista, Esqueletos, EsqueletoTopo } from '@/components/ui/esqueletos';

/** Título, as três abas (Cliente · Fornecedor · Status) e a lista de operações. */
export default function Carregando() {
  return (
    <Esqueletos>
      <EsqueletoTopo titulo />
      <EsqueletoAbas quantas={3} />
      <EsqueletoLista linhas={8} />
    </Esqueletos>
  );
}
