'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { Botao, Campo } from '@/components/ui/base';
import { TopoDaTela } from '@/components/ui/casca';
import { LogoGoogleAgenda, LogoGoogleDrive } from '@/components/ui/logos-google';
import { clienteNavegador } from '@/lib/supabase/navegador';
import type { EstadoDaConexao } from '@/lib/google/conexao';
import type { EstadoDoDrive } from '@/lib/google/drive';
import { desconectarAgenda, desconectarDrive, salvarPastaRaiz } from './acoes';
import './conexoes.css';

const ESCOPO_AGENDA = 'https://www.googleapis.com/auth/calendar.events';
const ESCOPO_DRIVE = 'https://www.googleapis.com/auth/drive.readonly';

/**
 * Conexões com o Google (specs/11 e specs/17). Conectar refaz o OAuth do
 * Google pedindo, além do login, a permissão do serviço — com
 * `access_type=offline` (o app age quando a pessoa não está na tela) e
 * `prompt=consent` (sem isso o Google só manda o refresh token na primeira
 * vez da vida, e uma reconexão voltaria sem ele).
 */
async function conectar(qual: 'agenda' | 'drive') {
  const { error } = await clienteNavegador().auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: qual === 'drive' ? ESCOPO_DRIVE : ESCOPO_AGENDA,
      queryParams: { access_type: 'offline', prompt: 'consent' },
      redirectTo: `${window.location.origin}/auth/retorno?${qual}=1`,
    },
  });
  return !error;
}

