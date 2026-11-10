"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download, LoaderCircle, RefreshCw, Share2, X } from "lucide-react";
import { randomPhrase, renderStoryImage, type StoryData } from "@/lib/story-image";

type Props = Omit<StoryData, "accent" | "phrase"> & {
  /** Link completo del artículo: se copia para pegarlo en el sticker "Enlace" de la historia. */
  url: string;
  /** "icon": botón cuadrado junto a "Lo quiero" en la grilla; "full": botón ancho en la página del artículo. */
  variant?: "icon" | "full";
};

/**
 * Compartir en historia: arma una imagen vertical con la foto, el título y el precio, copia el link
 * y abre el menú de compartir del celular (Instagram → Historia). Instagram no deja que una web
 * agregue el link a la historia, así que se lo explicamos y lo dejamos copiado para pegar.
 */
export function StoryShareButton({ url, variant = "icon", ...story }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  /** Motivo técnico corto, visible para poder diagnosticar desde el celular. */
  const [failed, setFailed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [phrase, setPhrase] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function build(nextPhrase: string) {
    setPhrase(nextPhrase);
    setFile(null);
    setPreview(null);
    setFailed(null);
    try {
      // Las tiendas Pro pueden tener su propio color: se toma del botón, que está dentro del tema.
      const accent = getComputedStyle(triggerRef.current!).getPropertyValue("--accent").trim() || "#17784b";
      const blob = await renderStoryImage({
        ...story,
        phrase: nextPhrase,
        accent,
      });
      const next = new File([blob], `reutilizalo-${story.title.slice(0, 30).replace(/[^\w]+/g, "-")}.png`, {
        type: "image/png",
      });
      setFile(next);
      setPreview(URL.createObjectURL(blob));
      setCanShareFiles(canShareFile(next));
    } catch (error) {
      setFailed(error instanceof Error ? error.message : String(error));
    }
  }

  function open() {
    dialogRef.current?.showModal();
    // Cada vez que se abre sale una frase nueva, así las historias no se ven todas iguales.
    build(randomPhrase(phrase ?? undefined));
  }

  function copyLink() {
    // Sin await: así el toque sigue "vivo" para abrir el menú de compartir justo después.
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      },
      () => {},
    );
  }

  async function share() {
    if (!file) return;
    copyLink();
    if (canShareFiles) {
      try {
        await navigator.share({ files: [file] });
      } catch {
        // Si la persona cierra el menú no hay nada que hacer: el link igual quedó copiado.
      }
      return;
    }
    download();
  }

  function download() {
    if (!file || !preview) return;
    const link = document.createElement("a");
    link.href = preview;
    link.download = file.name;
    link.click();
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={open}
          aria-label="Compartir en historia"
          title="Compartir en historia"
          className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-chip-off text-ink transition-colors hover:bg-line"
        >
          <Share2 className="size-5" aria-hidden />
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={open}
          className="flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-surface text-lg font-bold text-ink transition-colors hover:bg-chip-off"
        >
          <Share2 className="size-5" aria-hidden /> Compartir en historia
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="story-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto mb-0 w-full max-w-md rounded-t-3xl bg-surface p-0 text-ink-soft backdrop:bg-ink/50 md:mb-auto md:rounded-3xl"
      >
        <div className="flex flex-col gap-5 p-5 pb-7">
          <div className="flex items-center justify-between gap-3">
            <h2 id="story-title" className="font-sans text-lg font-bold tracking-normal">
              Compartir en tu historia
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar"
              className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-chip-off"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="flex gap-4">
            <div className="relative aspect-[9/16] w-28 shrink-0 self-start overflow-hidden rounded-2xl bg-chip-off">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- es una imagen generada en el momento (blob:)
                <img src={preview} alt="Vista previa de la historia" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center">
                  {!failed && <LoaderCircle className="size-6 animate-spin text-ink-muted" aria-hidden />}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <ol className="flex flex-col gap-3 text-sm">
                <Step n={1}>
                  Toca <strong>Compartir</strong> y elige <strong>Instagram → Historia</strong>.
                </Step>
                <Step n={2}>
                  En la historia, toca el sticker <strong>Enlace</strong> y pega el link: ya te lo copiamos.
                </Step>
                <Step n={3}>
                  Ponlo en el espacio punteado, debajo de la frase: así quien la vea entra directo al artículo.
                </Step>
              </ol>
              <button
                type="button"
                onClick={() => build(randomPhrase(phrase ?? undefined))}
                disabled={!file && !failed}
                className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-chip-off px-4 text-sm font-bold text-ink transition-colors hover:bg-line disabled:opacity-60"
              >
                <RefreshCw className="size-4" aria-hidden /> Otra frase
              </button>
            </div>
          </div>

          {failed && (
            <p className="text-sm text-red-700">
              No pudimos armar la imagen. Prueba de nuevo en un rato.{" "}
              <span className="text-ink-muted">({failed})</span>
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={share}
              disabled={!file}
              className="flex min-h-14 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-accent text-lg font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {canShareFiles || !file ? (
                <>
                  <Share2 className="size-5" aria-hidden /> Compartir
                </>
              ) : (
                <>
                  <Download className="size-5" aria-hidden /> Descargar imagen
                </>
              )}
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-chip-off font-bold text-ink transition-colors hover:bg-line"
            >
              {copied ? (
                <Check className="size-4 text-accent" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              <span aria-live="polite">{copied ? "¡Link copiado!" : "Copiar link"}</span>
            </button>
            {!canShareFiles && file && (
              <p className="text-center text-sm text-ink-muted">
                Las historias se suben desde el celular: descarga la imagen o abre esta página en tu teléfono.
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Algunos navegadores tiran error en vez de responder "no" cuando no pueden compartir archivos. */
function canShareFile(file: File) {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-highlight text-xs font-bold text-ink">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
