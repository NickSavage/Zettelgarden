import { it, expect, test, describe } from "vitest";

import { sampleTasks, sampleCards } from "../tests/data";
import { convertCardToPartialCard, isCardIdUnique, sortCardIds } from "./cards";

test("convert card to partial card", () => {
  let card = sampleCards()[0];
  let result = convertCardToPartialCard(card)
  expect(result["id"]).toBe(1);
})

test("isCardIdUnique", () => {
  expect(isCardIdUnique(sampleCards(), "3")).toBe(true);
  expect(isCardIdUnique(sampleCards(), "1")).toBe(false);
  
})

test("sort card ids", () => {
  let input = ["2/A.3/B", "10/A.2/B", "1/A.1/A", "3/B.1/C", "4/A.5/D", "2/A.10/A", "5/B.2/B", "3/A.6/A", "11/A.1/B", "1/B.1/A"]
  let expectedOutput = ["1/A.1/A", "1/B.1/A", "2/A.3/B", "2/A.10/A", "3/A.6/A", "3/B.1/C", "4/A.5/D", "5/B.2/B", "10/A.2/B", "11/A.1/B"]
  expect(sortCardIds(input)).toStrictEqual(expectedOutput)
})
