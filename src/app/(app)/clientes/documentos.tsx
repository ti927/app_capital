'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Botao } from '@/components/ui/base';
import { Indicador } from '@/components/ui/indicador';
import { LogoGoogleDrive } from '@/components/ui/logos-google';
import type { ItemDoDrive } from '@/lib/google/drive';
import { documentosDoCliente, type RespostaDocumentos } from './documentos-acoes';
import './documentos.css';

/**
 * Abas do cliente já cadastrado: "Cadastro" (o formulário de sempre) e
 * "Documentos" (specs/17). O formulário fica montado mesmo escondido — o
 * "Salvar" do rodapé aponta para ele por `form=`, e trocar de aba não pode
 * perder o que foi digitado.
 */
export function AbasDoCliente({
  clienteId,
  ehMaster,
  children,
}: {
  clienteId: string | null;
  ehMaster: boolean;
  children: ReactNode;
}) {
  const [aba, setAba] = useState<'cadastro' | 'documentos'>('cadastro');
  if (!clienteId) return <>{children}</>;

  return (
    <>
      <div className="abas docs__abas" role="tablist">
        <Indicador seletor={'.abas__item[aria-selected="true"]'} tipo="sublinhado" />
        <button
          type="button"
          role="tab"
          className="abas__item"
          aria-selected={aba === 'cadastro'}
          onClick={() => setAba('cadastro')}
        >
          Cadastro
        </button>
        <button
          type="button"
          role="tab"
          className="abas__item"
          aria-selected={aba === 'documentos'}
          onClick={() => setAba('documentos')}
        >
          Documentos
        </button>
      </div>
      <div hidden={aba !== 'cadastro'}>{children}</div>
      {aba === 'documentos' ? <AbaDocumentos clienteId={clienteId} ehMaster={ehMaster} /> : null}
    </>
  );
}

/* ------------------------------------------------------------ documentos -- */

type Trilha = Array<{ id: string | null; nome: string }>;

