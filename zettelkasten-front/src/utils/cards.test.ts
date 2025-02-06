import { it, expect, test, describe } from "vitest";

import { sampleTasks, sampleCards } from "../tests/data";
import { convertCardToPartialCard, isCardIdUnique, sortCardIds, findNextChildId } from "./cards";

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
  let input = ["2/A.3/B", "10/A.2/B", "B10/B.5", "1/A.1/A", "3/B.1/C", "4/A.5/D", "2/A.10/A", "5/B.2/B", "A2/A.1", "3/A.6/A", "11/A.1/B", "1/B.1/A", "A1/A.10"]
  let expectedOutput = ["1/A.1/A", "1/B.1/A", "2/A.3/B", "2/A.10/A", "3/A.6/A", "3/B.1/C", "4/A.5/D", "5/B.2/B", "10/A.2/B", "11/A.1/B", "A1/A.10", "A2/A.1", "B10/B.5"]
  expect(sortCardIds(input)).toStrictEqual(expectedOutput)
})

describe('findNextChildId', () => {
  it('handles parent ending in number with no children', () => {
    expect(findNextChildId("A.1", [])).toBe("A.1/A");
  });

  it('handles parent ending in letter with no children', () => {
    expect(findNextChildId("A.1/A", [])).toBe("A.1/A.1");
  });

  it('increments existing number after letter', () => {
    expect(findNextChildId("A.1/A", [{ card_id: "A.1/A.1", id: 1 } as any])).toBe("A.1/A.2");
  });

  it('increments letter after number', () => {
    expect(findNextChildId("SP104/A.6", [{ card_id: "SP104/A.6/B", id: 1 } as any])).toBe("SP104/A.6/C");
  });

  it('handles Z to AA transition', () => {
    expect(findNextChildId("A.1", [{ card_id: "A.1/Z", id: 1 } as any])).toBe("A.1/AA");
  });

  it('handles multiple existing children', () => {
    const children = [
      { card_id: "A.1/B.1", id: 1 },
      { card_id: "A.1/B.2", id: 2 },
      { card_id: "A.1/B.3", id: 3 }
    ] as any[];
    expect(findNextChildId("A.1/B", children)).toBe("A.1/B.4");
  });

  it('handles complex paths with multiple segments', () => {
    expect(findNextChildId("SP104/A.6/B.1", [{ card_id: "SP104/A.6/B.1/A", id: 1 } as any]))
      .toBe("SP104/A.6/B.1/B");
  });

  it('handles real world example', () => {
    expect(findNextChildId("SP104/A.6", [{ card_id: "SP104/A.6/B", id: 1 } as any]))
      .toBe("SP104/A.6/C");
  });
});

