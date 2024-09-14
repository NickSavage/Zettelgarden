import React, { ReactElement } from "react";
import { render } from "@testing-library/react";
import { PartialCardProvider } from "../contexts/CardContext";
import { TaskProvider } from "../contexts/TaskContext";
import { TagProvider } from "../contexts/TagContext";
import { ShortcutProvider } from "../contexts/ShortcutContext";
import { sampleTasks, sampleTags } from "../tests/data";

function AllTheProviders({ children }) {
  return (
    <TagProvider testing={true} testTags={sampleTags()} >
      <PartialCardProvider>
        <TaskProvider testing={true} testTasks={sampleTasks()}>
          <ShortcutProvider>{children}</ShortcutProvider>
        </TaskProvider>
      </PartialCardProvider>
    </TagProvider>
  );
}

const customRender = (ui: ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

// Override render method
export { customRender as renderWithProviders };
