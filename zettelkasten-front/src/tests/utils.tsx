import React, { ReactElement } from "react";
import { render } from "@testing-library/react";
import { PartialCardProvider } from "../contexts/CardContext";
import { TaskProvider } from "../contexts/TaskContext";
import { ShortcutProvider } from "../contexts/ShortcutContext";
import { sampleTasks } from "../tests/data";

function AllTheProviders({ children }) {
  return (
    <PartialCardProvider>
      <TaskProvider testing={true} testTasks={sampleTasks()}>
        <ShortcutProvider>{children}</ShortcutProvider>
      </TaskProvider>
    </PartialCardProvider>
  );
}

const customRender = (ui: ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

// Override render method
export { customRender as renderWithProviders };
