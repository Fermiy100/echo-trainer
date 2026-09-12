import Link from "next/link";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { StackItem } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core/TopNav";
import { HomeMark, HistoryMark, AboutMark } from "@/components/ui/illustrations";
import styles from "./AppFrame.module.css";

type NavKey = "home" | "history" | "about";

const NAV_ITEMS: { key: NavKey; href: string; label: string; Mark: typeof HomeMark }[] = [
  { key: "home", href: "/", label: "Главная", Mark: HomeMark },
  { key: "history", href: "/history", label: "История", Mark: HistoryMark },
  { key: "about", href: "/about", label: "О проекте", Mark: AboutMark },
];

export function AppFrame({
  active,
  children,
}: {
  active: NavKey;
  children: React.ReactNode;
}) {
  return (
    <VStack as="main" gap={0} minHeight="100dvh">
      <div className={styles.desktopNav}>
        <TopNav
          heading={<TopNavHeading heading="Эхо" headingHref="/" />}
          startContent={
            <>
              {NAV_ITEMS.map((item) => (
                <TopNavItem
                  key={item.key}
                  label={item.label}
                  href={item.href}
                  isSelected={item.key === active}
                />
              ))}
            </>
          }
        />
      </div>

      <StackItem size="fill" isScrollable>
        <div className={styles.shell}>{children}</div>
      </StackItem>

      <nav aria-label="Главная навигация" className={styles.bottomNav}>
        <HStack gap={0}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === active;
            return (
              <StackItem size="fill" key={item.key}>
                <Link href={item.href} className={styles.navItem}>
                  <VStack gap={1} hAlign="center" padding={1.5}>
                    <item.Mark className={styles.navIcon} active={isActive} />
                    <Text type="label" size="2xs" weight={isActive ? "bold" : "normal"} color={isActive ? "primary" : "secondary"}>
                      {item.label}
                    </Text>
                  </VStack>
                </Link>
              </StackItem>
            );
          })}
        </HStack>
      </nav>
    </VStack>
  );
}
