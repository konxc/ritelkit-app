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
    <div class="relative z-{30 - (index * 10)} flex shrink-0">
        <!-- Render avatar with fixed styles representing stack overlap -->
        <Avatar 
            src={user.src} 
            alt={user.alt} 
            initials={user.initials} 
            size="md" 
            class="scale-[0.85] !m-0"
        />
    </div>
  {/each}

  {#if remainingCount > 0}
    <div class="w-10 h-10 rounded-full bg-stone-50 border-2 border-white shadow-sm flex items-center justify-center z-0 text-xs font-bold text-stone-500 shrink-0">
      +{remainingCount}
    </div>
  {/if}
</div>
