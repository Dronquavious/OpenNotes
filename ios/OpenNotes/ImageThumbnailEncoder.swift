import Foundation
import ImageIO
import UniformTypeIdentifiers

enum ImageThumbnailEncoder {
  enum DecodeError: Error {
    case invalidSource
    case decodeFailed
    case encodeFailed
  }

  /// Produces bounded, orientation-correct preview bytes without modifying the asset.
  static func pngData(at url: URL, maxPixelSize: Int = 1024) throws -> Data {
    guard url.isFileURL, maxPixelSize > 0,
          let source = CGImageSourceCreateWithURL(url as CFURL, nil) else {
      throw DecodeError.invalidSource
    }
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceThumbnailMaxPixelSize: maxPixelSize,
      kCGImageSourceShouldCacheImmediately: true,
    ]
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
      throw DecodeError.decodeFailed
    }
    let data = CFDataCreateMutable(nil, 0)!
    guard let destination = CGImageDestinationCreateWithData(
      data, UTType.png.identifier as CFString, 1, nil
    ) else {
      throw DecodeError.encodeFailed
    }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else { throw DecodeError.encodeFailed }
    return data as Data
  }
}
