<script lang="ts">
  import { actions } from "astro:actions";
  import { fade, fly } from "svelte/transition";
  import type { AdminUser } from "../../../lib/types";
  import CrudInlineForm from "../CrudInlineForm.svelte";
  import RowActions from "../RowActions.svelte";
  import SectionHeader from "../SectionHeader.svelte";
  import ToastNotification from "../ToastNotification.svelte";
  import Table from "../ui/Table.svelte";
  import TableRow from "../ui/TableRow.svelte";
  import TableCell from "../ui/TableCell.svelte";
  import Button from "../ui/Button.svelte";
  import TextInput from "../ui/forms/TextInput.svelte";
  import SelectInput from "../ui/forms/SelectInput.svelte";
  import { t } from "../../../lib/i18n/store.svelte";
  import { onMount } from "svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import ColumnVisibilityToggle from "../ui/ColumnVisibilityToggle.svelte";
  import Fab from "../ui/Fab.svelte";
  import Drawer from "../ui/overlay/Drawer.svelte";

  let {
    rows: initialRows = [],
    q = "",
  }: {
    rows?: AdminUser[];
    q?: string;
  } = $props();

  let columns = $state([
    { id: "email", label: t("system_admin.admin_users.email"), isVisible: true },
    { id: "role", label: t("system_admin.admin_users.role"), isVisible: true },
    { id: "password", label: t("system_admin.admin_users.password"), isVisible: true },
  ]);

  let activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);

  let toastRef = $state<ToastNotification>();
  let rows = $state<AdminUser[]>([]);
  let isSubmitting = $state(false);
  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);
  let isDrawerOpen = $state(false);

  // Sync with initialRows from SSR
  $effect(() => {
    rows = initialRows;
  });

  const refreshData = async () => {
    const { data, error } = await actions.listAdminUsers({ q });
    if (!error && data) {
      rows = data as AdminUser[];
    }
  };

  const syncFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    q = params.get("q") || "";
  };

  onMount(() => {
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  });

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement | null;
    if (!form) return;
    const formData = new FormData(form);
    const data = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      role: String(formData.get("role") || "admin") as "owner" | "admin" | "editor",
    };

    isSubmitting = true;
    const { error } = await actions.createAdminUser(data);
    isSubmitting = false;

    if (error) {
      toastRef?.show(error.message, "error");
    } else {
      toastRef?.show(t("system_admin.admin_users.toast_add"), "success");
      await refreshData();
      form.reset();
      isDrawerOpen = false;
    }
  };

  const handleRowAction = async (id: string, action: string, rowEl: HTMLElement | null) => {
    if (action === "delete") {
      if (!confirm(t("system_admin.admin_users.confirm_delete"))) return;
      deletingId = id;
      const { error } = await actions.deleteAdminUser(id);
      deletingId = null;
      if (error) {
        toastRef?.show(error.message, "error");
      } else {
        toastRef?.show(t("system_admin.admin_users.toast_delete"), "success");
        await refreshData();
      }
      return;
    }

    if (action === "save" && rowEl) {
      const roleSelect = rowEl.querySelector("[data-field='role'] select") as HTMLSelectElement | null;
      const role = roleSelect?.value || "";
      const passwordInput = rowEl.querySelector("[data-field='password'] input") as HTMLInputElement | null;
      const password = passwordInput?.value || "";

      savingId = id;
      const { error } = await actions.updateAdminUser({
        id,
        data: {
          role: role as "owner" | "admin" | "editor",
          password: password || undefined,
        },
      });
      savingId = null;

      if (error) {
        toastRef?.show(error.message, "error");
      } else {
        toastRef?.show(t("system_admin.admin_users.toast_update"), "success");
        if (passwordInput) passwordInput.value = "";
        await refreshData();
      }
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader title={t("system_admin.admin_users.title_list")} muted={t("system_admin.admin_users.subtitle_list")} />
      
      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <div class="mr-2">
          <AdminHeaderFilters tab="admins" {q} {columns} />
        </div>

        <ColumnVisibilityToggle bind:columns />

        <div class="h-10 w-px bg-stone-200/80"></div>

        <Button variant="primary" onclick={() => (isDrawerOpen = true)} class="group flex items-center gap-2">
          <div class="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
            {t("system_admin.admin_users.title_add")}
          </div>
        </Button>
      </div>
    </div>

    <Fab onclick={() => (isDrawerOpen = true)} label={t("system_admin.admin_users.title_add")} />

    {#snippet userIcon()}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
    {/snippet}

    {#snippet drawerFooter()}
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="h-11 flex-1 rounded-2xl border border-stone-200 bg-white text-[0.7rem] font-black tracking-widest text-stone-400 uppercase transition-all hover:bg-stone-50 hover:text-stone-600 focus:outline-none active:scale-95 lg:h-[52px]"
          onclick={() => (isDrawerOpen = false)}
        >
          {t("common.cancel")}
        </button>
        <Button
          type="submit"
          form="user-form"
          variant="primary"
          class="relative flex h-11 flex-[2] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#c48a3a] px-8 py-0 font-black text-white shadow-[0_10px_30px_-10px_rgba(196,138,58,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_35px_-10px_rgba(196,138,58,0.6)] active:scale-[0.98] lg:h-[52px]"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <div class="flex items-center gap-3">
              <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span class="text-xs">{t("common.saving")}</span>
            </div>
          {:else}
            <div class="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>
              <span class="text-[0.75rem] tracking-tight uppercase">{t("system_admin.admin_users.add_admin")}</span>
            </div>
          {/if}
        </Button>
      </div>
    {/snippet}

    <Drawer
      bind:isOpen={isDrawerOpen}
      title={t("system_admin.admin_users.title_add")}
      subtitle={t("system_admin.admin_users.role")}
      icon={userIcon}
      footer={drawerFooter}
      maxWidth="md"
    >
      <div class="px-5 py-6 lg:px-7 lg:py-8">
        <CrudInlineForm id="user-form" onsubmit={handleCreate} {isSubmitting}>
          <div class="space-y-6">
            <TextInput id="email" name="email" type="email" label={t("system_admin.admin_users.email")} required />
            <TextInput
              id="password"
              name="password"
              type="password"
              label={t("system_admin.admin_users.password")}
              required
              minlength={8}
            />
            <SelectInput
              id="role"
              name="role"
              label={t("system_admin.admin_users.role")}
              options={[
                { value: "owner", label: t("system_admin.admin_users.roles.owner") },
                { value: "admin", label: t("system_admin.admin_users.roles.admin") },
                { value: "editor", label: t("system_admin.admin_users.roles.editor") },
              ]}
            />
          </div>
        </CrudInlineForm>
      </div>
    </Drawer>

    <div class="mt-2">
      <Table headers={activeHeaders}>
        {#if rows.length === 0}
          <TableEmptyState
            title={t("system_admin.admin_users.empty")}
            subtitle=""
            colspan={activeHeaders.length}
          />
        {/if}
        {#each rows as row (row.id)}
          <TableRow data-id={row.id} class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50">
            {#if columns[0].isVisible}
              <TableCell class="py-4">
                <div class="px-3 py-1.5 font-bold text-stone-900 line-clamp-1">
                  {row.email}
                </div>
              </TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4">
                <div data-field="role" class="w-full">
                  <select
                    class="w-full cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm font-bold text-stone-700 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
                  >
                    <option value="owner" selected={row.role === "owner"}>{t("system_admin.admin_users.roles.owner")}</option>
                    <option value="admin" selected={row.role === "admin"}>{t("system_admin.admin_users.roles.admin")}</option>
                    <option value="editor" selected={row.role === "editor"}>{t("system_admin.admin_users.roles.editor")}</option>
                  </select>
                </div>
              </TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4">
                <div data-field="password" class="w-full">
                  <input
                    type="password"
                    placeholder={t("system_admin.admin_users.password_placeholder")}
                    class="w-full rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
                  />
                </div>
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <div class="flex items-center justify-center">
                <RowActions
                  isSaving={savingId === row.id}
                  isDeleting={deletingId === row.id}
                  onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr")!)}
                  onDelete={() => handleRowAction(row.id, "delete", null)}
                />
              </div>
            </TableCell>
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
