<script lang="ts">
  import Avatar from "./Avatar.svelte";

  interface AvatarUser {
    src?: string;
    alt?: string;
    initials?: string;
  }

  interface Props {
    users?: AvatarUser[];
    limit?: number;
    class?: string;
    [key: string]: any;
  }

  let { users = [], limit = 3, class: className = "", ...rest }: Props = $props();

  let visibleUsers = $derived(users.slice(0, limit));
  let remainingCount = $derived(users.length - limit);
</script>

<div class="flex items-center -space-x-4 {className}" {...rest}>
  {#each visibleUsers as user, index}
    <div class="relative z-{30 - index * 10} flex shrink-0">
      <!-- Render avatar with fixed styles representing stack overlap -->
      <Avatar src={user.src} alt={user.alt} initials={user.initials} size="md" class="!m-0 scale-[0.85]" />
    </div>
  {/each}

  {#if remainingCount > 0}
    <div
      class="z-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-stone-50 text-xs font-bold text-stone-500 shadow-sm"
    >
      +{remainingCount}
    </div>
  {/if}
</div>
