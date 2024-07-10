import Foundation

struct ZTask: Identifiable, Decodable, Encodable {
    var id: Int
    var card_pk: Int
    var user_id: Int
    var scheduled_date: Date?
    var created_at: Date
    var updated_at: Date
    var completed_at: String?
    var title: String
    var is_complete: Bool
    var is_deleted: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case card_pk
        case user_id
        case scheduled_date
        case created_at
        case updated_at
        case completed_at
        case title
        case is_complete
        case is_deleted
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        card_pk = try container.decode(Int.self, forKey: .card_pk)
        user_id = try container.decode(Int.self, forKey: .user_id)
        created_at = try container.decode(Date.self, forKey: .created_at)
        updated_at = try container.decode(Date.self, forKey: .updated_at)
        completed_at = try container.decodeIfPresent(String.self, forKey: .completed_at)
        title = try container.decode(String.self, forKey: .title)
        is_complete = try container.decode(Bool.self, forKey: .is_complete)
        is_deleted = try container.decode(Bool.self, forKey: .is_deleted)

        // Decode scheduled_date, handle null values
        let scheduledDateString = try container.decodeIfPresent(
            String.self,
            forKey: .scheduled_date
        )
        if let dateString = scheduledDateString {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'"
            dateFormatter.timeZone = TimeZone(secondsFromGMT: 0)
            scheduled_date = dateFormatter.date(from: dateString)
        }
        else {
            scheduled_date = nil
        }
    }

    init(
        id: Int,
        card_pk: Int,
        user_id: Int,
        scheduled_date: Date?,
        created_at: Date,
        updated_at: Date,
        completed_at: String? = nil,
        title: String,
        is_complete: Bool,
        is_deleted: Bool
    ) {
        self.id = id
        self.card_pk = card_pk
        self.user_id = user_id
        self.scheduled_date = scheduled_date
        self.created_at = created_at
        self.updated_at = updated_at
        self.completed_at = completed_at
        self.title = title
        self.is_complete = is_complete
        self.is_deleted = is_deleted
    }
}

extension ZTask {
    static var sampleData: [ZTask] = [
        ZTask(
            id: 1,
            card_pk: 1,
            user_id: 1,
            scheduled_date: Date(),
            created_at: Date(),
            updated_at: Date(),
            title: "This is a task",
            is_complete: false,
            is_deleted: false
        ),
        ZTask(
            id: 2,
            card_pk: 1,
            user_id: 1,
            scheduled_date: Date(),
            created_at: Date(),
            updated_at: Date(),
            title: "This is another task",
            is_complete: false,
            is_deleted: false
        ),
    ]
}
