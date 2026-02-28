<script lang="ts">
import AdminUsersManager from "./AdminUsersManager.svelte";
import AuditLogManager from "./AuditLogManager.svelte";
import CmsManager from "./CmsManager.svelte";
import NotificationsManager from "./NotificationsManager.svelte";
import QueryProvider from "../QueryProvider.svelte";

let {
	tab,
	q = "",
	page = 1,
	limit = 30,
	rows = [],
}: {
	tab: string;
	q?: string;
	page?: number;
	limit?: number;
	rows?: any[];
} = $props();
</script>

<QueryProvider initialData={rows}>
	{#if tab === "konten"}
	  <CmsManager {q} {page} {limit} {rows} />
	{:else if tab === "notifikasi"}
	  <NotificationsManager {q} {page} {limit} />
	{:else if tab === "audit"}
	  <AuditLogManager {q} {page} {limit} {rows} />
	{:else if tab === "admin"}
	  <AdminUsersManager {rows} />
	{/if}
</QueryProvider>
