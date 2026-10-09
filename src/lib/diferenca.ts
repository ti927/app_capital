/**
 * O que sai e o que entra para o conjunto `atuais` virar `novos`.
 *
 * Os formulários de vínculo (visualizadores, tipos de operação, tags, declínios)
 * regravavam o conjunto inteiro a cada salvar: apagar tudo e inserir de novo,
 * duas idas ao banco mesmo sem nada ter mudado. Com a diferença, só vai ao banco
 * o que mudou — e nada vai quando nada mudou.
 */
export function diferenca<T>(atuais: Iterable<T>, novos: Iterable<T>): { remover: T[]; incluir: T[] } {
  const antes = new Set(atuais);
  const depois = new Set(novos);
  return {
    remover: [...antes].filter((x) => !depois.has(x)),
    incluir: [...depois].filter((x) => !antes.has(x)),
  };
}
