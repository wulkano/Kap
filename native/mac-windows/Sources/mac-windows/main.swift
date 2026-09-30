import Quartz

struct Window {
  var pid = 0
  var ownerName = ""
  var name = ""
  var x = 0
  var y = 0
  var width = 0
  var height = 0
  var number = 0

  func convertToDictionary() -> [String : Any] {
    return ["pid": self.pid, "ownerName": self.ownerName, "name": self.name, "x": self.x, "y": self.y, "width": self.width, "height": self.height, "number": self.number]
  }
}

func getWindows(onScreenOnly: Bool) -> [Window] {
  var windows: [Window] = []

  var options = CGWindowListOption(arrayLiteral: CGWindowListOption.excludeDesktopElements)
  if onScreenOnly {
    options = CGWindowListOption(arrayLiteral: CGWindowListOption.excludeDesktopElements, CGWindowListOption.optionOnScreenOnly)
  }

  let windowList = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as! NSArray

  for window in windowList {
    let dict = (window as! NSDictionary)

    let minWinSize: Int = 50

    if ((dict.value(forKey: "kCGWindowAlpha") as! Double) == 0) {
      continue;
    }

    let bounds = dict.value(forKey: "kCGWindowBounds") as! NSDictionary

    let x = bounds.value(forKey: "X")! as! Int
    let y = bounds.value(forKey: "Y")! as! Int
    let width = bounds.value(forKey: "Width")! as! Int
    let height = bounds.value(forKey: "Height")! as! Int

    if (width < minWinSize || height < minWinSize) {
      continue;
    }

    let pid = dict.value(forKey: "kCGWindowOwnerPID") as! Int

    var ownerName = ""
    if (dict.value(forKey: "kCGWindowOwnerName") != nil) {
      ownerName = dict.value(forKey: "kCGWindowOwnerName") as! String
    }

    var number = 0
    if (dict.value(forKey: "kCGWindowNumber") != nil) {
      number = dict.value(forKey: "kCGWindowNumber") as! Int
    }

    var name = ""
    if (dict.value(forKey: "kCGWindowName") != nil) {
      name = dict.value(forKey: "kCGWindowName") as! String
    }

    windows.append(Window(pid: pid, ownerName: ownerName, name: name, x: x, y: y, width: width, height: height, number: number))
  }

  return windows
}

func toJson(windows: [Window]) -> String {
  do {
    let dicArray = windows.map { $0.convertToDictionary() }
    let jsonData = try JSONSerialization.data(withJSONObject: dicArray, options: .prettyPrinted)
    let json = String(data: jsonData, encoding: String.Encoding.utf8)
    return json!
  } catch {
    return "[]"
  }
}

let onScreenOnly = Bool(CommandLine.arguments[1])!
let windows = getWindows(onScreenOnly: onScreenOnly);
let json = toJson(windows: windows);

print(json);
