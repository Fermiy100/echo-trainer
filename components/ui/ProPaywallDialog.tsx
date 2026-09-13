"use client";

import { useState } from "react";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { TextInput } from "@astryxdesign/core/TextInput";
import { activatePro } from "@/lib/pro";
import { PhotosProMark, InfinityProMark, RewordProMark, WeakSpotProMark, ParentProMark } from "@/components/ui/illustrations";
import styles from "./ProPaywallDialog.module.css";

const FEATURES = [
  { Mark: PhotosProMark, title: "До 5 фото за раз" },
  { Mark: InfinityProMark, title: "Безлимитные вопросы ИИ" },
  { Mark: RewordProMark, title: "«Объясни иначе» без лимита" },
  { Mark: WeakSpotProMark, title: "Карта слабых мест" },
  { Mark: ParentProMark, title: "Доступ для родителя" },
];

// Момент, когда бесплатный лимит реально упирается в стену — не тихая
// надпись где-то внизу экрана, а то, что нельзя не заметить. Раньше отказ
// показывался маленьким баннером под кнопкой, и на практике его никто не
// замечал (см. чат: "даже не узнал про платную") — теперь это модалка ровно
// в момент клика по заблокированному действию.
export function ProPaywallDialog({
  isOpen,
  onOpenChange,
  reason,
  onActivated,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onActivated: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (activatePro(code)) {
      setCode("");
      onActivated();
      onOpenChange(false);
    } else {
      setError("Такого кода нет — проверь, что ввёл его без ошибок");
    }
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={420}>
      <Layout
        header={<DialogHeader title="Это уже в Эхо Про" subtitle={reason} onOpenChange={onOpenChange} />}
        content={
          <LayoutContent>
            <VStack gap={4} padding={5}>
              <div className={styles.featureGrid}>
                {FEATURES.map(({ Mark, title }) => (
                  <div key={title} className={styles.featureCell}>
                    <div className={styles.iconBadge}>
                      <Mark className={styles.iconMark} />
                    </div>
                    <Text type="supporting" weight="bold">
                      {title}
                    </Text>
                  </div>
                ))}
              </div>
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
                    placeholder="Например: ЭХОПРО"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                  />
                </div>
                <Button label="Активировать" variant="primary" onClick={submit} />
              </HStack>
              <Button label="Может, позже" variant="ghost" width="100%" onClick={() => onOpenChange(false)} />
            </VStack>
          </LayoutContent>
        }
      />
    </Dialog>
  );
}
