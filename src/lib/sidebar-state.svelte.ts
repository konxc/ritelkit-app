export class SidebarState {
  isOpen = $state(false);
  toggle() {
    this.isOpen = !this.isOpen;
  }
}
export const mobileSidebarState = new SidebarState();
