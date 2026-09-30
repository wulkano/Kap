import AppKit
import Foundation

func focus(windowName: String) -> Bool {
  let workspace = NSWorkspace.shared
  let activeApps = workspace.runningApplications
  for app in activeApps {
    if app.localizedName == windowName {
      app.activate(options: .activateIgnoringOtherApps)
      return true
    }
  }

  return false
}

let windowName = String(CommandLine.arguments[1])
let result = focus(windowName: windowName)
print(result)