//
//  FileListItem.swift
//  Zettelgarden
//
//  Created by Nicholas Savage on 2024-05-20.
//

import SwiftUI

struct FileListItem: View {
    let file: File

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Text(String(file.id))
                Text(" - ")
                Text(file.name)
            }
            if let card = file.card {
                HStack {
                    Text(card.card_id).foregroundColor(.blue).bold()
                    Text(": ")
                    Text(card.title)
                }
            }
            Spacer()
        }
    }
}

struct FileListItem_Previews: PreviewProvider {
    static var file = File.sampleData
    static var previews: some View {
        FileListItem(file: file).previewLayout(.fixed(width: 400, height: 40))
    }
}
