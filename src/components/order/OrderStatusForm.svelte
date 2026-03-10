<script lang="ts">
  import { actions } from "astro:actions";

  type OrderStatusPayload = {
    status: string;
    paymentStatus: string;
  };

  let {
    onSuccess,
  }: {
    onSuccess?: (payload: OrderStatusPayload) => void;
  } = $props();

  let orderNo = $state("");
  let phone = $state("");
  let statusMessage = $state("");
  let isLoading = $state(false);

  const handleCheck = async (e: SubmitEvent) => {
    e.preventDefault();
    isLoading = true;
    statusMessage = "";

    const { data, error } = await actions.checkOrderStatus({ orderNo, phone });

    if (error) {
      statusMessage = error.message;
      isLoading = false;
      return;
    }

    if (data) {
      statusMessage = `Status: ${data.status} | Pembayaran: ${data.paymentStatus}`;
      onSuccess?.(data);
    }

    isLoading = false;
  };
</script>

<form class="mx-auto grid max-w-[420px] gap-2.5" onsubmit={handleCheck}>
  <input
    class="rounded-[10px] border border-[#e6dfd3] p-2.5"
    name="order_no"
    placeholder="Masukkan No. Pesanan"
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
