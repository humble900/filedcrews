/**
 * make-icons.mjs
 * Converts the new Ocrem logo PNG into:
 *  1. public/favicon.ico  (multi-resolution ICO)
 *  2. public/og-image.png (1200×630 dark branded OG card)
 *
 * Uses ONLY Node.js built-ins — no npm installs needed.
 * ICO format: 16×16, 32×32, 48×48 embedded as raw BGRA bitmaps.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createCanvas, loadImage } from "canvas";

const SRC = "C:/Users/USER/.gemini/antigravity-ide/brain/395c5158-7511-478c-998c-44fb412e2f30/ocrem_logo_icon_1781180399428.png";
const FAVICON_ICO = "public/favicon.ico";
const FAVICON_PNG = "public/favicon.png";
const OG_IMAGE   = "public/og-image.png";

async function main() {
  const logo = await loadImage(SRC);

  // ─── 1. favicon.png (already done via Copy-Item, but redo at 512px) ───
  {
    const c = createCanvas(512, 512);
    const ctx = c.getContext("2d");
    ctx.drawImage(logo, 0, 0, 512, 512);
    writeFileSync(FAVICON_PNG, c.toBuffer("image/png"));
    console.log("✓ favicon.png written (512×512)");
  }

  // ─── 2. favicon.ico (16, 32, 48) ────────────────────────────────────────
  {
    const sizes = [16, 32, 48];
    const bitmaps = sizes.map(sz => {
      const c = createCanvas(sz, sz);
      const ctx = c.getContext("2d");
      // Round corners via clip
      ctx.beginPath();
      const r = sz * 0.2;
      ctx.moveTo(r, 0); ctx.lineTo(sz - r, 0); ctx.arcTo(sz, 0, sz, r, r);
      ctx.lineTo(sz, sz - r); ctx.arcTo(sz, sz, sz - r, sz, r);
      ctx.lineTo(r, sz); ctx.arcTo(0, sz, 0, sz - r, r);
      ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath(); ctx.clip();
      ctx.drawImage(logo, 0, 0, sz, sz);
      const imgData = ctx.getImageData(0, 0, sz, sz);
      // Convert RGBA → BGRA for ICO
      const bgra = Buffer.alloc(sz * sz * 4);
      for (let i = 0; i < sz * sz; i++) {
        bgra[i*4+0] = imgData.data[i*4+2]; // B
        bgra[i*4+1] = imgData.data[i*4+1]; // G
        bgra[i*4+2] = imgData.data[i*4+0]; // R
        bgra[i*4+3] = imgData.data[i*4+3]; // A
      }
      return { sz, bgra };
    });

    // ICO header + directory
    const N = bitmaps.length;
    const headerSz = 6 + N * 16;
    let offset = headerSz;
    const parts = [];
    for (const { sz, bgra } of bitmaps) {
      // BITMAPINFOHEADER (40 bytes) + XOR mask + AND mask
      const xorSz = sz * sz * 4;
      const andRowSz = Math.ceil(sz / 32) * 4;
      const andSz = andRowSz * sz;
      const dibSz = 40 + xorSz + andSz;
      const dib = Buffer.alloc(dibSz);
      dib.writeUInt32LE(40, 0);          // biSize
      dib.writeInt32LE(sz, 4);           // biWidth
      dib.writeInt32LE(sz * 2, 8);       // biHeight (×2 for AND mask)
      dib.writeUInt16LE(1, 12);          // biPlanes
      dib.writeUInt16LE(32, 14);         // biBitCount
      dib.writeUInt32LE(0, 16);          // biCompression BI_RGB
      dib.writeUInt32LE(xorSz, 20);     // biSizeImage
      // Copy BGRA rows bottom-up
      for (let y = 0; y < sz; y++) {
        const srcRow = (sz - 1 - y) * sz * 4;
        bgra.copy(dib, 40 + y * sz * 4, srcRow, srcRow + sz * 4);
      }
      // AND mask: all zeros (fully opaque via alpha channel)
      parts.push({ sz, dib, dibSz });
      offset += dibSz;
    }

    const header = Buffer.alloc(6 + N * 16);
    header.writeUInt16LE(0, 0);   // reserved
    header.writeUInt16LE(1, 2);   // type: ICO
    header.writeUInt16LE(N, 4);   // count
    let dirOffset = headerSz;
    let dataOffset = headerSz;
    for (let i = 0; i < parts.length; i++) {
      const { sz, dibSz } = parts[i];
      const base = 6 + i * 16;
      header.writeUInt8(sz === 256 ? 0 : sz, base+0);  // width
      header.writeUInt8(sz === 256 ? 0 : sz, base+1);  // height
      header.writeUInt8(0, base+2);   // colour count
      header.writeUInt8(0, base+3);   // reserved
      header.writeUInt16LE(1, base+4);  // planes
      header.writeUInt16LE(32, base+6); // bit count
      header.writeUInt32LE(dibSz, base+8);
      header.writeUInt32LE(dataOffset, base+12);
      dataOffset += dibSz;
    }
    const icoData = Buffer.concat([header, ...parts.map(p => p.dib)]);
    writeFileSync(FAVICON_ICO, icoData);
    console.log("✓ favicon.ico written (16×16, 32×32, 48×48)");
  }

  // ─── 3. og-image.png (1200×630 branded card) ──────────────────────────
  {
    const W = 1200, H = 630;
    const c = createCanvas(W, H);
    const ctx = c.getContext("2d");

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e293b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Glow behind icon
    const glow = ctx.createRadialGradient(260, H/2, 0, 260, H/2, 280);
    glow.addColorStop(0, "rgba(59,130,246,0.25)");
    glow.addColorStop(1, "rgba(59,130,246,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Icon (240×240, vertically centred, left-ish)
    const iconSz = 240;
    const iconX = 80, iconY = (H - iconSz) / 2;
    // Rounded rect clip
    const r = iconSz * 0.18;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(iconX + r, iconY);
    ctx.lineTo(iconX + iconSz - r, iconY); ctx.arcTo(iconX+iconSz, iconY, iconX+iconSz, iconY+r, r);
    ctx.lineTo(iconX + iconSz, iconY + iconSz - r); ctx.arcTo(iconX+iconSz, iconY+iconSz, iconX+iconSz-r, iconY+iconSz, r);
    ctx.lineTo(iconX + r, iconY + iconSz); ctx.arcTo(iconX, iconY+iconSz, iconX, iconY+iconSz-r, r);
    ctx.lineTo(iconX, iconY + r); ctx.arcTo(iconX, iconY, iconX+r, iconY, r);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(logo, iconX, iconY, iconSz, iconSz);
    ctx.restore();

    // Divider line
    ctx.strokeStyle = "rgba(59,130,246,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(iconX + iconSz + 60, 80);
    ctx.lineTo(iconX + iconSz + 60, H - 80);
    ctx.stroke();

    // Text block
    const textX = iconX + iconSz + 90;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 68px sans-serif";
    ctx.fillText("OnSite Crew", textX, H/2 - 30);
    ctx.fillText("Manager", textX, H/2 + 55);

    // Subtitle
    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px sans-serif";
    ctx.fillText("Real-time GPS · Geofencing · Face Verification", textX, H/2 + 110);

    // Tag
    ctx.fillStyle = "rgba(59,130,246,0.15)";
    ctx.beginPath();
    ctx.roundRect(textX, H/2 + 140, 160, 38, 20);
    ctx.fill();
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Ocrem", textX + 44, H/2 + 166);

    writeFileSync(OG_IMAGE, c.toBuffer("image/png"));
    console.log("✓ og-image.png written (1200×630)");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
