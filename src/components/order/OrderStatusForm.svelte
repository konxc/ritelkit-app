<script lang="ts">
  import { createEventDispatcher } from "svelte";

  type OrderStatusPayload = {
    status: string;
    payment_status: string;
  };

  const dispatch = createEventDispatcher<{ success: OrderStatusPayload }>();

  let orderNo = "";
  let phone = "";
  let statusMessage = "";
  let isLoading = false;
  const handleCheck = async () => {
    isLoading = true;
    statusMessage = "";
    try {
      const params = new URLSearchParams({
        order_no: orderNo,
        phone,
      });
      const response = await fetch(`/api/order-status?${params.toString()}`);
      if (!response.ok) {
        statusMessage = await response.text();
        return;
      }
      const payload = (await response.json()) as OrderStatusPayload;
      statusMessage = `Status: ${payload.status} | Pembayaran: ${payload.payment_status}`;
      dispatch("success", payload);
    } catch (error) {
      statusMessage = error instanceof Error ? error.message : "Terjadi kesalahan";
    } finally {
      isLoading = false;
    }
  };
</script>

<form
  class="mx-auto grid max-w-[420px] gap-2.5"
  on:submit|preventDefault={handleCheck}
>
  <input
    class="rounded-[10px] border border-[#e6dfd3] p-2.5"
    name="order_no"
    placeholder="Masukkan Order No"
    bind:value={orderNo}
    required
  />
  <input
    class="rounded-[10px] border border-[#e6dfd3] p-2.5"
    name="phone"
    placeholder="Masukkan No. HP saat checkout"
    bind:value={phone}
    required
  />
  <button class="btn btn-primary" type="submit" disabled={isLoading}>
    {isLoading ? "Memeriksa..." : "Cek Status"}
  </button>
  {#if statusMessage}
    <div class="muted text-sm">{statusMessage}</div>
  {/if}
</form>
