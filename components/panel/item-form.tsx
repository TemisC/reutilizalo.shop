"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Image as ImageIcon, ImagePlus, LoaderCircle, Star, TriangleAlert, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage, ImageValidationError, type CompressedImage } from "@/lib/images/compress";
import { ITEM_PHOTOS_BUCKET } from "@/lib/images/storage";
import {
  CATEGORIES,
  CONDITIONS,
  CONDITIONS_NEEDING_DETAILS,
  PHOTO_MAX,
  PHOTO_MIN,
  type Category,
  type Condition,
} from "@/lib/catalog";
import { createItem, updateItem, type ItemActionResult } from "@/lib/actions/items";
import type { ItemFieldErrors, ItemInput } from "@/lib/validation/item";
import { Button } from "@/components/ui/button";
import { Field, FieldError, inputClasses } from "@/components/ui/field";
import { formatUYU } from "@/lib/format";

/** Una foto de la lista; `id` es local, solo para seguirla mientras se sube. */
type PhotoState = { id: string } & (
  | { status: "uploading"; previewUrl?: string }
  | { status: "ready"; previewUrl: string; path: string; isNew: boolean }
  | { status: "error"; previewUrl?: string; error: string }
);

type InitialItem = Omit<ItemInput, "photos"> & {
  photos: { path: string; url: string }[];
};

