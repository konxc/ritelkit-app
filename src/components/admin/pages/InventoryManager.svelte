<script lang="ts">
  import SectionHeader from "../SectionHeader.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import AdminDataTable from "../AdminDataTable.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  type Product = {
    id: number | string;
    name: string;
    sku: string | null;
    stock: number | null;
    price: number | null;
  };

  type Movement = {
    id: number | string;
    product_name: string | null;
    type: string;
    qty: number;
    ref_order_no: string | null;
    notes: string | null;
    created_at: string;
  };

  export let products: Product[] = [];
  export let movements: Movement[] = [];
  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/inventory-movements", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body: data,
    });
    if (!response.ok) {
      alert(await response.text());
      return;
    }
    location.reload();
  };
  const fieldIds = {
    product: "inventory-product",
    type: "inventory-type",
    qty: "inventory-qty",
    notes: "inventory-notes",
  };
</script>

<SectionHeader title="Tambah Mutasi Stok" badge="Restock & Penyesuaian" />

<CrudInlineForm id="inventory-form" on:submit={handleCreate}>
  <div>
    <label for="product_id">Produk</label>
    <select id={fieldIds.product} name="product_id" required>
      {#each products as product}
        <option value={product.id}>{product.name}</option>
      {/each}
    </select>
  </div>
  <div>
    <label for="type">Tipe</label>
    <select id={fieldIds.type} name="type">
      <option value="in">Stock In</option>
      <option value="out">Stock Out</option>
      <option value="adjustment">Adjustment</option>
    </select>
  </div>
  <div>
    <label for="qty">Qty</label>
    <input id={fieldIds.qty} name="qty" type="number" required />
  </div>
  <div>
    <label for="notes">Catatan</label>
    <input id={fieldIds.notes} name="notes" placeholder="Opsional" />
  </div>
  <button class="primary" type="submit">Simpan</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Stok Produk" muted="Klik sel untuk edit" />
</div>
<AdminDataTable>
  <thead>
    <tr>
      <th>Produk</th>
      <th>SKU</th>
      <th>Stok</th>
      <th>Harga</th>
    </tr>
  </thead>
  <tbody>
    {#each products as product}
      <tr>
        <td>{product.name}</td>
        <td>{product.sku || "-"}</td>
        <td>{product.stock ?? "-"}</td>
        <td>Rp {Number(product.price ?? 0).toLocaleString("id-ID")}</td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>

<div class="mt-6">
  <SectionHeader title="Mutasi Terakhir" muted="30 entri terakhir" />
</div>
<AdminDataTable>
  <thead>
    <tr>
      <th>Produk</th>
      <th>Tipe</th>
      <th>Qty</th>
      <th>Order Ref</th>
      <th>Catatan</th>
      <th>Tanggal</th>
    </tr>
  </thead>
  <tbody>
    {#each movements as movement}
      <tr>
        <td>{movement.product_name || "-"}</td>
        <td>{movement.type}</td>
        <td>{movement.qty}</td>
        <td>{movement.ref_order_no || "-"}</td>
        <td>{movement.notes || "-"}</td>
        <td>{String(movement.created_at).split("T")[0]}</td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>
