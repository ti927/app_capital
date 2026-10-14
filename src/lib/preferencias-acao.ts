'use server';

import { clienteServidor } from '@/lib/supabase/servidor';
import type { PreferenciaPopups } from '@/lib/dominio';

/**
 * Grava a preferência de pop-ups da pessoa da sessão. Usa a sessão dela
 * (nunca service_role) e a função `definir_ui_popups` (db/014), que só mexe
 * nesta coluna e só na linha de `auth.uid()`. O valor do navegador é
 * conferido aqui e de novo no banco.
 *
 * Sem `revalidatePath`: a tela já trocou na hora (otimista, contexto em
 * src/components/preferencias.tsx); recarregar o layout só custaria tempo.
 */
export async function gravarPreferenciaPopups(valor: string): Promise<{ erro?: string }> {
  if (valor !== 'classica' && valor !== 'moderna') return { erro: 'opção inválida.' };
  const supabase = await clienteServidor();
  const { error } = await supabase.rpc('definir_ui_popups', { valor: valor satisfies PreferenciaPopups });
  return error ? { erro: 'Não consegui gravar a preferência.' } : {};
}
