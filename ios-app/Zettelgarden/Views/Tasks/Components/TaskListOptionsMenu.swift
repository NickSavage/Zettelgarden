//
//  TaskListOptionsMenu.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-08-11.
//

import SwiftUI

struct TaskListOptionsMenu: View {
    @ObservedObject var taskListViewModel: TaskListViewModel

    var body: some View {
      Menu {
        Menu("Dates") {
          Button("Today", action: todayAction)
          Button("Tomorrow", action: tomorrowAction)
          Button("All", action: allAction)
          
        }
        Button("Show Completed", action: testAction)
      } label: {
        Image(systemName: "gearshape")
          .padding()
      }
    }

    private func testAction() {}

    private func todayAction() {
      taskListViewModel.dateFilter = .today
    }
    private func tomorrowAction() {
      taskListViewModel.dateFilter = .tomorrow
    }
  
    private func allAction() {
      taskListViewModel.dateFilter = .all
      
    }
}
