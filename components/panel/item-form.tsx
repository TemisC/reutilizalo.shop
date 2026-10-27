"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Camera, Image as ImageIcon, LoaderCircle, Plus, TriangleAlert, X, ZoomIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, ImageValidationError } from "@/lib/images/compress";
import { ITEM_PHOTOS_BUCKET } from "@/lib/images/storage";
import {
  CATEGORIES,
  CONDITIONS,
  CONDITIONS_NEEDING_DETAILS,
  PHOTO_SLOTS,
  type Category,
  type Condition,
  type PhotoKind,
} from "@/lib/catalog";
import { createItem, updateItem, type ItemActionResult } from "@/lib/actions/items";
import type { ItemFieldErrors, ItemInput } from "@/lib/validation/item";
import { Button } from "@/components/ui/button";
import { Field, FieldError, inputClasses } from "@/components/ui/field";
import { formatUYU } from "@/lib/format";

type PhotoState =
  | { status: "uploading"; previewUrl: string }
  | { status: "ready"; previewUrl: string; path: string; isNew: boolean }
  | { status: "error"; previewUrl?: string; error: string };

type InitialItem = Omit<ItemInput, "photos"> & {
  photos: { kind: PhotoKind; path: string; url: string }[];
};

type Props = {
  userId: string;
  itemId?: string;
  initial?: InitialItem;
};

const EMPTY: Omit<ItemInput, "photos"> = {
  title: "",
  description: "",
  price: "",
  category: "",
  condition: "",
  defects: "",
  honestyConfirmed: false,
};

