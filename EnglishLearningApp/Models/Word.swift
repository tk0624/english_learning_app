import Foundation

struct Word: Identifiable, Codable {
    let id: UUID
    let english: String
    let japanese: String
    let phonetic: String
    var isMemorized: Bool

    init(id: UUID = UUID(), english: String, japanese: String, phonetic: String = "", isMemorized: Bool = false) {
        self.id = id
        self.english = english
        self.japanese = japanese
        self.phonetic = phonetic
        self.isMemorized = isMemorized
    }
}

extension Word {
    static let samples: [Word] = [
        Word(english: "ambiguous", japanese: "曖昧な", phonetic: "/æmˈbɪɡjuəs/"),
        Word(english: "persevere", japanese: "忍耐強く続ける", phonetic: "/ˌpɜːrsɪˈvɪər/"),
        Word(english: "eloquent", japanese: "雄弁な", phonetic: "/ˈeləkwənt/"),
    ]
}
