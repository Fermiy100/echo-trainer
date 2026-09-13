"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { List, ListItem } from "@astryxdesign/core/List";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { TextInput } from "@astryxdesign/core/TextInput";
import { isPro, activatePro, deactivatePro, DEMO_PRO_CODE } from "@/lib/pro";
import styles from "./page.module.css";

const FEATURES = [
  {
    title: "Безлимитные вопросы ИИ",
    detail: "Спрашивай про непонятное место, пока реально не поймёшь — не 1–2 раза в день, как бесплатно",
  },
  {
    title: "«Объясни иначе»",
    detail: "Не зашло с первого раза — мгновенно другое объяснение: проще, с другим примером",
  },
  {
    title: "Карта слабых мест",
    detail: "Что не запомнилось за всю четверть по всем предметам — не только по последнему параграфу",
  },
  {
    title: "Доступ для родителя",
    detail: "Тот же прогресс виден по коду приглашения — без отдельной подписки для него",
  },
];

export default function ProPage() {
  const [active, setActive] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);

  useEffect(() => {
    setActive(isPro());
  }, []);

  const submit = () => {
    setError(null);
    if (activatePro(code)) {
      setActive(true);
      setJustActivated(true);
      setCode("");
    } else {
      setError("Такого кода нет — проверь, что ввёл его без ошибок");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/" aria-label="Назад" className={styles.backLink}>
          <IconButton label="Назад" icon={<Icon icon="chevronLeft" />} variant="ghost" />
        </Link>
        <Text type="body" weight="bold">
          Эхо Про
        </Text>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.shell}>
        <VStack gap={6} padding={5}>
          <VStack gap={2}>
            <Heading level={1}>Репетитор, а не игра</Heading>
            <Text type="body" color="secondary">
              Не геймификация ради геймификации — четыре вещи, за которые реально стоит платить, если
              домашка и правда сложная в этой четверти.
            </Text>
          </VStack>

          <Card padding={0}>
            <List>
              {FEATURES.map((f) => (
                <ListItem
                  key={f.title}
                  label={f.title}
                  description={f.detail}
                  startContent={<Icon icon="success" color="accent" />}
                />
              ))}
            </List>
          </Card>

          <Card padding={5} elevation="low">
            <VStack gap={2}>
              <Text type="supporting" color="secondary">
                Для сравнения
              </Text>
              <HStack gap={4}>
                <VStack gap={0}>
                  <Text type="large" hasTabularNumbers>
                    700–1500 ₽
                  </Text>
                  <Text type="supporting" size="xsm">
                    час с репетитором
                  </Text>
                </VStack>
                <VStack gap={0}>
                  <Text type="large" color="accent" hasTabularNumbers>
                    149 ₽
                  </Text>
                  <Text type="supporting" size="xsm">
                    месяц Эхо Про
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>

          {active ? (
            <VStack gap={3}>
              <Banner
                status="success"
                title={justActivated ? "Про активирован!" : "Про уже активен на этом устройстве"}
                description="Безлимитные вопросы, «объясни иначе» и карта слабых мест открыты."
              />
              <Button label="Отключить Про (для теста)" variant="ghost" onClick={() => { deactivatePro(); setActive(false); }} />
            </VStack>
          ) : (
            <VStack gap={3}>
              <Banner
                status="info"
                title="Оплата пока демонстрационная"
                description="Настоящего платёжного шлюза ещё нет — у школьного проекта пока нет для этого юрлица. Код ниже включает Про по-настоящему, просто без денег."
              />
              {error && <Banner status="error" title="Не получилось" description={error} />}
              <HStack gap={2}>
                <div className={styles.codeInput}>
                  <TextInput
                    label="Код активации"
                    isLabelHidden
                    value={code}
                    onChange={setCode}
                    placeholder={`Например: ${DEMO_PRO_CODE}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                  />
                </div>
                <Button label="Активировать" variant="primary" onClick={submit} />
              </HStack>
            </VStack>
          )}
        </VStack>
      </div>
    </div>
  );
}
