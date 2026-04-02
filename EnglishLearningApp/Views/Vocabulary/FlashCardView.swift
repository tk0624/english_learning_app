import SwiftUI

struct FlashCardView: View {
    let words: [Word]

    @State private var currentIndex = 0
    @State private var isFlipped = false

    private var currentWord: Word? {
        guard !words.isEmpty else { return nil }
        return words[currentIndex]
    }

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            if let word = currentWord {
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color(.systemBackground))
                        .shadow(radius: 8)
                        .frame(height: 200)

                    Text(isFlipped ? word.japanese : word.english)
                        .font(.title)
                        .padding()
                }
                .onTapGesture {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isFlipped.toggle()
                    }
                }
                .padding(.horizontal, 32)
            }

            Text("タップして裏返す")
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()

            HStack(spacing: 48) {
                Button("前へ") {
                    guard currentIndex > 0 else { return }
                    currentIndex -= 1
                    isFlipped = false
                }
                .disabled(currentIndex == 0)

                Text("\(currentIndex + 1) / \(words.count)")
                    .font(.subheadline)

                Button("次へ") {
                    guard currentIndex < words.count - 1 else { return }
                    currentIndex += 1
                    isFlipped = false
                }
                .disabled(currentIndex == words.count - 1)
            }
            .padding(.bottom, 40)
        }
        .navigationTitle("フラッシュカード")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        FlashCardView(words: Word.samples)
    }
}
