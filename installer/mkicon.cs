// Baut spielhalle.ico aus dem gezeichneten Logo (wird nur beim Bauen benutzt)
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;

static class MkIcon
{
    static void Main(string[] args)
    {
        int[] sizes = { 16, 20, 24, 32, 40, 48, 64, 128, 256 };
        var pngs = new List<byte[]>();
        foreach (int s in sizes)
        {
            using (var bmp = new Bitmap(s, s, PixelFormat.Format32bppArgb))
            using (var g = Graphics.FromImage(bmp))
            using (var ms = new MemoryStream())
            {
                g.Clear(Color.Transparent);
                Logo.Draw(g, new RectangleF(0, 0, s, s));
                if (s >= 256) bmp.Save(ms, ImageFormat.Png);
                else WriteDib(bmp, ms);
                pngs.Add(ms.ToArray());
            }
        }
        using (var w = new BinaryWriter(File.Create(args[0])))
        {
            w.Write((short)0); w.Write((short)1); w.Write((short)sizes.Length);
            int offset = 6 + 16 * sizes.Length;
            for (int i = 0; i < sizes.Length; i++)
            {
                w.Write((byte)(sizes[i] >= 256 ? 0 : sizes[i]));
                w.Write((byte)(sizes[i] >= 256 ? 0 : sizes[i]));
                w.Write((byte)0); w.Write((byte)0);
                w.Write((short)1); w.Write((short)32);
                w.Write(pngs[i].Length); w.Write(offset);
                offset += pngs[i].Length;
            }
            foreach (var p in pngs) w.Write(p);
        }
        Console.WriteLine("Icon: " + args[0]);
    }

    // klassisches Icon-Bild: BITMAPINFOHEADER + 32-Bit-Pixel (von unten nach oben) + leere AND-Maske
    static void WriteDib(Bitmap bmp, Stream o)
    {
        int s = bmp.Width;
        var w = new BinaryWriter(o);
        w.Write(40); w.Write(s); w.Write(s * 2); w.Write((short)1); w.Write((short)32);
        w.Write(0); w.Write(0); w.Write(0); w.Write(0); w.Write(0); w.Write(0);
        for (int y = s - 1; y >= 0; y--)
            for (int x = 0; x < s; x++)
            {
                Color c = bmp.GetPixel(x, y);
                w.Write(c.B); w.Write(c.G); w.Write(c.R); w.Write(c.A);
            }
        int maskRow = ((s + 31) / 32) * 4;
        w.Write(new byte[maskRow * s]);
        w.Flush();
    }
}