function AbaDocumentos({ clienteId, ehMaster }: { clienteId: string; ehMaster: boolean }) {
  // `id: null` é a pasta do cliente — o nome real chega com a primeira resposta.
  const [trilha, setTrilha] = useState<Trilha>([{ id: null, nome: 'Documentos' }]);
  const [resposta, setResposta] = useState<RespostaDocumentos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState<ItemDoDrive | null>(null);

  const atual = trilha[trilha.length - 1];

  const carregar = useCallback(
    async (pastaId: string | null) => {
      setCarregando(true);
      setResposta(await documentosDoCliente(clienteId, pastaId ?? undefined));
      setCarregando(false);
    },
    [clienteId],
  );

  useEffect(() => {
    void carregar(atual.id);
  }, [carregar, atual.id]);

  // O nome da pasta do cliente substitui o "Documentos" provisório da trilha.
  const nomeRaiz = resposta?.estado === 'ok' ? resposta.pastaDoCliente.nome : null;
  useEffect(() => {
    if (nomeRaiz) setTrilha((t) => (t[0].nome === nomeRaiz ? t : [{ id: null, nome: nomeRaiz }, ...t.slice(1)]));
  }, [nomeRaiz]);

  const itens = useMemo(() => {
    if (resposta?.estado !== 'ok') return [];
    const termo = busca.trim().toLowerCase();
    return termo ? resposta.itens.filter((i) => i.nome.toLowerCase().includes(termo)) : resposta.itens;
  }, [resposta, busca]);

  if (aberto) {
    return <Visualizador clienteId={clienteId} arquivo={aberto} aoVoltar={() => setAberto(null)} />;
  }

  return (
    <section className="docs" aria-busy={carregando}>
      <header className="docs__topo">
        <span className="docs__logo">
          <LogoGoogleDrive tamanho={20} />
        </span>
        <nav className="docs__trilha" aria-label="Pastas">
          {trilha.map((p, i) => (
            <span key={`${p.id}-${i}`} className="docs__trilha-item">
              {i > 0 ? <span className="docs__sep" aria-hidden="true">/</span> : null}
              {i < trilha.length - 1 ? (
                <button type="button" className="docs__trilha-botao" onClick={() => setTrilha(trilha.slice(0, i + 1))}>
                  {p.nome}
                </button>
              ) : (
                <span className="docs__trilha-atual">{p.nome}</span>
              )}
            </span>
          ))}
        </nav>
        {resposta?.estado === 'ok' && resposta.itens.length > 6 ? (
          <input
            className="lc-field__input docs__busca"
            type="search"
            placeholder="Filtrar nesta pasta"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Filtrar documentos nesta pasta"
          />
        ) : null}
      </header>

      {carregando ? (
        <ul className="docs__lista" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="docs__item docs__item--esqueleto" />
          ))}
        </ul>
      ) : !resposta ? null : resposta.estado === 'sem-drive' ? (
        <Estado titulo="O Google Drive não está conectado">
          {ehMaster ? (
            <>
              Conecte o Drive da Lure em <Link href="/conta/conexoes">Conexões</Link> para ver os documentos aqui.
            </>
          ) : (
            'Peça a um master para conectar o Drive da Lure.'
          )}
        </Estado>
      ) : resposta.estado === 'sem-pasta' ? (
        <Estado titulo="Nenhuma pasta com o nome deste cliente">
          Procurei uma pasta parecida com <strong>{resposta.buscado}</strong> no Drive da Lure e não achei. Crie a
          pasta (ou renomeie a que já existe) com o nome do cliente.
        </Estado>
      ) : resposta.estado === 'erro' ? (
        <Estado titulo="Não deu para abrir os documentos" erro>
          {resposta.erro}{' '}
          <Botao variante="tertiary" tamanho="sm" onClick={() => void carregar(atual.id)}>
            Tentar de novo
          </Botao>
        </Estado>
      ) : (
        <>
          {resposta.outras.length > 0 && trilha.length === 1 ? (
            <p className="docs__aviso apoio">
              Também parecem deste cliente: {resposta.outras.slice(0, 3).join(', ')}
              {resposta.outras.length > 3 ? ` e mais ${resposta.outras.length - 3}` : ''}. Mostrando a mais parecida.
            </p>
          ) : null}
          {itens.length === 0 ? (
            <Estado titulo={busca ? 'Nada com esse nome nesta pasta' : 'Pasta vazia'} />
          ) : (
            <ul className="docs__lista">
              {itens.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="docs__item"
                    onClick={() =>
                      item.ehPasta ? (setBusca(''), setTrilha([...trilha, { id: item.id, nome: item.nome }])) : setAberto(item)
                    }
                  >
                    <Selo item={item} />
                    <span className="docs__nome">{item.nome}</span>
                    <span className="docs__meta">{item.ehPasta ? 'Pasta' : tamanho(item.tamanho)}</span>
                    <span className="docs__meta docs__data">{dataCurta(item.modificadoEm)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------- visualizador -- */

/** O que o navegador abre sozinho; o resto, só baixando. */
function abreNaTela(mime: string) {
  return (
    mime === 'application/pdf' ||
    /^image\/(png|jpeg|gif|webp)$/.test(mime) ||
    mime === 'text/plain' ||
    mime.startsWith('application/vnd.google-apps.')
  );
}

function Visualizador({ clienteId, arquivo, aoVoltar }: { clienteId: string; arquivo: ItemDoDrive; aoVoltar: () => void }) {
  const url = `/api/drive/${encodeURIComponent(clienteId)}/${encodeURIComponent(arquivo.id)}`;
  const naTela = abreNaTela(arquivo.mimeType);
  const imagem = arquivo.mimeType.startsWith('image/');

  return (
    <section className="docs docs--visualizando">
      <header className="docs__topo">
        <Botao variante="tertiary" tamanho="sm" onClick={aoVoltar}>
          ← Voltar
        </Botao>
        <span className="docs__titulo-arquivo">
          <Selo item={arquivo} />
          <span className="docs__nome">{arquivo.nome}</span>
        </span>
        <span className="docs__acoes">
          <a className="lc-btn lc-btn--secondary lc-btn--sm" href={url} target="_blank" rel="noopener noreferrer">
            Abrir em nova aba
          </a>
          <a className="lc-btn lc-btn--secondary lc-btn--sm" href={`${url}?baixar=1`}>
            Baixar
          </a>
        </span>
      </header>
      {naTela ? (
        imagem ? (
          // eslint-disable-next-line @next/next/no-img-element -- vem do proxy do Drive, sem otimização do Next
          <img className="docs__imagem" src={url} alt={arquivo.nome} />
        ) : (
          <iframe className="docs__quadro" src={url} title={arquivo.nome} />
        )
      ) : (
        <Estado titulo="Este tipo de arquivo não abre aqui">Use “Baixar” para abrir no seu computador.</Estado>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- pedaços -- */

function Estado({ titulo, erro, children }: { titulo: string; erro?: boolean; children?: ReactNode }) {
  return (
    <div className={['docs__estado', erro && 'docs__estado--erro'].filter(Boolean).join(' ')} role={erro ? 'alert' : undefined}>
      <p className="docs__estado-titulo">{titulo}</p>
      {children ? <p className="apoio">{children}</p> : null}
    </div>
  );
}

/** Selo do tipo: a cor que a pessoa já associa (PDF vermelho, planilha verde…). */
function Selo({ item }: { item: ItemDoDrive }) {
  const { rotulo, tom } = tipoDe(item);
  return (
    <span className={`docs__selo docs__selo--${tom}`} aria-hidden="true">
      {item.ehPasta ? <IconePasta /> : rotulo}
    </span>
  );
}

function tipoDe(item: ItemDoDrive): { rotulo: string; tom: string } {
  const m = item.mimeType;
  const ext = item.nome.includes('.') ? item.nome.split('.').pop()!.toLowerCase() : '';
  if (item.ehPasta) return { rotulo: '', tom: 'pasta' };
  if (m === 'application/pdf') return { rotulo: 'PDF', tom: 'pdf' };
  if (m.startsWith('image/')) return { rotulo: 'IMG', tom: 'img' };
  if (m.includes('spreadsheet') || m.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return { rotulo: 'XLS', tom: 'planilha' };
  if (m.includes('presentation') || m.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) return { rotulo: 'PPT', tom: 'apresentacao' };
  if (m.includes('document') || m.includes('word') || ['doc', 'docx'].includes(ext)) return { rotulo: 'DOC', tom: 'documento' };
  if (m.includes('zip') || m.includes('compressed') || ['zip', 'rar', '7z'].includes(ext)) return { rotulo: 'ZIP', tom: 'outro' };
  return { rotulo: (ext || 'ARQ').slice(0, 4).toUpperCase(), tom: 'outro' };
}

function IconePasta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M3 6a2 2 0 0 1 2-2h4.2a2 2 0 0 1 1.6.8L12 6.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function tamanho(bytes: number | null) {
  if (bytes === null) return 'Documento Google';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1).replace('.', ',')} MB`;
}

function dataCurta(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