/** crypto.randomUUID no existe en navegadores de celular algo viejos. */
function newId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/** Para que ninguna foto quede "subiendo" para siempre si el celular o la red se traban. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

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
  const [photos, setPhotos] = useState<PhotoState[]>(() =>
    (initial?.photos ?? []).map((photo) => ({
      id: newId(),
      status: "ready",
      previewUrl: photo.url,
      path: photo.path,
      isNew: false,
    })),
  );
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [result, setResult] = useState<ItemActionResult>({});
  const [honestyWarning, setHonestyWarning] = useState(false);
  const [pending, startTransition] = useTransition();
  const defectsRef = useRef<HTMLTextAreaElement>(null);

  // Libera las URLs locales de las vistas previas al salir.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => {
        if (photo?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(photo.previewUrl);
      });
    },
    [],
  );

  const errors: ItemFieldErrors = result.fieldErrors ?? {};
  const set = <K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) =>
    setFields((current) => ({ ...current, [key]: value }));

  const updatePhoto = (id: string, next: PhotoState) =>
    setPhotos((current) => current.map((photo) => (photo.id === id ? next : photo)));

  /** Se pueden elegir varias de una vez; las que no entran en el máximo se descartan con aviso. */
  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const free = PHOTO_MAX - photos.length;
    setPhotoNotice(
      files.length > free
        ? `Elegiste ${files.length} fotos y ${free === 1 ? "solo entra 1 más" : `solo entran ${free} más`}: el máximo es ${PHOTO_MAX}.`
        : null,
    );

    const queue = files.slice(0, free).map((file) => ({ id: newId(), file }));
    setPhotos((current) => [...current, ...queue.map(({ id }) => ({ id, status: "uploading" as const }))]);
    processQueue(queue);
  }

  /**
   * Las fotos se achican de a una: decodificar varias fotos de cámara a la vez llena la memoria del
   * celular y congela la página. La subida de cada una sigue en segundo plano mientras se achica la siguiente.
   */
  async function processQueue(queue: { id: string; file: File }[]) {
    for (const { id, file } of queue) {
      let compressed: CompressedImage;
      try {
        compressed = await withTimeout(compressImage(file), 30_000);
      } catch (error) {
        failPhoto(id, error);
        continue;
      }
      uploadPhoto(id, compressed);
    }
  }

  function failPhoto(id: string, error: unknown, previewUrl?: string) {
    updatePhoto(id, {
      id,
      status: "error",
      previewUrl,
      error:
        error instanceof ImageValidationError
          ? error.message
          : "Algunas fotos no se subieron: revisa tu conexión.",
    });
  }

  async function uploadPhoto(id: string, compressed: CompressedImage) {
    const previewUrl = URL.createObjectURL(compressed.blob);
    updatePhoto(id, { id, status: "uploading", previewUrl });
    try {
      const path = `${userId}/${newId()}.${compressed.extension}`;
      const supabase = createClient();
      const { error } = await withTimeout(
        supabase.storage.from(ITEM_PHOTOS_BUCKET).upload(path, compressed.blob, {
          contentType: compressed.blob.type,
          upsert: false,
        }),
        90_000,
      );
      if (error) throw error;

      updatePhoto(id, { id, status: "ready", previewUrl, path, isNew: true });
    } catch (error) {
      failPhoto(id, error, previewUrl);
    }
  }

  // Borra del Storage una foto recién subida que ya no se usa (las guardadas las limpia el servidor).
  function removePhoto(id: string) {
    const photo = photos.find((candidate) => candidate.id === id);
    if (photo?.status === "ready" && photo.isNew) {
      createClient().storage.from(ITEM_PHOTOS_BUCKET).remove([photo.path]);
    }
    setPhotoNotice(null);
    setPhotos((current) => current.filter((candidate) => candidate.id !== id));
  }

  /** La primera foto es la principal: la elegida pasa adelante. */
  function makeMain(id: string) {
    setPhotos((current) => {
      const photo = current.find((candidate) => candidate.id === id);
      return photo ? [photo, ...current.filter((candidate) => candidate.id !== id)] : current;
    });
  }

  const photoErrors = [
    ...new Set(photos.flatMap((photo) => (photo.status === "error" ? [photo.error] : []))),
  ];
  const readyCount = photos.filter((photo) => photo.status === "ready").length;
  const missingPhotos = Math.max(0, PHOTO_MIN - readyCount);

  function submit(skipHonestyCheck = false) {
    const uploading = photos.some((photo) => photo.status === "uploading");
    if (uploading) {
      setResult({ message: "Espera a que terminen de subir las fotos." });
      return;
    }

    const needsDetails =
      fields.condition !== "" && CONDITIONS_NEEDING_DETAILS.includes(fields.condition as Condition);
    const hasDetails = fields.defects.trim().length > 0;
    if (needsDetails && !hasDetails && !skipHonestyCheck) {
      setHonestyWarning(true);
      return;
    }
    setHonestyWarning(false);

    const input: ItemInput = {
      ...fields,
      photos: photos.flatMap((photo) => (photo.status === "ready" ? [{ path: photo.path }] : [])),
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
            <legend className="mb-3 flex w-full items-baseline justify-between gap-3 font-bold text-ink">
              Fotos
              <span className="text-sm font-normal text-ink-muted">
                {`Mínimo ${PHOTO_MIN}, hasta ${PHOTO_MAX} · ${photos.length}/${PHOTO_MAX}`}
              </span>
            </legend>
            <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-4 lg:gap-3">
              {photos.map((photo, index) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onRemove={() => removePhoto(photo.id)}
                  onMakeMain={() => makeMain(photo.id)}
                />
              ))}
              {photos.length < PHOTO_MAX && (
                // El input transparente cubre todo el recuadro: el toque cae directo sobre él, sin depender de
                // .click() por código ni de que el navegador asocie el label (falla en algunos celulares).
                <label
                  className={`relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed p-2 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                    photos.length === 0
                      ? "col-span-3 min-h-40 border-accent bg-accent/5 hover:bg-accent/10 lg:col-span-4"
                      : "aspect-square border-line bg-surface hover:bg-chip-off"
                  }`}
                >
                  <ImagePlus className="size-6 text-ink" aria-hidden />
                  <span className="font-bold text-ink">
                    {photos.length === 0 ? "Agregar fotos" : "Agregar"}
                  </span>
                  {photos.length === 0 && (
                    <span className="text-sm text-ink-muted">
                      Puedes elegir varias a la vez: mantén presionada una foto y marca las demás
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    aria-label="Agregar fotos"
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    onChange={(event) => {
                      handleFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
            {photoNotice && <p className="text-sm text-ink-muted">{photoNotice}</p>}
            {photoErrors.length > 0 && (
              <p role="alert" className="text-sm text-red-700">
                {photoErrors.join(" ")} Quita las marcadas con la X y vuelve a agregarlas.
              </p>
            )}
            {errors.photos && <FieldError id="photos-error">{errors.photos}</FieldError>}
            <ul className="flex flex-col gap-1 text-sm text-ink-soft">
              <li>· Usa luz natural y un fondo liso.</li>
              <li>· Sube fotos reales tuyas, nunca imágenes de internet.</li>
              <li>· Muestra manchas, raspones o roturas tal como están: sácales una foto de cerca.</li>
              <li>· Toca la estrella para elegir la foto principal.</li>
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

          <fieldset
            className="flex flex-col gap-3"
            aria-describedby={errors.condition ? "condition-error" : undefined}
          >
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
            hint={
              <p className="text-sm text-ink-muted">Medidas, marca, por qué lo vendes, cómo lo entregas…</p>
            }
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
        photoUrl={photos[0]?.previewUrl}
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
          <div
            role="alertdialog"
            aria-labelledby="honesty-warning"
            className="flex flex-col gap-3 rounded-3xl bg-highlight/40 p-5 ring-2 ring-highlight"
          >
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
            disabled={!fields.honestyConfirmed || missingPhotos > 0}
          >
            {isEdit ? "Guardar cambios" : "Publicar"}
          </Button>
          {!pending && missingPhotos > 0 && (
            <p className="text-center text-sm text-ink-muted">
              Sube al menos {PHOTO_MIN} fotos para publicar (
              {missingPhotos === 1 ? "falta 1" : `faltan ${missingPhotos}`}).
            </p>
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
          <p className={`line-clamp-2 ${title ? "text-ink-soft" : "text-ink-muted"}`}>
            {title || "Título del artículo"}
          </p>
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
          Que se vea: así tu comprador (o tu amiga) sabe exactamente lo que está comprando, y tú no te ganas
          una baja reputación.
        </p>
        <p className="text-sm">
          Queremos una comunidad de economía circular sana, donde todos quedemos contentos.
        </p>
      </div>
    </aside>
  );
}

function PhotoTile({
  photo,
  index,
  onRemove,
  onMakeMain,
}: {
  photo: PhotoState;
  index: number;
  onRemove: () => void;
  onMakeMain: () => void;
}) {
  const isMain = index === 0;
  const label = `foto ${index + 1}`;

  return (
    <div className="relative aspect-square overflow-hidden rounded-3xl bg-chip-off">
      {photo.previewUrl && (
        // Vista previa local (blob:) o URL pública ya guardada.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.previewUrl}
          alt=""
          className={`absolute inset-0 size-full object-cover ${photo.status === "error" ? "opacity-30" : ""}`}
        />
      )}

      {photo.status === "uploading" && (
        <span className="absolute inset-0 flex items-center justify-center bg-ink/40">
          <LoaderCircle className="size-7 animate-spin text-white" aria-label="Subiendo foto" />
        </span>
      )}

      {photo.status === "error" && (
        // El motivo completo va debajo de la grilla: acá no entra en celulares angostos.
        <span className="absolute inset-x-0 bottom-0 top-8 flex flex-col items-center justify-center gap-1 p-1 text-center text-xs font-bold text-red-700">
          <TriangleAlert className="size-5 shrink-0" aria-hidden />
          No se subió
        </span>
      )}

      {isMain && photo.status !== "error" && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-white">
          Principal
        </span>
      )}

      {photo.status === "ready" && !isMain && (
        <button
          type="button"
          onClick={onMakeMain}
          aria-label={`Usar ${label} como principal`}
          title="Usar como principal"
          className="absolute bottom-1.5 left-1.5 flex size-9 items-center justify-center rounded-full bg-surface/90 text-ink hover:bg-surface"
        >
          <Star className="size-4" aria-hidden />
        </button>
      )}

      {photo.status !== "uploading" && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${label}`}
          className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-full bg-ink/80 text-white hover:bg-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
