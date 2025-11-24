// utils/image.ts
export type CompressOptions = {
  maxSide?: number;   // default 2048
  quality?: number;   // default 0.86
};

const ALLOWED_UPLOAD = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

function guessMimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  if (ext === "pdf") return "application/pdf";
  return "";
}

export function isAllowed(file: File): boolean {
  const mt = (file.type || "").toLowerCase() || guessMimeFromName(file.name);
  return ALLOWED_UPLOAD.has(mt);
}

async function fileToBitmap(file: File): Promise<ImageBitmap> {
  try {
    // @ts-ignore
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      return await createImageBitmap(file);
    } catch {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = url;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas no disponible");
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return await createImageBitmap(blob);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }
}

async function drawToWebpBlob(
  bmp: ImageBitmap,
  opts: Required<CompressOptions>
): Promise<Blob> {
  const { maxSide, quality } = opts;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));

  // @ts-ignore
  if (typeof OffscreenCanvas !== "undefined") {
    // @ts-ignore
    const off = new OffscreenCanvas(w, h);
    const ctx = off.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.drawImage(bmp, 0, 0, w, h);
    // @ts-ignore
    return await off.convertToBlob({ type: "image/webp", quality });
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bmp, 0, 0, w, h);

  return await new Promise((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error("toBlob falló"))), "image/webp", quality)
  );
}

/** Solo normaliza mime para casos simples, no convierte HEIC */
async function ensureDecodable(file: File): Promise<File> {
  const mt0 = (file.type || "").toLowerCase() || guessMimeFromName(file.name);
  const mt = mt0 === "image/jpg" ? "image/jpeg" : mt0;
  return mt && mt !== mt0 ? new File([file], file.name, { type: mt }) : file;
}

/**
 * Comprime a WebP cuando el navegador puede decodificar,
 * si es HEIC o HEIF, ignora la compresión y devuelve el archivo original.
 */
export async function compressToWebp(
  input: File,
  options: CompressOptions = {}
): Promise<File> {
  const opts: Required<CompressOptions> = {
    maxSide: options.maxSide ?? 2048,
    quality: options.quality ?? 0.86,
  };
  if (!isAllowed(input)) {
    throw new Error("Tipo de archivo no permitido");
  }

  const mt = (input.type || "").toLowerCase() || guessMimeFromName(input.name);
  if (mt === "image/heic" || mt === "image/heif") {
    return input;
  }

  const decodable = await ensureDecodable(input);
  const bmp = await fileToBitmap(decodable);
  try {
    const blob = await drawToWebpBlob(bmp, opts);
    // @ts-ignore
    if (bmp.close) bmp.close();
    return new File(
      [blob],
      decodable.name.replace(/\.\w+$/, ".webp"),
      { type: "image/webp" }
    );
  } catch (e) {
    // @ts-ignore
    if (bmp.close) bmp.close();
    throw e;
  }
}

/**
 * Re-encode PDF to enable object streams and strip some metadata.
 * This is a lightweight, best-effort compression and may yield modest savings.
 * Falls back to original file on any error.
 */
export async function compressPdf(input: File): Promise<File> {
  const isPdf =
    ((input.type || "").toLowerCase() || guessMimeFromName(input.name)) ===
    "application/pdf";
  if (!isPdf) return input;
  try {
    const { PDFDocument } = await import("pdf-lib");
    const bytes = await input.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });

    // Light metadata normalization (optional small savings)
    try {
      pdf.setTitle("");
      pdf.setAuthor("");
      pdf.setSubject("");
      pdf.setKeywords([]);
      pdf.setProducer("");
      pdf.setCreator("");
    } catch {}

    const out = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
    const name = input.name.toLowerCase().endsWith(".pdf") ? input.name : `${input.name}.pdf`;
    return new File([out], name, { type: "application/pdf" });
  } catch {
    return input;
  }
}

/**
 * Comprime varios archivos. HEIC y HEIF se devuelven sin cambios.
 * PDFs se re-encodean con streams (best-effort).
 * Los demás se comprimen en paralelo moderado.
 */
export async function compressManySmart(
  files: File[],
  options: CompressOptions = {}
): Promise<File[]> {
  const heicOrHeif = (f: File) => {
    const t = (f.type || "").toLowerCase() || guessMimeFromName(f.name);
    return t === "image/heic" || t === "image/heif";
  };
  const isPdfFile = (f: File) => {
    const t = (f.type || "").toLowerCase() || guessMimeFromName(f.name);
    return t === "application/pdf";
  };

  const heic = files.filter(heicOrHeif);
  const pdfs = files.filter(isPdfFile);
  const other = files.filter(f => !heicOrHeif(f) && !isPdfFile(f));

  const out: File[] = [];

  // HEIC y HEIF, bypass total
  for (const f of heic) {
    out.push(f);
  }
  // PDFs: best-effort re-encode
  for (const f of pdfs) {
    out.push(await compressPdf(f));
  }

  // Los demás, compresión en paralelo moderado
  const pool = 2;
  const queue = [...other];
  const workers: Promise<void>[] = [];
  async function worker() {
    while (queue.length) {
      const f = queue.shift()!;
      out.push(await compressToWebp(f, options));
    }
  }
  const n = Math.min(pool, queue.length);
  for (let i = 0; i < n; i++) workers.push(worker());
  await Promise.all(workers);

  return out;
}

/** Utilidad, te dice qué va a pasar con el archivo */
export function getCompressionPlan(file: File): "bypass" | "compress" | "pdf" {
  const t = (file.type || "").toLowerCase() || guessMimeFromName(file.name);
  if (t === "application/pdf") return "pdf";
  return t === "image/heic" || t === "image/heif" ? "bypass" : "compress";
}

/** Comprime 1 archivo cualquiera (imagen, pdf u otros) */
export async function compressAnySmart(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const plan = getCompressionPlan(file);
  if (plan === "bypass") return file;
  if (plan === "pdf") return await compressPdf(file);
  return await compressToWebp(file, options);
}


