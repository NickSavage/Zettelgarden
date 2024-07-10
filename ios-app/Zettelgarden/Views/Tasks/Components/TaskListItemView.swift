//
//  TaskListItemView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-09.
//

import SwiftUI

struct TaskListItemView: View {
    @AppStorage("jwt") private var token: String?
    @ObservedObject private var taskViewModel = TaskViewModel()
    @ObservedObject var taskListViewModel: TaskListViewModel

    let inputTask: ZTask

    var body: some View {
        VStack {

            if let task = taskViewModel.task {

                HStack {
                    Button(action: {
                        taskViewModel.completeTask()
                    }) {
                        Text("[ ]")
                    }
                    VStack {
                        Text(task.title)
                        // if let date = task.scheduled_date {
                        //     //Text(formatDate(date: date))
                        //     Text(date)
                        // }
                        // else {
                        //     Text("No Date")  // Or any default text
                        // }
                    }
                    Spacer()
                    Text("asd")
                }
            }
        }.onAppear {
            taskViewModel.setTask(task: inputTask)
            taskViewModel.setListViewModel(taskListViewModel: taskListViewModel)
        }
    }
}

struct TaskListItem_Previews: PreviewProvider {
    static var previews: some View {
        TaskListItemWrapper()
    }

    struct TaskListItemWrapper: View {
        var task = ZTask.sampleData[0]
        var listViewModel = TaskListViewModel()

        var body: some View {
            TaskListItemView(taskListViewModel: listViewModel, inputTask: task).previewLayout(
                .fixed(width: 400, height: 80)
            )
        }

    }
}
