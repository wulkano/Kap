// Thanks to Sindre Sorhus for these utilities
// https://github.com/sindresorhus/do-not-disturb/blob/master/Sources/do-not-disturb/util.swift
import Cocoa

func sleep(for duration: TimeInterval) {
  usleep(useconds_t(duration * Double(USEC_PER_SEC)))
}

extension FileHandle: TextOutputStream {
  public func write(_ string: String) {
    write(string.data(using: .utf8)!)
  }
}

extension NSImage {
  func resizing(to size: CGSize) -> NSImage? {
    // Create a new rect with given width and height.
    let frame = CGRect(origin: .zero, size: size)

    // Get the best representation for the given size.
    guard let representation = bestRepresentation(for: frame, context: nil, hints: nil) else {
        return nil
    }

    // Create an empty image with the given size.
    let image = NSImage(size: size)

    // Set the drawing context and make sure to remove the focus before returning.
    image.lockFocus()
    defer { image.unlockFocus() }

    // Draw the new image.
    guard representation.draw(in: frame) else {
        return nil
    }

    return image
  }
}

extension URL {
    var typeIdentifier: String? {
      return (try? resourceValues(forKeys: [.typeIdentifierKey]))?.typeIdentifier
    }
}

struct CLI {
  static var standardInput = FileHandle.standardInput
  static var standardOutput = FileHandle.standardOutput
  static var standardError = FileHandle.standardError

  static let arguments = Array(CommandLine.arguments.dropFirst(1))
}

enum PrintOutputTarget {
  case standardOutput
  case standardError
}

/// Make `print()` accept an array of items.
private func print<Target>(
  _ items: [Any],
  separator: String = " ",
  terminator: String = "\n",
  to output: inout Target
) where Target: TextOutputStream {
  let item = items.map { "\($0)" }.joined(separator: separator)
  Swift.print(item, terminator: terminator, to: &output)
}

func print(
  _ items: Any...,
  separator: String = " ",
  terminator: String = "\n",
  to output: PrintOutputTarget = .standardOutput
) {
  switch output {
  case .standardOutput:
    print(items, separator: separator, terminator: terminator)
  case .standardError:
    print(items, separator: separator, terminator: terminator, to: &CLI.standardError)
  }
}

extension URL {
  /// Get a unqiue temp path that can be used as a directory or file.
  /// - Note: The path is not actually created for you.
  static func uniqueTempPath() -> URL {
    return FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
  }
}
