// swift-tools-version:5.1
import PackageDescription

let package = Package(
  name: "ActivateWindow",
  platforms: [
		.macOS(.v10_12)
	],
  targets: [
    .target(
      name: "activate-window"
    )
  ]
)