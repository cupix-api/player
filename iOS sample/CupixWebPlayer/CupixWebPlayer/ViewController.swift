//
//  ViewController.swift
//  CupixWebPlayer
//
//  Created by Changyoon Yang on 05/03/2019.
//  Copyright © 2019 Cupix. All rights reserved.
//

import UIKit
import WebKit

class ViewController: UIViewController, WKScriptMessageHandler {

	var webView: WKWebView!

	override func viewDidLoad() {
		super.viewDidLoad()
		// Do any additional setup after loading the view, typically from a nib.

		let webCfg:WKWebViewConfiguration = WKWebViewConfiguration()
		let userController:WKUserContentController = WKUserContentController()
		// userController.add(self, name: "cupixEventHandler")
		userController.add(self, name: "cupixEventHandlerV2")
		webCfg.userContentController = userController

		self.webView = WKWebView(frame: CGRect(x: 0, y: 0, width: self.view.frame.size.width, height: self.view.frame.size.height), configuration: webCfg)
		// let url = URL(string: "http://players.cupix.com/p/ruHO8MyM")
		let url = URL(string: "https://players.cupix.com/p/bUVnYXBp")
		webView.load(URLRequest(url:url!))

		self.view = self.webView

		self.addSendEventButton();
	}

	func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
		if (message.name == "cupixEventHandler") {
			let msg = message.body as! NSDictionary
			let type = msg["eventType"] as! String
			let eventName = msg["eventName"] as! String
			let eventArg = msg["arg"] as! String
			print("[CUPIX-EVENT][\(type)] \(eventName): \(eventArg)")
		}
		else if (message.name == "cupixEventHandlerV2") {
			let msg = message.body as! NSDictionary
			func parse(_ key: String) -> Any {
				return msg[key] ?? "{}";
			}
			let ver = parse("ver")
			let sender = parse("sender")
			let type = parse("type")
			let args = parse("args")
			let pid = parse("player_id")
			let caller = parse("caller")
			print("[CUPIX-EVENT-V\(ver)]\(sender) - \(type): \(args): \(pid): \(caller)")
		}
	}

	func addSendEventButton() {
		let button = UIButton(frame: CGRect(x: 0, y: 0, width: 100, height: 50))
		button.center.x = self.view.center.x
		button.center.y = self.view.center.y + 100
		button.layer.cornerRadius = 10
		button.backgroundColor = .orange
		button.setTitle("Reset View", for: .normal)
		button.addTarget(self, action: #selector(self.sendEventButtonAction), for: .touchUpInside)
		self.view.addSubview(button)
	}

	func sendEventToPlayer(event: [String: Any]) {
		guard let data = try? JSONSerialization.data(withJSONObject: event, options: []) else {
			print("Failed to serialize JSON", event)
			return
		}
		if let eventStr = String(data: data, encoding: String.Encoding.utf8) {
			self.webView.evaluateJavaScript("window.postMessage(\(eventStr), '*')",
				completionHandler: { (output, error) in if error != nil { print(error!) } })
		} else {
			print("Failed to stringify JSON", event)
		}
	}

	@objc func sendEventButtonAction(sender: UIButton!) {
		self.sendEventToPlayer(event: [
			"ver": "2",
			"caller": "iOS",
			"sender": "Camera",
			"type": "Change",
			"args": [
				"pos": [0.0, 0.0, 0.0],
				"up": [0.0, 0.0, 1.0],
				"lookat": [0.0, 1.0, 0.0],
				"fov": 60.0
			]
		])
	}

}