export function ItemForm({ userId, itemId, initial }: Props) {
  const isEdit = Boolean(itemId);
  const [fields, setFields] = useState<Omit<ItemInput, "photos">>(() =>
    initial ? { ...initial, honestyConfirmed: false } : EMPTY,
  );
  const [photos, setPhotos] = useState<Partial<Record<PhotoKind, PhotoState>>>(() =>
    Object.fromEntries(
      (initial?.photos ?? []).map((photo) => [
        photo.kind,
        { status: "ready", previewUrl: photo.url, path: photo.path, isNew: false },
      ]),
    ),
  );
  const [result, setResult] = useState<ItemActionResult>({});
  const [honestyWarning, setHonestyWarning] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInputs = useRef<Partial<Record<PhotoKind, HTMLInputElement | null>>>({});
  const defectsRef = useRef<HTMLTextAreaElement>(null);

  // Libera las URLs locales de las vistas previas al salir.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      Object.values(photosRef.current).forEach((photo) => {
        if (photo?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(photo.previewUrl);
      });
    },
    [],
  );

  const errors: ItemFieldErrors = result.fieldErrors ?? {};
  const set = <K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  async function handleFile(kind: PhotoKind, file: File | undefined) {
    if (!file) return;
    const previous = photos[kind];
    let previewUrl: string | undefined;
    try {
      const compressed = await compressImage(file);
      previewUrl = URL.createObjectURL(compressed.blob);
      setPhotos((current) => ({ ...current, [kind]: { status: "uploading", previewUrl: previewUrl! } }));

      const path = `${userId}/${crypto.randomUUID()}.${compressed.extension}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from(ITEM_PHOTOS_BUCKET).upload(path, compressed.blob, {
        contentType: compressed.blob.type,
        upsert: false,
      });
      if (error) throw error;

      setPhotos((current) => ({
        ...current,
        [kind]: { status: "ready", previewUrl: previewUrl!, path, isNew: true },
      }));
      discardUpload(previous);
    } catch (error) {
      setPhotos((current) => ({
        ...current,
        [kind]: {
          status: "error",
          previewUrl,
          error:
            error instanceof ImageValidationError
              ? error.message
              : "No pudimos subir la foto. Revisa tu conexión y prueba de nuevo.",
        },
      }));
    }
  }

  // Borra del Storage una foto recién subida que ya no se usa (las guardadas las limpia el servidor).
  function discardUpload(photo: PhotoState | undefined) {
    if (photo?.status === "ready" && photo.isNew) {
      createClient().storage.from(ITEM_PHOTOS_BUCKET).remove([photo.path]);
    }
  }

  function removePhoto(kind: PhotoKind) {
    discardUpload(photos[kind]);
    setPhotos((current) => {
      const next = { ...current };
      delete next[kind];
      return next;
    });
  }

  function submit(skipHonestyCheck = false) {
    const uploading = Object.values(photos).some((photo) => photo?.status === "uploading");
    if (uploading) {
      setResult({ message: "Espera a que terminen de subir las fotos." });
      return;
    }

    const needsDetails =
      fields.condition !== "" && CONDITIONS_NEEDING_DETAILS.includes(fields.condition as Condition);
    const hasDetails = photos.defect?.status === "ready" || fields.defects.trim().length > 0;
    if (needsDetails && !hasDetails && !skipHonestyCheck) {
      setHonestyWarning(true);
      return;
    }
    setHonestyWarning(false);

    const input: ItemInput = {
      ...fields,
      photos: PHOTO_SLOTS.flatMap(({ kind }) => {
        const photo = photos[kind];
        return photo?.status === "ready" ? [{ kind, path: photo.path }] : [];
      }),
    };

    startTransition(async () => {
      const response = isEdit ? await updateItem(itemId!, input) : await createItem(input);
      // Si todo salió bien, la acción redirige al panel y no llega acá.
      setResult(response);
    });
  }

  return (
    <form
      className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-[auto_auto_1fr] lg:items-start lg:gap-x-10 lg:gap-y-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {/* Celular: una columna en este orden. Computadora: formulario a la izquierda; aviso, vista previa y
          botón a la derecha. */}
      <div className="lg:col-start-2 lg:row-start-1">
        <HonestyBanner />
      </div>

      <div className="flex flex-col gap-7 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:gap-6">
        <div className="lg:rounded-3xl lg:bg-surface lg:p-8">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-bold text-ink">Fotos (hasta 4)</legend>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {PHOTO_SLOTS.map((slot) => (
                <PhotoSlot
                  key={slot.kind}
                  slot={slot}
                  photo={photos[slot.kind]}
                  onPick={() => fileInputs.current[slot.kind]?.click()}
                  onRemove={() => removePhoto(slot.kind)}
                >
                  <input
                    ref={(element) => {
                      fileInputs.current[slot.kind] = element;
                    }}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={(event) => {
                      handleFile(slot.kind, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </PhotoSlot>
              ))}
            </div>
            {errors.photos && <FieldError id="photos-error">{errors.photos}</FieldError>}
            <ul className="flex flex-col gap-1 text-sm text-ink-soft">
              <li>· Usa luz natural y un fondo liso.</li>
              <li>· Sube fotos reales tuyas, nunca imágenes de internet.</li>
              <li>· Muestra manchas, raspones o roturas tal como están.</li>
            </ul>
          </fieldset>
        </div>

        <div className="flex flex-col gap-7 lg:rounded-3xl lg:bg-surface lg:p-8">
          <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-4">
            <Field label="Título" htmlFor="title" error={errors.title}>
              <input
                id="title"
                value={fields.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="Ej.: Campera de jean talle M"
                maxLength={80}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                className={inputClasses}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 lg:contents">
              <Field label="Precio ($U)" htmlFor="price" error={errors.price}>
                <input
                  id="price"
                  value={fields.price}
                  onChange={(event) => set("price", event.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder="900"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={errors.price ? "price-error" : undefined}
                  className={inputClasses}
                />
              </Field>
              <Field label="Categoría" htmlFor="category" error={errors.category}>
                <select
                  id="category"
                  value={fields.category}
                  onChange={(event) => set("category", event.target.value as Category)}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? "category-error" : undefined}
                  className={`${inputClasses} appearance-auto`}
                >
                  <option value="" disabled>
                    Elige
                  </option>
                  {Object.entries(CATEGORIES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <fieldset className="flex flex-col gap-3" aria-describedby={errors.condition ? "condition-error" : undefined}>
            <legend className="mb-3 font-bold text-ink">Estado</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CONDITIONS).map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="condition"
                    value={value}
                    checked={fields.condition === value}
                    onChange={() => set("condition", value as Condition)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-11 items-center rounded-full bg-surface px-4 text-ink transition-colors peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent lg:bg-canvas lg:peer-checked:bg-ink">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {errors.condition && <FieldError id="condition-error">{errors.condition}</FieldError>}
          </fieldset>

          <Field label="¿Tiene algún detalle? Cuéntalo" htmlFor="defects" error={errors.defects}>
            <textarea
              id="defects"
              ref={defectsRef}
              value={fields.defects}
              onChange={(event) => set("defects", event.target.value)}
              placeholder="Ej.: pequeña mancha en la manga izquierda, se ve en la foto 4."
              maxLength={600}
              rows={3}
              className={`${inputClasses} py-3`}
            />
          </Field>

          <Field
            label="Descripción (opcional)"
            htmlFor="description"
            error={errors.description}
            hint={<p className="text-sm text-ink-muted">Medidas, marca, por qué lo vendes, cómo lo entregas…</p>}
          >
            <textarea
              id="description"
              value={fields.description}
              onChange={(event) => set("description", event.target.value)}
              maxLength={600}
              rows={3}
              className={`${inputClasses} py-3`}
            />
          </Field>
        </div>
      </div>

      <ItemPreview
        className="hidden lg:col-start-2 lg:row-start-2 lg:flex"
        title={fields.title}
        price={fields.price}
        condition={fields.condition}
        photoUrl={photos.main?.previewUrl}
      />

      <div className="flex flex-col gap-7 lg:col-start-2 lg:row-start-3 lg:gap-5">
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={fields.honestyConfirmed}
              onChange={(event) => set("honestyConfirmed", event.target.checked)}
              aria-invalid={Boolean(errors.honestyConfirmed)}
              className="mt-0.5 size-7 shrink-0 accent-[var(--accent)]"
            />
            <span className="text-ink-soft">
              Confirmo que las fotos son reales y muestran el estado actual del producto.
            </span>
          </label>
          {errors.honestyConfirmed && <FieldError>{errors.honestyConfirmed}</FieldError>}
        </div>

        {honestyWarning && (
          <div role="alertdialog" aria-labelledby="honesty-warning" className="flex flex-col gap-3 rounded-3xl bg-highlight/40 p-5 ring-2 ring-highlight">
            <p id="honesty-warning" className="flex gap-2 font-bold text-ink">
              <TriangleAlert className="size-5 shrink-0" aria-hidden />
              Contar los detalles evita malentendidos y cuida tu reputación. ¿Publicar igual?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="dark"
                className="flex-1"
                onClick={() => {
                  setHonestyWarning(false);
                  defectsRef.current?.focus();
                }}
              >
                Agregar detalles
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => submit(true)}>
                Publicar igual
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 lg:pt-0">
          {result.message && <FieldError>{result.message}</FieldError>}
          <Button
            type="submit"
            size="lg"
            loading={pending}
            disabled={!fields.honestyConfirmed || photos.main?.status !== "ready"}
          >
            {isEdit ? "Guardar cambios" : "Publicar"}
          </Button>
          {!pending && photos.main?.status !== "ready" && (
            <p className="text-center text-sm text-ink-muted">Sube la foto principal para publicar.</p>
          )}
        </div>
      </div>
    </form>
  );
}

/** "Así se verá en tu tienda": se actualiza mientras se completa el formulario (solo computadora). */
function ItemPreview({
  className,
  title,
  price,
  condition,
  photoUrl,
}: {
  className: string;
  title: string;
  price: string;
  condition: Condition | "";
  photoUrl: string | undefined;
}) {
  return (
    <section aria-label="Vista previa" className={`flex-col gap-4 rounded-3xl bg-surface p-5 ${className}`}>
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-ink-muted">Así se verá en tu tienda</p>
      <div className="flex flex-col gap-2 rounded-3xl bg-canvas p-2" aria-hidden>
        <div className="relative flex aspect-[4/3.4] items-center justify-center overflow-hidden rounded-2xl bg-[#e3ebe4]">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <ImageIcon className="size-7 text-ink-muted" />
          )}
          {condition && (
            <span className="absolute left-2 top-2 rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink">
              {CONDITIONS[condition]}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between gap-3 px-2">
          <p className={`line-clamp-2 ${title ? "text-ink-soft" : "text-ink-muted"}`}>{title || "Título del artículo"}</p>
          <p className="shrink-0 whitespace-nowrap font-display text-xl font-bold text-ink">
            {price ? formatUYU(Number(price)) : "$U –"}
          </p>
        </div>
        <span className="flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-accent font-bold text-white">
          Lo quiero
        </span>
      </div>
    </section>
  );
}

function HonestyBanner() {
  return (
    <aside className="flex gap-4 rounded-3xl bg-highlight p-5 text-ink lg:flex-col lg:p-6">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white">
        <Camera className="size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-lg font-bold leading-snug">¿Tu producto tiene algún detalle? Sácale foto.</p>
        <p>
          Que se vea: así tu comprador (o tu amiga) sabe exactamente lo que está comprando, y tú no te
          ganas una baja reputación.
        </p>
        <p className="text-sm">Queremos una comunidad de economía circular sana, donde todos quedemos contentos.</p>
      </div>
    </aside>
  );
}

function PhotoSlot({
  slot,
  photo,
  onPick,
  onRemove,
  children,
}: {
  slot: (typeof PHOTO_SLOTS)[number];
  photo: PhotoState | undefined;
  onPick: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  const recommended = "recommended" in slot && slot.recommended;
  const filled = photo?.previewUrl && photo.status !== "error";

  return (
    <div className="relative aspect-square">
      {children}
      <button
        type="button"
        onClick={onPick}
        aria-label={filled ? `Cambiar foto: ${slot.label}` : `Subir foto: ${slot.label}`}
        className={`flex size-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border-2 border-dashed p-3 text-center transition-colors ${
          filled
            ? "border-transparent bg-chip-off"
            : recommended
              ? "border-accent bg-accent/5 hover:bg-accent/10"
              : "border-line bg-surface hover:bg-chip-off"
        }`}
      >
        {filled ? (
          // Vista previa local (blob:) o URL pública ya guardada.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.previewUrl} alt="" className="absolute inset-0 size-full rounded-3xl object-cover" />
        ) : photo?.status === "error" ? (
          <span role="alert" className="flex flex-col items-center gap-1 pt-6 text-sm text-red-700">
            <TriangleAlert className="size-5" aria-hidden />
            {photo.error}
            <span className="font-bold text-ink">Toca para reintentar</span>
          </span>
        ) : (
          <>
            {recommended ? (
              <ZoomIn className="size-6 text-ink" aria-hidden />
            ) : slot.kind === "main" ? (
              <ImageIcon className="size-6 text-ink-muted" aria-hidden />
            ) : (
              <Plus className="size-6 text-ink" aria-hidden />
            )}
            <span className={recommended ? "font-bold text-ink" : "text-ink"}>
              {slot.kind === "main" ? "Agregar foto" : slot.label}
            </span>
          </>
        )}
      </button>

      {(slot.kind === "main" || recommended) && (
        <span
          className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
            recommended ? "bg-accent" : "bg-ink"
          }`}
        >
          {recommended ? "Recomendado" : "Principal"}
        </span>
      )}

      {filled && slot.kind !== "main" && !recommended && (
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
          {slot.label}
        </span>
      )}

      {photo?.status === "uploading" && (
        <span className="absolute inset-0 flex items-center justify-center rounded-3xl bg-ink/40">
          <LoaderCircle className="size-8 animate-spin text-white" aria-label="Subiendo foto" />
        </span>
      )}

      {photo?.status === "ready" && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar foto: ${slot.label}`}
          className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-full bg-ink/80 text-white hover:bg-ink"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}

    </div>
  );
}
