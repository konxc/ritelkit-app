type ShippingConfig = Record<string, unknown>;

export function initShippingRuleConfig(form: HTMLFormElement): () => ShippingConfig {
  const typeSelect = form.querySelector("select[name='type']") as HTMLSelectElement | null;
  const flatConfig = document.getElementById("flat-config");
  const thresholdConfig = document.getElementById("threshold-config");
  const zoneConfig = document.getElementById("zone-config");
  const preview = form.querySelector(
    "textarea[name='config_preview']",
  ) as HTMLTextAreaElement | null;

  const buildConfig = (): ShippingConfig => {
    const type = typeSelect?.value || "";
    let config: ShippingConfig = {};

    if (type === "flat") {
      const feeInput = form.querySelector<HTMLInputElement>("input[name='flat_fee']");
      const fee = Number(feeInput?.value || 0);
      config = { fee };
    } else if (type === "free_threshold") {
      const thresholdInput = form.querySelector<HTMLInputElement>(
        "input[name='threshold_amount']",
      );
      const feeInput = form.querySelector<HTMLInputElement>("input[name='threshold_fee']");
      const threshold = Number(thresholdInput?.value || 0);
      const fee = Number(feeInput?.value || 0);
      config = { threshold, fee };
    } else if (type === "zone") {
      const zoneInput = form.querySelector<HTMLTextAreaElement>("textarea[name='zone_list']");
      const text = zoneInput?.value || "";
      const zones = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [province, city, district, fee] = line.split("|");
          return {
            province: (province || "").trim(),
            city: (city || "").trim(),
            district: (district || "").trim(),
            fee: Number(fee || 0),
          };
        });
      config = { zones };
    }

    if (preview) preview.value = JSON.stringify(config);
    return config;
  };

  typeSelect?.addEventListener("change", () => {
    const type = typeSelect?.value || "";
    if (flatConfig) flatConfig.style.display = type === "flat" ? "block" : "none";
    if (thresholdConfig) {
      thresholdConfig.style.display = type === "free_threshold" ? "block" : "none";
    }
    if (zoneConfig) zoneConfig.style.display = type === "zone" ? "block" : "none";
    buildConfig();
  });

  form.addEventListener("input", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      buildConfig();
    }
  });

  buildConfig();
  return buildConfig;
}
