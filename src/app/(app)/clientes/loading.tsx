import { EsqueletoLista, Esqueletos, EsqueletoTopo } from '@/components/ui/esqueletos';

/** Busca + "Novo Cliente" no alto, lista embaixo — a forma de `tela.tsx`. */
export default function Carregando() {
  return (
    <Esqueletos>
      <EsqueletoTopo botoes={1} />
      <EsqueletoLista linhas={9} />
    </Esqueletos>
  );
}
