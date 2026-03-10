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
  import { t, initI18n } from "../../../lib/i18n/store.svelte";
  import { onMount } from "svelte";

  let { rows: initialRows = [] }: { rows?: AdminUser[] } = $props();

  let toastRef = $state<ToastNotification>();
  let rows = $state<AdminUser[]>([]);
  let isSubmitting = $state(false);
  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  // Sync with initialRows from SSR
  $effect(() => {
    rows = initialRows;
  });

  const refreshData = async () => {
    const { data, error } = await actions.listAdminUsers({});
    if (!error && data) {
      rows = data as AdminUser[];
    }
  };

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
      const role = String(rowEl.querySelector("[data-field='role']")?.textContent?.trim() || "");
      const password = String((rowEl.querySelector("[data-field='password']") as HTMLInputElement | null)?.value || "");

      savingId = id;
      // Standardized updateAdminUser in index.ts
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
        await refreshData();
      }
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title={t("system_admin.admin_users.title_add")} badge={t("system_admin.admin_users.role")} />
    <CrudInlineForm id="user-form" onsubmit={handleCreate} {isSubmitting}>
      <div class="mb-8 flex w-full flex-col flex-wrap items-end gap-4 border-b border-stone-100 pb-8 md:flex-row">
        <div class="w-full md:w-64">
          <TextInput id="email" name="email" type="email" label={t("system_admin.admin_users.email")} required />
        </div>
        <div class="w-full md:w-64">
          <TextInput
            id="password"
            name="password"
            type="password"
            label={t("system_admin.admin_users.password")}
            required
            minlength={8}
          />
        </div>
        <div class="w-full md:w-48">
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
        <Button variant="primary" type="submit" class="h-[42px] w-full px-8 md:w-auto" disabled={isSubmitting}>
          {#if isSubmitting}
            <svg
              class="mr-2 -ml-1 inline-block h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              ><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path></svg
            >
          {/if}
          {t("system_admin.admin_users.add_admin")}
        </Button>
      </div>
    </CrudInlineForm>

    <div class="mt-6">
      <SectionHeader
        title={t("system_admin.admin_users.title_list")}
        muted={t("system_admin.admin_users.subtitle_list")}
      />
    </div>
    <div class="mt-2">
      <Table
        headers={[
          t("system_admin.admin_users.email"),
          t("system_admin.admin_users.role"),
          t("system_admin.admin_users.password"),
          t("common.actions"),
        ]}
      >
        {#if rows.length === 0}
          <TableRow>
            <TableCell colspan={4} class="py-12 text-center text-sm text-stone-400 italic"
              >{t("system_admin.admin_users.empty")}</TableCell
            >
          </TableRow>
        {/if}
        {#each rows as row (row.id)}
          <TableRow data-id={row.id}>
            <TableCell class="py-4">
              <div class="border border-transparent px-3 py-1.5 font-bold text-stone-900">
                {row.email}
              </div>
            </TableCell>
            <TableCell class="py-4">
              <select
                data-field="role"
                class="cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm font-bold text-stone-700 transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
              >
                <option value="owner" selected={row.role === "owner"}
                  >{t("system_admin.admin_users.roles.owner")}</option
                >
                <option value="admin" selected={row.role === "admin"}
                  >{t("system_admin.admin_users.roles.admin")}</option
                >
                <option value="editor" selected={row.role === "editor"}
                  >{t("system_admin.admin_users.roles.editor")}</option
                >
              </select>
            </TableCell>
            <TableCell class="py-4">
              <input
                data-field="password"
                type="password"
                placeholder={t("system_admin.admin_users.password_placeholder")}
                class="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm transition-all outline-none hover:bg-white focus:border-[#c48a3a] focus:bg-white focus:ring-2 focus:ring-[#c48a3a]/30"
              />
            </TableCell>
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
