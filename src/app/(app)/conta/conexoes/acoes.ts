'use server';

import { revalidatePath } from 'next/cache';
import { perfilAtual } from '@/lib/perfil';
import { apagarConexao } from '@/lib/google/conexao';
import { revogarNoGoogle } from '@/lib/google/agenda';
import { apagarConexaoDrive, definirPastaRaiz } from '@/lib/google/drive';

/**
 * Desconecta a agenda de quem está logado — e só dela: o perfil vem da sessão,
 * nunca de parâmetro. Os eventos já criados ficam na agenda; o que para é a
 * sincronização.
 */
export async function desconectarAgenda() {
  const perfil = await perfilAtual();
  await revogarNoGoogle(perfil.id);
  await apagarConexao(perfil.id);
  revalidatePath('/conta/conexoes');
}

/** O Drive é da empresa (specs/17): só master mexe na conexão. */
async function exigirMaster() {
  const perfil = await perfilAtual();
  if (perfil.nivel_acesso !== 'master') throw new Error('Só master gerencia o Google Drive.');
}

export async function desconectarDrive() {
  await exigirMaster();
  await apagarConexaoDrive();
  revalidatePath('/conta/conexoes');
}

export async function salvarPastaRaiz(linkOuId: string): Promise<{ erro?: string }> {
  await exigirMaster();
  const r = await definirPastaRaiz(linkOuId);
  revalidatePath('/conta/conexoes');
  return r;
}
