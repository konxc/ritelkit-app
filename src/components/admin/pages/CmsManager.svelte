<script lang="ts" context="module">
  export type CmsPageRow = {
    id: string;
    slug: string;
    title: string;
    is_active: boolean;
    updated_at: string | Date;
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import AdminDataTable from "../AdminDataTable.svelte";
  import RowActions from "../RowActions.svelte";
  import ActionGroup from "../ActionGroup.svelte";
  import { bindCrudTable, getCsrfToken, readError } from "../../../lib/admin-client";

  export let rows: CmsPageRow[] = [];

  let pageId = "";
  let title = "";
  let slug = "";
  let contentMd = "";
  let isActive = "true";
  const csrfToken = getCsrfToken();

  const resetForm = () => {
    pageId = "";
    title = "";
    slug = "";
    contentMd = "";
    isActive = "true";
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const payload = {
      title,
      slug,
      content_md: contentMd,
      is_active: isActive === "true",
    };
    const endpoint = pageId
      ? `/api/admin/cms-pages/${pageId}`
      : "/api/admin/cms-pages";
    const method = pageId ? "PUT" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      alert(await readError(response));
      return;
    }
    location.reload();
  };

  const handleClear = () => resetForm();

  const fillFormFromRow = (id: string, row: Element, md?: string) => {
    pageId = id;
    title = row.querySelector("[data-field='title']")?.textContent?.trim() || "";
    slug = row.querySelector("[data-field='slug']")?.textContent?.trim() || "";
    const activeText =
      row.querySelector("[data-field='is_active']")?.textContent?.trim() || "true";
    isActive = activeText;
    if (md !== undefined) {
      contentMd = md;
    }
  };

  onMount(() => {
    bindCrudTable({
      basePath: "/api/admin/cms-pages",
      deleteConfirm: "Hapus halaman ini?",
      extraActions: {
        edit: async ({ id, row }) => {
          fillFormFromRow(id, row);
          const response = await fetch(`/api/admin/cms-pages/${id}`);
          if (!response.ok) {
            alert(await readError(response));
            return;
          }
          const data = (await response.json()) as { content_md?: string };
          contentMd = data.content_md || "";
        },
      },
      mapFields: (fields) => ({
        ...fields,
        content_md: contentMd,
      }),
    });
  });
</script>

<SectionHeader title="Buat Halaman" badge="Brand Awareness" />
<CrudInlineForm id="cms-form" on:submit={handleSubmit}>
  <input type="hidden" name="page_id" value={pageId} />
  <div>
    <label for="title">Judul</label>
    <input id="title" name="title" bind:value={title} required />
  </div>
  <div>
    <label for="slug">Slug</label>
    <input id="slug"
      name="slug"
      placeholder="contoh: semesta-bersholawat"
      bind:value={slug}
      required
    />
  </div>
  <div>
    <label for="content_md">Konten (Markdown)</label>
    <textarea id="content_md" name="content_md" rows="6" bind:value={contentMd} required></textarea>
  </div>
  <div>
    <label for="is_active">Status</label>
    <select id="is_active" name="is_active" bind:value={isActive}>
      <option value="true">Aktif</option>
      <option value="false">Draft</option>
    </select>
  </div>
  <ActionGroup>
    <button class="primary" type="submit">Simpan</button>
    <button class="btn-ghost" type="button" on:click={handleClear}>Clear</button>
  </ActionGroup>
</CrudInlineForm>

<AdminDataTable class="mt-6">
  <thead>
    <tr>
      <th>Judul</th>
      <th>Slug</th>
      <th>Status</th>
      <th>Update</th>
      <th>Aksi</th>
    </tr>
  </thead>
  <tbody>
    {#each rows as p}
      <tr data-id={p.id}>
        <td contenteditable="true" data-field="title">{p.title}</td>
        <td contenteditable="true" data-field="slug">{p.slug}</td>
        <td contenteditable="true" data-field="is_active">
          {p.is_active ? "true" : "false"}
        </td>
        <td>{String(p.updated_at).split("T")[0]}</td>
        <td>
          <RowActions
            viewHref={`/content/${p.slug}`}
            showEdit={true}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</AdminDataTable>
