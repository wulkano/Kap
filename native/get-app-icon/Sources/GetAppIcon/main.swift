import Quartz
import Commander

let stderr = FileHandle.standardError
let stdout = FileHandle.standardOutput

extension NSBitmapImageRep {
    var png: Data? {
        return representation(using: .png, properties: [:])
    }
}

extension Data {
    var bitmap: NSBitmapImageRep? {
        return NSBitmapImageRep(data: self)
    }
}

extension NSImage {
    var png: Data? {
        return tiffRepresentation?.bitmap?.png
    }
}

func resizeImage(image: NSImage?, w: Int, h: Int) -> NSImage? {
    guard let sourceImage = image else {
        return nil
    }
    let destSize = NSMakeSize(CGFloat(w), CGFloat(h))
    let newImage = NSImage(size: destSize)
    newImage.lockFocus()
    sourceImage.draw(
        in: NSMakeRect(0, 0, destSize.width, destSize.height),
        from: NSMakeRect(0, 0, sourceImage.size.width, sourceImage.size.height),
        operation: .sourceOver,
        fraction: CGFloat(1)
    )
    newImage.unlockFocus()
    newImage.size = destSize
    return NSImage(data: newImage.tiffRepresentation!)!
}

func getIcon(pid: Int, size: Int) -> NSImage? {
    let runningApp = NSRunningApplication(processIdentifier: pid_t(pid))
    return resizeImage(image: runningApp?.icon, w: size, h: size)
}

func stringify(data: Data) -> String {
    return "data:image/png;base64,\(data.base64EncodedString())"
}

func printErr(_ item: String) {
    stderr.write("\(item)\n".data(using: String.Encoding.utf8)!)
    exit(1)
}

command(
    Argument<Int>("pid", description: "pid of the Application"),
    Option("size", default: 32, description: "Size of out the output"),
    Option("encoding", default: "base64", description: "Encoding of output")
) { pid, size, encoding in
    guard let icon = getIcon(pid: pid, size: size) else {
        return printErr("App with provided pid has not been found.")
    }
    if encoding == "buffer" {
        stdout.write(icon.png!)
    } else {
        print(stringify(data: icon.png!))
    }
}.run()
