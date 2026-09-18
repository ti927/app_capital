import { perfilAtual } from '@/lib/perfil';
import { FormularioDeSenha } from './formulario';

export const metadata = { title: 'Trocar senha · Lure Capital' };

/**
 * Troca de senha.
 *
 * O botão "Senha" da barra superior sempre apontou para cá e a rota não
 * existia — dava 404 em produção, para qualquer usuário que clicasse. As cinco
 * contas foram criadas com senha provisória (`specs/04-fases.md`), então esta
 * é a tela que faltava para a primeira troca.
 */
export default async function PaginaSenha() {
  const perfil = await perfilAtual();
  return <FormularioDeSenha email={perfil.email} />;
}
