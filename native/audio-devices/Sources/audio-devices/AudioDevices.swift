import Cocoa
import CoreAudio

struct AudioDevice: Hashable, Codable, Identifiable {
  enum Error: Swift.Error {
    case invalidDeviceId
    case invalidDevice
    case volumeNotSupported
    case invalidVolumeValue
  }

  let id: AudioDeviceID
  let name: String
  let uid: String
  let isInput: Bool
  let isOutput: Bool
  var transportType: TransportType

  init(withId deviceId: AudioDeviceID) throws {
    self.id = deviceId

    var deviceName = "" as CFString
    var deviceUID = "" as CFString

    do {
      try CoreAudioData.get(id: deviceId, selector: kAudioObjectPropertyName, value: &deviceName)
      try CoreAudioData.get(id: deviceId, selector: kAudioDevicePropertyDeviceUID, value: &deviceUID)
    } catch {
      throw Error.invalidDeviceId
    }

    self.name = deviceName as String
    self.uid = deviceUID as String

    var deviceTransportType: UInt32 = 0
    do {
      try CoreAudioData.get(
        id: deviceId,
        selector: kAudioDevicePropertyTransportType,
        value: &deviceTransportType
      )
    } catch {
      deviceTransportType = 0
    }

    self.transportType = TransportType(rawTransportType: deviceTransportType)

    let inputChannels: UInt32 = try CoreAudioData.size(
      id: deviceId,
      selector: kAudioDevicePropertyStreams,
      scope: kAudioDevicePropertyScopeInput
    )

    isInput = inputChannels > 0

    let outputChannels: UInt32 = try CoreAudioData.size(
      id: deviceId,
      selector: kAudioDevicePropertyStreams,
      scope: kAudioDevicePropertyScopeOutput
    )

    isOutput = outputChannels > 0
  }

  var volume: Double? {
    let hasVolume = CoreAudioData.has(
      id: id,
      selector: kAudioDevicePropertyVolumeScalar,
      scope: kAudioDevicePropertyScopeOutput
    )

    guard hasVolume else {
      return nil
    }

    var deviceVolume: Float32 = 0
    do {
      try CoreAudioData.get(
        id: id,
        selector: kAudioDevicePropertyVolumeScalar,
        scope: kAudioDevicePropertyScopeOutput,
        value: &deviceVolume
      )

      return Double(deviceVolume)
    } catch {
      return nil
    }
  }

  func setVolume(_ newVolume: Double) throws {
    guard volume != nil else {
      throw Error.volumeNotSupported
    }

    guard (0...1).contains(newVolume) else {
      throw Error.invalidVolumeValue
    }

    var value = Float32(newVolume)
    try CoreAudioData.set(
      id: id,
      selector: kAudioDevicePropertyVolumeScalar,
      scope: kAudioDevicePropertyScopeOutput,
      value: &value
    )
  }

  func isDefault(for deviceType: DeviceType) -> Bool {
    guard let defaultDevice = try? Self.getDefaultDevice(for: deviceType) else {
      return false
    }

    return self == defaultDevice
  }

  func setAsDefault(for deviceType: DeviceType) throws {
    try Self.setDefaultDevice(for: deviceType, device: self)
  }
}

extension AudioDevice {
  struct DeviceType {
    let selector: AudioObjectPropertySelector
    let isInput: Bool
    let isOutput: Bool

    static let input = Self(
      selector: kAudioHardwarePropertyDefaultInputDevice,
      isInput: true,
      isOutput: false
    )

    static let output = Self(
      selector: kAudioHardwarePropertyDefaultOutputDevice,
      isInput: false,
      isOutput: true
    )

    static let system = Self(
      selector: kAudioHardwarePropertyDefaultSystemOutputDevice,
      isInput: false,
      isOutput: true
    )
  }
}

extension AudioDevice {
  enum TransportType: String, Codable {
    case avb
    case aggregate
    case airplay
    case autoaggregate
    case bluetooth
    case bluetoothle
    case builtin
    case displayport
    case firewire
    case hdmi
    case pci
    case thunderbolt
    case usb
    case virtual
    case unknown

    init(rawTransportType deviceTransportType: UInt32) {
      switch deviceTransportType {
      case kAudioDeviceTransportTypeAVB:
        self = .avb
      case kAudioDeviceTransportTypeAggregate:
        self = .aggregate
      case kAudioDeviceTransportTypeAirPlay:
        self = .airplay
      case kAudioDeviceTransportTypeAutoAggregate:
        self = .autoaggregate
      case kAudioDeviceTransportTypeBluetooth:
        self = .bluetooth
      case kAudioDeviceTransportTypeBluetoothLE:
        self = .bluetoothle
      case kAudioDeviceTransportTypeBuiltIn:
        self = .builtin
      case kAudioDeviceTransportTypeDisplayPort:
        self = .displayport
      case kAudioDeviceTransportTypeFireWire:
        self = .firewire
      case kAudioDeviceTransportTypeHDMI:
        self = .hdmi
      case kAudioDeviceTransportTypePCI:
        self = .pci
      case kAudioDeviceTransportTypeThunderbolt:
        self = .thunderbolt
      case kAudioDeviceTransportTypeUSB:
        self = .usb
      case kAudioDeviceTransportTypeVirtual:
        self = .virtual
      default:
        self = .unknown
      }
    }
  }
}

