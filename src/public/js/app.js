const userSwitcher = document.querySelector("[data-user-switcher]");

if (userSwitcher instanceof HTMLSelectElement) {
  userSwitcher.addEventListener("change", () => {
    const targetUser = userSwitcher.value;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("user", targetUser);
    window.location.assign(currentUrl.toString());
  });
}

const closeDialogButton = document.querySelector("[data-dialog-close]");
const appDialog = document.querySelector("[data-app-dialog]");

const clearDialogQueryParams = () => {
  if (!(appDialog instanceof HTMLElement)) {
    return;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete("dialogType");
  currentUrl.searchParams.delete("dialogTitle");
  currentUrl.searchParams.delete("dialogMessage");
  window.history.replaceState({}, "", currentUrl.toString());
  appDialog.remove();
};

if (closeDialogButton instanceof HTMLButtonElement) {
  closeDialogButton.addEventListener("click", clearDialogQueryParams);
}

if (appDialog instanceof HTMLElement) {
  appDialog.addEventListener("click", (event) => {
    if (event.target === appDialog) {
      clearDialogQueryParams();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearDialogQueryParams();
    }
  });
}
