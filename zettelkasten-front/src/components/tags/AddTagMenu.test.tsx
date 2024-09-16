// @vitest-environment happy-dom

import React from "react";
import { AddTagMenu } from "./AddTagMenu";
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../tests/utils";

import { sampleTasks } from "../../tests/data";

describe("Add Tag Menu Component", () => {
  it("renders with correct content", () => {
    let tasks = sampleTasks();
    renderWithProviders(
      <AddTagMenu
        task={tasks[0]}
        handleAddTag={(tag: string) => {}}
      />,
    );
    screen.debug(); // Prints the current DOM to the console
    expect(screen.getByText("#report"));
  });
});
