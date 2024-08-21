//
//  ShareViewController.swift
//  ZettelgardenShare
//
//  Created by Nicholas Savage on 2024-08-21.
//

import MobileCoreServices
import SwiftUI
import UIKit
import ZettelgardenShared

@objc(PrincipalClassName)
class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        print("?")
        ZettelTest()
        let extensionAttachments = (self.extensionContext!.inputItems.first as! NSExtensionItem)
            .attachments
        let u = UIHostingController(
            rootView: ShareAddTaskView(data: extensionAttachments)
        )
        u.view.frame = (self.view.bounds)
        self.view.addSubview(u.view)
        self.addChild(u)
    }

}
