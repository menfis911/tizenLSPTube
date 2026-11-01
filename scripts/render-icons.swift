import AppKit
import Foundation
let root = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ".")
func color(_ r: CGFloat,_ g: CGFloat,_ b: CGFloat)->NSColor { NSColor(srgbRed:r/255,green:g/255,blue:b/255,alpha:1) }
func polygon(_ points: [(CGFloat,CGFloat)], _ color:NSColor) { color.setFill();let p=NSBezierPath();p.move(to:NSPoint(x:points[0].0,y:points[0].1));for point in points.dropFirst(){p.line(to:NSPoint(x:point.0,y:point.1))};p.close();p.fill() }
for (name,width,height) in [("icon.png",1024,1024),("icon_16b9.png",1920,1080)] {
 let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:width,pixelsHigh:height,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
 NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:bitmap)
 color(24,33,40).setFill();NSRect(x:0,y:0,width:width,height:height).fill()
 let transform=NSAffineTransform();let scale=CGFloat(height)/1024;transform.translateX(by:(CGFloat(width)-CGFloat(height))/2,yBy:0);transform.scale(by:scale);transform.concat()
 color(244,240,230).setStroke();let ring=NSBezierPath(ovalIn:NSRect(x:238,y:238,width:548,height:548));ring.lineWidth=62;ring.stroke()
 color(255,179,77).setFill();NSBezierPath(ovalIn:NSRect(x:342,y:342,width:340,height:340)).fill()
 color(24,33,40).setFill();NSBezierPath(ovalIn:NSRect(x:414,y:412,width:340,height:340)).fill()
 color(255,179,77).setFill();NSBezierPath(ovalIn:NSRect(x:654,y:658,width:88,height:88)).fill()
 NSGraphicsContext.restoreGraphicsState()
 try bitmap.representation(using:.png,properties:[:])!.write(to:root.appendingPathComponent("assets/"+name))
}
