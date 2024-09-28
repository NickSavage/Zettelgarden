import SwiftUI

public struct CreateTaskView: View {

    @Binding var newTask: ZTask
    @State private var selectedCard: PartialCard?
    @EnvironmentObject var taskListViewModel: TaskListViewModel

    @State private var title: String = ""
    @State private var scheduledDate: Date = Date()
    @State private var message: String = ""

    @State private var isBacklinkInputPresented = false
    @State private var showAddTagsSheet = false

    var onSave: (_ task: ZTask) -> Void

    public init(
        newTask: Binding<ZTask>,
        onSave: @escaping (_ task: ZTask) -> Void
    ) {
        self._newTask = newTask
        self.onSave = onSave
    }

    private func saveTask() {
        newTask.scheduled_date = scheduledDate
        taskListViewModel.createNewTask(newTask: newTask)
        title = ""
        scheduledDate = Date()
        self.message = "Task created"
        onSave(newTask)
        newTask = ZTask.emptyTask
        selectedCard = nil
    }

    public var body: some View {
        VStack {
            Text(message)
            List {
                Section(header: Text("Add Task").font(.headline)) {
                    TextField("Title", text: $newTask.title)
                        .textFieldStyle(RoundedBorderTextFieldStyle())

                    DatePicker(
                        "Scheduled Date",
                        selection: $scheduledDate,
                        displayedComponents: [.date]
                    )
                }
                Menu {
                    Button(action: {
                        isBacklinkInputPresented.toggle()

                    }) {
                        Text("Add Backlink")
                    }
                    Button(action: {
                        showAddTagsSheet.toggle()
                    }) {
                        Text("Add Tags")

                    }
                } label: {
                    Text("Actions")
                }

                if let card = selectedCard {
                    Text("Linked Card: [\(card.card_id)]")
                }
            }

            Spacer()
            Button(action: {
                saveTask()
            }) {
                Text("Save")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .foregroundColor(.white)
                    .background(Color.blue)
                    .cornerRadius(10)
            }
            .padding()
        }
        .sheet(isPresented: $isBacklinkInputPresented) {
            BacklinkInputView(
                onCardSelect: { card in
                    selectedCard = card
                    newTask.card_pk = card.id
                    isBacklinkInputPresented = false
                }
            )
            .presentationDetents([.medium, .large])
        }

    }

}
