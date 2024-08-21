//
//  ShareViewController.swift
//  ZettelgardenShare
//
//  Created by Nicholas Savage on 2024-08-21.
//

import SwiftUI
import UIKit
import ZettelgardenShared

struct ImageView: View {
    @State var image: Image

    var body: some View {
        VStack {
            Spacer()
            Text("Hello, from share extension").font(.largeTitle)
            image.resizable().aspectRatio(contentMode: .fit)
            Spacer()
        }
    }
}
@objc(PrincipalClassName)
class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        print("?")
        ZettelTest()
        let extensionAttachments = (self.extensionContext!.inputItems.first as! NSExtensionItem)
            .attachments
        for provider in extensionAttachments! {
            // loadItem can be used to extract different types of data from NSProvider object in attachements
            provider.loadItem(forTypeIdentifier: "public.image") { data, _ in
                // Load Image data from image URL
                if let url = data as? URL {
                    if let imageData = try? Data(contentsOf: url) {
                        // Load Image as UIImage from image data
                        let uiimg = UIImage(data: imageData)!
                        // Convert to SwiftUI Image
                        let image = Image(uiImage: uiimg)
                        // .. Do something with the Image
                        DispatchQueue.main.async {
                            let u = UIHostingController(
                                rootView: ImageView(image: image)
                            )
                            u.view.frame = (self.view.bounds)
                            self.view.addSubview(u.view)
                            self.addChild(u)
                        }
                    }
                }
            }
        }
    }

}
