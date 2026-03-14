import type { APIContext } from "astro";
import { requireAdmin } from "@/lib/auth";
import { getDb, initDb } from "@/lib/db";
import { isCloudflare, isNodeLike } from "@/lib/runtime";

export async function GET(ctx: APIContext) {
  await initDb(ctx);
  const admin = await requireAdmin(ctx);
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const invoiceNo = ctx.params.invoice_no;
  if (!invoiceNo) return new Response("Invalid invoice", { status: 400 });

  const db = getDb(ctx);
  const result = await db.execute({
    sql: `SELECT i.*, o.order_no, o.customer_name, o.customer_phone, o.total, o.items_json, o.shipping_address_json
              FROM invoices i JOIN orders o ON o.id = i.order_id
              WHERE i.invoice_no = ?`,
    args: [invoiceNo],
  });
  const invoice = result.rows[0] as any;
  if (!invoice) return new Response("Invoice not found", { status: 404 });

  if (isCloudflare(ctx) || !isNodeLike()) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/invoice/${invoice.invoice_no}`,
      },
    });
  }

  const items = JSON.parse(String(invoice.items_json || "[]"));
  const address = JSON.parse(String(invoice.shipping_address_json || "{}"));

  const { default: PDFDocument } = await import("pdfkit");
  const doc = new PDFDocument({ margin: 40 });
  const chunks: Uint8Array[] = [];
  doc.on("data", (chunk: any) => chunks.push(chunk));

  doc.fontSize(18).text("Roti Sholawat", { align: "left" });
  doc.fontSize(11).text("Semesta Bersholawat", { align: "left" });
  doc.moveDown();

  doc.fontSize(12).text(`Faktur: ${invoice.invoice_no}`);
  doc.text(`Pesanan: ${invoice.order_no}`);
  doc.text(`Tanggal: ${String(invoice.issued_at).split("T")[0]}`);
  doc.moveDown();

  doc.fontSize(12).text("Pelanggan");
  doc.fontSize(11).text(invoice.customer_name || "-");
  doc.text(invoice.customer_phone || "-");
  doc.moveDown();

  doc.fontSize(12).text("Alamat");
  doc.fontSize(11).text(`${address.province || ""} ${address.city || ""} ${address.district || ""}`.trim());
  doc.text(address.street || "");
  doc.moveDown();

  doc.fontSize(12).text("Item");
  doc.moveDown(0.5);
  items.forEach((item: any) => {
    doc.fontSize(11).text(`${item.name} x${item.qty} - Rp ${Number(item.total).toLocaleString("id-ID")}`);
  });
  doc.moveDown();
  doc.fontSize(12).text(`Total: Rp ${Number(invoice.total).toLocaleString("id-ID")}`, {
    align: "right",
  });

  doc.end();

  const buffer = await new Promise<Uint8Array>((resolve) => {
    doc.on("end", () => {
      const size = chunks.reduce((sum, c) => sum + c.length, 0);
      const merged = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      resolve(merged);
    });
  });

  return new Response(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_no}.pdf"`,
    },
  });
}
