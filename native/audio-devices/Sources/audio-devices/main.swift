import Cocoa
import SwiftCLI

func printDevice(_ device: AudioDevice) {
  print("\(device.id) - \(device.name)")
}

func getDevice(deviceId: Int) throws -> AudioDevice {
  do {
    return try AudioDevice(withId: UInt32(deviceId))
  } catch AudioDevice.Error.invalidDeviceId {
    print("No device exists with id \(deviceId)", to: .standardError)
    exit(1)
  } catch {
    throw error
  }
}

final class ListCommand: Command {
  let name = "list"
  let shortDescription = "List the available audio devices"

  @Flag("--input", description: "Only list input devices")
  var inputOnly: Bool

  @Flag("--output", description: "Only list output devices")
  var outputOnly: Bool

  @Flag("--json", description: "Print the result in JSON format")
  var json: Bool

  var optionGroups: [OptionGroup] { [.atMostOne($inputOnly, $outputOnly)] }

  func execute() throws {
    var devices = AudioDevice.all

    if inputOnly {
      devices = devices.filter { $0.isInput }
    }

    if outputOnly {
      devices = devices.filter { $0.isOutput }
    }

    if json {
      do {
        print(try toJson(devices))
      } catch {
        print("[]")
      }

      return
    }

    if !outputOnly {
      print("Input Devices\n")
      devices.filter { $0.isInput }.forEach { printDevice($0) }

      if !inputOnly {
        print("\n")
      }
    }

    if !inputOnly {
      print("Output Devices\n")
      devices.filter { $0.isOutput }.forEach { printDevice($0) }
    }
  }
}

final class GetCommand: Command {
  let name = "get"
  let shortDescription = "Get a device by its ID"

  @Flag("--json", description: "Print the result in JSON format")
  var json: Bool

  @Param var deviceId: Int

  func execute() throws {
    let device = try getDevice(deviceId: deviceId)

    if json {
      do {
        print(try toJson(device))
      } catch {
        print("{}")
      }

      return
    }

    printDevice(device)
  }
}

final class OutputGroup: CommandGroup {
  let shortDescription = "Get or set the default output device"
  let name = "output"
  let children = [GetOutputCommand(), SetOutputCommand()] as [Routable]
}

final class GetOutputCommand: Command {
  let name = "get"

  @Flag("--json", description: "Print the result in JSON format")
  var json: Bool

  func execute() throws {
    let device = try AudioDevice.getDefaultDevice(for: .output)

    if json {
      do {
        print(try toJson(device))
      } catch {
        print("{}")
      }

      return
    }

    printDevice(device)
  }
}

final class SetOutputCommand: Command {
  let name = "set"

  @Param var deviceId: Int

  func execute() throws {
    let device = try getDevice(deviceId: deviceId)

    do {
      try AudioDevice.setDefaultDevice(for: .output, device: device)
      print("Default output device was set to \(device.name)")
    } catch AudioDevice.Error.invalidDevice {
      print("\(device.name) is not an output device", to: .standardError)
    } catch {
      throw error
    }
  }
}

final class InputGroup: CommandGroup {
  let shortDescription = "Get or set the default input device"
  let name = "input"
  let children = [GetInputCommand(), SetInputCommand()] as [Routable]
}

final class GetInputCommand: Command {
  let name = "get"

  @Flag("--json", description: "Print the result in JSON format")
  var json: Bool

  func execute() throws {
    let device = try AudioDevice.getDefaultDevice(for: .input)

    if json {
      do {
        print(try toJson(device))
      } catch {
        print("{}")
      }
      return
    }

    printDevice(device)
  }
}

final class SetInputCommand: Command {
  let name = "set"

  @Param var deviceId: Int

  func execute() throws {
  let device = try getDevice(deviceId: deviceId)

    do {
      try AudioDevice.setDefaultDevice(for: .input, device: device)
      print("Default input device was set to \(device.name)")
    } catch AudioDevice.Error.invalidDevice {
      print("\(device.name) is not an input device", to: .standardError)
    } catch {
      throw error
    }
  }
}

