'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PreferenciaPopups } from '@/lib/dominio';
import { gravarPreferenciaPopups } from '@/lib/preferencias-acao';
import { useAvisos } from './ui/aviso';

/**
 * Preferências da pessoa, lidas do perfil no layout (sem consulta por tela) e
 * trocadas na hora: a escolha vale a partir do próximo pop-up aberto, e a
 * gravação segue em segundo plano. Se falhar, volta ao valor anterior e avisa.
 */
interface Contexto {
  popups: PreferenciaPopups;
  mudarPopups: (valor: PreferenciaPopups) => void;
}

const Ctx = createContext<Contexto>({ popups: 'classica', mudarPopups: () => {} });

export function PreferenciasProvider({ popups: inicial, children }: { popups: PreferenciaPopups; children: ReactNode }) {
  const [popups, setPopups] = useState<PreferenciaPopups>(inicial);
  const atual = useRef(inicial);
  atual.current = popups;
  const { avisar } = useAvisos();

  const mudarPopups = useCallback(
    (valor: PreferenciaPopups) => {
      const anterior = atual.current;
      if (valor === anterior) return;
      setPopups(valor);
      avisar('Preferência salva');
      void gravarPreferenciaPopups(valor)
        .catch(() => ({ erro: 'sem resposta do servidor.' }))
        .then((r) => {
          if (!r.erro) return;
          setPopups(anterior);
          avisar(`Não salvei a preferência: ${r.erro}`, { tipo: 'erro' });
        });
    },
    [avisar],
  );

  const valor = useMemo(() => ({ popups, mudarPopups }), [popups, mudarPopups]);
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function usePreferencias() {
  return useContext(Ctx);
}
