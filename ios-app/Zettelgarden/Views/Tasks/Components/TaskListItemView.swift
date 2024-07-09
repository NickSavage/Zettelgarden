//
//  TaskListItemView.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-07-09.
//

import SwiftUI

struct TaskListItemView: View {
    let task: Task

    var body: some View {
        HStack {
            Text("[ ]")
            VStack {
                Text(task.title)
                if let date = task.scheduled_date {
                    //Text(formatDate(date: date))
                    Text(date)
                }
                else {
                    Text("No Date")  // Or any default text
                }
            }
            Spacer()
            Text("asd")
        }
    }
}

struct TaskListItem_Previews: PreviewProvider {
    static var previews: some View {
        TaskListItemWrapper()
    }

    struct TaskListItemWrapper: View {
        var task = Task.sampleData[0]

        var body: some View {
            TaskListItemView(task: task).previewLayout(
                .fixed(width: 400, height: 80)
            )
        }

    }
}
