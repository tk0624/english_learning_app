import SwiftUI

struct VocabularyView: View {
    @StateObject private var viewModel = VocabularyViewModel()

    var body: some View {
        NavigationStack {
            List(viewModel.words) { word in
                VStack(alignment: .leading, spacing: 4) {
                    Text(word.english)
                        .font(.headline)
                    Text(word.japanese)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("単語帳")
            .toolbar {
                NavigationLink("フラッシュカード") {
                    FlashCardView(words: viewModel.words)
                }
            }
        }
    }
}

#Preview {
    VocabularyView()
}
