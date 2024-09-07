import { expect, test } from "vitest";
import { removeTagsFromTitle, parseTags } from "./tasks";

test("remove tags from title", () => {
  let title = "This is a #test title with #tags";
  expect(removeTagsFromTitle(title)).toBe("This is a  title with");
});

test("remove no tags from title", () => {
  const title = "This is a title without tags";
  expect(removeTagsFromTitle(title)).toBe("This is a title without tags");
});

test("parse tags from title with multiple tags", () => {
  const title = "This is a #test title with #multiple #tags";
  expect(parseTags(title)).toEqual(["#test", "#multiple", "#tags"]);
});

test("parse tags from title with no tags", () => {
  const title = "This title has no tags";
  expect(parseTags(title)).toEqual([]);
});

test("parse tags from empty string", () => {
  const title = "";
  expect(parseTags(title)).toEqual([]);
});

test("parse tags from title with only tags", () => {
  const title = "#tag1 #tag2 #tag3";
  expect(parseTags(title)).toEqual(["#tag1", "#tag2", "#tag3"]);
});

test("parse tags from title with tags and punctuation", () => {
  const title = "This is a title with #tags, and punctuation!";
  expect(parseTags(title)).toEqual(["#tags"]);
});

test("parse tags from title with mixed content", () => {
  const title = "Some text #tag1 more text #tag2";
  expect(parseTags(title)).toEqual(["#tag1", "#tag2"]);
});

test("parse tags from title with consecutive tags", () => {
  const title = "Some text #tag1#tag2 more text";
  expect(parseTags(title)).toEqual(["#tag1", "#tag2"]);
});

test("parse tags from title with consecutive tags", () => {
  const title = "Some text #tag1#tag2 more text";
  expect(parseTags(title)).toEqual(["#tag1", "#tag2"]);
});

// test("skip parsing tags from middle of words", () => {
//   const title = "Some text#tag1#tag2 more text";
//   expect(parseTags(title)).toEqual([#tag]);
  
// })
