import SwiftUI

struct SpeakingView: View {
    var body: some View {
        NavigationStack {
            Text("スピーキング練習")
                .font(.title2)
                .foregroundStyle(.secondary)
                .navigationTitle("スピーキング")
        }
    }
}

#Preview {
    SpeakingView()
}
