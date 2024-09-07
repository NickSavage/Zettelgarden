import { it, expect, test, describe } from "vitest";

import { sampleTasks, sampleCards } from "../tests/data";
import { convertCardToPartialCard, isCardIdUnique } from "./cards";

test("convert card to partial card", () => {
  let card = sampleCards()[0];
  let result = convertCardToPartialCard(card)
  expect(result["id"]).toBe(1);
})

test("isCardIdUnique", () => {
  expect(isCardIdUnique(sampleCards(), "3")).toBe(true);
  expect(isCardIdUnique(sampleCards(), "1")).toBe(false);
  
})
