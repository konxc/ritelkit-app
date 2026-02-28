<script lang="ts">
import { onMount } from "svelte";

interface CartItem {
	id: string;
	name: string;
	price: number;
	qty: number;
}

let { cart, totalPrice, env } = $props<{
	cart: Map<string, CartItem>;
	totalPrice: number;
	env: any;
}>();

let loading = $state(false);
let error = $state("");
let formElement: HTMLFormElement;

onMount(() => {
	// Load Midtrans Snap script if not present
	if (!window.snap) {
		const script = document.createElement("script");
		script.src =
			env.MIDTRANS_IS_PRODUCTION === "true"
				? "https://app.midtrans.com/snap/snap.js"
				: "https://app.sandbox.midtrans.com/snap/snap.js";
		script.setAttribute("data-client-key", env.PUBLIC_MIDTRANS_CLIENT_KEY);
		document.head.appendChild(script);
	}
});

async function handleSubmit(e: SubmitEvent) {
	e.preventDefault();
	if (cart.size === 0 || loading) return;

	loading = true;
	error = "";

	const formData = new FormData(formElement);
	const items = (Array.from(cart.values()) as CartItem[]).map((item) => ({
		product_id: item.id,
		qty: item.qty,
	}));

	const payload = {
		customer_name: formData.get("customer_name"),
		customer_phone: formData.get("customer_phone"),
		customer_email: "",
		shipping_address: {
			province: "DI Yogyakarta",
			city: formData.get("city"),
			district: formData.get("district"),
			street: formData.get("street"),
		},
		delivery_date: formData.get("delivery_date"),
		delivery_time: formData.get("delivery_time"),
		coupon_code: "",
		items,
	};

	try {
		const res = await fetch("/api/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(text);
		}

		const data = (await res.json()) as {
			snap_token: string;
			order_no: string;
		};

		window.snap?.pay(data.snap_token, {
			onSuccess: () => {
				window.location.href = `/order/success?order=${data.order_no}`;
			},
			onPending: () => {
				window.location.href = `/order/pending?order=${data.order_no}`;
			},
			onError: () => {
				error = "Pembayaran gagal.";
				loading = false;
			},
			onClose: () => {
				loading = false;
			},
		});
	} catch (err: any) {
		error = err.message || "Terjadi kesalahan sistem.";
		loading = false;
	}
}

// Exposed trigger for parent
export function submit() {
	if (formElement.reportValidity()) {
		formElement.requestSubmit();
	}
}
</script>

<div id="checkout-section" class="transition-all duration-300">
    <div class="h-px w-full bg-border/40 my-6"></div>

    <div class="space-y-4">
        <h3
            class="font-bold text-[0.85rem] text-primary-dark uppercase tracking-wider mb-3"
        >
            Informasi Pengiriman
        </h3>
        <form
            bind:this={formElement}
            onsubmit={handleSubmit}
            class="space-y-4 pb-4"
        >
            <div class="space-y-3">
                <input
                    name="customer_name"
                    placeholder="Nama Penerima"
                    required
                    class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-text-muted/60 text-[0.95rem]"
                />
                <input
                    name="customer_phone"
                    type="tel"
                    placeholder="No. WhatsApp (Aktif)"
                    required
                    class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-text-muted/60 text-[0.95rem]"
                />
            </div>
            <div class="grid grid-cols-2 gap-3">
                <input
                    name="city"
                    placeholder="Kota/Kabupaten"
                    required
                    class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem] placeholder:text-text-muted/60"
                />
                <input
                    name="district"
                    placeholder="Kecamatan"
                    required
                    class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem] placeholder:text-text-muted/60"
                />
            </div>
            <textarea
                name="street"
                placeholder="Alamat Detail (No Rumah, Jalan, Patokan)"
                required
                class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none min-h-[90px] resize-none text-[0.95rem] placeholder:text-text-muted/60"
            ></textarea>
            <div class="grid grid-cols-2 gap-3 pb-2">
                <div>
                    <label
                        for="delivery_date"
                        class="block text-[11px] font-bold text-text-muted uppercase mb-1.5 px-1"
                        >🗓 Tanggal <span class="text-red-400">*</span></label
                    >
                    <input
                        id="delivery_date"
                        name="delivery_date"
                        type="date"
                        required
                        class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem]"
                    />
                </div>
                <div>
                    <label
                        for="delivery_time"
                        class="block text-[11px] font-bold text-text-muted uppercase mb-1.5 px-1"
                        >⏱ Waktu <span class="text-red-400">*</span></label
                    >
                    <input
                        id="delivery_time"
                        name="delivery_time"
                        type="time"
                        required
                        class="w-full px-4 py-3 rounded-[14px] bg-surface/50 border border-border/80 focus:border-primary focus:bg-white outline-none text-[0.95rem]"
                    />
                </div>
            </div>

            {#if error}
                <div
                    class="text-center text-sm text-red-500 font-medium px-3 py-3 bg-red-50 rounded-xl leading-snug"
                >
                    {error}
                </div>
            {/if}

            <button
                type="submit"
                disabled={loading}
                class="w-full h-14 rounded-2xl bg-primary text-white font-bold text-[1.05rem] shadow-[0_8px_20px_rgba(37,190,196,0.3)] hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {#if loading}
                    <span class="animate-pulse">Memproses...</span>
                {:else}
                    Bayar Sekarang
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
                    >
                {/if}
            </button>
        </form>
    </div>
</div>