export function PainelConexoes({
  agenda,
  drive,
  erro,
  acabouDeConectar,
}: {
  agenda: EstadoDaConexao;
  /** `null` para quem não é master: o card do Drive nem aparece. */
  drive: EstadoDoDrive | null;
  erro: { onde: 'agenda' | 'drive'; texto: string } | null;
  acabouDeConectar: 'agenda' | 'drive' | null;
}) {
  return (
    <>
      <TopoDaTela titulo="Conexões" />
      <p className="apoio conexoes__intro">Ligue o app aos serviços do Google que a equipe já usa.</p>

      <div className="conexoes">
        <CardAgenda
          estado={agenda}
          erro={erro?.onde === 'agenda' ? erro.texto : null}
          acabou={acabouDeConectar === 'agenda'}
        />
        {drive ? (
          <CardDrive
            estado={drive}
            erro={erro?.onde === 'drive' ? erro.texto : null}
            acabou={acabouDeConectar === 'drive'}
          />
        ) : null}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ card -- */

function Card({
  id,
  logo,
  titulo,
  quem,
  conectado,
  caiu,
  emailGoogle,
  children,
}: {
  id: string;
  logo: ReactNode;
  titulo: string;
  quem: string;
  conectado: boolean;
  caiu: boolean;
  emailGoogle: string | null;
  children: ReactNode;
}) {
  const situacao = conectado ? 'conectado' : caiu ? 'caiu' : 'desligado';
  return (
    <section className={`conexao conexao--${situacao}`} aria-labelledby={`conexao-${id}`}>
      <header className="conexao__topo">
        <span className="conexao__logo">{logo}</span>
        <div className="conexao__nome">
          <h2 id={`conexao-${id}`} className="conexao__titulo">
            {titulo}
          </h2>
          <span className="conexao__quem">{quem}</span>
        </div>
        <span className="conexao__selo">
          <span className="conexao__ponto" aria-hidden="true" />
          {conectado ? 'Conectado' : caiu ? 'Reconectar' : 'Desconectado'}
        </span>
      </header>
      {conectado && emailGoogle ? (
        <p className="conexao__conta">
          como <strong>{emailGoogle}</strong>
        </p>
      ) : null}
      {children}
    </section>
  );
}

function Avisos({
  erro,
  acabou,
  caiu,
  textoAcabou,
}: {
  erro: string | null;
  acabou: boolean;
  caiu: boolean;
  textoAcabou: string;
}) {
  return (
    <>
      {acabou ? (
        <p className="conexao__ok" role="status">
          {textoAcabou}
        </p>
      ) : null}
      {erro ? (
        <p className="lc-field__msg" role="alert">
          {erro}
        </p>
      ) : null}
      {caiu ? (
        <p className="lc-field__msg" role="alert">
          O Google recusou a conexão — o acesso foi revogado ou expirou. Conecte de novo.
        </p>
      ) : null}
    </>
  );
}

function BotaoConectar({ qual, caiu }: { qual: 'agenda' | 'drive'; caiu: boolean }) {
  const [indo, setIndo] = useState(false);
  return (
    <Botao
      variante="primary"
      disabled={indo}
      onClick={async () => {
        setIndo(true);
        if (!(await conectar(qual))) setIndo(false);
      }}
    >
      {indo ? 'Abrindo o Google…' : caiu ? 'Reconectar' : 'Conectar'}
    </Botao>
  );
}

function CardAgenda({ estado, erro, acabou }: { estado: EstadoDaConexao; erro: string | null; acabou: boolean }) {
  const [desconectando, transicao] = useTransition();

  return (
    <Card
      id="agenda"
      logo={<LogoGoogleAgenda tamanho={36} />}
      titulo="Google Agenda"
      quem="Sua agenda pessoal"
      conectado={estado.conectado}
      caiu={estado.caiu}
      emailGoogle={estado.emailGoogle}
    >
      <p className="conexao__texto">
        Tarefas de <strong>reunião</strong> do funil, com data e hora, em que você é responsável viram eventos
        na sua agenda, com link do Google Meet. O ícone da agenda em cada tarefa manda uma cópia direto.
      </p>
      <Avisos
        erro={erro}
        acabou={acabou}
        caiu={estado.caiu}
        textoAcabou="Agenda conectada. As próximas reuniões já vão para ela."
      />
      <div className="conexao__acoes">
        {estado.conectado ? (
          <Botao variante="secondary" carregando={desconectando} onClick={() => transicao(() => desconectarAgenda())}>
            {desconectando ? 'Desconectando…' : 'Desconectar'}
          </Botao>
        ) : (
          <BotaoConectar qual="agenda" caiu={estado.caiu} />
        )}
      </div>
    </Card>
  );
}

function CardDrive({ estado, erro, acabou }: { estado: EstadoDoDrive; erro: string | null; acabou: boolean }) {
  const [desconectando, transicaoDesconectar] = useTransition();
  const [salvando, transicaoSalvar] = useTransition();
  const [link, setLink] = useState('');
  const [erroPasta, setErroPasta] = useState<string | null>(null);

  return (
    <Card
      id="drive"
      logo={<LogoGoogleDrive tamanho={34} />}
      titulo="Google Drive"
      quem="Drive da Lure · só master conecta"
      conectado={estado.conectado}
      caiu={estado.caiu}
      emailGoogle={estado.emailGoogle}
    >
      <p className="conexao__texto">
        Cada cliente ganha a aba <strong>Documentos</strong>, com os arquivos da pasta do Drive que tem o nome
        dele. Só leitura — o app nunca altera nada no Drive. Quem vê o cliente vê os documentos.
      </p>
      <Avisos
        erro={erro}
        acabou={acabou}
        caiu={estado.caiu}
        textoAcabou="Drive conectado. Os documentos já aparecem nos clientes."
      />

      {estado.conectado ? (
        <form
          className="conexao__pasta"
          onSubmit={(e) => {
            e.preventDefault();
            transicaoSalvar(async () => {
              const r = await salvarPastaRaiz(link);
              setErroPasta(r.erro ?? null);
              if (!r.erro) setLink('');
            });
          }}
        >
          <p className="conexao__rotulo">Pasta dos clientes</p>
          <p className="apoio">
            {estado.pastaRaiz ? (
              <>
                Buscando dentro de <strong>{estado.pastaRaiz.nome ?? estado.pastaRaiz.id}</strong>.
              </>
            ) : (
              'Buscando em todo o Drive. Para acertar mais, cole o link da pasta onde ficam as pastas dos clientes.'
            )}
          </p>
          <div className="conexao__pasta-linha">
            <Campo
              rotulo="Link da pasta"
              nome="pasta"
              valor={link}
              aoMudar={setLink}
              placeholder="https://drive.google.com/drive/folders/…"
            />
            <Botao variante="secondary" type="submit" carregando={salvando} disabled={!link.trim()}>
              Usar esta pasta
            </Botao>
          </div>
          {estado.pastaRaiz ? (
            <Botao
              variante="tertiary"
              tamanho="sm"
              onClick={() =>
                transicaoSalvar(async () => {
                  await salvarPastaRaiz('');
                })
              }
            >
              Buscar em todo o Drive
            </Botao>
          ) : null}
          {erroPasta ? (
            <p className="lc-field__msg" role="alert">
              {erroPasta}
            </p>
          ) : null}
        </form>
      ) : null}

      <div className="conexao__acoes">
        {estado.conectado ? (
          <Botao
            variante="secondary"
            carregando={desconectando}
            onClick={() => transicaoDesconectar(() => desconectarDrive())}
          >
            {desconectando ? 'Desconectando…' : 'Desconectar'}
          </Botao>
        ) : (
          <BotaoConectar qual="drive" caiu={estado.caiu} />
        )}
      </div>
    </Card>
  );
}
