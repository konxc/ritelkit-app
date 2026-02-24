<script lang="ts" context="module">
  export type ProductRow = {
    id: string | number;
    name: string;
    sku?: string | null;
    price: number;
    stock: number;
    category_id?: string | null;
    category_name?: string | null;
    is_active: boolean;
    images_json?: string;
  };

  export type CategoryOption = {
    id: string | number;
    name: string;
  };
</script>

<script lang="ts">
  import AdminDataTable from "../AdminDataTable.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import { getCsrfToken } from "../../../lib/admin-client";
  import {
    attachDrop,
    parseUrls,
    renderGallery,
    uploadFiles,
  } from "../../../lib/admin-product-client";

  export let rows: ProductRow[] = [];
  export let categories: CategoryOption[] = [];
  const csrfToken = getCsrfToken();

  const productFormHandler = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const response = await fetch("/api/admin/products", {
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

  const handleRowClick = async (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    if (!action) return;
    const rowEl = target.closest("tr[data-id]");
    if (!rowEl) return;
    const id = rowEl.getAttribute("data-id");
    if (!id) return;

    if (action === "delete") {
      if (!confirm("Hapus produk ini?")) return;
      const response = await fetch(`/api/admin/products/${id}`, {
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
      const payload: Record<string, unknown> = {};
      rowEl.querySelectorAll("[data-field]").forEach((cell) => {
        const field = cell.getAttribute("data-field");
        if (!field) return;
        if (
          cell instanceof HTMLSelectElement ||
          cell instanceof HTMLInputElement
        ) {
          payload[field] = cell.value;
          return;
        }
        if (field === "images_json") {
          payload[field] = JSON.parse(cell.getAttribute("data-value") || "[]");
          return;
        }
        payload[field] = cell.textContent?.trim() || "";
      });
      const response = await fetch(`/api/admin/products/${id}`, {
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

  const updateGallery = (input: HTMLInputElement, container: HTMLElement) => {
    const urls = parseUrls(input.value);
    renderGallery(container, urls, (next) => {
      input.value = next.join(",");
      updateGallery(input, container);
    });
  };

  const attachGalleryHandlers = (input: HTMLInputElement) => {
    const container = document.querySelector<HTMLDivElement>(
      `[data-gallery-input=${input.id}]`,
    );
    if (!container) return;
    const update = (next: string[]) => {
      input.value = next.join(",");
      renderGallery(container, next, update);
    };
    const initial = parseUrls(input.value);
    update(initial);
    attachDrop(container, async (files) => {
      const urls = await uploadFiles(files, csrfToken);
      const current = parseUrls(input.value);
      input.value = [...current, ...urls].join(",");
      update(parseUrls(input.value));
    });
  };

  const setupGallery = () => {
    const input = document.querySelector<HTMLInputElement>("#new-image-urls");
    const container = document.querySelector<HTMLElement>("#new-gallery");
    if (!input || !container) return;
    attachDrop(container, async (files) => {
      const urls = await uploadFiles(files, csrfToken);
      const current = parseUrls(input.value);
      input.value = [...current, ...urls].join(",");
      updateGallery(input, container);
    });
  };

  $: if (typeof window !== "undefined") {
    setupGallery();
  }
</script>

<SectionHeader title="Tambah Produk" badge="E-commerce Ready" />
<CrudInlineForm id="product-form" on:submit={productFormHandler}>
  <div class="grid grid-2">
    <div>
      <label for="name">Nama Produk</label>
      <input id="name" name="name" required />
    </div>
    <div>
      <label for="sku">SKU (Opsional)</label>
      <input id="sku" name="sku" />
    </div>
    <div>
      <label for="category_id">Kategori</label>
      <select id="category_id" name="category_id">
        <option value="">Pilih Kategori</option>
        {#each categories as cat}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="is_active">Status</label>
      <select id="is_active" name="is_active">
        <option value="true">Aktif</option>
        <option value="false">Draf</option>
      </select>
    </div>
    <div>
      <label for="price">Harga (Rp)</label>
      <input id="price" name="price" type="number" value="0" required />
    </div>
    <div>
      <label for="stock">Stok</label>
      <input
        id="stock"
        name="stock"
        type="number"
        placeholder="Bisa dikosongkan"
      />
    </div>
  </div>
  <div class="mt-3">
    <label for="description">Deskripsi</label>
    <textarea id="description" name="description" rows="3"></textarea>
  </div>
  <div class="field mt-3">
    <label for="file-input">Gambar Produk</label>
    <div class="upload-zone" id="upload-zone">
      <input
        type="file"
        id="file-input"
        multiple
        accept="image/*"
        class="hidden"
      />
      <div class="upload-placeholder">
        <span>Drag & drop gambar atau klik untuk upload</span>
        <p class="muted">Urutan gambar pertama = Foto Utama</p>
      </div>
    </div>
    <div
      id="new-gallery"
      class="thumbnail-gallery"
      data-has="false"
      data-gallery-input="new-image-urls"
    ></div>
    <div id="upload-status" class="muted mt-1.5"></div>
    <input type="hidden" name="image_urls" id="new-image-urls" />
  </div>
  <button class="primary mt-5" type="submit">Tambah Produk</button>
</CrudInlineForm>

<div class="mt-6">
  <SectionHeader title="Daftar Produk" muted="Klik sel untuk edit" />
</div>
<div
  class="mt-2"
  role="button"
  tabindex="0"
  on:click={handleRowClick}
  on:keydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  }}
>
  <AdminDataTable>
    <thead>
      <tr>
        <th>Foto</th>
        <th>Nama</th>
        <th>Kategori</th>
        <th>Harga</th>
        <th>Stok</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.id)}
        <tr data-id={row.id}>
          <td>
            <div
              class="edit-gallery thumbnail-gallery"
              data-field="images_json"
              data-value={row.images_json || "[]"}
            ></div>
          </td>
          <td>
            <div contenteditable="true" data-field="name">{row.name}</div>
            <div class="muted text-[0.8em]">
              SKU:
              <span contenteditable="true" data-field="sku"
                >{row.sku || "-"}</span
              >
            </div>
          </td>
          <td>
            <select data-field="category_id">
              <option value="">Tanpa Kategori</option>
              {#each categories as cat}
                <option value={cat.id} selected={cat.id === row.category_id}>
                  {cat.name}
                </option>
              {/each}
            </select>
          </td>
          <td contenteditable="true" data-field="price">{row.price}</td>
          <td contenteditable="true" data-field="stock">{row.stock}</td>
          <td>
            <select data-field="is_active">
              <option value="true" selected={row.is_active}>Aktif</option>
              <option value="false" selected={!row.is_active}>Draf</option>
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
