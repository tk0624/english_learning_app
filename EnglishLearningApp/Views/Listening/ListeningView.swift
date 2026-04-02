import SwiftUI

struct ListeningView: View {
    var body: some View {
        NavigationStack {
            Text("リスニング練習")
                .font(.title2)
                .foregroundStyle(.secondary)
                .navigationTitle("リスニング")
        }
    }
}

#Preview {
    ListeningView()
}
