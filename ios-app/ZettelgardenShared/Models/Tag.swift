import Foundation

public struct Tag: Identifiable, Decodable, Encodable {
    public var id: Int
    public var name: String
    public var color: String
    public var user_id: Int
    public var task_count: Int
    public var card_count: Int
}

extension Tag {
    public static var sampleData: [Tag] = [
        Tag(id: 1, name: "Urgent", color: "red", user_id: 101, task_count: 5, card_count: 3),
        Tag(id: 2, name: "Work", color: "blue", user_id: 102, task_count: 10, card_count: 7),
        Tag(id: 3, name: "Personal", color: "green", user_id: 101, task_count: 3, card_count: 5),
        Tag(id: 4, name: "Home", color: "yellow", user_id: 103, task_count: 2, card_count: 4),
        Tag(id: 5, name: "Travel", color: "purple", user_id: 102, task_count: 8, card_count: 10),
    ]
}
