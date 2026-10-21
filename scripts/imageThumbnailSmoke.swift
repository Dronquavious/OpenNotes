import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

@main
struct ImageThumbnailSmoke {
  static func main() throws {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    defer { try? FileManager.default.removeItem(at: directory) }

    let context = CGContext(data: nil, width: 2000, height: 1000,
                            bitsPerComponent: 8, bytesPerRow: 0,
                            space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.setFillColor(CGColor(red: 0, green: 0.7, blue: 0.2, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: 2000, height: 1000))
    let image = context.makeImage()!
    var checked = 0
    for (name, type, orientation) in [
      ("photo.png", UTType.png, 1),
      ("photo.jpg", UTType.jpeg, 6),
      ("photo.heic", UTType.heic, 1),
    ] {
      let url = directory.appendingPathComponent(name)
      let destination = CGImageDestinationCreateWithURL(url as CFURL, type.identifier as CFString, 1, nil)!
      CGImageDestinationAddImage(destination, image, [kCGImagePropertyOrientation: orientation] as CFDictionary)
      precondition(CGImageDestinationFinalize(destination), "Could not create fixture")
      let before = try Data(contentsOf: url)
      let thumbnail = try ImageThumbnailEncoder.pngData(at: url, maxPixelSize: 256)
      let source = CGImageSourceCreateWithData(thumbnail as CFData, nil)!
      precondition(CGImageSourceGetType(source) as String? == UTType.png.identifier)
      let decoded = CGImageSourceCreateImageAtIndex(source, 0, nil)!
      precondition(decoded.width == (orientation == 6 ? 128 : 256), "Wrong thumbnail width")
      precondition(decoded.height == (orientation == 6 ? 256 : 128), "Wrong thumbnail height/orientation")
      var pixel = [UInt8](repeating: 0, count: 4)
      let sample = CGContext(data: &pixel, width: 1, height: 1, bitsPerComponent: 8,
                             bytesPerRow: 4, space: CGColorSpaceCreateDeviceRGB(),
                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
      sample.draw(decoded, in: CGRect(x: 0, y: 0, width: 1, height: 1))
      precondition(pixel[0] < 40 && pixel[1] > 140 && pixel[2] < 100, "Image colors were lost")
      let after = try Data(contentsOf: url)
      precondition(after == before, "Original photo was changed")
      checked += 1
    }
    for url in [directory.appendingPathComponent("missing.heic"), directory.appendingPathComponent("broken.png")] {
      if url.lastPathComponent == "broken.png" { try Data("invalid".utf8).write(to: url) }
      do {
        _ = try ImageThumbnailEncoder.pngData(at: url)
        preconditionFailure("Invalid input should be rejected")
      } catch { checked += 1 }
    }
    do {
      _ = try ImageThumbnailEncoder.pngData(at: URL(string: "https://example.com/image.heic")!)
      preconditionFailure("Remote URLs must not be fetched by the native helper")
    } catch { checked += 1 }
    FileHandle.standardOutput.write(Data("Passed \(checked) native image thumbnail checks (PNG, JPEG orientation, HEIC, missing/corrupt assets).\n".utf8))
  }
}
