"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { TextInput } from "@astryxdesign/core/TextInput";
import { isPro, activatePro, deactivatePro, DEMO_PRO_CODE } from "@/lib/pro";
import { PhotosProMark, InfinityProMark, RewordProMark, WeakSpotProMark, ParentProMark } from "@/components/ui/illustrations";
import styles from "./page.module.css";

const FEATURES = [
  { Mark: PhotosProMark, title: "До 5 фото за раз", detail: "Вместо 3 бесплатных — длинный параграф не разбивается на две попытки" },
  { Mark: InfinityProMark, title: "Безлимитные вопросы ИИ", detail: "Спрашивай про непонятное место, пока реально не поймёшь" },
  { Mark: RewordProMark, title: "«Объясни иначе»", detail: "Не зашло с первого раза — мгновенно другое объяснение" },
  { Mark: WeakSpotProMark, title: "Карта слабых мест", detail: "Что не запомнилось за всю четверть по всем предметам сразу" },
  { Mark: ParentProMark, title: "Доступ для родителя", detail: "Тот же прогресс по коду приглашения — без отдельной подписки" },
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
          <div className={styles.hero}>
            <div className={styles.eyebrow}>
              <Text type="label" color="accent" weight="bold">
                ЛИЧНЫЙ ИИ-РЕПЕТИТОР
              </Text>
            </div>
            <div className={styles.heroPrice}>
              <Text type="display-1" hasTabularNumbers as="span">
                149 ₽
              </Text>
              <Text type="body" color="secondary" as="span">
                /мес
              </Text>
            </div>
            <Text type="body" color="secondary">
              Меньше пятёрки в день — а помогает с домашкой каждый раз, когда что-то не заходит с первого
              объяснения.
            </Text>
          </div>

          <VStack gap={2}>
            {FEATURES.map(({ Mark, title, detail }) => (
              <Card key={title} padding={4} elevation="low">
                <HStack gap={3} vAlign="center">
                  <div className={styles.iconBadge}>
                    <Mark className={styles.iconMark} />
                  </div>
                  <VStack gap={0}>
                    <Text type="body" weight="bold">
                      {title}
                    </Text>
                    <Text type="supporting" size="xsm">
                      {detail}
                    </Text>
                  </VStack>
                </HStack>
              </Card>
            ))}
          </VStack>

          <Card padding={5} elevation="low">
            <VStack gap={3}>
              <Text type="supporting" color="secondary">
                Для сравнения
              </Text>
              <HStack gap={5}>
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
                description="Все пять фич выше открыты."
              />
              <Button label="Отключить Про (для теста)" variant="ghost" onClick={() => { deactivatePro(); setActive(false); }} />
            </VStack>
          ) : (
            <Card padding={5} variant="orange">
              <VStack gap={3}>
                <Heading level={2}>Активировать</Heading>
                <Banner
                  status="info"
                  title="Оплата пока демонстрационная"
                  description="Юрлица под школьный проект ещё нет — код ниже включает Про по-настоящему, просто без денег."
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
            </Card>
          )}
        </VStack>
      </div>
    </div>
  );
}
