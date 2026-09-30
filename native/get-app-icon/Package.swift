// swift-tools-version:4.0
import PackageDescription

let package = Package(
  name: "GetAppIcon",
  products: [
    .executable(name: "GetAppIcon", targets: ["GetAppIcon"]),
  ],
  dependencies: [
    .package(url: "https://github.com/kylef/Commander.git", from: "0.8.0"),
  ],
  targets: [
    .target(name: "GetAppIcon", dependencies: ["Commander"])
  ]
)
