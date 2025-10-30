"use client";

import TerminalImageManager from "@/components/TerminalImageManager";
import { ScenarioData } from "@/types/homeTypes";
import HomeNoScenario from "./HomeNoScenario";

interface HomeTerminalImageProps {
  scenario: ScenarioData | null;
}

function HomeTerminalImage({ scenario }: HomeTerminalImageProps) {
  if (!scenario) {
    return <HomeNoScenario />;
  }

  return (
    <TerminalImageManager
      airport={scenario.airport}
      terminal={scenario.terminal}
    />
  );
}

export default HomeTerminalImage;
