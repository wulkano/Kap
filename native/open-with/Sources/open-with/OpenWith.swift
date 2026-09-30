import Cocoa

struct OpenWith {
  static func urlsForAppsThatOpenFile(
    _ url: URL,
    role: LSRolesMask = [.viewer, .editor],
    withIcons: Bool = true
  ) -> String {
    let appUrls = LSCopyApplicationURLsForURL(url as CFURL, role)?.takeRetainedValue() as? [URL] ?? []
    let defaultAppUrl = LSCopyDefaultApplicationURLForURL(url as CFURL, role, nil)?.takeRetainedValue() as URL?

    let appList = appUrls.map {
      [
        "url": $0.absoluteString,
        "isDefault": $0 == defaultAppUrl
      ]
    }

    return toJson(withIcons ? addIconsToAppList(appList) : appList)
  }

  static func urlsForAppsThatOpenType(
    _ typeIdentifier: String,
    role: LSRolesMask = [.viewer, .editor],
    withIcons: Bool = true
  ) -> String {
    let appIdentifiers = LSCopyAllRoleHandlersForContentType(typeIdentifier as CFString, role)?.takeRetainedValue() as? [String] ?? []
    let defaultAppIdentifier = LSCopyDefaultRoleHandlerForContentType(typeIdentifier as CFString, role)?.takeRetainedValue() as String?

    let appUrls = appIdentifiers.compactMap { NSWorkspace.shared.urlForApplication(withBundleIdentifier: $0) }
    let defaultAppUrl = defaultAppIdentifier.flatMap { NSWorkspace.shared.urlForApplication(withBundleIdentifier: $0) }

    let appList = appUrls.map {
      [
        "url": $0.absoluteString,
        "isDefault": $0 == defaultAppUrl
      ]
    }

    return toJson(withIcons ? addIconsToAppList(appList) : appList)
  }

  static func urlsForAppsThatOpenExtension(
    _ fileExtension: String,
    role: LSRolesMask = [.viewer, .editor],
    withIcons: Bool = true
  ) -> String {
    let fullUrl = URL.uniqueTempPath().appendingPathExtension(fileExtension)

    do {
      try "".write(to: fullUrl, atomically: false, encoding: .utf8)
    } catch {
      return "[]"
    }

    return urlsForAppsThatOpenFile(fullUrl, role: role, withIcons: withIcons)
  }

  static func getIconFromAppUrl(_ url: String) -> String {
    let path = URL(string: url)?.path;
    let icon = NSWorkspace.shared.icon(forFile: path!).resizing(to: CGSize(width: 64, height: 64))?.tiffRepresentation
    let bitmap = NSBitmapImageRep(data: icon!)
    let data = bitmap?.representation(using: .png, properties: [:])
    return "data:image/png;base64,\(data!.base64EncodedString())"
  }

  static func addIconsToAppList(_ appList: [[String: Any]]) -> [[String: Any]] {
    return appList.map {
      [
        "url": $0["url"]!,
        "isDefault": $0["isDefault"]!,
        "icon": getIconFromAppUrl($0["url"] as! String)
      ]
    }
  }

  static func toJson(_ data: [[String: Any]]) -> String {
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: data, options: .prettyPrinted)
      return String(data: jsonData, encoding: .utf8)!
    } catch {
      return "[]"
    }
  }

  static func open(_ filePath: String, withAppAtUrl appUrl: URL) {
    do {
      try NSWorkspace.shared.open(
        [URL(fileURLWithPath: filePath)],
        withApplicationAt: appUrl,
        configuration: [:]
      )
    } catch {
      print(error, to: .standardError)
    }
  }
}
