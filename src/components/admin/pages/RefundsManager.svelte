<script lang="ts">
  import { trpc } from "../../../lib/trpc";
  import { fade, fly } from "svelte/transition";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
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
  import Badge from "../ui/Badge.svelte";

  export type RefundRow = {
    id: string | number;
    orderNo: string;
    amount: number;
    status: string;
    providerStatus?: string | null;
    providerResponseJson?: string | null;
    reason?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  let {
    rows: initialRows = [],
    page = 1,
    limit = 20,
  }: {
    rows?: RefundRow[];
    page?: number;
    limit?: number;
  } = $props();

  const offset = $derived((page - 1) * limit);
  const queryClient = useQueryClient();

  let toastRef = $state<ToastNotification>();
  let isSubmitting = $state(false);

  const refundsQuery = createQuery(() => ({
    queryKey: ["refunds.list", { limit, offset }],
    queryFn: () => trpc.refunds.list.query({ limit, offset }),
    initialData: initialRows.length > 0 ? { rows: initialRows, total: initialRows.length } : undefined,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
  }));

  let currentRefunds = $derived((refundsQuery.data?.rows as RefundRow[]) || initialRows);
  let total = $derived(refundsQuery.data?.total || 0);
  let isFetching = $derived(refundsQuery.isFetching);

  let savingId = $state<string | null>(null);
  let deletingId = $state<string | null>(null);

  const ordersQuery = createQuery(() => ({
    queryKey: ["orders.list", { limit: 100 }],
    queryFn: () => trpc.orders.list.query({ limit: 100 }),
  }));

  let availableOrders = $derived(ordersQuery.data?.rows || []);

  const handleCreate = async (event: SubmitEvent) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    isSubmitting = true;
    try {
      const orderNo = formData.get("order_no") as string;
      const order = availableOrders.find((o: any) => o.orderNo === orderNo);

      if (!order) {
        toastRef?.show("Invalid order number", "error");
        return;
      }

      await trpc.refunds.create.mutate({
        orderNo: orderNo,
        orderId: order.id,
        amount: Number(formData.get("amount")),
        status: formData.get("status") as string,
        reason: (formData.get("reason") as string) || undefined,
      });

      toastRef?.show("Refund berhasil ditambah!", "success");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toastRef?.show(message, "error");
    } finally {
      isSubmitting = false;
    }
  };

  const handleRowAction = async (id: string | number, action: string, rowElement: HTMLElement | null) => {
    const resolvedId = String(id);
    if (action === "delete") {
      if (confirm("Hapus refund ini?")) {
        deletingId = resolvedId;
        try {
          await trpc.refunds.delete.mutate(resolvedId);
          toastRef?.show("Refund dihapus", "success");
          queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "An error occurred";
          toastRef?.show(message, "error");
        } finally {
          deletingId = null;
        }
      }
    } else if (action === "save" && rowElement) {
      const fields: Record<string, string> = {};
      rowElement.querySelectorAll("[data-field]").forEach((el) => {
        const field = el.getAttribute("data-field")!;
        if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
          fields[field] = el.value;
        } else {
          fields[field] = el.textContent?.trim() || "";
        }
      });

      const data = {
        amount: Number(fields.amount),
        status: fields.status,
        reason: fields.reason || undefined,
      };

      savingId = resolvedId;
      try {
        await trpc.refunds.update.mutate({ id: resolvedId, data });
        toastRef?.show("Refund diperbarui", "success");
        queryClient.invalidateQueries({ queryKey: ["refunds.list"] });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An error occurred";
        toastRef?.show(message, "error");
      } finally {
        savingId = null;
      }
    }
  };
</script>

<div class="h-full w-full">
  <div in:fly={{ y: 20, duration: 400, delay: 100 }}>
    <SectionHeader title="Buat Refund" />
    <CrudInlineForm id="refund-form" onsubmit={handleCreate} {isSubmitting}>
      <div class="grid w-full grid-cols-2 gap-4 border-b border-stone-100 pb-5 md:grid-cols-4">
        <div>
          <TextInput
            id="order_no"
            name="order_no"
            label="No. Pesanan"
            required
            class="w-full font-bold tabular-nums"
            list="available-orders"
          />
          <datalist id="available-orders">
            {#each availableOrders as order}
              <option value={order.orderNo}>{order.customerName} - Rp{order.total}</option>
            {/each}
          </datalist>
        </div>
        <div>
          <TextInput id="amount" name="amount" type="number" label="Jumlah (Rp)" required />
        </div>
        <div>
          <SelectInput
            id="status"
            name="status"
            label="Status Awal"
            options={[
              { value: "pending", label: "⏳ Pending" },
              { value: "processing", label: "🔄 Diproses" },
              { value: "completed", label: "✅ Selesai" },
              { value: "failed", label: "❌ Failed" },
            ]}
          />
        </div>
        <div>
          <TextInput id="reason" name="reason" label="Alasan" />
        </div>
      </div>
      <div class="mt-4 flex items-end">
        <Button type="submit" variant="primary" class="mt-auto h-[38px] w-full px-6 sm:w-auto" disabled={isSubmitting}>
          {#if isSubmitting}
            <svg
              class="mr-2 -ml-1 inline-block h-3.5 w-3.5 animate-spin text-white"
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
          Simpan
        </Button>
      </div>
    </CrudInlineForm>

    <div class="-mt-2 mb-4">
      <Badge text="Dana Keluar" color="red" />
    </div>

    <Table headers={["Pesanan", "Jumlah", "Status", "Gateway", "Alasan", "Aksi"]}>
      {#if currentRefunds.length === 0}
        <TableRow>
          <TableCell colspan={6} class="py-12 text-center text-sm text-stone-400 italic">
            {#if isFetching}Memuat data...{:else}Belum ada refund yang sesuai kriteria.{/if}
          </TableCell>
        </TableRow>
      {/if}
      {#each currentRefunds as row (row.id)}
        <TableRow data-id={row.id}>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="orderNo"
              class="rounded-lg border border-transparent px-2 py-1.5 transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.orderNo}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="amount"
              class="rounded-lg border border-transparent px-3 py-1.5 font-mono font-bold text-stone-800 tabular-nums transition-all outline-none hover:bg-white focus:bg-white"
            >
              <span class="mr-1 font-sans text-xs text-stone-400">Rp</span>{row.amount}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <select
              data-field="status"
              class="cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-xs font-bold uppercase transition-all outline-none hover:bg-white focus:bg-white"
            >
              <option value="pending" selected={row.status === "pending"}>⏳ Pending</option>
              <option value="processing" selected={row.status === "processing"}>🔄 Proses</option>
              <option value="completed" selected={row.status === "completed"}>✅ Selesai</option>
              <option value="failed" selected={row.status === "failed"}>❌ Failed</option>
            </select>
          </TableCell>
          <TableCell class="py-4">{row.providerStatus || "-"}</TableCell>
          <TableCell class="py-4">
            <div
              contenteditable="true"
              data-field="reason"
              class="rounded-lg border border-transparent px-2 py-1.5 transition-all outline-none hover:bg-white focus:bg-white"
            >
              {row.reason || ""}
            </div>
          </TableCell>
          <TableCell class="py-4">
            <RowActions
              isSaving={savingId === row.id}
              isDeleting={deletingId === row.id}
              onSave={(e) => handleRowAction(row.id, "save", e.currentTarget.closest("tr"))}
              onDelete={() => handleRowAction(row.id, "delete", null)}
            />
          </TableCell>
        </TableRow>
      {/each}
    </Table>
  </div>

  <ToastNotification bind:this={toastRef} />
</div>
