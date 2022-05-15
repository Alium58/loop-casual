import {
  cliExecute,
  gametimeToInt,
  myAdventures,
  myClosetMeat,
  myLevel,
  myMeat,
  print,
  takeCloset,
  turnsPlayed,
} from "kolmafia";
import { all_tasks, level_tasks, organ_tasks } from "./tasks/all";
import { prioritize } from "./route";
import { Engine } from "./engine";
import { convertMilliseconds, debug } from "./lib";
import { $skill, get, have, set } from "libram";
import { step, Task } from "./tasks/structure";
import { Args } from "./args";

export const args = Args.create("loopcasual", "A script to complete casual runs.", {
  goal: Args.string({
    help: "Which tasks to perform.",
    options: [
      ["all", "Level up, complete all quests, and get your steel organ."],
      ["level", "Level up only."],
      ["quests", "Complete all quests only."],
      ["organ", "Get your steel organ only."],
    ],
    default: "all",
  }),
  stomach: Args.number({
    help: "Amount of stomach to fill.",
    default: 5,
  }),
  liver: Args.number({
    help: "Amount of liver to fill.",
    default: 10,
  }),
  spleen: Args.number({
    help: "Amount of spleen to fill.",
    default: 5,
  }),
  voa: Args.number({
    help: "Value of an adventure, in meat, for determining diet.",
    setting: "valueOfAdventure",
    default: 6500,
  }),
  actions: Args.number({
    help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
  }),
});
export function main(command?: string): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  if (runComplete()) {
    print("Casual complete!", "purple");
    return;
  }

  const time_property = "_loop_casual_first_start";
  const set_time_now = get(time_property, -1) === -1;
  if (set_time_now) set(time_property, gametimeToInt());

  if (myMeat() > 2000000) {
    print("You have too much meat; closeting some during execution.");
    cliExecute(`closet put ${myMeat() - 2000000} meat`);
  }

  // Select which tasks to perform
  let tasks: Task[] = [];
  switch (args.goal) {
    case "all":
      tasks = prioritize(all_tasks());
      break;
    case "level":
      tasks = prioritize(level_tasks(), true);
      break;
    case "organ":
      tasks = prioritize(organ_tasks(), true);
      break;
  }

  const engine = new Engine(tasks);
  cliExecute("ccs loopcasual");

  let actions_left = args.actions ?? Number.MAX_VALUE;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Locate the next task.
    const next = engine.getNextTask();
    if (next === undefined) break;

    // Track the number of actions remaining to execute.
    // If there are no more actions left, just print our plan and exit.
    if (actions_left <= 0) {
      debug(`Next task: ${next[0].name}`);
      return;
    } else {
      actions_left -= 1;
    }

    // Do the next task.
    if (next[1] !== undefined) engine.execute(next[0], next[1]);
    else engine.execute(next[0]);
  }

  // Script is done; ensure we have finished
  takeCloset(myClosetMeat());

  const remaining_tasks = tasks.filter((task) => !task.completed());
  if (!runComplete()) {
    debug("Remaining tasks:", "red");
    for (const task of remaining_tasks) {
      if (!task.completed()) debug(`${task.name}`, "red");
    }
    if (myAdventures() === 0) {
      throw `Ran out of adventures. Consider setting higher stomach, liver, and spleen usage, or a higher voa.`;
    } else {
      throw `Unable to find available task, but the run is not complete.`;
    }
  }

  print("Casual complete!", "purple");
  print(`   Adventures used: ${turnsPlayed()}`, "purple");
  print(`   Adventures remaining: ${myAdventures()}`, "purple");
  if (set_time_now)
    print(
      `   Time: ${convertMilliseconds(gametimeToInt() - get(time_property, gametimeToInt()))}`,
      "purple"
    );
  else
    print(
      `   Time: ${convertMilliseconds(
        gametimeToInt() - get(time_property, gametimeToInt())
      )} since first run today started`,
      "purple"
    );
}

function runComplete(): boolean {
  switch (args.goal) {
    case "all":
      return step("questL13Final") === 999 && have($skill`Liver of Steel`) && myLevel() >= 13;
    case "level":
      return myLevel() >= 13;
    case "quests":
      return step("questL13Final") === 999;
    case "organ":
      return have($skill`Liver of Steel`);
    default:
      throw `Unknown goal ${args.goal}`;
  }
}
