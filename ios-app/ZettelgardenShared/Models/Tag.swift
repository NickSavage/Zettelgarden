import Foundation

public struct Tag: Identifiable, Decodable, Encodable {
    public var id: Int
    public var name: String
    public var color: String
    public var user_id: Int
    public var task_count: Int
    public var card_count: Int
}
