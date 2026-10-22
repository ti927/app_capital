import { redirect } from 'next/navigation';

/** "Agenda" virou "Conexões" (specs/17): link antigo e favorito continuam valendo. */
export default function PaginaAgenda() {
  redirect('/conta/conexoes');
}
