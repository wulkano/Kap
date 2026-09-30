import Foundation
import Cocoa


func toJson<T: Encodable>(_ data: T) throws -> String {
  let jsonData = try JSONEncoder().encode(data)
  return String(data: jsonData, encoding: .utf8)!
}


enum PrintOutputTarget {
  case standardOutput
  case standardError
}


extension FileHandle: TextOutputStream {
	public func write(_ string: String) {
		write(string.data(using: .utf8)!)
	}
}


struct CLITargets {
  static var standardInput = FileHandle.standardOutput
  static var standardOutput = FileHandle.standardOutput
  static var standardError = FileHandle.standardError
}


/// Make `print()` accept an array of items.
/// Since Swift doesn't support spreading...
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
    print(items, separator: separator, terminator: terminator, to: &CLITargets.standardError)
  }
}


extension NSError {
  /// Execute the given closure and throw an error if the status code is non-zero.
  static func checkOSStatus(_ closure: () -> OSStatus) throws {
    guard let error = NSError(osstatus: closure()) else {
      return
    }

    throw error
  }

  /// Create an `NSError` from a `OSStatus`.
  convenience init?(osstatus: OSStatus) {
    guard osstatus != 0 else {
      return nil
    }

	self.init(domain: NSOSStatusErrorDomain, code: Int(osstatus), userInfo: nil)
  }
}
