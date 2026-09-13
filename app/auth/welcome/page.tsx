"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Center } from "@astryxdesign/core/Center";
import { VStack } from "@astryxdesign/core/VStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { setStudentId, setDisplayName } from "@/lib/client-id";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

export default function AuthWelcomePage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const sid = readCookie("echo_sid_transfer");
    const displayName = readCookie("echo_name_transfer");
    if (sid) {
      setStudentId(sid);
      clearCookie("echo_sid_transfer");
    }
    if (displayName) {
      setDisplayName(displayName);
      clearCookie("echo_name_transfer");
      setName(displayName);
    }
    const timer = setTimeout(() => router.replace("/history"), 1400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Center axis="both" minHeight="100dvh">
      <VStack gap={2} hAlign="center" padding={5}>
        <Heading level={1} justify="center">
          {name ? `Привет, ${name}!` : "Вход выполнен"}
        </Heading>
        <Text type="body" color="secondary" justify="center">
          Теперь история видна с любого устройства, где ты войдёшь так же
        </Text>
      </VStack>
    </Center>
  );
}
