import SwiftUI

struct HomeView: View {
    var body: some View {
        TabView {
            VocabularyView()
                .tabItem {
                    Label("単語帳", systemImage: "text.book.closed")
                }

            ListeningView()
                .tabItem {
                    Label("リスニング", systemImage: "ear")
                }

            SpeakingView()
                .tabItem {
                    Label("スピーキング", systemImage: "mic")
                }

            GrammarView()
                .tabItem {
                    Label("文法", systemImage: "pencil.and.list.clipboard")
                }

            PronunciationView()
                .tabItem {
                    Label("発音", systemImage: "waveform")
                }
        }
    }
}

#Preview {
    HomeView()
}
