<script lang="ts">
  let {
    rows: initialRows = [],
    q = "",
    status = "",
    lang,
  }: {
    rows?: AdminUser[];
    q?: string;
    status?: string;
    lang?: any;
  } = $props();
  initI18n(untrack(() => lang));

  import { trpc } from "../../../lib/trpc";
  import { createQuery } from "@tanstack/svelte-query";
  import { fly } from "svelte/transition";
  import type { AdminUser } from "../../../lib/types";
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
  import { untrack } from "svelte";
  import AdminHeaderFilters from "../AdminHeaderFilters.svelte";
  import TableEmptyState from "../ui/TableEmptyState.svelte";
  import Fab from "../ui/Fab.svelte";
  import AdminDrawerForm from "../ui/overlay/AdminDrawerForm.svelte";
  import { createAdminFilters } from "../../../lib/admin-filters.svelte";
  import { createAdminMutation } from "../../../lib/admin-mutations.svelte";
  import { createTableState } from "../../../lib/admin-table-state.svelte";

  let columns = $state([
    { id: "email", label: t("system_admin.admin_users.email"), isVisible: true },
    { id: "role", label: t("system_admin.admin_users.role"), isVisible: true },
    { id: "password", label: t("system_admin.admin_users.password"), isVisible: true },
  ]);

  const filters = createAdminFilters({ q, status, page: 1 });
  let toastRef = $state<ToastNotification>();
  let isDrawerOpen = $state(false);
  let processingId = $state<string | null>(null);

  const query = createQuery(() => ({
    queryKey: ["adminUsers", filters.q],
    queryFn: () => trpc.adminUsers.list.query({ q: filters.q }),
    initialData: filters.isInitial ? initialRows : undefined,
  }));

  const currentRows = $derived(query.data || []);
  const tableState = createTableState<any>(() => currentRows);

  const updateMutation = createAdminMutation(
    (payload: { id: string; data: any }) => trpc.adminUsers.update.mutate(payload),
    {
      invalidateKeys: [["adminUsers"]],
      successMessage: t("system_admin.admin_users.toast_update"),
      onSuccess: () => tableState.reset(),
    },
    () => toastRef,
  );

  const deleteMutation = createAdminMutation(
    (id: string) => trpc.adminUsers.delete.mutate(id),
    {
      invalidateKeys: [["adminUsers"]],
      successMessage: t("system_admin.admin_users.toast_delete"),
    },
    () => toastRef,
  );

  const createMutation = createAdminMutation(
    (data: any) => trpc.adminUsers.create.mutate(data),
    {
      invalidateKeys: [["adminUsers"]],
      successMessage: t("system_admin.admin_users.toast_add"),
      onSuccess: () => {
        isDrawerOpen = false;
      },
    },
    () => toastRef,
  );

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const data = {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      role: formData.get("role") as any,
    };
    await createMutation.mutate(data);
  };

  const handleSave = async (id: string) => {
    const updates = tableState.editedValues[id];
    if (!updates) return;
    processingId = id;
    try {
      await updateMutation.mutate({ id, data: updates });
    } finally {
      processingId = null;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("system_admin.admin_users.confirm_delete"))) return;
    processingId = id;
    try {
      await deleteMutation.mutate(id);
    } finally {
      processingId = null;
    }
  };

  const activeHeaders = $derived([
    ...columns.filter((c) => c.isVisible).map((c) => ({ label: c.label })),
    t("common.actions"),
  ]);
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <div class="mt-2 mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
      <SectionHeader
        title={t("system_admin.admin_users.title_list")}
        muted={t("system_admin.admin_users.subtitle_list")}
      />

      <div class="hidden lg:flex lg:items-center lg:gap-3">
        <AdminHeaderFilters tab="admins" q={filters.q} bind:columns {lang} />

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
              stroke-linejoin="round"
              ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path
                d="M19 8v6"
              /><path d="M22 11h-6" /></svg
            >
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
        ><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6" /><path
          d="M22 11h-6"
        /></svg
      >
    {/snippet}

    <AdminDrawerForm
      bind:isOpen={isDrawerOpen}
      title={t("system_admin.admin_users.title_add")}
      subtitle={t("system_admin.admin_users.subtitle_add")}
      icon={userIcon}
      isSubmitting={createMutation.isPending}
      onsubmit={handleCreate}
      formId="admin-user-form"
    >
      <div class="space-y-6">
        <TextInput id="email" name="email" label={t("system_admin.admin_users.email")} type="email" required />
        <TextInput
          id="password"
          name="password"
          label={t("system_admin.admin_users.password")}
          type="password"
          required
        />
        <SelectInput id="role" name="role" label={t("system_admin.admin_users.role")} required>
          <option value="admin">{t("system_admin.admin_users.roles.admin")}</option>
          <option value="editor">{t("system_admin.admin_users.roles.editor")}</option>
          <option value="owner">{t("system_admin.admin_users.roles.owner")}</option>
        </SelectInput>
      </div>
    </AdminDrawerForm>

    <div class="mt-2">
      <Table headers={activeHeaders}>
        {#if currentRows.length === 0}
          <TableEmptyState
            title={t("system_admin.admin_users.empty")}
            subtitle={t("common.empty_orders_desc")}
            colspan={activeHeaders.length}
          />
        {/if}
        {#each currentRows as p (p.id)}
          <TableRow
            data-id={p.id}
            class="group border-b border-stone-100 transition-colors last:border-0 hover:bg-stone-50/50"
          >
            {#if columns[0].isVisible}
              <TableCell class="py-4 font-bold text-stone-900">{p.email}</TableCell>
            {/if}
            {#if columns[1].isVisible}
              <TableCell class="py-4">
                <select
                  onchange={(e) => tableState.onEdit(p.id, "role", e.currentTarget.value)}
                  class="rounded-md border-none bg-transparent px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase focus:ring-0"
                >
                  <option value="admin" selected={(tableState.editedValues[p.id]?.role ?? p.role) === "admin"}
                    >{t("system_admin.admin_users.roles.admin")}</option
                  >
                  <option value="editor" selected={(tableState.editedValues[p.id]?.role ?? p.role) === "editor"}
                    >{t("system_admin.admin_users.roles.editor")}</option
                  >
                  <option value="owner" selected={(tableState.editedValues[p.id]?.role ?? p.role) === "owner"}
                    >{t("system_admin.admin_users.roles.owner")}</option
                  >
                </select>
              </TableCell>
            {/if}
            {#if columns[2].isVisible}
              <TableCell class="py-4">
                <input
                  type="password"
                  placeholder="******"
                  oninput={(e: any) => tableState.onEdit(p.id, "password", (e.currentTarget as HTMLInputElement).value)}
                  class="w-full border-none bg-transparent font-mono text-xs text-stone-500 outline-none focus:ring-0"
                />
              </TableCell>
            {/if}
            <TableCell align="center" class="py-4">
              <RowActions
                showEdit={false}
                onSave={() => handleSave(p.id)}
                onDelete={() => handleDelete(p.id)}
                isSaving={processingId === p.id && updateMutation.isPending}
                isDeleting={processingId === p.id && deleteMutation.isPending}
              />
            </TableCell>
          </TableRow>
        {/each}
      </Table>
    </div>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
