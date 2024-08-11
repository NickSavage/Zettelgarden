import SwiftUI

struct TaskListView: View {
    @ObservedObject var taskListViewModel: TaskListViewModel
    @State private var showingAddTaskView = false

    var body: some View {
        ZStack {
          VStack{
            Text("Tasks")
            HStack {
              FilterFieldView(filterText: $taskListViewModel.filterText, placeholder: "Filter")
              TaskListOptionsMenu(taskListViewModel: taskListViewModel)
            }
            if !taskListViewModel.filteredTasks.isEmpty {
                List {
                    ForEach(taskListViewModel.filteredTasks) { task in
                        TaskListItemView(taskListViewModel: taskListViewModel, inputTask: task)
                    }
                }
                .refreshable {
                    taskListViewModel.loadTasks()
                }
            }
            else {
                Text("No tasks available.")
                Spacer()
            }
            
          }
          VStack{
            Spacer()
            HStack{
              Spacer()
              Button(action: {
                    showingAddTaskView.toggle()
                     }, label: {
                          Text("+")
                            .font(.system(.largeTitle))
                            .frame(width: 40, height: 40)
                            .foregroundColor(Color.white)
                            .padding(.bottom, 7)
                        })
                .background(Color.blue)
                .cornerRadius(38.5)
                .padding()
                .shadow(color: Color.black.opacity(0.3),
                        radius: 3,
                        x: 3,
                        y: 3)
              
            }
          }
        }
        .sheet(isPresented: $showingAddTaskView) {
            AddTaskView(taskListViewModel: taskListViewModel)
        }
    }
}

enum TaskDisplayOptions: Int, CaseIterable, Identifiable {
    case today = 1
    case tomorrow = 2
    case closedToday = 3
    case all = 4
    case closedAll = 5

    var id: Int { self.rawValue }
    var title: String {
        switch self {
        case .today:
            return "Today"
        case .tomorrow:
            return "Tomorrow"
        case .closedToday:
            return "Closed Today"
        case .all:
            return "All"
        case .closedAll:
            return "Closed All"
        }
    }
}
