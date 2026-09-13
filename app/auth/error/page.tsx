"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Center } from "@astryxdesign/core/Center";
import { VStack } from "@astryxdesign/core/VStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";

const REASONS: Record<string, string> = {
  state: "Сессия входа устарела — попробуй войти ещё раз",
  config: "Вход через Яндекс сейчас не настроен",
  exchange: "Не получилось подтвердить вход — попробуй ещё раз",
};

function AuthErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason") ?? "";
  return (
    <VStack gap={3} hAlign="center" padding={5}>
      <Heading level={1} justify="center">
        Не получилось войти
      </Heading>
      <Text type="body" color="secondary" justify="center">
        {REASONS[reason] ?? "Попробуй ещё раз"}
      </Text>
      <Link href="/history">
        <Button label="Вернуться" variant="primary" />
      </Link>
    </VStack>
  );
}

export default function AuthErrorPage() {
  return (
    <Center axis="both" minHeight="100dvh">
      <Suspense fallback={null}>
        <AuthErrorContent />
      </Suspense>
    </Center>
  );
}
