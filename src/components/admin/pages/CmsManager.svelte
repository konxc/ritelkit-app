<script module lang="ts">
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
  import ToastNotification from "../ToastNotification.svelte";

  let { rows = [] }: { rows: CmsPageRow[] } = $props();

  let pageId = $state("");
  let title = $state("");
  let slug = $state("");
  let contentMd = $state("");
  let isActive = $state("true");

  let csrfToken = "";
  let isSubmitting = $state(false);
  let rowStates = $state<
    Record<
      string,
      { isSaving?: boolean; isDeleting?: boolean; isEditing?: boolean }
    >
  >({});
  let toastRef: ToastNotification;

  onMount(() => {
    csrfToken =
      document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") || "";
  });

  const resetForm = () => {
    pageId = "";
    title = "";
    slug = "";
    contentMd = "";
    isActive = "true";
  };

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    try {
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
        toastRef?.show(await response.text(), "error");
        return;
      }
      toastRef?.show(
        pageId ? "Halaman diperbarui!" : "Halaman dibuat!",
        "success",
      );
      setTimeout(() => location.reload(), 800);
    } catch (err: any) {
      toastRef?.show(err.message || "Gagal menyimpan", "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleClear = () => resetForm();

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
      if (!confirm("Hapus halaman ini?")) return;

      rowStates[id] = { ...rowStates[id], isDeleting: true };

      try {
        const response = await fetch(`/api/admin/cms-pages/${id}`, {
          method: "DELETE",
          headers: { "X-CSRF-Token": csrfToken },
        });
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          rowStates[id] = { ...rowStates[id], isDeleting: false };
          return;
        }
        toastRef?.show("Halaman dihapus", "success");
        setTimeout(() => location.reload(), 800);
      } catch (err: any) {
        toastRef?.show(err.message, "error");
        rowStates[id] = { ...rowStates[id], isDeleting: false };
      }
      return;
    }

    if (action === "edit") {
      rowStates[id] = { ...rowStates[id], isEditing: true };

      try {
        pageId = id;
        title =
          row.querySelector("[data-field='title']")?.textContent?.trim() || "";
        slug =
          row.querySelector("[data-field='slug']")?.textContent?.trim() || "";
        const activeText =
          row.querySelector("[data-field='is_active']")?.textContent?.trim() ||
          "true";
        isActive = activeText === "true" ? "true" : "false";

        const response = await fetch(`/api/admin/cms-pages/${id}`);
        if (!response.ok) {
          toastRef?.show(await response.text(), "error");
          return;
        }
        const data = (await response.json()) as { content_md?: string };
        contentMd = data.content_md || "";

        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err: any) {
        toastRef?.show(err.message, "error");
      } finally {
        rowStates[id] = { ...rowStates[id], isEditing: false };
      }
    }
  };
</script>

<SectionHeader title="Buat Halaman" badge="Brand Awareness" />
<CrudInlineForm id="cms-form" on:submit={handleSubmit} {isSubmitting}>
  <input type="hidden" name="page_id" value={pageId} />
  <div class="space-y-4 border-b border-stone-100 pb-5">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="space-y-1 md:col-span-1">
        <label
          for="title"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Judul</label
        >
        <input
          id="title"
          name="title"
          bind:value={title}
          required
          class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm"
        />
      </div>
      <div class="space-y-1 md:col-span-1">
        <label
          for="slug"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Slug</label
        >
        <input
          id="slug"
          name="slug"
          placeholder="contoh: semesta-bersholawat"
          bind:value={slug}
          required
          class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm"
        />
      </div>
      <div class="space-y-1 md:col-span-1">
        <label
          for="is_active"
          class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
          >Status</label
        >
        <select
          id="is_active"
          name="is_active"
          bind:value={isActive}
          class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-white text-sm appearance-none cursor-pointer"
        >
          <option value="true">Aktif</option>
          <option value="false">Draft</option>
        </select>
      </div>
    </div>
    <div class="space-y-1">
      <label
        for="content_md"
        class="block text-xs font-semibold text-stone-500 uppercase tracking-wider"
        >Konten (Markdown)</label
      >
      <textarea
        id="content_md"
        name="content_md"
        rows="8"
        bind:value={contentMd}
        required
        class="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#c48a3a]/30 focus:border-[#c48a3a] transition-all bg-stone-50 focus:bg-white font-mono text-sm leading-relaxed text-stone-700 placeholder:text-stone-400 min-h-[200px]"
      ></textarea>
    </div>
  </div>
  <div class="mt-4 flex gap-3">
    <ActionGroup>
      <button
        class="flex items-center justify-center gap-2 h-[38px] px-8 rounded-xl bg-stone-900 border border-transparent text-white text-sm font-semibold hover:bg-stone-800 transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto mt-auto"
        type="submit"
        disabled={isSubmitting}
      >
        {#if isSubmitting}
          <svg
            class="animate-spin -ml-1 h-3.5 w-3.5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            ><circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle><path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path></svg
          >
        {/if}
        Simpan
      </button>
      <button
        class="flex items-center justify-center gap-2 h-[38px] px-6 rounded-xl bg-white border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors text-sm"
        type="button"
        onclick={handleClear}>Clear</button
      >
    </ActionGroup>
  </div>
</CrudInlineForm>

<div
  role="button"
  tabindex="0"
  onclick={handleTableClick}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.currentTarget.click();
    }
  }}
>
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
          <td data-field="title">{p.title}</td>
          <td data-field="slug">{p.slug}</td>
          <td data-field="is_active">
            {p.is_active ? "true" : "false"}
          </td>
          <td>{String(p.updated_at).split("T")[0]}</td>
          <td>
            <RowActions
              viewHref={`/content/${p.slug}`}
              showEdit={true}
              isDeleting={rowStates[p.id]?.isDeleting}
              isSaving={rowStates[p.id]?.isEditing}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </AdminDataTable>
</div>

<ToastNotification bind:this={toastRef} />
