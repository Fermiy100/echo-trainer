"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Center } from "@astryxdesign/core/Center";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { Banner } from "@astryxdesign/core/Banner";
import { storeParagraph } from "@/lib/paragraph-store";
import { getInterest } from "@/lib/profile";
import styles from "./page.module.css";

const MAX_PHOTOS = 5;

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Реальное фото с телефона — это 3-6МБ в base64 на снимок; 5 таких фото разом
// превышают жёсткий лимит NVIDIA NIM в 25МБ на запрос (проверено напрямую: с
// оригиналами модель отвечает HTTP 400 "payload above 26214400 bytes"). Такое
// разрешение и не нужно, чтобы прочитать текст страницы — уменьшаем перед
// отправкой: 1600px по длинной стороне превращает ~4МБ фото в ~300-400КБ.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

async function resizeToDataUrl(file: File): Promise<string> {
  try {
    // {imageOrientation: "from-image"} учитывает EXIF-поворот с телефона —
    // без этого фото, снятое вертикально, могло бы лечь на canvas боком.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D недоступен");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } catch (err) {
    // На случай браузера без поддержки createImageBitmap — лучше отправить
    // фото как есть, чем не отправить вообще (сервер всё равно проверит размер).
    console.error("capture: не удалось сжать фото, отправляю оригинал", err);
    return readAsDataUrl(file);
  }
}

export default function CapturePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // разрешает выбрать тот же файл повторно
    if (!file) return;
    const dataUrl = await resizeToDataUrl(file);
    setError(null);
    setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, dataUrl]));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const confirm = async () => {
    if (photos.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrls: photos, interest: getInterest() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || `HTTP ${res.status}`);
      storeParagraph(result.id, result);
      router.push(`/explain/${result.id}`);
    } catch (err) {
      // Честно показываем, что не получилось, вместо того чтобы подсунуть
      // случайный пример под видом разбора реального фото ученика.
      console.error("capture: /api/explain недоступен", err);
      setError("Не получилось прочитать фото — переснимай при хорошем освещении, без бликов, или попробуй ещё раз");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" aria-label="Назад" className={styles.backLink}>
          <IconButton label="Назад" icon={<Icon icon="chevronLeft" />} variant="ghost" />
        </Link>
        <Text type="body" weight="bold">
          Сфотографировать параграф
        </Text>
        <div className={styles.headerSpacer} />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className={styles.hiddenInput}
      />

      {photos.length === 0 && (
        <Center axis="both" minHeight="70dvh">
          <VStack gap={5} hAlign="center" padding={5}>
            <div className={styles.frame}>
              <Icon icon="search" size="lg" color="secondary" />
            </div>
            <VStack gap={1} hAlign="center">
              <Heading level={1} justify="center">
                Наведи камеру на страницу
              </Heading>
              <Text type="body" color="secondary" justify="center">
                Постарайся уместить весь параграф в кадр, без бликов. Не поместился в один
                кадр — сфотографируй по частям, можно до {MAX_PHOTOS} фото.
              </Text>
            </VStack>
            <VStack gap={2} hAlign="center">
              <Button
                label="Сфотографировать"
                variant="primary"
                width="240px"
                onClick={() => inputRef.current?.click()}
              />
              <Button
                label="Выбрать из галереи"
                variant="ghost"
                onClick={() => inputRef.current?.click()}
              />
            </VStack>
          </VStack>
        </Center>
      )}

      {photos.length > 0 && (
        <VStack gap={5} padding={5}>
          <div className={styles.thumbGrid}>
            {photos.map((photo, i) => (
              <div key={i} className={styles.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={`Страница ${i + 1}`} className={styles.thumbImage} />
                <button
                  type="button"
                  className={styles.thumbRemove}
                  aria-label={`Убрать фото ${i + 1}`}
                  onClick={() => removePhoto(i)}
                  disabled={isSubmitting}
                >
                  <Icon icon="close" size="sm" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                className={styles.thumbAdd}
                onClick={() => inputRef.current?.click()}
                disabled={isSubmitting}
              >
                <Icon icon={PlusIcon} color="secondary" />
                <Text type="supporting" color="secondary">
                  Добавить
                </Text>
              </button>
            )}
          </div>

          {error && <Banner status="error" title="Не получилось" description={error} />}
          {isSubmitting && photos.length > 1 && (
            <Text type="supporting" color="secondary" justify="center">
              Несколько фото могут читаться дольше одного — не закрывай экран
            </Text>
          )}

          <VStack gap={2}>
            <Button
              label={isSubmitting ? "Читаю параграф…" : photos.length > 1 ? `Всё верно (${photos.length} фото)` : "Всё верно"}
              variant="primary"
              width="100%"
              isLoading={isSubmitting}
              onClick={confirm}
            />
            {!isSubmitting && (
              <Button label="Переснять всё" variant="ghost" width="100%" onClick={() => setPhotos([])} />
            )}
          </VStack>
        </VStack>
      )}
    </div>
  );
}
