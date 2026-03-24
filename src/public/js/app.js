const userSwitcher = document.querySelector("[data-user-switcher]");

if (userSwitcher instanceof HTMLSelectElement) {
  userSwitcher.addEventListener("change", () => {
    const targetUser = userSwitcher.value;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("user", targetUser);
    window.location.assign(currentUrl.toString());
  });
}

