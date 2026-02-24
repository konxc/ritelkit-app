<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";

  type CouponRow = {
    id: string | number;
    code: string;
    type: string;
    value: number;
    min_order: number | null;
    max_discount: number | null;
    start_at: string | null;
    end_at: string | null;
    usage_limit: number | null;
    per_user_limit: number | null;
    is_active: boolean;
  };

  let { rows }: { rows: CouponRow[] } = $props();
  const csrfToken = getCsrfToken();

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/coupons", {
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

  const handleRowAction = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus kupon ini?")) return;
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": csrfToken },
      });
      if (!response.ok) {
        alert(await response.text());
        return;
      }
      location.reload();
      return;
    }

    if (action === "save") {
      const fields: Record<string, string> = {};
      row.querySelectorAll("[data-field]").forEach((cell) => {
        const field = cell.getAttribute("data-field");
        if (!field) return;
        if (
          cell instanceof HTMLSelectElement ||
          cell instanceof HTMLInputElement
        ) {
          fields[field] = String(cell.value);
          return;
        }
        fields[field] = String(cell.textContent?.trim() || "");
      });
      const payload = {
        ...fields,
      };
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        alert(await response.text());
        return;
      }
      location.reload();
    }
  };
</script>

<SectionHeader title="Tambah Kupon" muted="Promo & diskon" />
<CrudInlineForm id="coupon-form" on:submit={handleCreate}>
  <div>
    <label for="code">Kode</label>
    <input id="code" name="code" required />
  </div>
  <div>
    <label for="type">Tipe</label>
    <select id="type" name="type">
      <option value="percent">Percent</option>
      <option value="fixed">Fixed</option>
      <option value="free_shipping">Free Shipping</option>
    </select>
  </div>
  <div>
    <label for="value">Nilai</label>
    <input id="value" name="value" type="number" required />
  </div>
  <div>
    <label for="min_order">Min Order</label>
    <input id="min_order" name="min_order" type="number" />
  </div>
  <div>
    <label for="max_discount">Max Diskon</label>
    <input id="max_discount" name="max_discount" type="number" />
  </div>
  <div>
    <label for="start_at">Mulai</label>
    <input id="start_at" name="start_at" type="date" />
  </div>
  <div>
    <label for="end_at">Berakhir</label>
    <input id="end_at" name="end_at" type="date" />
  </div>
  <div>
    <label for="usage_limit">Usage Limit</label>
    <input id="usage_limit" name="usage_limit" type="number" />
  </div>
  <div>
    <label for="per_user_limit">Limit per User</label>
    <input id="per_user_limit" name="per_user_limit" type="number" />
  </div>
  <div>
    <label for="is_active">Aktif</label>
    <select id="is_active" name="is_active">
      <option value="true">Ya</option>
      <option value="false">Tidak</option>
    </select>
  </div>
  <button class="primary" type="submit">Tambah Kupon</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Kupon" muted="Klik sel untuk edit" />
</div>
<div role="button" tabindex="0" onclick={handleRowAction} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Kode</th>
        <th>Tipe</th>
        <th>Nilai</th>
        <th>Min Order</th>
        <th>Max Diskon</th>
        <th>Mulai</th>
        <th>Berakhir</th>
        <th>Limit</th>
        <th>Per User</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td contenteditable="true" data-field="code">{row.code}</td>
          <td contenteditable="true" data-field="type">{row.type}</td>
          <td contenteditable="true" data-field="value">{row.value}</td>
          <td contenteditable="true" data-field="min_order">{row.min_order ?? ""}</td>
          <td contenteditable="true" data-field="max_discount">{row.max_discount ?? ""}</td>
          <td contenteditable="true" data-field="start_at">{row.start_at ?? ""}</td>
          <td contenteditable="true" data-field="end_at">{row.end_at ?? ""}</td>
          <td contenteditable="true" data-field="usage_limit">{row.usage_limit ?? ""}</td>
          <td contenteditable="true" data-field="per_user_limit">{row.per_user_limit ?? ""}</td>
          <td>
            <select data-field="is_active">
              <option value="true" selected={row.is_active}>Aktif</option>
              <option value="false" selected={!row.is_active}>Nonaktif</option>
            </select>
          </td>
          <td>
            <RowActions />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>
