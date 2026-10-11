// Spielhalle-Logo (lila Kachel mit Play-Zeichen) – wird für Icon, Startfenster und Setup gezeichnet
using System.Drawing;
using System.Drawing.Drawing2D;

static class Logo
{
    public static readonly Color Lila1 = Color.FromArgb(0xa5, 0x94, 0xff);
    public static readonly Color Lila2 = Color.FromArgb(0x6a, 0x4c, 0xff);
    public static readonly Color Dunkel = Color.FromArgb(0x12, 0x14, 0x1b);

    public static GraphicsPath RoundRect(RectangleF r, float rad)
    {
        var p = new GraphicsPath();
        float d = rad * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }

    public static void Draw(Graphics g, RectangleF r)
    {
        g.SmoothingMode = SmoothingMode.AntiAlias;
        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
        float s = r.Width / 64f;
        var big = RectangleF.Inflate(r, 1, 1);
        using (var path = RoundRect(r, 16 * s))
        {
            using (var br = new LinearGradientBrush(big, Lila1, Lila2, 45f))
                g.FillPath(br, path);
            // leichter Glanz oben
            if (r.Width >= 32)
            {
                var top = new RectangleF(r.X, r.Y, r.Width, r.Height * 0.5f);
                var oldClip = g.Clip;
                g.SetClip(path);
                using (var gl = new LinearGradientBrush(RectangleF.Inflate(top, 0, 1), Color.FromArgb(60, 255, 255, 255), Color.FromArgb(0, 255, 255, 255), 90f))
                    g.FillRectangle(gl, top);
                g.Clip = oldClip;
            }
        }
        PointF[] tri = { P(r, s, 24, 18), P(r, s, 24, 46), P(r, s, 46, 32) };
        if (r.Width >= 32)
        {
            PointF[] sh = { P(r, s, 25, 20), P(r, s, 25, 48), P(r, s, 47, 34) };
            using (var sb = new SolidBrush(Color.FromArgb(55, 30, 10, 90))) g.FillPolygon(sb, sh);
        }
        using (var wb = new SolidBrush(Color.White)) g.FillPolygon(wb, tri);
    }

    static PointF P(RectangleF r, float s, float x, float y) { return new PointF(r.X + x * s, r.Y + y * s); }
}
