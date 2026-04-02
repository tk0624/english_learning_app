import SwiftUI

struct PronunciationView: View {
    var body: some View {
        NavigationStack {
            Text("読み方・発音")
                .font(.title2)
                .foregroundStyle(.secondary)
                .navigationTitle("発音")
        }
    }
}

#Preview {
    PronunciationView()
}
