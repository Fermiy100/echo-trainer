import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { Link } from "@astryxdesign/core/Link";
import { AppFrame } from "@/components/shell/AppFrame";
import { getPilotStats } from "@/lib/db";
import styles from "./page.module.css";

// Цифры пилота обновляются раз в 5 минут, а не на каждый запрос — этого
// достаточно для честной статистики и не гоняет Neon без нужды.
export const revalidate = 300;

const TECH = [
  {
    title: "Понимание параграфа",
    detail:
      "Фото страницы читает нейросеть NVIDIA NIM — бесплатный тариф, которого хватает на целый класс.",
  },
  {
    title: "Озвучка и запись пересказа",
    detail: "Встроенный в браузер Web Speech API — ничего не платим за голос.",
  },
  {
    title: "История и прогресс",
    detail: "Neon Postgres — бесплатный тариф, хранит только то, что нужно для статистики.",
  },
  {
    title: "Если что-то сломается на сцене",
    detail:
      "Демо-режим на заранее подготовленном примере работает полностью офлайн — без интернета и без нейросети.",
  },
];

export default async function AboutPage() {
  const stats = await getPilotStats();
  const isLive = stats !== null;
  const pilotStats = [
    { value: String(stats?.uniqueStudents ?? 0), label: "учеников попробовали" },
    { value: String(stats?.totalParagraphs ?? 0), label: "параграфов пройдено" },
    { value: String(stats?.averageStreakDays ?? 0), label: "средний стрик, дней" },
  ];

  return (
    <AppFrame active="about">
      <VStack gap={8} padding={5}>
        <VStack gap={2}>
          <Text type="supporting">О проекте</Text>
          <Heading level={1} type="display-2">
            Эхо
          </Heading>
          <div className={styles.offer}>
            <Text type="body" color="secondary">
              За 5 минут без зубрёжки: фотографируешь параграф, слышишь его простое объяснение,
              пересказываешь своими словами — и получаешь честный ответ, готов ли ты отвечать у
              доски.
            </Text>
          </div>
        </VStack>

        <VStack gap={3}>
          <Heading level={2}>Пилот на классе</Heading>
          <div className={styles.statsGrid}>
            {pilotStats.map((stat) => (
              <Card key={stat.label} padding={5} elevation="low">
                <VStack gap={1}>
                  <Text type="display-2" color="accent" hasTabularNumbers>
                    {stat.value}
                  </Text>
                  <Text type="supporting">{stat.label}</Text>
                </VStack>
              </Card>
            ))}
          </div>
          <Text type="supporting" size="xsm">
            {isLive
              ? "Цифры считаются автоматически из реальных попыток учеников."
              : "База данных пилота ещё не подключена — сейчас здесь честный ноль, не выдуманная статистика."}
          </Text>
        </VStack>

        <VStack gap={3}>
          <Heading level={2}>Как это работает — без магии</Heading>
          <Card padding={0}>
            <VStack gap={0}>
              {TECH.map((item, i) => (
                <div key={item.title}>
                  {i > 0 && <Divider />}
                  <VStack gap={1} padding={4}>
                    <Text type="body" weight="bold">
                      {item.title}
                    </Text>
                    <Text type="supporting">{item.detail}</Text>
                  </VStack>
                </div>
              ))}
            </VStack>
          </Card>
        </VStack>

        <VStack gap={1}>
          <Heading level={2}>Исходники</Heading>
          <Text type="supporting">
            Весь код открыт на{" "}
            <Link href="https://github.com/Fermiy100/echo-trainer" isExternalLink>
              GitHub
            </Link>{" "}
            — можно посмотреть, как всё устроено внутри.
          </Text>
        </VStack>
      </VStack>
    </AppFrame>
  );
}
