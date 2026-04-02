import Foundation

struct Exercise: Identifiable, Codable {
    enum ExerciseType: String, Codable {
        case listening
        case speaking
        case grammar
        case pronunciation
    }

    let id: UUID
    let type: ExerciseType
    let prompt: String
    let answer: String
    var isCompleted: Bool

    init(id: UUID = UUID(), type: ExerciseType, prompt: String, answer: String, isCompleted: Bool = false) {
        self.id = id
        self.type = type
        self.prompt = prompt
        self.answer = answer
        self.isCompleted = isCompleted
    }
}
