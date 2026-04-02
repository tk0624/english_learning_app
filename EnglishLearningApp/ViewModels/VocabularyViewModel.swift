import Foundation
import Combine

@MainActor
final class VocabularyViewModel: ObservableObject {
    @Published var words: [Word] = Word.samples
    @Published var searchText: String = ""

    var filteredWords: [Word] {
        guard !searchText.isEmpty else { return words }
        return words.filter {
            $0.english.localizedCaseInsensitiveContains(searchText) ||
            $0.japanese.localizedCaseInsensitiveContains(searchText)
        }
    }

    func toggleMemorized(_ word: Word) {
        guard let index = words.firstIndex(where: { $0.id == word.id }) else { return }
        words[index].isMemorized.toggle()
    }
}
