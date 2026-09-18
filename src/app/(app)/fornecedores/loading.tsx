import { EsqueletoAbas, Esqueletos, EsqueletoTabela, EsqueletoTopo } from '@/components/ui/esqueletos';

/** Duas abas, busca com "Novo Fundo" e a tabela densa de fundos. */
export default function Carregando() {
  return (
    <Esqueletos>
      <EsqueletoAbas quantas={2} />
      <EsqueletoTopo botoes={1} />
      <EsqueletoTabela colunas={6} linhas={9} />
    </Esqueletos>
  );
}
