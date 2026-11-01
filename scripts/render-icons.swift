import AppKit
import Foundation
let root = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ".")
func color(_ r: CGFloat,_ g: CGFloat,_ b: CGFloat)->NSColor { NSColor(srgbRed:r/255,green:g/255,blue:b/255,alpha:1) }
func polygon(_ points: [(CGFloat,CGFloat)], _ color:NSColor) { color.setFill();let p=NSBezierPath();p.move(to:NSPoint(x:points[0].0,y:points[0].1));for point in points.dropFirst(){p.line(to:NSPoint(x:point.0,y:point.1))};p.close();p.fill() }
for (name,width,height) in [("icon.png",1024,1024),("icon_16b9.png",1920,1080)] {
 let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:width,pixelsHigh:height,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
 NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:bitmap)
 color(16,41,47).setFill();NSRect(x:0,y:0,width:width,height:height).fill()
 let transform=NSAffineTransform();let scale=CGFloat(height)/1024;transform.translateX(by:(CGFloat(width)-CGFloat(height))/2,yBy:0);transform.scale(by:scale);transform.concat()
 polygon([(256,744),(384,744),(384,408),(640,408),(640,280),(256,280)],color(98,226,206))
 polygon([(460,744),(460,472),(760,608)],color(98,226,206))
 polygon([(512,668),(512,548),(644,608)],color(16,41,47))
 NSGraphicsContext.restoreGraphicsState()
 try bitmap.representation(using:.png,properties:[:])!.write(to:root.appendingPathComponent("assets/"+name))
}
