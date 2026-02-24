<script lang="ts" context="module">
  export type RuleRow = {
    id: string | number;
    name: string;
    type: string;
    priority: number;
    config_json: string;
    is_active: boolean;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import RowActions from "../RowActions.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";
  import { initShippingRuleConfig } from "../../../lib/admin-shipping-client";
  import { onMount } from "svelte";

  export let rows: RuleRow[] = [];
  const csrfToken = getCsrfToken();

  let configBuilder: (() => unknown) | null = null;

  onMount(() => {
    const form = document.querySelector<HTMLFormElement>("#shipping-rule-form");
    if (form) {
      configBuilder = initShippingRuleConfig(form);
    }
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const config = configBuilder ? configBuilder() : {};
    const payload = {
      ...Object.fromEntries(formData.entries()),
      config,
    };
    const response = await fetch("/api/admin/shipping-rules", {
      method: "POST",
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
  };

  const handleTableClick = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const row = target.closest("tr[data-id]");
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus rule ini?")) return;
      const response = await fetch(`/api/admin/shipping-rules/${id}`, {
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
          cell instanceof HTMLInputElement ||
          cell instanceof HTMLTextAreaElement
        ) {
          fields[field] = String(cell.value);
          return;
        }
        fields[field] = String(cell.textContent?.trim() || "");
      });
      const payload = {
        name: fields.name || "",
        type: fields.type || "",
        priority: Number(fields.priority || 0),
        config: fields.config ? JSON.parse(fields.config) : {},
        is_active: fields.is_active,
      };
      const response = await fetch(`/api/admin/shipping-rules/${id}`, {
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

  let simulateMessage = "";

  const handleSimulation = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const payload = {
      subtotal: Number(data.get("subtotal") || 0),
      province: String(data.get("province") || ""),
      city: String(data.get("city") || ""),
      district: String(data.get("district") || ""),
      free_shipping: String(data.get("free_shipping") || "false") === "true",
    };
    const response = await fetch("/api/admin/shipping-simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      simulateMessage = await response.text();
      return;
    }
    const result = (await response.json()) as { fee: number; rule: string };
    simulateMessage = `Rule: ${result.rule} | Ongkir: Rp ${Number(result.fee).toLocaleString("id-ID")}`;
  };
</script>

<SectionHeader title="Tambah Rule" badge="Ongkir dinamis" />
<CrudInlineForm id="shipping-rule-form" on:submit={handleCreate}>
  <div>
    <label for="name">Nama Rule</label>
    <input id="name" name="name" required />
  </div>
  <div>
    <label for="type">Tipe</label>
    <select id="type" name="type">
      <option value="flat">Flat</option>
      <option value="free_threshold">Free Threshold</option>
      <option value="zone">Zone</option>
    </select>
  </div>
  <div>
    <label for="priority">Prioritas</label>
    <input id="priority" name="priority" type="number" value="100" />
  </div>
  <div id="flat-config">
    <label for="flat_fee">Flat Fee (Rp)</label>
    <input id="flat_fee" name="flat_fee" type="number" value="10000" />
  </div>
  <div id="threshold-config" class="hidden">
    <label for="threshold_amount">Threshold (Rp)</label>
    <input id="threshold_amount" name="threshold_amount" type="number" value="150000" />
    <label for="threshold_fee">Fee jika di bawah threshold (Rp)</label>
    <input id="threshold_fee" name="threshold_fee" type="number" value="10000" />
  </div>
  <div id="zone-config" class="hidden">
    <label for="zone_list">Zone List</label>
    <textarea id="zone_list"
      name="zone_list"
      rows="5"
      placeholder="DI Yogyakarta|Bantul|Sewon|8000\nDI Yogyakarta|Sleman||12000"
    ></textarea>
    <p class="muted">Format: province|city|district|fee, satu baris per zona</p>
  </div>
  <div>
    <label for="config_preview">Config (preview)</label>
    <textarea id="config_preview" name="config_preview" rows="4" readonly></textarea>
  </div>
  <button class="primary" type="submit">Tambah Rule</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Rule" muted="Klik sel untuk edit" />
</div>
<div class="mt-6">
<SectionHeader title="Simulasi Ongkir" badge="Test Rule" />
<CrudInlineForm class="mt-2" on:submit={handleSimulation}>
  <div>
    <label for="subtotal">Subtotal (Rp)</label>
    <input id="subtotal" name="subtotal" type="number" value="150000" />
  </div>
  <div>
    <label for="province">Provinsi</label>
    <input id="province" name="province" value="DI Yogyakarta" />
  </div>
  <div>
    <label for="city">Kota</label>
    <input id="city" name="city" value="Bantul" />
  </div>
  <div>
    <label for="district">Kecamatan</label>
    <input id="district" name="district" value="Sewon" />
  </div>
  <div>
    <label for="free_shipping">Free Shipping</label>
    <select id="free_shipping" name="free_shipping">
      <option value="false">Tidak</option>
      <option value="true">Ya</option>
    </select>
  </div>
  <button class="primary" type="submit">Hitung</button>
  {#if simulateMessage}
    <p class="mt-2 muted">{simulateMessage}</p>
  {/if}
</CrudInlineForm>
</div>
<AdminDataTable class="mt-2" onclick={handleTableClick}>
  <thead>
    <tr>
      <th>Nama</th>
      <th>Tipe</th>
      <th>Prioritas</th>
      <th>Config</th>
      <th>Status</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#each rows as row (row.id)}
      <tr data-id={row.id}>
        <td contenteditable="true" data-field="name">{row.name}</td>
        <td contenteditable="true" data-field="type">{row.type}</td>
        <td contenteditable="true" data-field="priority">{row.priority}</td>
        <td>
          <textarea data-field="config" rows="3">{row.config_json}</textarea>
        </td>
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
