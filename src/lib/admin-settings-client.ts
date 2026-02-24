import { bindJsonForm, getCsrfToken } from "./admin-client";

export function initAdminSettingsPage(): void {
  const csrfToken = getCsrfToken();
  const seedButton = document.querySelector("#seed-btn");

  bindJsonForm({
    formSelector: "#settings-form",
    endpoint: "/api/admin/settings",
    mapPayload: (data) => {
      const orderSettings = {
        preorder_only: data.get("preorder_only") === "true",
        minimum_lead_time_hours: Number(data.get("minimum_lead_time_hours") || 0),
        cutoff_time: data.get("cutoff_time") || "",
        same_day_enabled: data.get("same_day_enabled") === "true",
        available_days: String(data.get("available_days") || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const deliverySettings = {
        delivery_province: data.get("delivery_province") || "",
        free_delivery_threshold: Number(data.get("free_delivery_threshold") || 0),
      };
      return {
        order_settings: orderSettings,
        delivery_settings: deliverySettings,
      };
    },
  });

  seedButton?.addEventListener("click", async () => {
    if (!confirm("Generate data demo?")) return;
    const response = await fetch("/api/admin/seed", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    });
    if (!response.ok) {
      alert(await response.text());
      return;
    }
    alert("Seed data selesai");
    location.reload();
  });
}
