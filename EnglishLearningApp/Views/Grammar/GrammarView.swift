import SwiftUI

struct GrammarView: View {
    var body: some View {
        NavigationStack {
            Text("文法問題")
                .font(.title2)
                .foregroundStyle(.secondary)
                .navigationTitle("文法")
        }
    }
}

#Preview {
    GrammarView()
}
