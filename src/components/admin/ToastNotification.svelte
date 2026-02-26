<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    export let message: string = "";
    export let type: "success" | "error" | "info" = "info";
    export let duration: number = 3500;
    export let visible: boolean = false;

    export function show(
        msg: string,
        msgType: "success" | "error" | "info" = "info",
        customDuration?: number,
    ) {
        message = msg;
        type = msgType;
        visible = true;

        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            visible = false;
        }, customDuration || duration);
    }

    let timeoutId: any;

    onDestroy(() => {
        if (timeoutId) clearTimeout(timeoutId);
    });
</script>

{#if visible}
    <div class="fixed bottom-6 right-6 z-[100] animate-fade-in-up" role="alert">
        <div
            class="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border
      {type === 'success'
                ? 'bg-green-50/95 border-green-200/80'
                : type === 'error'
                  ? 'bg-red-50/95 border-red-200/80'
                  : 'bg-stone-50/95 border-stone-200/80'} backdrop-blur-md transition-all"
        >
            <div
                class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        {type === 'success'
                    ? 'bg-green-100 text-green-600'
                    : type === 'error'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-stone-200 text-stone-600'}"
            >
                {#if type === "success"}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><polyline points="20 6 9 17 4 12"></polyline></svg
                    >
                {:else if type === "error"}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><line x1="18" y1="6" x2="6" y2="18"></line><line
                            x1="6"
                            y1="6"
                            x2="18"
                            y2="18"
                        ></line></svg
                    >
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><circle cx="12" cy="12" r="10"></circle><line
                            x1="12"
                            y1="16"
                            x2="12"
                            y2="12"
                        ></line><line x1="12" y1="8" x2="12.01" y2="8"
                        ></line></svg
                    >
                {/if}
            </div>
            <p
                class="text-[0.95rem] font-semibold {type === 'success'
                    ? 'text-green-800'
                    : type === 'error'
                      ? 'text-red-800'
                      : 'text-stone-800'} m-0 leading-tight"
            >
                {message}
            </p>
        </div>
    </div>
{/if}
