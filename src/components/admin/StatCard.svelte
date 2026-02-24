<script lang="ts">
  let {
    label,
    value,
  }: {
    label: string;
    value: string | number;
  } = $props();
</script>

<div class="card">
  <strong>{label}</strong>
  <p>{value}</p>
</div>