extension AudioDevice {
  static var all: [Self] {
    do {
      let devicesSize = try CoreAudioData.size(selector: kAudioHardwarePropertyDevices)
      let devicesLength = devicesSize / UInt32(MemoryLayout<AudioDeviceID>.size)
      var deviceIds: [AudioDeviceID] = Array(repeating: 0, count: Int(devicesLength))

      try CoreAudioData.get(
        selector: kAudioHardwarePropertyDevices,
        initialSize: devicesSize,
        value: &deviceIds
      )

      return deviceIds.compactMap { try? self.init(withId: $0) }
    } catch {
      return []
    }
  }

  static var input: [Self] {
    all.filter { $0.isInput }
  }

  static var output: [Self] {
    all.filter { $0.isOutput }
  }

  static func getDefaultDevice(for deviceType: DeviceType) throws -> Self {
    var deviceId: AudioDeviceID = 0

    try CoreAudioData.get(
      selector: deviceType.selector,
      value: &deviceId
    )

    return try self.init(withId: deviceId)
  }

  static func setDefaultDevice(for deviceType: DeviceType, device: Self) throws {
    if (deviceType.isInput && !device.isInput) || (deviceType.isOutput && !device.isOutput) {
      throw Error.invalidDevice
    }

    var deviceId = device.id

    try CoreAudioData.set(
      selector: deviceType.selector,
      value: &deviceId
    )
  }

  /// This function uses two or more devices to create an aggregate device.
  ///
  /// Usage:
  ///
  ///     createAggregate(
  ///       name: "Aggregate Device Name",
  ///       mainDevice: AudioDevice(withId: 73),
  ///       otherDevices: [AudioDevice(withId: 84)],
  ///       shouldStack: true
  ///     )
  ///
  /// - Parameter name: The name for the device to be created.
  /// - Parameter mainDevice: The main device.
  /// - Parameter otherDevices: The rest of the devices to be combined with the main one.
  /// - Parameter shouldStack: Whether or not it should create a Multi-Output Device.
  ///
  /// - Returns: The newly created device.
  static func createAggregate(
    name: String,
    uid: String = UUID().uuidString,
    mainDevice: Self,
    otherDevices: [Self],
    shouldStack: Bool = false
  ) throws -> Self {
    let allDevices = [mainDevice] + otherDevices

    let deviceList = allDevices.map {
      [
        kAudioSubDeviceUIDKey: $0.uid,
        kAudioSubDeviceDriftCompensationKey: $0.id == mainDevice.id ? 0 : 1
      ]
    }

    let description: [String: Any] = [
      kAudioAggregateDeviceNameKey: name,
      kAudioAggregateDeviceUIDKey: uid,
      kAudioAggregateDeviceSubDeviceListKey: deviceList,
      kAudioAggregateDeviceMasterSubDeviceKey: mainDevice.uid,
      kAudioAggregateDeviceIsStackedKey: shouldStack ? 1 : 0
    ]

    var aggregateDeviceId: AudioDeviceID = 0

    try NSError.checkOSStatus {
      AudioHardwareCreateAggregateDevice(description as CFDictionary, &aggregateDeviceId)
    }

    return try self.init(withId: aggregateDeviceId)
  }

  static func destroyAggregate(device: Self) throws {
    try NSError.checkOSStatus {
      AudioHardwareDestroyAggregateDevice(device.id)
    }
  }
}

private struct CoreAudioData {
  static func get<T>(
    id: UInt32 = AudioObjectID(kAudioObjectSystemObject),
    selector: AudioObjectPropertySelector,
    scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal,
    element: AudioObjectPropertyElement = kAudioObjectPropertyElementMaster,
    initialSize: UInt32 = UInt32(MemoryLayout<T>.size),
    value: UnsafeMutablePointer<T>
  ) throws {
    var size = initialSize
    var address = AudioObjectPropertyAddress(
      mSelector: selector,
      mScope: scope,
      mElement: element
    )

    try NSError.checkOSStatus {
      AudioObjectGetPropertyData(id, &address, 0, nil, &size, value)
    }
  }

  static func set<T>(
    id: UInt32 = AudioObjectID(kAudioObjectSystemObject),
    selector: AudioObjectPropertySelector,
    scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal,
    element: AudioObjectPropertyElement = kAudioObjectPropertyElementMaster,
    value: UnsafeMutablePointer<T>
  ) throws {
    let size = UInt32(MemoryLayout<T>.size)
    var address = AudioObjectPropertyAddress(
      mSelector: selector,
      mScope: scope,
      mElement: element
    )

    try NSError.checkOSStatus {
      AudioObjectSetPropertyData(id, &address, 0, nil, size, value)
    }
  }

  static func has(
    id: UInt32 = AudioObjectID(kAudioObjectSystemObject),
    selector: AudioObjectPropertySelector,
    scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal,
    element: AudioObjectPropertyElement = kAudioObjectPropertyElementMaster
  ) -> Bool {
    var address = AudioObjectPropertyAddress(
      mSelector: selector,
      mScope: scope,
      mElement: element
    )

    return AudioObjectHasProperty(id, &address)
  }

  static func size(
    id: UInt32 = AudioObjectID(kAudioObjectSystemObject),
    selector: AudioObjectPropertySelector,
    scope: AudioObjectPropertyScope = kAudioObjectPropertyScopeGlobal,
    element: AudioObjectPropertyElement = kAudioObjectPropertyElementMaster
  ) throws -> UInt32 {
    var size: UInt32 = 0

    var address = AudioObjectPropertyAddress(
      mSelector: selector,
      mScope: scope,
      mElement: element
    )

    try NSError.checkOSStatus {
      AudioObjectGetPropertyDataSize(id, &address, 0, nil, &size)
    }

    return size
  }
}
