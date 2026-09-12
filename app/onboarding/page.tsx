"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VStack } from "@astryxdesign/core/VStack";
import { Center } from "@astryxdesign/core/Center";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Stepper, Step } from "@astryxdesign/core/Stepper";
import { WelcomeIllustration } from "@/components/ui/illustrations";
import { markOnboarded } from "@/lib/onboarding-status";
import { setInterest as saveInterest } from "@/lib/profile";
import styles from "./page.module.css";

const INTERESTS = ["Футбол", "Игры", "Музыка", "Фильмы", "Свой вариант"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interest, setInterest] = useState<string | null>(null);
  const [customInterest, setCustomInterest] = useState("");
  const [subject, setSubject] = useState("");

  const canGoNext = interest !== null && (interest !== "Свой вариант" || customInterest.trim().length > 0);

  const finish = () => {
    const chosenInterest = interest === "Свой вариант" ? customInterest.trim() : interest;
    if (chosenInterest) saveInterest(chosenInterest);
    markOnboarded();
    router.push("/");
  };

  return (
    <div className={styles.page}>
      <Center axis="horizontal">
        <div className={styles.shell}>
          <VStack gap={8} padding={5}>
            <div className={styles.stepperTrack}>
              <Stepper
                activeStep={step}
                label="Онбординг"
                horizontalOptions={{ minimumStepWidth: 999, collapsedVariant: "hiddenLabel" }}
              >
                <Step step={0} label="Приветствие" indicator="none" />
                <Step step={1} label="Интересы" indicator="none" />
                <Step step={2} label="Предмет" indicator="none" />
              </Stepper>
            </div>

            {step === 0 && (
              <VStack gap={5} hAlign="center">
                <Center>
                  <WelcomeIllustration className={styles.illustration} />
                </Center>
                <VStack gap={2} hAlign="center">
                  <Heading level={1} type="display-2" justify="center">
                    Эхо — твой тренажёр пересказа
                  </Heading>
                  <Text type="body" color="secondary" justify="center">
                    Фотографируешь параграф, слышишь его простое объяснение, пересказываешь
                    своими словами — и узнаёшь, готов ли отвечать у доски.
                  </Text>
                </VStack>
                <Button label="Начать" variant="primary" width="100%" onClick={() => setStep(1)} />
              </VStack>
            )}

            {step === 1 && (
              <VStack gap={5}>
                <VStack gap={1}>
                  <Heading level={1} type="display-2">
                    Что тебе интересно?
                  </Heading>
                  <Text type="body" color="secondary">
                    Будем объяснять примеры в этом духе — можно сменить позже
                  </Text>
                </VStack>

                <div className={styles.interestGrid}>
                  {INTERESTS.map((option) => (
                    <SelectableCard
                      key={option}
                      label={option}
                      isSelected={interest === option}
                      onChange={(selected) => setInterest(selected ? option : null)}
                    >
                      <Text type="body" weight="bold" justify="center">
                        {option}
                      </Text>
                    </SelectableCard>
                  ))}
                </div>

                {interest === "Свой вариант" && (
                  <TextInput
                    label="Свой вариант"
                    value={customInterest}
                    onChange={(value) => setCustomInterest(value)}
                    placeholder="Например: аниме"
                  />
                )}

                <div className={styles.actions}>
                  <Button label="Назад" variant="ghost" onClick={() => setStep(0)} />
                  <Button
                    label="Далее"
                    variant="primary"
                    isDisabled={!canGoNext}
                    onClick={() => setStep(2)}
                  />
                </div>
              </VStack>
            )}

            {step === 2 && (
              <VStack gap={5}>
                <VStack gap={1}>
                  <Heading level={1} type="display-2">
                    Какой предмет сегодня?
                  </Heading>
                  <Text type="body" color="secondary">
                    Поможет группировать историю занятий — необязательно
                  </Text>
                </VStack>

                <TextInput
                  label="Предмет"
                  value={subject}
                  onChange={(value) => setSubject(value)}
                  placeholder="История, биология, литература…"
                />

                <div className={styles.actions}>
                  <Button label="Назад" variant="ghost" onClick={() => setStep(1)} />
                  <Button label="Готово" variant="primary" onClick={finish} />
                </div>
                <Button label="Пропустить" variant="ghost" onClick={finish} />
              </VStack>
            )}
          </VStack>
        </div>
      </Center>
    </div>
  );
}
