"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { Center } from "@astryxdesign/core/Center";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { MOCK_PARAGRAPH } from "@/lib/mock-data";
import { storeParagraph } from "@/lib/paragraph-store";
import { getInterest } from "@/lib/profile";
import styles from "./page.module.css";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CapturePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDataUrl(await readAsDataUrl(file));
  };

  const retake = () => {
    setDataUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const confirm = async () => {
    if (!dataUrl) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl, interest: getInterest() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      storeParagraph(result.id, result);
      router.push(`/explain/${result.id}`);
    } catch (err) {
      // Сеть/сервер недоступны — честный офлайн-пример вместо тупика на экране
      console.error("capture: /api/explain недоступен, использую офлайн-пример", err);
      storeParagraph(MOCK_PARAGRAPH.id, MOCK_PARAGRAPH);
      router.push(`/explain/${MOCK_PARAGRAPH.id}`);
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

      {!dataUrl && (
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
                Постарайся уместить весь параграф в кадр, без бликов
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

      {dataUrl && (
        <VStack gap={5} padding={5}>
          <div className={styles.previewFrame}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="Превью страницы" className={styles.previewImage} />
          </div>
          <VStack gap={2}>
            <Button
              label={isSubmitting ? "Читаю параграф…" : "Всё верно"}
              variant="primary"
              width="100%"
              isLoading={isSubmitting}
              onClick={confirm}
            />
            <Button label="Переснять" variant="ghost" width="100%" isDisabled={isSubmitting} onClick={retake} />
          </VStack>
        </VStack>
      )}
    </div>
  );
}
