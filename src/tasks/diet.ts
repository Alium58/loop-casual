import {
  cliExecute,
  eat,
  myAdventures,
  myBasestat,
  myDaycount,
  myFullness,
  myInebriety,
  myPrimestat,
  mySpleenUse,
  reverseNumberology,
  use,
} from "kolmafia";
import { $item, get, have, set } from "libram";
import { args } from "../main";
import { Quest } from "./structure";

function max(a: number, b: number) {
  return a > b ? a : b;
}
export const DietQuest: Quest = {
  name: "Diet",
  tasks: [
    {
      name: "Consume",
      after: [],
      completed: () =>
        myDaycount() > 1 || myFullness() >= args.stomach || myInebriety() >= args.liver,
      ready: () => myBasestat(myPrimestat()) >= 150 || myAdventures() === 1, // Wait until 150 mainstat (level 13 + 2 stats), in case of transdermal smoke patch deleveling
      do: (): void => {
        // Save cleaners for aftercore
        const spice = get("spiceMelangeUsed");
        const mojo = get("currentMojoFilters");
        set("spiceMelangeUsed", true);
        set("currentMojoFilters", 3);
        const food = max(args.stomach - myFullness(), 0);
        const drink = max(args.liver - myInebriety(), 0);
        const spleen = max(args.spleen - mySpleenUse(), 0);
        cliExecute(`CONSUME ORGANS ${food} ${drink} ${spleen} NOMEAT`);
        set("spiceMelangeUsed", spice);
        set("currentMojoFilters", mojo);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
    {
      name: "Numberology",
      after: [],
      completed: () => get("_universeCalculated") >= get("skillLevel144"),
      ready: () => myAdventures() > 0 && Object.keys(reverseNumberology()).includes("69"),
      do: (): void => {
        cliExecute("numberology 69");
      },
      limit: { tries: 4 },
      freeaction: true,
    },
    {
      name: "Sausage",
      after: ["Consume"],
      completed: () => !have($item`Kramco Sausage-o-Matic™`) || get("_sausagesEaten") >= 23, // Cap at 23 sausages to avoid burning through an entire supply
      ready: () => have($item`magical sausage casing`),
      do: (): void => {
        eat(1, $item`magical sausage`);
      },
      limit: { tries: 23 },
      freeaction: true,
    },
    {
      name: "Hourglass",
      after: [],
      completed: () => !have($item`etched hourglass`) || get("_etchedHourglassUsed"),
      do: (): void => {
        use($item`etched hourglass`);
      },
      limit: { tries: 1 },
      freeaction: true,
    },
  ],
};
