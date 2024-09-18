import Foundation

public func getTestNavigationViewModel() -> NavigationViewModel {
    let result = NavigationViewModel(cardViewModel: CardViewModel())
    return result
}

public func getTestPartialCardViewModel() -> PartialCardViewModel {
    let result = PartialCardViewModel()
    result.loadTestCards(cards: PartialCard.sampleData)
    return result
}
public func getTestCardViewModel() -> CardViewModel {
    let result = CardViewModel()
    result.card = Card.sampleData[0]
    return result
}
public func getTestTaskListViewModel() -> TaskListViewModel {
    let viewModel = TaskListViewModel()
    viewModel.loadTestTasks(tasks: ZTask.sampleData)
    return viewModel

}

public func getTestTaskViewModel() -> TaskViewModel {
    let viewModel = TaskViewModel()
    viewModel.task = ZTask.sampleData[0]
    return viewModel

}
