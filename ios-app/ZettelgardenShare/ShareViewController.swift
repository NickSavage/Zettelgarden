//
//  ShareViewController.swift
//  ZettelgardenShare
//
//  Created by Nicholas Savage on 2024-08-21.
//

import MobileCoreServices
import SwiftUI
import UIKit

@objc(PrincipalClassName)
class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        guard let extensionItems = extensionContext?.inputItems.first as? NSExtensionItem,
            let attachments = extensionItems.attachments
        else {
            return
        }

        let hostingController = UIHostingController(
            rootView: ShareContentView(
                extensionContext: extensionContext,
                data: attachments
            )
        )

        addChild(hostingController)
        hostingController.view.frame = view.bounds
        hostingController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(hostingController.view)
        hostingController.didMove(toParent: self)
    }
}