final class SystemGroup: CommandGroup {
  let shortDescription = "Get or set the default device for system sounds"
  let name = "system"
  let children = [GetSystemCommand(), SetSystemCommand()] as [Routable]
}

final class GetSystemCommand: Command {
  let name = "get"

  @Flag("--json", description: "Print the result in json format")
  var json: Bool

  func execute() throws {
    let device = try AudioDevice.getDefaultDevice(for: .system)

    if json {
      do {
        print(try toJson(device))
      } catch {
        print("{}")
      }

      return
    }

    printDevice(device)
  }
}

final class SetSystemCommand: Command {
  let name = "set"

  @Param var deviceId: Int

  func execute() throws {
    let device = try getDevice(deviceId: deviceId)

    do {
      try AudioDevice.setDefaultDevice(for: .system, device: device)
      print("Default system sound device was set to \(device.name)")
    } catch AudioDevice.Error.invalidDevice {
      print("\(device.name) is not an output device", to: .standardError)
    } catch {
      throw error
    }
  }
}

final class VolumeGroup: CommandGroup {
  let shortDescription = "Get or set the volume of an output device"
  let name = "volume"
  let children = [GetVolumeCommand(), SetVolumeCommand()] as [Routable]
}

final class GetVolumeCommand: Command {
  let name = "get"

  @Param var deviceId: Int

  func execute() throws {
  let device = try getDevice(deviceId: deviceId)
    if let volume = device.volume {
      print(String(format: "%.2f", volume))
    } else {
      print("\(device.name) does not support volume", to: .standardError)
    }
  }
}

final class SetVolumeCommand: Command {
  let name = "set"

  @Param var deviceId: Int
  @Param var volume: Double

  func execute() throws {
    var device = try getDevice(deviceId: deviceId)

    do {
      try device.setVolume(volume)
    } catch AudioDevice.Error.volumeNotSupported {
      print("\(device.name) does not support volume", to: .standardError)
    } catch AudioDevice.Error.invalidVolumeValue {
      print("Volume needs to be between 0 and 1", to: .standardError)
    } catch {
      throw error
    }
  }
}

final class AggregateGroup: CommandGroup {
  let shortDescription = "Create or delete aggregate audio devices"
  let name = "aggregate"
  let children = [CreateAggregate(), DestroyAggregate()] as [Routable]
}

final class CreateAggregate: Command {
  let name = "create"
  let shortDescription = "Create an aggregate device using existing devices"

  @Flag("--json", description: "Print the result in JSON format")
  var json: Bool

  @Flag("--multi-output", description: "Create the aggregate device as a Multi-Output Device")
  var shouldStack: Bool

  @Param var deviceName: String
  @Param var mainDeviceId: Int
  @CollectedParam(minCount: 1) var deviceIds: [Int]

  func execute() throws {
    let mainDevice = try getDevice(deviceId: mainDeviceId)
    let otherDevices = try deviceIds.map { try getDevice(deviceId: $0) }

    let aggregateDevice = try AudioDevice.createAggregate(
      name: deviceName,
      mainDevice: mainDevice,
      otherDevices: otherDevices,
      shouldStack: shouldStack
    )

    if json {
      do {
        print(try toJson(aggregateDevice))
      } catch {
        print("{}")
      }

      return
    }

    printDevice(aggregateDevice)
  }
}

final class DestroyAggregate: Command {
  let name = "destroy"
  let shortDescription = "Destory a created aggregate device"

  @Param var deviceId: Int

  func execute() throws {
    let device = try getDevice(deviceId: deviceId)
    try AudioDevice.destroyAggregate(device: device)
    print("\(device.name) was destroyed")
  }
}

let audioDevices = CLI(name: "audio-devices")

audioDevices.commands = [
  ListCommand(),
  GetCommand(),
  OutputGroup(),
  InputGroup(),
  SystemGroup(),
  VolumeGroup(),
  AggregateGroup()
]

_ = audioDevices.go()
